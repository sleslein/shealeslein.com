#!/usr/bin/env node
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/bloodbowl.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const teams = db.prepare("SELECT id, name FROM teams").all();
const platforms = db.prepare("SELECT id, name FROM platforms").all();
const formats = db.prepare("SELECT id, name, platform_id FROM formats").all();

const formatsByPlatform = new Map();
for (const f of formats) {
  if (!formatsByPlatform.has(f.platform_id)) formatsByPlatform.set(f.platform_id, []);
  formatsByPlatform.get(f.platform_id).push(f);
}

const opponents = [
  "Grimbold Ironside",
  "Coach McMurphy",
  "The Legendary Zug",
  "Darkside Cowboys",
  "Varag Ghoul-Chewer",
  "Morg N Thorg",
  "Griff Oberwald",
  "Puggy Baconbreath",
  "Helmut Wulf",
  "Bertha Bigfist",
  "Ramtut III",
  "Mummy McGee",
  "Nobbla Blackwart",
  "Deeproot Strongbranch",
  "Rashnak Backstabber",
  "Wilhelm Chaney",
];

const results = ["W", "W", "W", "D", "L", "L"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate() {
  const start = new Date("2023-01-01");
  const end = new Date("2026-05-24");
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 10);
}

const insert = db.prepare(`
  INSERT INTO games (opponent_name, my_race_id, opponent_race_id, result,
                     score_for, score_against, date, platform_id, format_id, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction(() => {
  for (let i = 0; i < 110; i++) {
    const myRace = rand(teams);
    const opponentRace = rand(teams);
    const platform = rand(platforms);
    const format = rand(formatsByPlatform.get(platform.id));
    const result = rand(results);
    const scoreFor = randInt(0, 5);
    const scoreAgainst = randInt(0, 5);

    insert.run(
      rand(opponents),
      myRace.id,
      opponentRace.id,
      result,
      scoreFor,
      scoreAgainst,
      randDate(),
      platform.id,
      format.id,
      null,
    );
  }
});

insertMany();
console.log("Inserted 110 random games into", DB_PATH);
