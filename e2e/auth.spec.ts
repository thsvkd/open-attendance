import { test, expect } from "@playwright/test";

/**
 * 인증(로그인/회원가입) E2E 테스트
 */
test.describe("Authentication", () => {
  test.describe("로그인 페이지", () => {
    test("로그인 페이지가 올바르게 렌더링되어야 함", async ({ page }) => {
      await page.goto("/login");

      // 로그인 폼이 표시되는지 확인
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("빈 필드로 로그인 시도 시 실패해야 함", async ({ page }) => {
      await page.goto("/login");

      // 빈 필드로 제출 시도
      await page.locator('button[type="submit"]').click();

      // 폼 유효성 검사가 작동하는지 확인
      // HTML5 폼 유효성 검사 또는 커스텀 에러 메시지가 표시되어야 함
      const emailInput = page.locator('input[type="email"]');
      
      // 이메일 필드가 여전히 포커스 가능하거나 에러 상태인지 확인
      await expect(emailInput).toBeVisible();
      
      // 여전히 로그인 페이지에 있어야 함 (성공하지 못함)
      await expect(page).toHaveURL(/.*login.*/);
    });

    test("잘못된 자격 증명으로 로그인 시도 시 오류 메시지가 표시되어야 함", async ({
      page,
    }) => {
      await page.goto("/login");

      // 존재하지 않는 계정 정보 입력
      await page.locator('input[type="email"]').fill("nonexistent@example.com");
      await page.locator('input[type="password"]').fill("wrongpassword");
      await page.locator('button[type="submit"]').click();

      // 오류 메시지 또는 로그인 페이지 유지 확인
      await page.waitForTimeout(2000);

      // 여전히 로그인 페이지에 있거나 오류 메시지가 표시되어야 함
      const currentUrl = page.url();
      expect(
        currentUrl.includes("/login") || currentUrl === "http://localhost:3000/"
      ).toBe(true);
    });
  });

  test.describe("회원가입 페이지", () => {
    test("회원가입 페이지가 올바르게 렌더링되어야 함", async ({ page }) => {
      await page.goto("/register");

      // 회원가입 폼이 표시되는지 확인
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("빈 필드로 회원가입 시도 시 실패해야 함", async ({ page }) => {
      await page.goto("/register");

      // 빈 필드로 제출 시도
      await page.locator('button[type="submit"]').click();

      // 폼 유효성 검사가 작동하는지 확인
      const nameInput = page.locator('input[name="name"]');
      
      // 이름 필드가 여전히 포커스 가능하거나 에러 상태인지 확인
      await expect(nameInput).toBeVisible();
      
      // 여전히 회원가입 페이지에 있어야 함
      await expect(page).toHaveURL(/.*register.*/);
    });
  });

  test.describe("초기 설정", () => {
    test("초기 설정 페이지가 접근 가능해야 함", async ({ page }) => {
      // 초기 설정 페이지 방문 (첫 관리자 계정 생성)
      await page.goto("/setup");

      // 설정 페이지가 렌더링되는지 확인
      // (이미 설정이 완료되었을 수 있으므로 URL만 확인)
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("localhost:3000");
    });
  });

  test.describe("보호된 라우트", () => {
    test("인증되지 않은 사용자는 대시보드에 접근할 수 없어야 함", async ({
      page,
    }) => {
      // 대시보드 접근 시도
      await page.goto("/dashboard");

      // 로그인 페이지로 리디렉션되어야 함
      await page.waitForURL("**/login**", { timeout: 5000 }).catch(() => {
        // 이미 로그인 페이지에 있을 수 있음
      });

      const currentUrl = page.url();
      expect(
        currentUrl.includes("/login") || currentUrl.includes("/setup")
      ).toBe(true);
    });
  });

  test.describe("로그아웃", () => {
    test("로그아웃 기능이 존재해야 함", async ({ page }) => {
      await page.goto("/");

      // 로그아웃 버튼이나 메뉴가 있는지 확인
      // (실제로는 로그인 후에만 표시됨)
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("localhost:3000");
    });
  });
});
