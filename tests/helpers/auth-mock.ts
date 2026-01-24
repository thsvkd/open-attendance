import { Session } from "next-auth";

/**
 * Helper to create a mock session for testing
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create a mock admin session for testing
 */
export function createMockAdminSession(overrides?: Partial<Session>): Session {
  return createMockSession({
    user: {
      id: "admin-user-id",
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
      ...overrides?.user,
    },
    ...overrides,
  });
}
