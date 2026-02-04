import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculateLeaveConsumption } from "@/lib/leave-consumption-calculator";
import * as holidayService from "@/lib/holiday-service";
import type { Holiday } from "@/lib/holiday-service";

// Mock holiday service
vi.mock("@/lib/holiday-service", async () => {
  const actual = await vi.importActual("@/lib/holiday-service");
  return {
    ...actual,
    fetchHolidays: vi.fn(),
  };
});

const mockedFetchHolidays = vi.mocked(holidayService.fetchHolidays);

describe("leave-consumption-calculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateLeaveConsumption - no country code", () => {
    it("should return requested days when no country code is provided", async () => {
      const result = await calculateLeaveConsumption(
        "FULL_DAY",
        new Date("2024-01-15"),
        new Date("2024-01-19"),
        5,
        null,
      );

      expect(result).toEqual({
        requestedDays: 5,
        effectiveDays: 5,
        workingDays: 5, // Calendar days between start and end
        hasWarning: false,
      });
    });
  });

  describe("calculateLeaveConsumption - FULL_DAY", () => {
    it("should calculate effective days excluding weekends", async () => {
      mockedFetchHolidays.mockResolvedValueOnce([]);

      // Jan 15-21, 2024 (Mon-Sun) = 7 days, but only 5 working days
      const result = await calculateLeaveConsumption(
        "FULL_DAY",
        new Date("2024-01-15"),
        new Date("2024-01-21"),
        7,
        "US",
      );

      expect(result.requestedDays).toBe(7);
      expect(result.effectiveDays).toBe(5);
      expect(result.workingDays).toBe(5);
      expect(result.hasWarning).toBe(false);
    });

    it("should calculate effective days excluding holidays", async () => {
      const mockHolidays: Holiday[] = [
        {
          date: "2024-01-16",
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

      mockedFetchHolidays.mockResolvedValueOnce(mockHolidays);

      // Jan 15-19, 2024 (Mon-Fri) with one holiday on Jan 16 = 4 working days
      const result = await calculateLeaveConsumption(
        "FULL_DAY",
        new Date("2024-01-15"),
        new Date("2024-01-19"),
        5,
        "US",
      );

      expect(result.requestedDays).toBe(5);
      expect(result.effectiveDays).toBe(4);
      expect(result.workingDays).toBe(4);
      expect(result.hasWarning).toBe(false);
    });

    it("should return warning when all days are non-working days", async () => {
      mockedFetchHolidays.mockResolvedValueOnce([]);

      // Jan 13-14, 2024 (Sat-Sun) = 0 working days
      const result = await calculateLeaveConsumption(
        "FULL_DAY",
        new Date("2024-01-13"),
        new Date("2024-01-14"),
        2,
        "US",
      );

      expect(result.requestedDays).toBe(2);
      expect(result.effectiveDays).toBe(0);
      expect(result.workingDays).toBe(0);
      expect(result.hasWarning).toBe(true);
      expect(result.warningMessage).toBeDefined();
    });

    it("should fetch holidays for multiple years if leave spans years", async () => {
      mockedFetchHolidays.mockResolvedValueOnce([]);
      mockedFetchHolidays.mockResolvedValueOnce([]);

      // Dec 30, 2024 - Jan 3, 2025
      await calculateLeaveConsumption(
        "FULL_DAY",
        new Date("2024-12-30"),
        new Date("2025-01-03"),
        5,
        "US",
      );

      expect(mockedFetchHolidays).toHaveBeenCalledTimes(2);
      expect(mockedFetchHolidays).toHaveBeenCalledWith("US", 2024);
      expect(mockedFetchHolidays).toHaveBeenCalledWith("US", 2025);
    });
  });

  describe("calculateLeaveConsumption - HALF_DAY", () => {
    it("should return requested days for working day", async () => {
      mockedFetchHolidays.mockResolvedValueOnce([]);

      // Jan 15, 2024 (Monday)
      const result = await calculateLeaveConsumption(
        "HALF_DAY_AM",
        new Date("2024-01-15"),
        new Date("2024-01-15"),
        0.5,
        "US",
      );

      expect(result.requestedDays).toBe(0.5);
      expect(result.effectiveDays).toBe(0.5);
      expect(result.workingDays).toBe(1);
      expect(result.hasWarning).toBe(false);
    });

    it("should return warning for weekend day", async () => {
      mockedFetchHolidays.mockResolvedValueOnce([]);

      // Jan 13, 2024 (Saturday)
      const result = await calculateLeaveConsumption(
        "HALF_DAY_AM",
        new Date("2024-01-13"),
        new Date("2024-01-13"),
        0.5,
        "US",
      );

      expect(result.requestedDays).toBe(0.5);
      expect(result.effectiveDays).toBe(0);
      expect(result.workingDays).toBe(0);
      expect(result.hasWarning).toBe(true);
      expect(result.warningMessage).toBeDefined();
    });

    it("should return warning for holiday", async () => {
      const mockHolidays: Holiday[] = [
        {
          date: "2024-01-15",
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

      mockedFetchHolidays.mockResolvedValueOnce(mockHolidays);

      // Jan 15, 2024 (Monday but holiday)
      const result = await calculateLeaveConsumption(
        "HALF_DAY_PM",
        new Date("2024-01-15"),
        new Date("2024-01-15"),
        0.5,
        "US",
      );

      expect(result.requestedDays).toBe(0.5);
      expect(result.effectiveDays).toBe(0);
      expect(result.workingDays).toBe(0);
      expect(result.hasWarning).toBe(true);
      expect(result.warningMessage).toBeDefined();
    });
  });

  describe("calculateLeaveConsumption - QUARTER_DAY", () => {
    it("should return requested days for working day", async () => {
      mockedFetchHolidays.mockResolvedValueOnce([]);

      // Jan 15, 2024 (Monday)
      const result = await calculateLeaveConsumption(
        "QUARTER_DAY",
        new Date("2024-01-15"),
        new Date("2024-01-15"),
        0.25,
        "US",
      );

      expect(result.requestedDays).toBe(0.25);
      expect(result.effectiveDays).toBe(0.25);
      expect(result.workingDays).toBe(1);
      expect(result.hasWarning).toBe(false);
    });

    it("should return warning for weekend day", async () => {
      mockedFetchHolidays.mockResolvedValueOnce([]);

      // Jan 13, 2024 (Saturday)
      const result = await calculateLeaveConsumption(
        "QUARTER_DAY",
        new Date("2024-01-13"),
        new Date("2024-01-13"),
        0.25,
        "US",
      );

      expect(result.requestedDays).toBe(0.25);
      expect(result.effectiveDays).toBe(0);
      expect(result.workingDays).toBe(0);
      expect(result.hasWarning).toBe(true);
      expect(result.warningMessage).toBeDefined();
    });
  });
});
