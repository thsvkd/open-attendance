# 테스트 가이드

이 문서는 Open Attendance 프로젝트의 테스트 환경 및 실행 방법을 설명합니다.

## 📋 목차

- [테스트 스택](#테스트-스택)
- [테스트 실행](#테스트-실행)
- [테스트 구조](#테스트-구조)
- [테스트 작성 가이드](#테스트-작성-가이드)
- [CI/CD](#cicd)

## 🛠 테스트 스택

### 단위/통합 테스트

- **Vitest**: 빠르고 현대적인 테스트 프레임워크
- **Testing Library**: React 컴포넌트 테스트
- **vitest-mock-extended**: Prisma 및 의존성 모킹

### E2E 테스트

- **Playwright**: 크로스 브라우저 E2E 테스트
  - Chromium, Firefox, WebKit 지원

## 🚀 테스트 실행

### 환경 제약사항

**참고**: 샌드박스 환경에서는 Playwright 브라우저 다운로드가 차단될 수 있습니다. 이 경우 E2E 테스트는 로컬 개발 환경이나 CI/CD 환경에서 실행해야 합니다.

### NPM 스크립트 사용

```bash
# 모든 단위/통합 테스트 실행
npm run test

# 테스트 watch 모드 (개발 중 추천)
npm run test:watch

# 테스트 UI로 실행
npm run test:ui

# 코드 커버리지 포함
npm run test:coverage

# E2E 테스트 실행
npm run test:e2e

# E2E 테스트 UI 모드
npm run test:e2e:ui

# E2E 테스트 headed 모드 (브라우저 보이기)
npm run test:e2e:headed

# 모든 테스트 실행 (단위 + E2E)
npm run test:all
```

### Shell 스크립트 사용

프로젝트 루트에서 실행:

```bash
# 모든 테스트 실행
./scripts/test.sh all

# 단위/통합 테스트만 실행
./scripts/test.sh unit

# E2E 테스트만 실행
./scripts/test.sh e2e

# Watch 모드로 실행
./scripts/test.sh watch
```

## 📁 테스트 구조

```
open-attendance/
├── __tests__/              # 단위 및 통합 테스트
│   ├── helpers/           # 테스트 헬퍼 유틸리티
│   │   ├── prisma-mock.ts   # Prisma 모킹 헬퍼
│   │   └── auth-mock.ts     # 인증 모킹 헬퍼
│   ├── lib/              # 비즈니스 로직 테스트
│   │   ├── leave-utils.test.ts
│   │   └── api-utils.test.ts
│   └── api/              # API 라우트 통합 테스트
│       └── leaves.test.ts
├── e2e/                   # E2E 테스트
│   └── auth.spec.ts      # 인증 플로우 테스트
├── vitest.config.ts      # Vitest 설정
├── vitest.setup.ts       # Vitest 전역 설정
└── playwright.config.ts  # Playwright 설정
```

## 📝 테스트 작성 가이드

### 단위 테스트 예제

```typescript
import { describe, it, expect } from "vitest";
import { calculateDays } from "@/lib/leave-utils";

describe("calculateDays", () => {
  it("전일 휴가의 일수를 올바르게 계산해야 함", () => {
    const startDate = new Date("2024-01-15");
    const endDate = new Date("2024-01-17");

    const days = calculateDays("FULL_DAY", startDate, endDate);

    expect(days).toBe(3);
  });
});
```

### API 통합 테스트 예제

```typescript
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/leaves/route";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import { createMockSession } from "@/__tests__/helpers/auth-mock";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: prismaMock,
}));

describe("/api/leaves GET", () => {
  it("인증된 사용자의 휴가 목록을 반환해야 함", async () => {
    const mockSession = createMockSession();
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const mockLeaves = [
      /* ... */
    ];
    prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaves);

    const response = await GET();
    expect(response.status).toBe(200);
  });
});
```

### E2E 테스트 예제

```typescript
import { test, expect } from "@playwright/test";

test("로그인 페이지가 올바르게 렌더링되어야 함", async ({ page }) => {
  await page.goto("/login");

  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
```

## 🔧 테스트 모범 사례

### 1. 테스트 격리

- 각 테스트는 독립적으로 실행되어야 합니다
- 테스트 간 상태 공유를 피합니다
- `beforeEach`와 `afterEach`를 사용하여 상태를 초기화합니다

### 2. 명확한 테스트 케이스

- 테스트 이름은 무엇을 테스트하는지 명확히 설명해야 합니다
- 한국어로 작성하여 가독성을 높입니다
- Given-When-Then 패턴을 따릅니다

### 3. Mock 사용

- 외부 의존성(DB, API 등)은 모킹합니다
- `vitest-mock-extended`를 사용하여 Prisma를 모킹합니다
- 테스트 헬퍼를 활용하여 재사용 가능한 모킹 로직을 작성합니다

### 4. 의미 있는 Assertion

- 구체적이고 명확한 assertion을 작성합니다
- 에러 메시지를 포함하여 실패 원인을 쉽게 파악할 수 있도록 합니다

## 🎯 CI/CD

### GitHub Actions

`.github/workflows/test.yml` 파일을 통해 자동화된 테스트가 실행됩니다:

- **Push/PR 시 자동 실행**: `main`, `develop` 브랜치
- **병렬 실행**: 단위/통합 테스트와 E2E 테스트가 별도 Job으로 실행
- **아티팩트 업로드**: 테스트 결과, 커버리지, Playwright 리포트 저장

### 실행 환경

- Node.js 20.x
- Ubuntu Latest
- Playwright Chromium 브라우저

## 🐛 트러블슈팅

### 테스트 실패 시

1. **로컬에서 재현**: 동일한 환경에서 테스트를 실행해 보세요
2. **로그 확인**: 테스트 출력과 에러 메시지를 자세히 읽어보세요
3. **격리 테스트**: 실패한 테스트만 단독으로 실행해 보세요

```bash
# 특정 테스트 파일만 실행
npx vitest run __tests__/lib/leave-utils.test.ts

# 특정 E2E 테스트만 실행
npx playwright test e2e/auth.spec.ts
```

### E2E 테스트 디버깅

```bash
# UI 모드로 실행 (단계별 확인 가능)
npm run test:e2e:ui

# Headed 모드로 실행 (브라우저 보이기)
npm run test:e2e:headed

# 특정 브라우저만 사용
npx playwright test --project=chromium
```

## 📚 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [Playwright 공식 문서](https://playwright.dev/)
- [Testing Library 공식 문서](https://testing-library.com/)
- [Prisma Testing 가이드](https://www.prisma.io/docs/guides/testing)
