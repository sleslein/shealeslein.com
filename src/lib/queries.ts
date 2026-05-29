import { getDb } from "./db";

export interface Game {
  id: number;
  date: string;
  opponent_name: string;
  my_race: string;
  opponent_race: string;
  result: "W" | "L" | "D";
  score_for: number;
  score_against: number;
  platform: string;
  format: string;
  notes: string | null;
}

export interface Team {
  id: number;
  name: string;
}

export interface Platform {
  id: number;
  name: string;
}

export interface Format {
  id: number;
  name: string;
  platform_id: number;
}

export interface RawGame {
  id: number;
  date: string;
  opponent_name: string;
  my_race_id: number;
  opponent_race_id: number;
  result: "W" | "L" | "D";
  score_for: number;
  score_against: number;
  platform_id: number;
  format_id: number;
  notes: string | null;
}

export interface InsertGameData {
  opponent_name: string;
  my_race_id: number;
  opponent_race_id: number;
  result: "W" | "L" | "D";
  score_for: number;
  score_against: number;
  date: string;
  platform_id: number;
  format_id: number;
  notes: string | null;
}

export function getGames(): Game[] {
  return getDb()
    .prepare(`
    SELECT
      g.id,
      g.date,
      g.opponent_name,
      mt.name  AS my_race,
      ot.name  AS opponent_race,
      g.result,
      g.score_for,
      g.score_against,
      p.name   AS platform,
      f.name   AS format,
      g.notes
    FROM games g
    JOIN teams     mt ON mt.id = g.my_race_id
    JOIN teams     ot ON ot.id = g.opponent_race_id
    JOIN platforms p  ON p.id  = g.platform_id
    JOIN formats   f  ON f.id  = g.format_id
    ORDER BY g.date DESC
  `)
    .all() as Game[];
}

export function getTeams(): Team[] {
  return getDb().prepare(`SELECT id, name FROM teams ORDER BY name`).all() as Team[];
}

export function getPlatforms(): Platform[] {
  return getDb().prepare(`SELECT id, name FROM platforms ORDER BY name`).all() as Platform[];
}

export function getFormats(): Format[] {
  return getDb()
    .prepare(`SELECT id, name, platform_id FROM formats ORDER BY name`)
    .all() as Format[];
}

export function getGame(id: number): Game | undefined {
  return getDb()
    .prepare(`
    SELECT
      g.id,
      g.date,
      g.opponent_name,
      mt.name  AS my_race,
      ot.name  AS opponent_race,
      g.result,
      g.score_for,
      g.score_against,
      p.name   AS platform,
      f.name   AS format,
      g.notes
    FROM games g
    JOIN teams     mt ON mt.id = g.my_race_id
    JOIN teams     ot ON ot.id = g.opponent_race_id
    JOIN platforms p  ON p.id  = g.platform_id
    JOIN formats   f  ON f.id  = g.format_id
    WHERE g.id = ?
  `)
    .get(id) as Game | undefined;
}

export function getRawGame(id: number): RawGame | undefined {
  return getDb()
    .prepare(`
    SELECT id, date, opponent_name, my_race_id, opponent_race_id, result,
           score_for, score_against, platform_id, format_id, notes
    FROM games WHERE id = ?
  `)
    .get(id) as RawGame | undefined;
}

export function deleteGame(id: number): void {
  getDb().prepare(`DELETE FROM games WHERE id = ?`).run(id);
}

export function updateGame(id: number, data: InsertGameData): void {
  getDb()
    .prepare(`
    UPDATE games
    SET opponent_name    = ?,
        my_race_id       = ?,
        opponent_race_id = ?,
        result           = ?,
        score_for        = ?,
        score_against    = ?,
        date             = ?,
        platform_id      = ?,
        format_id        = ?,
        notes            = ?
    WHERE id = ?
  `)
    .run(
      data.opponent_name,
      data.my_race_id,
      data.opponent_race_id,
      data.result,
      data.score_for,
      data.score_against,
      data.date,
      data.platform_id,
      data.format_id,
      data.notes,
      id,
    );
}

export function insertGame(data: InsertGameData): void {
  getDb()
    .prepare(`
    INSERT INTO games (opponent_name, my_race_id, opponent_race_id, result, score_for, score_against, date, platform_id, format_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      data.opponent_name,
      data.my_race_id,
      data.opponent_race_id,
      data.result,
      data.score_for,
      data.score_against,
      data.date,
      data.platform_id,
      data.format_id,
      data.notes,
    );
}
