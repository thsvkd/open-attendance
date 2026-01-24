import { test, expect } from "@playwright/test";

/**
 * Auth E2E Tests - Executed in actual usage flow order
 *
 * Test order:
 * 1. Initial State (No Users) - Verify redirect to /setup
 * 2. Initial Setup - Create admin account
 * 3. Login/Register tests (with admin exists)
 */

// Test account information
const ADMIN = {
  name: "Admin User",
  email: "admin@example.com",
  password: "admin123456",
};

// === Phase 1: Initial State (No Users) ===
test.describe.serial("Phase 1: Initial State (No Users)", () => {
  test("Accessing / should redirect to /setup", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*setup.*/);
  });

  test("Accessing /login should redirect to /setup", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*setup.*/);
  });

  test("Accessing /register should redirect to /setup", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*setup.*/);
  });

  test("Initial setup page should render correctly", async ({ page }) => {
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

// === Phase 2: Initial Setup - Create Admin ===
test.describe.serial("Phase 2: Initial Setup - Create Admin", () => {
  test("Validation should work when creating account with empty fields", async ({
    page,
  }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Create Admin Account" }).click();

    // Validation message should appear
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("Should successfully create admin account", async ({ page }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");

    // Fill form
    await page.getByPlaceholder("John Doe").fill(ADMIN.name);
    await page.getByPlaceholder("admin@example.com").fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
    await page.getByLabel("Confirm Password").fill(ADMIN.password);

    // Submit
    await page.getByRole("button", { name: "Create Admin Account" }).click();

    // Should redirect to /login
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("Accessing /setup after admin creation should redirect to /login", async ({
    page,
  }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*login.*/);
  });
});

// === Phase 3: Login Test (Admin exists) ===
test.describe.serial("Phase 3: Login Test (Admin exists)", () => {
  test("Login page should render correctly", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByPlaceholder("m@example.com")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("Validation should work when logging in with empty fields", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Login" }).click();

    // Should stay on login page
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("Login should fail with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("m@example.com").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    // Should stay on login page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("Login should succeed with valid credentials and redirect to dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("m@example.com").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Login" }).click();

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard.*/);
  });
});

// === Phase 4: Registration Test (Admin exists) ===
test.describe.serial("Phase 4: Registration Test (Admin exists)", () => {
  test("Registration page should render correctly", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByPlaceholder("John Doe")).toBeVisible();
    await expect(page.getByPlaceholder("m@example.com")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
  });

  test("Validation should work when registering with empty fields", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Register" }).click();

    // Validation message should appear
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("Should successfully register a new user", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("John Doe").fill("Test User");
    await page.getByPlaceholder("m@example.com").fill("user@example.com");
    await page.getByLabel("Password", { exact: true }).fill("user123456");
    await page.getByLabel("Confirm Password").fill("user123456");
    await page.getByRole("button", { name: "Register" }).click();

    // Should redirect to /login
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("Registration should fail with existing email", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByPlaceholder("John Doe").fill("Duplicate User");
    await page.getByPlaceholder("m@example.com").fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: "Register" }).click();

    // Should stay on register page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*register.*/);
  });
});

// === Phase 5: Protected Routes ===
test.describe.serial("Phase 5: Protected Routes", () => {
  test("Unauthenticated user should not access dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});

    const currentUrl = page.url();
    expect(currentUrl).toContain("/login");
  });
});
