import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

const TEST_DB = path.join(process.cwd(), 'data', 'test.db');

function runSeed(cmd: string) {
  execSync(cmd, { env: { ...process.env, DB_PATH: TEST_DB } });
}

export default function globalSetup() {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  runSeed('npx tsx src/lib/seed.ts');      // schema + reference data
  runSeed('node scripts/seed-test.js');    // known test games
}
