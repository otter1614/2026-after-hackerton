import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cumulativeScore INTEGER NOT NULL DEFAULT 0,
    averageBrightnessGrade TEXT NOT NULL DEFAULT 'B'
  );

  CREATE TABLE IF NOT EXISTS horror_reports (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    photoPath TEXT,
    scores TEXT NOT NULL,
    horrorGrade TEXT NOT NULL,
    horrorScore INTEGER NOT NULL,
    dangerScore INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ghost_spots (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    grade TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// 마이그레이션: horror_reports에 위치 컬럼 추가 (이미 있으면 skip)
const reportCols = db.prepare("PRAGMA table_info(horror_reports)").all() as Array<{ name: string }>;
const colNames = new Set(reportCols.map((c) => c.name));
if (!colNames.has('lat')) db.exec("ALTER TABLE horror_reports ADD COLUMN lat REAL");
if (!colNames.has('lng')) db.exec("ALTER TABLE horror_reports ADD COLUMN lng REAL");
if (!colNames.has('address')) db.exec("ALTER TABLE horror_reports ADD COLUMN address TEXT");

// 시드: horror_reports 가상 데이터 (위치 + 점수 다양화)
const reportCount = db.prepare('SELECT COUNT(*) as c FROM horror_reports').get() as { c: number };
if (reportCount.c === 0) {
  const seedReports = [
    {
      address: '경상남도 창원시 의창구 중앙대로 사거리',
      lat: 35.2304, lng: 128.6822,
      scores: { brightness: 78, abandoned: 45, graffiti: 62, lowPopulation: 70, eerieEnvironment: 55, structuralHazard: 40, rationale: '저녁 가로등 미점등 구간, 골목 사각지대 다수' },
    },
    {
      address: '경상남도 창원시 성산구 상남동 상가밀집지역',
      lat: 35.2241, lng: 128.6794,
      scores: { brightness: 50, abandoned: 30, graffiti: 75, lowPopulation: 40, eerieEnvironment: 35, structuralHazard: 25, rationale: '낙서 다수, 일부 폐점포 존재' },
    },
    {
      address: '경상남도 창원시 진해구 경화역 인근 철길',
      lat: 35.1483, lng: 128.7091,
      scores: { brightness: 88, abandoned: 92, graffiti: 70, lowPopulation: 95, eerieEnvironment: 90, structuralHazard: 85, rationale: '폐선 부지, 인적 거의 없음, 구조물 노후 심각' },
    },
    {
      address: '경상남도 창원시 마산합포구 산호동 폐공장',
      lat: 35.2096, lng: 128.5704,
      scores: { brightness: 92, abandoned: 95, graffiti: 65, lowPopulation: 88, eerieEnvironment: 88, structuralHazard: 90, rationale: '장기 방치된 공장 부지, 출입 통제 미흡' },
    },
    {
      address: '경상남도 창원시 성산구 반송동 야산 입구',
      lat: 35.2387, lng: 128.7012,
      scores: { brightness: 85, abandoned: 60, graffiti: 25, lowPopulation: 90, eerieEnvironment: 82, structuralHazard: 50, rationale: '산림 초입 비포장로, CCTV 부재' },
    },
    {
      address: '경상남도 창원시 의창구 명서동 재개발 예정지',
      lat: 35.2511, lng: 128.6587,
      scores: { brightness: 70, abandoned: 88, graffiti: 80, lowPopulation: 75, eerieEnvironment: 70, structuralHazard: 78, rationale: '철거 대기 건물 다수, 통제선 훼손' },
    },
    {
      address: '경상남도 창원시 마산회원구 양덕동 지하상가',
      lat: 35.2189, lng: 128.5816,
      scores: { brightness: 60, abandoned: 55, graffiti: 45, lowPopulation: 65, eerieEnvironment: 50, structuralHazard: 30, rationale: '심야 폐점 후 무인 구역' },
    },
    {
      address: '경상남도 창원시 진해구 풍호동 해안 창고지대',
      lat: 35.1379, lng: 128.6843,
      scores: { brightness: 80, abandoned: 78, graffiti: 35, lowPopulation: 82, eerieEnvironment: 75, structuralHazard: 65, rationale: '해안 창고 다수, 야간 인적 드묾' },
    },
    {
      address: '경상남도 창원시 성산구 가음정동 지하주차장',
      lat: 35.2167, lng: 128.6954,
      scores: { brightness: 65, abandoned: 25, graffiti: 30, lowPopulation: 55, eerieEnvironment: 40, structuralHazard: 20, rationale: '조명 일부 고장, 평일 야간 한산' },
    },
    {
      address: '경상남도 창원시 의창구 동읍 외곽 농로',
      lat: 35.2912, lng: 128.6471,
      scores: { brightness: 90, abandoned: 70, graffiti: 15, lowPopulation: 92, eerieEnvironment: 78, structuralHazard: 55, rationale: '외곽 비포장 농로, 가로등 거의 없음' },
    },
  ];

  const insertReport = db.prepare(`
    INSERT INTO horror_reports
      (id, userId, photoPath, scores, horrorGrade, horrorScore, dangerScore, timestamp, lat, lng, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const computeHorror = (s: any) => {
    const v = Math.round(s.brightness * 0.30 + s.abandoned * 0.25 + s.eerieEnvironment * 0.25 + s.structuralHazard * 0.20);
    const grade = v >= 80 ? 'S' : v >= 60 ? 'A' : v >= 40 ? 'B' : 'C';
    return { score: Math.min(100, v), grade };
  };
  const computeDanger = (s: any) => {
    const crimeProxy = (s.eerieEnvironment + s.structuralHazard) / 2;
    return Math.min(100, Math.round(s.brightness * 0.20 + s.abandoned * 0.25 + s.lowPopulation * 0.15 + s.graffiti * 0.10 + crimeProxy * 0.30));
  };

  const seedReportsTx = db.transaction(() => {
    seedReports.forEach((r, i) => {
      const horror = computeHorror(r.scores);
      const danger = computeDanger(r.scores);
      const ts = new Date(Date.now() - i * 86400000).toISOString();
      insertReport.run(
        `seed-${i}`,
        'me',
        null,
        JSON.stringify(r.scores),
        horror.grade,
        horror.score,
        danger,
        ts,
        r.lat,
        r.lng,
        r.address
      );
    });
  });
  seedReportsTx();
}

// 시드: 'me' + 더미 에이전트 10명. 이미 있으면 건너뜀
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
if (userCount.c === 0) {
  const insert = db.prepare(
    'INSERT INTO users (id, name, cumulativeScore, averageBrightnessGrade) VALUES (?, ?, ?, ?)'
  );
  const seed = db.transaction(() => {
    insert.run('me', '현재 사용자', 0, 'B');
    const grades = ['S', 'A', 'B', 'C', 'D'];
    for (let i = 0; i < 10; i++) {
      insert.run(
        `user-${i}`,
        `Agent_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        Math.floor(Math.random() * 141) + 100,
        grades[Math.floor(Math.random() * grades.length)]
      );
    }
  });
  seed();
}

export interface User {
  id: string;
  name: string;
  cumulativeScore: number;
  averageBrightnessGrade: string;
}

export interface HorrorReport {
  id: string;
  userId: string;
  photoPath: string | null;
  scores: string;
  horrorGrade: string;
  horrorScore: number;
  dangerScore: number;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
}

export interface GhostSpot {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  grade: string;
  createdAt: string;
}
