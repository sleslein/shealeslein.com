import { defineConfig } from "@playwright/test";
import path from "path";
import { config } from "dotenv";

config(); // load .env

const TEST_PORT = 4399;
const TEST_DB = path.join(process.cwd(), "data", "test.db");

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
  },
  webServer: {
    command: `npm run dev -- --port ${TEST_PORT}`,
    url: `http://localhost:${TEST_PORT}`,
    reuseExistingServer: false,
    env: {
      DB_PATH: TEST_DB,
      BLOOD_BOWL_KEY: process.env.BLOOD_BOWL_KEY ?? "",
    },
  },
});
