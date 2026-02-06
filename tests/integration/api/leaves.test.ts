import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSession } from "@/tests/helpers/auth-mock";

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
    it("should return the list of leave requests for an authenticated user", async () => {
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
          reason: "personal grounds",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          effectiveDays: null,
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

    it("should return 401 if not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(401);
    });

    it("should return 500 on database error", async () => {
      // Suppress expected error log
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      vi.mocked(db.leaveRequest.findMany).mockRejectedValue(
        new Error("Database error"),
      );

      const response = await GET();

      expect(response.status).toBe(500);

      consoleSpy.mockRestore();
    });
  });

  describe("POST", () => {
    it("should create a valid leave request", async () => {
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
        effectiveDays: null,
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
          reason: "personal grounds",
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

    it("should return 400 if required fields are missing", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          type: "ANNUAL",
          // missing startDate, endDate
        }),
      } as unknown as Request;

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
    });

    it("should return 400 if JSON format is invalid", async () => {
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
    it("should be able to cancel a pending leave request", async () => {
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
        effectiveDays: null,
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

    it("should return 400 if leave request ID is missing", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Request;

      const response = await PATCH(mockRequest);

      expect(response.status).toBe(400);
    });

    it("should return 404 if leave request does not exist", async () => {
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

    it("should return 403 if it is another user's leave request", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockLeave = {
        id: "leave-1",
        userId: "other-user-id", // different user
        status: "PENDING",
        type: "ANNUAL",
        leaveType: "FULL_DAY",
        startDate: new Date(),
        endDate: new Date(),
        days: 1,
        reason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        effectiveDays: null,
        approvedBy: null,
        rejectedReason: null,
        startTime: null,
        endTime: null,
      };

      vi.mocked(db.leaveRequest.findUnique).mockResolvedValue(mockLeave);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ id: "leave-1" }),
      } as unknown as Request;

      const response = await PATCH(mockRequest);

      expect(response.status).toBe(403);
    });

    it("should not be able to cancel a request that is not pending", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockLeave = {
        id: "leave-1",
        userId: mockSession.user.id,
        status: "APPROVED", // already approved
        type: "ANNUAL",
        leaveType: "FULL_DAY",
        startDate: new Date(),
        endDate: new Date(),
        days: 1,
        reason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        effectiveDays: null,
        approvedBy: null,
        rejectedReason: null,
        startTime: null,
        endTime: null,
      };

      vi.mocked(db.leaveRequest.findUnique).mockResolvedValue(mockLeave);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ id: "leave-1" }),
      } as unknown as Request;

      const response = await PATCH(mockRequest);

      expect(response.status).toBe(400);
    });
  });
});
