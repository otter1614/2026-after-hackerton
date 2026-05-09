import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db } from "./db";
import type { User, HorrorReport, GhostSpot } from "./db";
import { analyzeImage } from "./ai";

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
  const PORT = 3000;

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

      if (req.file) {
        photoPath = `/uploads/${req.file.filename}`;
        const buffer = fs.readFileSync(req.file.path);
        result = await analyzeImage(buffer, req.file.mimetype);
      } else {
        // 사진 없이 호출돼도 폴백으로 더미 결과 반환
        result = await analyzeImage(Buffer.alloc(0), 'image/jpeg');
      }

      const reportId = Math.random().toString(36).substring(2, 10);
      const timestamp = new Date().toISOString();

      db.prepare(`
        INSERT INTO horror_reports
          (id, userId, photoPath, scores, horrorGrade, horrorScore, dangerScore, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reportId,
        userId,
        photoPath,
        JSON.stringify(result.scores),
        result.horrorGrade,
        result.horrorScore,
        result.dangerScore,
        timestamp
      );

      // 누적 점수·평균 등급 업데이트
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
      server: { middlewareMode: true },
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
