import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db } from "./db";
import type { User, HorrorReport, GhostSpot } from "./db";
import { analyzeImage } from "./ai";
import { getGhosts, respawnGhosts } from "./ghosts";

dotenv.config();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const WS_PORT = Number(process.env.WS_PORT) || 24678;

  app.use(express.json());
  app.use('/uploads', express.static(UPLOAD_DIR));

  // 위치 기반 위험 분석 (이미지 없이 환경 변수만)
  app.post("/api/analyze", (req, res) => {
    const {
      brightness,
      cctvCount,
      populationDensity,
      isAbandoned,
      crimeStatsWeight,
    } = req.body;

    const b = brightness ?? 50;
    const c = cctvCount ?? 2;
    const p = populationDensity ?? 0.5;
    const a = isAbandoned ? 1 : 0;
    const cs = crimeStatsWeight ?? 0.5;

    const brightnessRisk = ((100 - b) / 100) * 0.2;
    const abandonedRisk = a * 0.25;
    const crimeRisk = cs * 0.3;
    const cctvRisk = Math.max(0, (5 - c) / 5) * 0.15;
    const popRisk = (1 - p) * 0.1;

    const totalScore = (brightnessRisk + abandonedRisk + crimeRisk + cctvRisk + popRisk) * 100;
    const finalScore = Math.min(100, Math.round(totalScore));

    let grade = 'C';
    if (finalScore >= 90) grade = 'S';
    else if (finalScore >= 75) grade = 'A';
    else if (finalScore >= 60) grade = 'B';

    res.json({
      score: finalScore,
      grade,
      timestamp: new Date().toISOString(),
      metadata: {
        dominantFactor: brightnessRisk > abandonedRisk ? 'Low Lighting' : 'Unsafe Structural Integrity',
      },
    });
  });

  // 사진 업로드 + AI 공포도/위험도 분석
  app.post("/api/analyze-horror", upload.single('photo'), async (req, res) => {
    try {
      const userId = 'me';
      let photoPath: string | null = null;
      let result;

      // FormData 필드: lat, lng, address (선택)
      const latRaw = req.body?.lat;
      const lngRaw = req.body?.lng;
      const lat = latRaw !== undefined && latRaw !== '' ? Number(latRaw) : null;
      const lng = lngRaw !== undefined && lngRaw !== '' ? Number(lngRaw) : null;
      const address = req.body?.address ? String(req.body.address) : null;

      if (req.file) {
        photoPath = `/uploads/${req.file.filename}`;
        const buffer = fs.readFileSync(req.file.path);
        result = await analyzeImage(buffer, req.file.mimetype);
      } else {
        result = await analyzeImage(Buffer.alloc(0), 'image/jpeg');
      }

      const reportId = Math.random().toString(36).substring(2, 10);
      const timestamp = new Date().toISOString();

      db.prepare(`
        INSERT INTO horror_reports
          (id, userId, photoPath, scores, horrorGrade, horrorScore, dangerScore, timestamp, lat, lng, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reportId,
        userId,
        photoPath,
        JSON.stringify(result.scores),
        result.horrorGrade,
        result.horrorScore,
        result.dangerScore,
        timestamp,
        Number.isFinite(lat as number) ? lat : null,
        Number.isFinite(lng as number) ? lng : null,
        address
      );

      db.prepare(`
        UPDATE users
        SET cumulativeScore = cumulativeScore + ?,
            averageBrightnessGrade = ?
        WHERE id = ?
      `).run(result.horrorScore, result.horrorGrade, userId);

      res.json({
        id: reportId,
        userId,
        photoPath,
        scores: result.scores,
        horrorGrade: result.horrorGrade,
        horrorScore: result.horrorScore,
        dangerScore: result.dangerScore,
        source: result.source,
        timestamp,
        lat,
        lng,
        address,
      });
    } catch (err) {
      console.error('[analyze-horror] error:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 랭킹 (상위 10명)
  app.get("/api/ranking", (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM users ORDER BY cumulativeScore DESC LIMIT 10')
      .all() as User[];
    res.json(rows);
  });

  // 내 통계
  app.get("/api/my-stats", (_req, res) => {
    const me = db.prepare('SELECT * FROM users WHERE id = ?').get('me') as User | undefined;
    res.json(me ?? null);
  });

  // 내 리포트 히스토리
  app.get("/api/my-reports", (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM horror_reports WHERE userId = ? ORDER BY timestamp DESC LIMIT 50')
      .all('me') as HorrorReport[];
    res.json(rows.map(r => ({ ...r, scores: JSON.parse(r.scores) })));
  });

  // 고스트 스팟 조회
  app.get("/api/spots", (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM ghost_spots ORDER BY createdAt DESC')
      .all() as GhostSpot[];
    res.json(rows);
  });

  // 고스트 스팟 등록
  app.post("/api/spots", (req, res) => {
    const { lat, lng, grade } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !grade) {
      return res.status(400).json({ error: 'lat, lng, grade 필요' });
    }
    const id = Math.random().toString(36).substring(2, 10);
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO ghost_spots (id, userId, lat, lng, grade, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, 'me', lat, lng, grade, createdAt);
    res.json({ id, userId: 'me', lat, lng, grade, createdAt });
  });

  // 고스트 스팟 전체 삭제 (디버그용)
  app.delete("/api/spots", (_req, res) => {
    db.prepare('DELETE FROM ghost_spots').run();
    res.json({ ok: true });
  });

  // 범죄 유형별 은닉 추정 장소 TOP N
  // 가중치: 각 범죄 유형이 어떤 환경 요소와 상관 높은지 휴리스틱
  const CRIME_WEIGHTS: Record<string, Record<string, number>> = {
    '절도': { abandoned: 0.25, graffiti: 0.20, lowPopulation: 0.30, brightness: 0.10, structuralHazard: 0.15 },
    '폭행': { brightness: 0.30, lowPopulation: 0.30, eerieEnvironment: 0.20, structuralHazard: 0.20 },
    '마약': { abandoned: 0.35, structuralHazard: 0.25, lowPopulation: 0.30, graffiti: 0.10 },
    '성범죄': { brightness: 0.30, lowPopulation: 0.35, abandoned: 0.20, eerieEnvironment: 0.15 },
    '도주': { abandoned: 0.30, lowPopulation: 0.25, structuralHazard: 0.25, brightness: 0.20 },
    '강도': { brightness: 0.25, lowPopulation: 0.30, abandoned: 0.20, structuralHazard: 0.15, eerieEnvironment: 0.10 },
    '방화': { abandoned: 0.40, structuralHazard: 0.25, lowPopulation: 0.20, graffiti: 0.15 },
  };
  const DEFAULT_WEIGHTS = {
    brightness: 0.20, abandoned: 0.20, graffiti: 0.15,
    lowPopulation: 0.20, eerieEnvironment: 0.10, structuralHazard: 0.15,
  };

  app.get("/api/hideouts", (req, res) => {
    const crime = (req.query.crime as string) || '';
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const weights = CRIME_WEIGHTS[crime] ?? DEFAULT_WEIGHTS;

    const rows = db
      .prepare(`
        SELECT * FROM horror_reports
        WHERE lat IS NOT NULL AND lng IS NOT NULL
        ORDER BY timestamp DESC
      `)
      .all() as HorrorReport[];

    const scored = rows.map((r) => {
      let scoresObj: any = {};
      try { scoresObj = JSON.parse(r.scores); } catch {}
      let matchScore = 0;
      let weightSum = 0;
      for (const [key, w] of Object.entries(weights)) {
        const v = Number(scoresObj[key] ?? 0);
        matchScore += v * w;
        weightSum += w;
      }
      matchScore = weightSum > 0 ? matchScore / weightSum : 0;
      return {
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        address: r.address,
        horrorGrade: r.horrorGrade,
        horrorScore: r.horrorScore,
        dangerScore: r.dangerScore,
        scores: scoresObj,
        matchScore: Math.round(matchScore),
        timestamp: r.timestamp,
        photoPath: r.photoPath,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json({
      crime: crime || '미지정',
      weights,
      total: scored.length,
      results: scored.slice(0, limit),
    });
  });

  // 행정구 범죄밀도 기반 영체 5개 (서버 시작 시 1회 생성, 캐시)
  app.get("/api/ghosts", (_req, res) => {
    res.json(getGhosts());
  });

  // 영체 리스폰 (디버그/리셋용)
  app.post("/api/ghosts/respawn", (_req, res) => {
    res.json(respawnGhosts());
  });

  // safemap WMS 프록시 (서비스키 클라이언트 노출 방지)
  app.get("/api/safemap/wms", async (req, res) => {
    const apiKey = process.env.SAFEMAP_API_KEY;
    if (!apiKey) {
      return res.status(503).send('SAFEMAP_API_KEY not set');
    }

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') params.set(k.toLowerCase(), v);
      else if (Array.isArray(v)) params.set(k.toLowerCase(), String(v[0]));
    }
    params.set('serviceKey', apiKey);

    const upstream = `https://www.safemap.go.kr/openApi2/IF_0087_WMS?${params.toString()}`;

    try {
      const r = await fetch(upstream);
      if (!r.ok) {
        return res.status(r.status).send(await r.text());
      }
      res.set('Content-Type', r.headers.get('content-type') ?? 'image/png');
      res.set('Cache-Control', 'public, max-age=3600');
      const buf = Buffer.from(await r.arrayBuffer());
      res.send(buf);
    } catch (err) {
      console.error('[safemap proxy] error:', err);
      res.status(502).send('upstream failed');
    }
  });

  // 핫스팟 (정적)
  app.get("/api/hotspots", (_req, res) => {
    res.json([
      { id: 1, lat: 37.5665, lng: 126.9780, risk: 92, type: 'THEFT_HIGH' },
      { id: 2, lat: 37.5172, lng: 127.0473, risk: 84, type: 'BLIND_SPOT' },
    ]);
  });

  // Vite middleware (개발) / 정적 (프로덕션)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: WS_PORT,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`AI: ${process.env.GEMINI_API_KEY ? 'Gemini 활성화' : '폴백(더미) 모드'}`);
  });
}

startServer();
