# Blood Bowl Tracker — Architecture Plan

## Context

Add a `/blood-bowl/` section to shealeslein.com to track win/loss/draw records against opponents in Blood Bowl. Data is stored in SQLite on the existing Fly.io persistent volume at `/data`. The section needs to be dynamically rendered (SSR) since data lives in the database at runtime, not at build time.

---

## Stack Additions

- **`better-sqlite3`** — synchronous SQLite client for Node.js, well-suited to the single-server Fly.io setup
- **`@types/better-sqlite3`** — TypeScript types

---

## Database Schema

File: `/data/bloodbowl.db` (on Fly volume)

```sql
CREATE TABLE IF NOT EXISTS games (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  opponent_name TEXT    NOT NULL,
  opponent_race TEXT    NOT NULL,
  result        TEXT    NOT NULL CHECK(result IN ('W', 'L', 'D')),
  score_for     INTEGER NOT NULL,
  score_against INTEGER NOT NULL,
  date          TEXT    NOT NULL,
  league        TEXT,
  notes         TEXT,
  created_at    TEXT    DEFAULT CURRENT_TIMESTAMP
);
```

---

## New Files

### `src/lib/db.ts`

Singleton that opens/creates the SQLite database and runs `CREATE TABLE IF NOT EXISTS` on first connect. Exported as `getDb()`.

### `src/pages/blood-bowl/index.astro`

SSR page (`export const prerender = false`). Queries all games, computes:

- Overall W/L/D totals
- W/L/D breakdown by opponent race
- Full results table sorted by date descending

Uses `BaseLayout` with `title="Blood Bowl"`.

### `src/pages/blood-bowl/add.astro`

SSR page with a form to add a new game. On GET: renders the form. On POST: inserts the row and redirects to `/blood-bowl/`.

Protected by a `BLOOD_BOWL_KEY` environment variable — the form requires a password field that must match the env var before the insert runs. If wrong, re-renders with an error.

### `src/components/GameTable.astro`

Renders the results table (date, opponent, race, result, score, league, notes).

### `src/components/StatsCard.astro`

Renders a W/L/D summary card — overall and per-race breakdown.

---

## Modified Files

### `astro.config.mjs`

Change `output: 'static'` to `output: 'hybrid'` to allow SSR pages alongside static ones.

### `src/components/Header.astro`

Add a `/blood-bowl/` nav link alongside the existing `/posts` and `/about` links.

---

## Environment Variable

Add `BLOOD_BOWL_KEY` as a Fly.io secret:

```bash
fly secrets set BLOOD_BOWL_KEY=<your-password>
```

Used only server-side to gate the add-game form. Never exposed to the client.

---

## Page Routes

| Route             | Type | Purpose                            |
| ----------------- | ---- | ---------------------------------- |
| `/blood-bowl/`    | SSR  | Stats summary + full results table |
| `/blood-bowl/add` | SSR  | Form to add a new game             |

---

## Verification

1. `npm run build` passes locally
2. `fly deploy` succeeds
3. Visit `https://shealeslein.com/blood-bowl/` — page loads (empty state initially)
4. Visit `https://shealeslein.com/blood-bowl/add` — form renders
5. Submit a game with correct password → redirects to index, game appears in table
6. Submit with wrong password → error shown, no insert
7. Stats card updates correctly as more games are added
