import { test, expect, type Page } from '@playwright/test';
import Database from 'better-sqlite3';
import { execSync } from 'child_process';
import path from 'path';

const PASSWORD = process.env.BLOOD_BOWL_KEY ?? '';
const TEST_DB  = path.join(process.cwd(), 'data', 'test.db');

test.beforeEach(() => {
  const db = new Database(TEST_DB);
  db.prepare('DELETE FROM games').run();
  db.close();
  execSync('node scripts/seed-test.js', { env: { ...process.env, DB_PATH: TEST_DB } });
});

// --- UI helper ---

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

// --- CRUD ---

test('add a game', async ({ page }) => {
  const name = `Add-Test-${Date.now()}`;
  await addGame(page, name);
  await expect(page.getByRole('table', { name: 'Games' })).toContainText(name);
});

test('edit a game', async ({ page }) => {
  const name       = `Edit-Test-${Date.now()}`;
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
  // Seed contains Seed W Game, Seed D Game, Seed L Game
  await page.goto('/blood-bowl');
  const text = await page.locator('.overall').textContent() ?? '';
  expect(text.indexOf('W')).toBeLessThan(text.indexOf('D'));
  expect(text.indexOf('D')).toBeLessThan(text.indexOf('L'));
});

// --- Add game link position ---

test('add game link appears above the game table', async ({ page }) => {
  await page.goto('/blood-bowl');
  const linkY  = (await page.getByRole('link', { name: '+ Add game' }).boundingBox())!.y;
  const tableY = (await page.getByRole('table', { name: 'Games' }).boundingBox())!.y;
  expect(linkY).toBeLessThan(tableY);
});

// --- Pagination (13 seeded games: 10 on page 1, 3 on page 2) ---

test('shows 10 games per page', async ({ page }) => {
  await page.goto('/blood-bowl');
  const rows = page.getByRole('table', { name: 'Games' }).getByRole('row');
  await expect(rows).toHaveCount(11); // 1 header + 10 data rows
});

test('next link navigates to page 2', async ({ page }) => {
  await page.goto('/blood-bowl');
  await page.getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/page=2/);
  const rows = page.getByRole('table', { name: 'Games' }).getByRole('row');
  await expect(rows).toHaveCount(4); // 1 header + 3 games
});

test('prev link navigates back to page 1', async ({ page }) => {
  await page.goto('/blood-bowl?page=2');
  await page.getByRole('link', { name: /Prev/ }).click();
  await expect(page).toHaveURL(/page=1/);
  const rows = page.getByRole('table', { name: 'Games' }).getByRole('row');
  await expect(rows).toHaveCount(11); // 1 header + 10 data rows
});

test('prev is disabled on page 1', async ({ page }) => {
  await page.goto('/blood-bowl');
  await expect(page.getByRole('link', { name: /Prev/ })).not.toBeVisible();
  await expect(page.locator('.disabled', { hasText: 'Prev' })).toBeVisible();
});

test('next is disabled on the last page', async ({ page }) => {
  await page.goto('/blood-bowl?page=2');
  await expect(page.getByRole('link', { name: /Next/ })).not.toBeVisible();
  await expect(page.locator('.disabled', { hasText: 'Next' })).toBeVisible();
});

// --- Filters (use seed data directly) ---

test('platform filter narrows results', async ({ page }) => {
  await page.goto('/blood-bowl?platform=Blood+Bowl+3');
  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('BB3 Extra 5');
  await expect(table).not.toContainText('Fumbbl Game');
});

test('format filter narrows results', async ({ page }) => {
  await page.goto('/blood-bowl?format=league');
  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('BB3 Extra 5');
  await expect(table).not.toContainText('Ladder Game');
});

test('my race filter narrows results', async ({ page }) => {
  await page.goto('/blood-bowl?my_race=Orc');
  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('BB3 Extra 5');
  await expect(table).not.toContainText('Dwarf Game');
});

test('opponent race filter narrows results', async ({ page }) => {
  await page.goto('/blood-bowl?opponent_race=Human');
  const table = page.getByRole('table', { name: 'Games' });
  await expect(table).toContainText('BB3 Extra 5');
  await expect(table).not.toContainText('Skaven Game');
});

test('clear link resets all filters', async ({ page }) => {
  await page.goto('/blood-bowl?platform=Blood+Bowl+3');
  await page.getByRole('link', { name: 'Clear' }).click();
  await expect(page).toHaveURL('/blood-bowl');
});

test('filters are preserved in pagination links', async ({ page }) => {
  // 11 seeded BB3 games trigger a second page when filtering by platform
  await page.goto('/blood-bowl?platform=Blood+Bowl+3');
  const nextHref = await page.getByRole('link', { name: /Next/ }).getAttribute('href');
  expect(nextHref).toContain('platform=Blood+Bowl+3');
});

// --- Format options scoped to platform ---

test('selecting a platform updates format options to match', async ({ page }) => {
  await page.goto('/blood-bowl');
  await page.locator('#platform-select').selectOption('tabletop');
  const labels = await page.locator('#format-select option').allTextContents();
  expect(labels).toContain('tournament');
  expect(labels).not.toContain('ladder'); // ladder is BB3/Fumbbl only
});

test('format dropdown shows all options when no platform is selected', async ({ page }) => {
  await page.goto('/blood-bowl');
  const labels = await page.locator('#format-select option').allTextContents();
  expect(labels).toContain('league');
  expect(labels).toContain('tournament');
});
