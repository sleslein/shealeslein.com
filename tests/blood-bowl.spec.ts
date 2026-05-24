import { test, expect, type Page } from '@playwright/test';
import Database from 'better-sqlite3';
import path from 'path';

const PASSWORD = process.env.BLOOD_BOWL_KEY ?? '';
const TEST_DB = path.join(process.cwd(), 'data', 'test.db');

test.beforeEach(() => {
  const db = new Database(TEST_DB);
  db.prepare('DELETE FROM games').run();
  db.close();
});

type GameOverrides = Partial<{
  opponent_name: string;
  my_race: string;
  opponent_race: string;
  result: 'W' | 'L' | 'D';
  score_for: number;
  score_against: number;
  date: string;
  platform: string;
  format: string;
}>;

function insertGame(overrides: GameOverrides = {}) {
  const opts = {
    opponent_name: 'Test Opponent',
    my_race: 'Orc',
    opponent_race: 'Human',
    result: 'W' as const,
    score_for: 2,
    score_against: 1,
    date: '2026-01-01',
    platform: 'Blood Bowl 3',
    format: 'league',
    ...overrides,
  };
  const db = new Database(TEST_DB);
  const myRaceId   = (db.prepare('SELECT id FROM teams     WHERE name = ?').get(opts.my_race)   as { id: number }).id;
  const oppRaceId  = (db.prepare('SELECT id FROM teams     WHERE name = ?').get(opts.opponent_race) as { id: number }).id;
  const platformId = (db.prepare('SELECT id FROM platforms WHERE name = ?').get(opts.platform)  as { id: number }).id;
  const formatId   = (db.prepare('SELECT id FROM formats   WHERE name = ? AND platform_id = ?').get(opts.format, platformId) as { id: number }).id;
  db.prepare(`
    INSERT INTO games (opponent_name, my_race_id, opponent_race_id, result, score_for, score_against, date, platform_id, format_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(opts.opponent_name, myRaceId, oppRaceId, opts.result, opts.score_for, opts.score_against, opts.date, platformId, formatId);
  db.close();
}

function insertGames(count: number, overrides: GameOverrides = {}) {
  for (let i = 0; i < count; i++) {
    insertGame({ opponent_name: `Opponent ${i + 1}`, ...overrides });
  }
}

async function addGame(page: Page, opponentName: string) {
  await page.goto('/blood-bowl/add');
  await page.getByLabel('Date').fill('2026-03-21');
  await page.getByLabel('Opponent name').fill(opponentName);
  await page.getByLabel('My race').selectOption({ label: 'Orc' });
  await page.getByLabel('Opponent race').selectOption({ label: 'Human' });
  await page.getByLabel('Result').selectOption('W');
  await page.getByLabel('Score for').fill('2');
  await page.getByLabel('Score against').fill('1');
  await page.getByLabel('Platform').selectOption({ label: 'Blood Bowl 3' });
  await page.getByLabel('Format').selectOption({ label: 'league' });
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Add game' }).click();
  await expect(page).toHaveURL('/blood-bowl/');
}

test('add a game', async ({ page }) => {
  const name = `Add-Test-${Date.now()}`;
  await addGame(page, name);
  await expect(page.getByRole('table', { name: 'Games' })).toContainText(name);
});

test('edit a game', async ({ page }) => {
  const name = `Edit-Test-${Date.now()}`;
  const editedName = `Edited-${Date.now()}`;
  await addGame(page, name);

  const row = page.getByRole('table', { name: 'Games' }).getByRole('row').filter({ hasText: name });
  await row.getByRole('link', { name: 'Edit' }).click();
  await expect(page).toHaveURL(/\/blood-bowl\/edit/);

  await page.getByLabel('Opponent name').fill(editedName);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page).toHaveURL('/blood-bowl/');
  await expect(page.getByRole('table', { name: 'Games' })).toContainText(editedName);
  await expect(page.getByRole('table', { name: 'Games' })).not.toContainText(name);
});

test('delete a game', async ({ page }) => {
  const name = `Delete-Test-${Date.now()}`;
  await addGame(page, name);

  const row = page.getByRole('table', { name: 'Games' }).getByRole('row').filter({ hasText: name });
  await row.getByRole('link', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/blood-bowl\/delete/);

  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page).toHaveURL('/blood-bowl/');
  await expect(page.getByRole('main')).not.toContainText(name);
});

// --- W/D/L ordering ---

test('stats card shows results in W/D/L order', async ({ page }) => {
  insertGame({ result: 'W' });
  insertGame({ result: 'D' });
  insertGame({ result: 'L' });
  await page.goto('/blood-bowl');

  const text = await page.locator('.overall').textContent() ?? '';
  expect(text.indexOf('W')).toBeLessThan(text.indexOf('D'));
  expect(text.indexOf('D')).toBeLessThan(text.indexOf('L'));
});

// --- Add game link position ---

test('add game link appears above the game table', async ({ page }) => {
  insertGame();
  await page.goto('/blood-bowl');

  const linkY  = (await page.getByRole('link', { name: '+ Add game' }).boundingBox())!.y;
  const tableY = (await page.getByRole('table', { name: 'Games' }).boundingBox())!.y;
  expect(linkY).toBeLessThan(tableY);
});

// --- Pagination ---

test('shows 10 games per page', async ({ page }) => {
  insertGames(11);
  await page.goto('/blood-bowl');

  const rows = page.getByRole('table', { name: 'Games' }).getByRole('row');
  await expect(rows).toHaveCount(11); // 1 header + 10 data rows
});

test('next link navigates to page 2', async ({ page }) => {
  insertGames(11);
  await page.goto('/blood-bowl');

  await page.getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/page=2/);

  const rows = page.getByRole('table', { name: 'Games' }).getByRole('row');
  await expect(rows).toHaveCount(2); // 1 header + 1 remaining game
});

test('prev link navigates back to page 1', async ({ page }) => {
  insertGames(11);
  await page.goto('/blood-bowl?page=2');

  await page.getByRole('link', { name: /Prev/ }).click();
  await expect(page).toHaveURL(/page=1/);

  const rows = page.getByRole('table', { name: 'Games' }).getByRole('row');
  await expect(rows).toHaveCount(11);
});

test('prev is disabled on page 1', async ({ page }) => {
  insertGame();
  await page.goto('/blood-bowl');

  await expect(page.getByRole('link', { name: /Prev/ })).not.toBeVisible();
  await expect(page.locator('.disabled', { hasText: 'Prev' })).toBeVisible();
});

test('next is disabled on the last page', async ({ page }) => {
  insertGame();
  await page.goto('/blood-bowl');

  await expect(page.getByRole('link', { name: /Next/ })).not.toBeVisible();
  await expect(page.locator('.disabled', { hasText: 'Next' })).toBeVisible();
});

// --- Filters ---

test('platform filter narrows results', async ({ page }) => {
  insertGame({ opponent_name: 'BB3 Game',    platform: 'Blood Bowl 3', format: 'league' });
  insertGame({ opponent_name: 'Fumbbl Game', platform: 'Fumbbl',       format: 'league' });
  await page.goto('/blood-bowl?platform=Blood+Bowl+3');

  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('BB3 Game');
  await expect(table).not.toContainText('Fumbbl Game');
});

test('format filter narrows results', async ({ page }) => {
  insertGame({ opponent_name: 'League Game', format: 'league'  });
  insertGame({ opponent_name: 'Ladder Game', format: 'ladder'  });
  await page.goto('/blood-bowl?format=league');

  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('League Game');
  await expect(table).not.toContainText('Ladder Game');
});

test('my race filter narrows results', async ({ page }) => {
  insertGame({ opponent_name: 'Orc Game',   my_race: 'Orc'   });
  insertGame({ opponent_name: 'Dwarf Game', my_race: 'Dwarf' });
  await page.goto('/blood-bowl?my_race=Orc');

  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('Orc Game');
  await expect(table).not.toContainText('Dwarf Game');
});

test('opponent race filter narrows results', async ({ page }) => {
  insertGame({ opponent_name: 'vs Human', opponent_race: 'Human' });
  insertGame({ opponent_name: 'vs Skaven', opponent_race: 'Skaven' });
  await page.goto('/blood-bowl?opponent_race=Human');

  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('vs Human');
  await expect(table).not.toContainText('vs Skaven');
});

test('clear link resets all filters', async ({ page }) => {
  insertGame({ opponent_name: 'BB3 Game', platform: 'Blood Bowl 3' });
  await page.goto('/blood-bowl?platform=Blood+Bowl+3');

  await page.getByRole('link', { name: 'Clear' }).click();
  await expect(page).toHaveURL('/blood-bowl');
});

test('filters are preserved in pagination links', async ({ page }) => {
  insertGames(11, { platform: 'Blood Bowl 3', format: 'league' });
  await page.goto('/blood-bowl?platform=Blood+Bowl+3');

  const nextHref = await page.getByRole('link', { name: /Next/ }).getAttribute('href');
  expect(nextHref).toContain('platform=Blood+Bowl+3');
});

// --- Format options scoped to platform ---

test('selecting a platform updates format options to match', async ({ page }) => {
  insertGame({ platform: 'tabletop', format: 'tournament' });
  await page.goto('/blood-bowl');

  await page.locator('#platform-select').selectOption('tabletop');

  const formatOptions = page.locator('#format-select option');
  const labels = await formatOptions.allTextContents();
  expect(labels).toContain('tournament');
  // league exists for BB3/Fumbbl but not tabletop
  expect(labels).not.toContain('league');
});

test('format dropdown shows all options when no platform selected', async ({ page }) => {
  insertGame({ platform: 'Blood Bowl 3', format: 'league'      });
  insertGame({ platform: 'tabletop',     format: 'tournament'  });
  await page.goto('/blood-bowl');

  const formatOptions = page.locator('#format-select option');
  const labels = await formatOptions.allTextContents();
  expect(labels).toContain('league');
  expect(labels).toContain('tournament');
});
