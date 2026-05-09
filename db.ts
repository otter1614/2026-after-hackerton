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
}

export interface GhostSpot {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  grade: string;
  createdAt: string;
}
