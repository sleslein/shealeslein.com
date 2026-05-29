import { getDb } from "./db";

const db = getDb();

// Teams
const teams = [
  "Amazon",
  "Black Orc",
  "Bretonnian",
  "Chaos Chosen",
  "Chaos Dwarf",
  "Chaos Renegade",
  "Dark Elf",
  "Dwarf",
  "Elven Union",
  "Gnome",
  "Goblin",
  "Halfling",
  "High Elf",
  "Human",
  "Imperial Nobility",
  "Khorne",
  "Lizardmen",
  "Necromantic Horror",
  "Norse",
  "Nurgle",
  "Ogre",
  "Old World Alliance",
  "Orc",
  "Shambling Undead",
  "Skaven",
  "Snotling",
  "Tomb Kings",
  "Underworld Denizens",
  "Vampire",
  "Wood Elf",
];

const insertTeam = db.prepare(`INSERT OR IGNORE INTO teams (name) VALUES (?)`);
for (const name of teams) {
  insertTeam.run(name);
}
console.log(`Seeded ${teams.length} teams`);

// Platforms
const platforms = ["Blood Bowl 3", "Fumbbl", "tabletop"];
const insertPlatform = db.prepare(`INSERT OR IGNORE INTO platforms (name) VALUES (?)`);
for (const name of platforms) {
  insertPlatform.run(name);
}
console.log(`Seeded ${platforms.length} platforms`);

// Formats
const bb3Id = (
  db.prepare(`SELECT id FROM platforms WHERE name = 'Blood Bowl 3'`).get() as { id: number }
).id;
const fumbbId = (
  db.prepare(`SELECT id FROM platforms WHERE name = 'Fumbbl'`).get() as { id: number }
).id;
const tabletopId = (
  db.prepare(`SELECT id FROM platforms WHERE name = 'tabletop'`).get() as { id: number }
).id;

const formats: { name: string; platform_id: number }[] = [
  { name: "league", platform_id: bb3Id },
  { name: "ladder", platform_id: bb3Id },
  { name: "resurrection", platform_id: bb3Id },
  { name: "community event", platform_id: bb3Id },
  { name: "friendly", platform_id: bb3Id },
  { name: "league", platform_id: fumbbId },
  { name: "ladder", platform_id: fumbbId },
  { name: "resurrection", platform_id: fumbbId },
  { name: "community event", platform_id: fumbbId },
  { name: "friendly", platform_id: fumbbId },
  { name: "league", platform_id: tabletopId },
  { name: "tournament", platform_id: tabletopId },
  { name: "friendly", platform_id: tabletopId },
];

const insertFormat = db.prepare(`INSERT OR IGNORE INTO formats (name, platform_id) VALUES (?, ?)`);
for (const f of formats) {
  insertFormat.run(f.name, f.platform_id);
}
console.log(`Seeded ${formats.length} formats`);
