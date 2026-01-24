import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach } from "vitest";

// Mock Prisma Client 생성
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// 각 테스트 전 Mock 리셋
beforeEach(() => {
  mockReset(prismaMock);
});

/**
 * 테스트용 Prisma Client를 반환합니다.
 * 실제 DB 대신 Mock 객체를 사용합니다.
 */
export function getPrismaTestClient(): PrismaClient {
  return prismaMock as unknown as PrismaClient;
}
