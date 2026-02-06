import { PrismaClient } from "@/generated/prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach } from "vitest";

// Create mock Prisma Client
export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

/**
 * Returns a Prisma Client for testing.
 * Uses a mock object instead of the actual database.
 */
export function getPrismaTestClient(): PrismaClient {
  return prismaMock as unknown as PrismaClient;
}
