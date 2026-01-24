import { describe, it, expect } from "vitest";
import {
  getLeaveMinutes,
  rangesOverlap,
  calculateDays,
} from "@/lib/leave-utils";

describe("leave-utils", () => {
  describe("getLeaveMinutes", () => {
    it("should correctly calculate the working hour range for a full-day leave", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("FULL_DAY", startDate, endDate);

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(9 * 60); // 9시간 = 540분
    });

    it("should correctly calculate the working hour range for an AM half-day leave", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("HALF_DAY_AM", startDate, endDate);

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(4 * 60); // 4시간 = 240분
    });

    it("should correctly calculate the working hour range for a PM half-day leave", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("HALF_DAY_PM", startDate, endDate);

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(4 * 60); // 4시간 = 240분
    });

    it("should correctly calculate the start/end time for a quarter-day leave", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes(
        "QUARTER_DAY",
        startDate,
        endDate,
        "09:00",
        "11:00",
      );

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(2 * 60); // 2시간 = 120분
    });

    it("should correctly calculate full-day leaves over multiple days", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17"); // 3일
      const ranges = getLeaveMinutes("FULL_DAY", startDate, endDate);

      expect(ranges).toHaveLength(3);
      ranges.forEach((range) => {
        expect(range.end - range.start).toBe(9 * 60); // 각 날짜마다 9시간
      });
    });

    it("should return an empty range for a quarter-day leave without time information", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("QUARTER_DAY", startDate, endDate);

      expect(ranges).toHaveLength(0);
    });
  });

  describe("rangesOverlap", () => {
    it("should correctly detect overlapping time ranges", () => {
      const range1 = { start: 100, end: 200 };
      const range2 = { start: 150, end: 250 };

      expect(rangesOverlap(range1, range2)).toBe(true);
    });

    it("should correctly detect non-overlapping time ranges", () => {
      const range1 = { start: 100, end: 200 };
      const range2 = { start: 200, end: 300 };

      expect(rangesOverlap(range1, range2)).toBe(false);
    });

    it("should detect completely included time ranges as overlapping", () => {
      const range1 = { start: 100, end: 300 };
      const range2 = { start: 150, end: 250 };

      expect(rangesOverlap(range1, range2)).toBe(true);
    });

    it("should detect exactly adjacent time ranges as non-overlapping", () => {
      const range1 = { start: 100, end: 200 };
      const range2 = { start: 200, end: 300 };

      expect(rangesOverlap(range1, range2)).toBe(false);
    });
  });

  describe("calculateDays", () => {
    it("should correctly calculate the number of days for a full-day leave", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");

      const days = calculateDays("FULL_DAY", startDate, endDate);

      expect(days).toBe(3);
    });

    it("should calculate a single full-day leave as 1 day", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("FULL_DAY", startDate, endDate);

      expect(days).toBe(1);
    });

    it("should calculate an AM half-day leave as 0.5 days", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("HALF_DAY_AM", startDate, endDate);

      expect(days).toBe(0.5);
    });

    it("should calculate a PM half-day leave as 0.5 days", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("HALF_DAY_PM", startDate, endDate);

      expect(days).toBe(0.5);
    });

    it("should calculate a quarter-day leave as 0.25 days", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("QUARTER_DAY", startDate, endDate);

      expect(days).toBe(0.25);
    });
  });
});
