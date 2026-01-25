import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */

// 환경 변수에서 포트 가져오기 (기본값: 3001)
// E2E_PORT를 설정하면 해당 포트 사용, 아니면 3001 사용
const PORT = process.env.E2E_PORT ? parseInt(process.env.E2E_PORT, 10) : 3001;
const BASE_URL = `http://localhost:${PORT}`;

// E2E 전용 Next 캐시 디렉터리(기본: .next-e2e)
// distDir은 next.config.ts에서 NEXT_DIST_DIR를 참고하도록 변경됨
const E2E_DIST_DIR = process.env.NEXT_DIST_DIR || ".next-e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  maxFailures: process.env.CI ? 0 : 1, // Stop on first failure in local dev
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [
        ["./playwright-reporter.js", {}],
        ["html", { open: "never" }],
      ],
  timeout: process.env.CI ? 30 * 1000 : 30 * 1000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 30 * 1000,
    actionTimeout: 10 * 1000,
  },

  expect: {
    timeout: 15 * 1000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: process.env.CI
      ? `node scripts/init-db.js --test && npm start -- --port ${PORT}`
      : `node scripts/init-db.js --test && npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    // Always start a fresh server for E2E to guarantee a clean test DB
    reuseExistingServer: false,
    timeout: 120 * 1000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      DATABASE_URL: "file:./test.db",
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: "test-secret-key-for-testing-only",
      NEXT_DIST_DIR: E2E_DIST_DIR,
    },
  },
});
