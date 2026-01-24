# Testing Guide

This document explains the testing environment, setup, and execution methods for the Open Attendance project.

## 📋 Table of Contents

- [Testing Stack](#testing-stack)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [CI/CD](#cicd)
- [Test Coverage](#test-coverage)

## 🛠 Testing Stack

### Unit & Integration Tests

- **Vitest**: Fast and modern testing framework
- **Testing Library**: React component testing
- **vitest-mock-extended**: Prisma and dependency mocking

### E2E Tests

- **Playwright**: Cross-browser E2E testing
  - Supports Chromium, Firefox, and WebKit

## 📁 Test Structure

```
tests/
├── unit/                  # Unit tests
│   └── lib/              # Library function tests
├── integration/          # Integration tests
│   └── api/             # API route tests
├── e2e/                 # End-to-end tests
│   └── auth.spec.ts     # Authentication flow tests
└── helpers/             # Test utilities
    ├── prisma-mock.ts   # Prisma client mocking
    └── auth-mock.ts     # NextAuth session mocking
```

### Test Categories

#### Unit Tests (15 tests)

- **`tests/unit/lib/leave-utils.test.ts`**
  - `getLeaveMinutes` function tests
  - `rangesOverlap` function tests
  - `calculateDays` function tests

- **`tests/unit/lib/api-utils.test.ts`**
  - `errorResponse` tests
  - `successResponse` tests
  - `parseJsonBody` tests
  - Other utility function tests

#### Integration Tests (11 tests)

- **`tests/integration/api/leaves.test.ts`**
  - GET /api/leaves - Leave list retrieval
  - POST /api/leaves - Leave request creation
  - PATCH /api/leaves - Leave request cancellation
  - Authentication and authorization validation

#### E2E Tests (11 tests)

- **`tests/e2e/auth.spec.ts`**
  - Database initialization
  - User registration flow
  - User login flow
  - Session persistence

## 🚀 Running Tests

### Prerequisites

Ensure you have Node.js 20+ and npm installed. Install dependencies first:

```bash
npm ci
```

### NPM Scripts

```bash
# Run all unit/integration tests
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with code coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run all tests (unit + E2E)
npm run test:all
```

### Environment Constraints

**Note**: In sandboxed environments, Playwright browser downloads may be blocked. In such cases, E2E tests should be run in a local development environment or CI/CD environment.

## ✍️ Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { calculateDays } from "@/lib/leave-utils";

describe("calculateDays", () => {
  it("should calculate days correctly", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-05");

    const result = calculateDays(startDate, endDate);

    expect(result).toBe(5);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/leaves/route";
import { prismaMock } from "@/tests/helpers/prisma-mock";

describe("GET /api/leaves", () => {
  it("should return leave requests", async () => {
    prismaMock.leave.findMany.mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/leaves"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.leaves).toEqual([]);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
  });
});
```

## 🧪 Test Configuration

### Vitest Configuration

The project uses `vitest.config.ts` for unit and integration test configuration:

```typescript
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
  },
});
```

### Playwright Configuration

The project uses `playwright.config.ts` for E2E test configuration:

```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3001",
  },
  webServer: {
    command: "npm run dev",
    port: 3001,
  },
});
```

## 🔧 Test Helpers

### Prisma Mock Helper

Located at `tests/helpers/prisma-mock.ts`, provides mocked Prisma client for testing:

```typescript
import { prismaMock } from "@/tests/helpers/prisma-mock";

prismaMock.user.findUnique.mockResolvedValue({
  id: "1",
  email: "test@example.com",
  // ... other fields
});
```

### Auth Mock Helper

Located at `tests/helpers/auth-mock.ts`, provides mocked NextAuth sessions:

```typescript
import { mockSession } from "@/tests/helpers/auth-mock";

const session = mockSession({
  user: { id: "1", email: "test@example.com" },
});
```

## 📊 Test Coverage

Run tests with coverage to see code coverage metrics:

```bash
npm run test:coverage
```

This generates a coverage report showing which parts of the codebase are covered by tests.

### Coverage Thresholds

The project aims for:

- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

## 🔄 CI/CD

Tests are automatically run in GitHub Actions on:

- Every push to main branch
- Every pull request

### CI Test Workflow

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
```

## 🐛 Debugging Tests

### Debug Unit/Integration Tests

```bash
# Run tests in watch mode with verbose output
npm run test:watch -- --reporter=verbose

# Run specific test file
npm run test -- tests/unit/lib/leave-utils.test.ts

# Run tests matching a pattern
npm run test -- -t "calculateDays"
```

### Debug E2E Tests

```bash
# Run in headed mode to see browser
npm run test:e2e:headed

# Run with Playwright Inspector
npx playwright test --debug

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

## 📝 Testing Best Practices

1. **Write descriptive test names**: Test names should clearly describe what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Keep tests independent**: Each test should be able to run independently
4. **Mock external dependencies**: Use mocks for database, APIs, etc.
5. **Test edge cases**: Don't just test the happy path
6. **Maintain test readability**: Tests should be easy to understand
7. **Keep tests fast**: Unit tests should run quickly

## 🆘 Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"

```bash
# Solution: Ensure all dependencies are installed
npm ci
```

**Issue**: Playwright browsers not installed

```bash
# Solution: Install Playwright browsers
npx playwright install --with-deps
```

**Issue**: Database connection errors in tests

```bash
# Solution: Tests use mocked Prisma client, ensure mocks are properly configured
```

**Issue**: E2E tests timeout

```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60000 // 60 seconds
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

For more information about the project, see the [main README](../README.md).
