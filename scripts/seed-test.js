#!/usr/bin/env node
// Inserts a fixed set of named test games. Requires the DB to already be
// initialized (schema + reference data). Run via:
//   DB_PATH=data/test.db node scripts/seed-test.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/test.db");

const db = new Database(DB_PATH);

const id = (table, col, val) => db.prepare(`SELECT id FROM ${table} WHERE ${col} = ?`).get(val).id;
const fmt = (name, pid) =>
  db.prepare("SELECT id FROM formats WHERE name = ? AND platform_id = ?").get(name, pid).id;

const orc = id("teams", "name", "Orc");
const human = id("teams", "name", "Human");
const dwarf = id("teams", "name", "Dwarf");
const skaven = id("teams", "name", "Skaven");
const bb3 = id("platforms", "name", "Blood Bowl 3");
const fumbbl = id("platforms", "name", "Fumbbl");
const tabletop = id("platforms", "name", "tabletop");

const ins = db.prepare(`
  INSERT INTO games
    (opponent_name, my_race_id, opponent_race_id, result,
     score_for, score_against, date, platform_id, format_id, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
`);

db.transaction(() => {
  ins.run("Seed W Game", orc, human, "W", 2, 1, "2024-01-01", bb3, fmt("league", bb3));
  ins.run("Seed D Game", orc, human, "D", 0, 0, "2024-01-02", bb3, fmt("league", bb3));
  ins.run("Seed L Game", orc, human, "L", 1, 2, "2024-01-03", bb3, fmt("league", bb3));
  ins.run("Fumbbl Game", orc, human, "W", 2, 1, "2024-01-04", fumbbl, fmt("league", fumbbl));
  ins.run("Ladder Game", orc, human, "W", 3, 0, "2024-01-05", bb3, fmt("ladder", bb3));
  ins.run("Dwarf Game", dwarf, human, "W", 1, 0, "2024-01-06", bb3, fmt("league", bb3));
  ins.run("Skaven Game", orc, skaven, "W", 2, 1, "2024-01-07", bb3, fmt("league", bb3));
  ins.run(
    "Tabletop Game",
    orc,
    human,
    "W",
    2,
    0,
    "2024-01-08",
    tabletop,
    fmt("tournament", tabletop),
  );
  // Extra BB3 games: brings total to 13 (>10 for pagination) and BB3 to 11 (>10 when platform-filtered)
  ins.run("BB3 Extra 1", orc, human, "W", 2, 1, "2024-01-09", bb3, fmt("league", bb3));
  ins.run("BB3 Extra 2", orc, human, "W", 2, 1, "2024-01-10", bb3, fmt("league", bb3));
  ins.run("BB3 Extra 3", orc, human, "W", 2, 1, "2024-01-11", bb3, fmt("league", bb3));
  ins.run("BB3 Extra 4", orc, human, "W", 2, 1, "2024-01-12", bb3, fmt("league", bb3));
  ins.run("BB3 Extra 5", orc, human, "W", 2, 1, "2024-01-13", bb3, fmt("league", bb3));
})();

db.close();
console.log("Seeded 13 test games into", DB_PATH);
