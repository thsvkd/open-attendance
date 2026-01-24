import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */

// 환경 변수에서 포트 가져오기 (기본값: 3000)
// E2E_PORT를 설정하면 해당 포트 사용, 아니면 3000 사용
const PORT = process.env.E2E_PORT ? parseInt(process.env.E2E_PORT, 10) : 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html"]] : "html",
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

  projects: process.env.CI
    ? [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },
        {
          name: "webkit",
          use: { ...devices["Desktop Safari"] },
        },
      ],

  webServer: {
    command: process.env.CI
      ? `npm start -- --port ${PORT}`
      : `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
