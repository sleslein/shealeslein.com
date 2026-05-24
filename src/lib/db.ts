import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || (
  process.env.NODE_ENV === 'production'
    ? path.join('/data', 'bloodbowl.db')
    : path.join(process.cwd(), 'data', 'bloodbowl.db')
);

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS platforms (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS formats (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      platform_id INTEGER NOT NULL REFERENCES platforms(id),
      UNIQUE(name, platform_id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      opponent_name    TEXT    NOT NULL,
      my_race_id       INTEGER NOT NULL REFERENCES teams(id),
      opponent_race_id INTEGER NOT NULL REFERENCES teams(id),
      result           TEXT    NOT NULL CHECK(result IN ('W', 'L', 'D')),
      score_for        INTEGER NOT NULL,
      score_against    INTEGER NOT NULL,
      date             TEXT    NOT NULL,
      platform_id      INTEGER NOT NULL REFERENCES platforms(id),
      format_id        INTEGER NOT NULL REFERENCES formats(id),
      notes            TEXT,
      created_at       TEXT    DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}
