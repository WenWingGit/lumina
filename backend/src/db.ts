import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data/lumina.db');
import fs from 'fs';

const dataDir = join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('accumulation', 'cycle', 'trend')),
      target_value REAL NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      change_value REAL NOT NULL,
      note TEXT,
      reflection TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      value REAL NOT NULL,
      reward_text TEXT NOT NULL,
      is_reached BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );
  `);

  const goalsCount = db.prepare('SELECT COUNT(*) as count FROM goals').get() as { count: number };
  if (goalsCount.count === 0) {
    const insertGoal = db.prepare(`
      INSERT INTO goals (title, type, target_value, current_value, unit, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertGoal.run('攒钱大计', 'accumulation', 300000, 50000, '元', 'active');
    insertGoal.run('身体管理', 'trend', 60, 70, 'kg', 'active');
  }

  console.log('Database initialized successfully');
}

export default db;
