import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSession } from "@/__tests__/helpers/auth-mock";

// Mock next-auth - must be before imports
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

// Mock lib/auth - must be before imports
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Mock lib/db with factory function
vi.mock("@/lib/db", () => ({
  db: {
    leaveRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Now import the route handlers
import { GET, POST, PATCH } from "@/app/api/leaves/route";
import { db } from "@/lib/db";

describe("/api/leaves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("인증된 사용자의 휴가 요청 목록을 반환해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockLeaves = [
        {
          id: "leave-1",
          userId: mockSession.user.id,
          type: "ANNUAL",
          leaveType: "FULL_DAY",
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-01-15"),
          days: 1,
          reason: "개인 사유",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          approvedBy: null,
          rejectedReason: null,
          startTime: null,
          endTime: null,
        },
      ];

      vi.mocked(db.leaveRequest.findMany).mockResolvedValue(mockLeaves);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("leave-1");
      expect(data[0].userId).toBe(mockSession.user.id);
      expect(data[0].type).toBe("ANNUAL");
      expect(db.leaveRequest.findMany).toHaveBeenCalledWith({
        where: { userId: mockSession.user.id },
        orderBy: { createdAt: "desc" },
      });
    });

    it("인증되지 않은 경우 401을 반환해야 함", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(401);
    });

    it("DB 오류 시 500을 반환해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      vi.mocked(db.leaveRequest.findMany).mockRejectedValue(
        new Error("Database error")
      );

      const response = await GET();

      expect(response.status).toBe(500);
    });
  });

  describe("POST", () => {
    it("유효한 휴가 요청을 생성해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockLeave = {
        id: "leave-1",
        userId: mockSession.user.id,
        type: "ANNUAL",
        leaveType: "FULL_DAY",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-15"),
        days: 1,
        reason: "개인 사유",
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedBy: null,
        rejectedReason: null,
        startTime: null,
        endTime: null,
      };

      vi.mocked(db.leaveRequest.create).mockResolvedValue(mockLeave);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          type: "ANNUAL",
          startDate: "2024-01-15",
          endDate: "2024-01-15",
          reason: "개인 사유",
        }),
      } as unknown as Request;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("leave-1");
      expect(data.userId).toBe(mockSession.user.id);
      expect(data.type).toBe("ANNUAL");
      expect(data.status).toBe("PENDING");
      expect(db.leaveRequest.create).toHaveBeenCalled();
    });

    it("필수 필드가 없으면 400을 반환해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          type: "ANNUAL",
          // startDate, endDate 누락
        }),
      } as unknown as Request;

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
    });

    it("잘못된 JSON 형식이면 400을 반환해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as Request;

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH", () => {
    it("대기 중인 휴가 요청을 취소할 수 있어야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const leaveId = "leave-1";
      const mockLeave = {
        id: leaveId,
        userId: mockSession.user.id,
        type: "ANNUAL",
        leaveType: "FULL_DAY",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-15"),
        days: 1,
        reason: "개인 사유",
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedBy: null,
        rejectedReason: null,
        startTime: null,
        endTime: null,
      };

      vi.mocked(db.leaveRequest.findUnique).mockResolvedValue(mockLeave);
      vi.mocked(db.leaveRequest.update).mockResolvedValue({
        ...mockLeave,
        status: "CANCELLED",
      });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ id: leaveId }),
      } as unknown as Request;

      const response = await PATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("CANCELLED");
    });

    it("휴가 요청 ID가 없으면 400을 반환해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Request;

      const response = await PATCH(mockRequest);

      expect(response.status).toBe(400);
    });

    it("존재하지 않는 휴가 요청이면 404를 반환해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      vi.mocked(db.leaveRequest.findUnique).mockResolvedValue(null);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ id: "non-existent" }),
      } as unknown as Request;

      const response = await PATCH(mockRequest);

      expect(response.status).toBe(404);
    });

    it("다른 사용자의 휴가 요청이면 403을 반환해야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockLeave = {
        id: "leave-1",
        userId: "other-user-id", // 다른 사용자
        status: "PENDING",
      } as any;

      vi.mocked(db.leaveRequest.findUnique).mockResolvedValue(mockLeave);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ id: "leave-1" }),
      } as unknown as Request;

      const response = await PATCH(mockRequest);

      expect(response.status).toBe(403);
    });

    it("대기 중이 아닌 요청은 취소할 수 없어야 함", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockLeave = {
        id: "leave-1",
        userId: mockSession.user.id,
        status: "APPROVED", // 이미 승인됨
      } as any;

      vi.mocked(db.leaveRequest.findUnique).mockResolvedValue(mockLeave);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ id: "leave-1" }),
      } as unknown as Request;

      const response = await PATCH(mockRequest);

      expect(response.status).toBe(400);
    });
  });
});
