import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";

// Mock environment variables for testing
beforeAll(() => {
  process.env.DATABASE_URL = "file:./test.db";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only";
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global test setup
afterAll(() => {
  vi.resetAllMocks();
});
