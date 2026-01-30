import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSession } from "@/tests/helpers/auth-mock";
import * as holidayService from "@/lib/holiday-service";
import type { Holiday } from "@/lib/holiday-service";

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
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leaveRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock next-intl
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string, params?: Record<string, unknown>) => {
    if (key === "insufficientBalance") {
      return `Insufficient balance. Remaining: ${params?.remaining}`;
    }
    if (key === "overlapError") {
      return `Overlap with ${params?.status} leave from ${params?.start} to ${params?.end}`;
    }
    if (key.startsWith("statuses.")) {
      const status = key.split(".")[1];
      return status.toLowerCase();
    }
    return key;
  }),
}));

// Mock holiday service
vi.mock("@/lib/holiday-service", async () => {
  const actual = await vi.importActual("@/lib/holiday-service");
  return {
    ...actual,
    fetchHolidays: vi.fn(),
  };
});

const mockedFetchHolidays = vi.mocked(holidayService.fetchHolidays);

// Now import the route handlers
import { POST } from "@/app/api/annual-leave/route";
import { db } from "@/lib/db";

describe("/api/annual-leave with holiday calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST with country code", () => {
    it("should calculate effective days excluding weekends", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockUser = {
        id: mockSession.user.id,
        totalLeaves: 15,
        usedLeaves: 0,
        country: "US",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(db.leaveRequest.findMany).mockResolvedValue([]);
      mockedFetchHolidays.mockResolvedValue([]);

      const mockLeave = {
        id: "leave-1",
        userId: mockSession.user.id,
        type: "ANNUAL",
        leaveType: "FULL_DAY",
        startDate: new Date("2024-01-15"), // Monday
        endDate: new Date("2024-01-21"), // Sunday (7 days total, 5 working days)
        days: 7,
        effectiveDays: 5,
        reason: null,
        status: "PENDING",
      };

      vi.mocked(db.leaveRequest.create).mockResolvedValue(mockLeave as never);

      const request = new Request("http://localhost/api/annual-leave", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-15",
          endDate: "2024-01-21",
          leaveType: "FULL_DAY",
          reason: "Vacation",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.effectiveDays).toBe(5);
      expect(data.days).toBe(7);
    });

    it("should calculate effective days excluding holidays", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockUser = {
        id: mockSession.user.id,
        totalLeaves: 15,
        usedLeaves: 0,
        country: "US",
      };

      const mockHolidays: Holiday[] = [
        {
          date: "2024-01-16", // Tuesday
          localName: "Holiday",
          name: "Holiday",
          countryCode: "US",
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ["Public"],
        },
      ];

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(db.leaveRequest.findMany).mockResolvedValue([]);
      mockedFetchHolidays.mockResolvedValue(mockHolidays);

      const mockLeave = {
        id: "leave-1",
        userId: mockSession.user.id,
        type: "ANNUAL",
        leaveType: "FULL_DAY",
        startDate: new Date("2024-01-15"), // Monday
        endDate: new Date("2024-01-19"), // Friday (5 days total, 4 working days excluding holiday)
        days: 5,
        effectiveDays: 4,
        reason: null,
        status: "PENDING",
      };

      vi.mocked(db.leaveRequest.create).mockResolvedValue(mockLeave as never);

      const request = new Request("http://localhost/api/annual-leave", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-15",
          endDate: "2024-01-19",
          leaveType: "FULL_DAY",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.effectiveDays).toBe(4);
    });

    it("should return warning when all days are weekends/holidays", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockUser = {
        id: mockSession.user.id,
        totalLeaves: 15,
        usedLeaves: 0,
        country: "US",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(db.leaveRequest.findMany).mockResolvedValue([]);
      mockedFetchHolidays.mockResolvedValue([]);

      const request = new Request("http://localhost/api/annual-leave", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-13", // Saturday
          endDate: "2024-01-14", // Sunday
          leaveType: "FULL_DAY",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.warning).toBeDefined();
      expect(data.effectiveDays).toBe(0);
    });

    it("should use effective days when checking balance", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockUser = {
        id: mockSession.user.id,
        totalLeaves: 3,
        usedLeaves: 0,
        country: "US",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(db.leaveRequest.findMany).mockResolvedValue([]);
      mockedFetchHolidays.mockResolvedValue([]);

      const request = new Request("http://localhost/api/annual-leave", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-15", // Monday
          endDate: "2024-01-21", // Sunday (7 days, 5 working days)
          leaveType: "FULL_DAY",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should fail because effective days (5) exceeds balance (3)
      expect(response.status).toBe(400);
      expect(data.error).toContain("Insufficient balance");
    });
  });

  describe("POST without country code", () => {
    it("should not calculate effective days if no country code", async () => {
      const mockSession = createMockSession();
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const mockUser = {
        id: mockSession.user.id,
        totalLeaves: 15,
        usedLeaves: 0,
        country: null, // No country code
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(db.leaveRequest.findMany).mockResolvedValue([]);

      const mockLeave = {
        id: "leave-1",
        userId: mockSession.user.id,
        type: "ANNUAL",
        leaveType: "FULL_DAY",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-21"),
        days: 7,
        effectiveDays: 7, // Same as requested days when no country
        reason: null,
        status: "PENDING",
      };

      vi.mocked(db.leaveRequest.create).mockResolvedValue(mockLeave as never);

      const request = new Request("http://localhost/api/annual-leave", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-15",
          endDate: "2024-01-21",
          leaveType: "FULL_DAY",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.effectiveDays).toBe(7);
      expect(data.days).toBe(7);
    });
  });
});
