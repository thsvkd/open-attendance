import { test, expect } from "@playwright/test";

/**
 * 인증 E2E 테스트 - 실제 사용 플로우 순서로 실행
 *
 * 테스트 순서:
 * 1. 초기 상태 (DB에 유저 없음) - /setup으로 리다이렉트 확인
 * 2. 초기 설정 - admin 계정 생성
 * 3. 로그인/회원가입 테스트 (admin 계정 존재 상태)
 */

// 테스트 계정 정보
const ADMIN = {
  name: "Admin User",
  email: "admin@example.com",
  password: "admin123456",
};

// === Phase 1: 초기 상태 (유저 없음) ===
test.describe.serial("Phase 1: 초기 상태 (유저 없음)", () => {
  test("/ 접근 시 /setup으로 리다이렉트되어야 함", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*setup.*/);
  });

  test("/login 접근 시 /setup으로 리다이렉트되어야 함", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*setup.*/);
  });

  test("/register 접근 시 /setup으로 리다이렉트되어야 함", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*setup.*/);
  });

  test("초기 설정 페이지가 올바르게 렌더링되어야 함", async ({ page }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Initial Setup")).toBeVisible();
    await expect(page.getByPlaceholder("John Doe")).toBeVisible();
    await expect(page.getByPlaceholder("admin@example.com")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Admin Account" }),
    ).toBeVisible();
  });
});

// === Phase 2: 초기 설정 - admin 계정 생성 ===
test.describe.serial("Phase 2: 초기 설정 - admin 계정 생성", () => {
  test("빈 필드로 계정 생성 시도 시 유효성 검사가 작동해야 함", async ({
    page,
  }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Create Admin Account" }).click();

    // 유효성 검사 메시지가 표시되어야 함
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("admin 계정을 성공적으로 생성해야 함", async ({ page }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");

    // 폼 작성
    await page.getByPlaceholder("John Doe").fill(ADMIN.name);
    await page.getByPlaceholder("admin@example.com").fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
    await page.getByLabel("Confirm Password").fill(ADMIN.password);

    // 제출
    await page.getByRole("button", { name: "Create Admin Account" }).click();

    // 성공 후 /login으로 리다이렉트되어야 함
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("admin 생성 후 /setup 접근 시 /login으로 리다이렉트되어야 함", async ({
    page,
  }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*login.*/);
  });
});

// === Phase 3: 로그인 테스트 (admin 계정 존재) ===
test.describe.serial("Phase 3: 로그인 테스트", () => {
  test("로그인 페이지가 올바르게 렌더링되어야 함", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByPlaceholder("m@example.com")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("빈 필드로 로그인 시도 시 유효성 검사가 작동해야 함", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Login" }).click();

    // 여전히 로그인 페이지에 있어야 함
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("잘못된 자격 증명으로 로그인 시도 시 실패해야 함", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("m@example.com").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    // 로그인 페이지에 머물러야 함
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("올바른 자격 증명으로 로그인 시 대시보드로 이동해야 함", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("m@example.com").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Login" }).click();

    // 대시보드로 리다이렉트되어야 함
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard.*/);
  });
});

// === Phase 4: 회원가입 테스트 (admin 계정 존재) ===
test.describe.serial("Phase 4: 회원가입 테스트", () => {
  test("회원가입 페이지가 올바르게 렌더링되어야 함", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByPlaceholder("John Doe")).toBeVisible();
    await expect(page.getByPlaceholder("m@example.com")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
  });

  test("빈 필드로 회원가입 시도 시 유효성 검사가 작동해야 함", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Register" }).click();

    // 유효성 검사 메시지가 표시되어야 함
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("새 사용자를 성공적으로 등록해야 함", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("John Doe").fill("Test User");
    await page.getByPlaceholder("m@example.com").fill("user@example.com");
    await page.getByLabel("Password", { exact: true }).fill("user123456");
    await page.getByLabel("Confirm Password").fill("user123456");
    await page.getByRole("button", { name: "Register" }).click();

    // 성공 후 /login으로 리다이렉트되어야 함
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("이미 존재하는 이메일로 회원가입 시도 시 실패해야 함", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("John Doe").fill("Duplicate User");
    await page.getByPlaceholder("m@example.com").fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: "Register" }).click();

    // 에러 발생 후 회원가입 페이지에 머물러야 함
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*register.*/);
  });
});

// === Phase 5: 보호된 라우트 ===
test.describe.serial("Phase 5: 보호된 라우트", () => {
  test("인증되지 않은 사용자는 대시보드에 접근할 수 없어야 함", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});

    const currentUrl = page.url();
    expect(currentUrl).toContain("/login");
  });
});
