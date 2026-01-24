import { describe, it, expect } from "vitest";
import {
  getLeaveMinutes,
  rangesOverlap,
  calculateDays,
} from "@/lib/leave-utils";
import type { LeaveType } from "@/types";

describe("leave-utils", () => {
  describe("getLeaveMinutes", () => {
    it("전일 휴가의 근무 시간 범위를 올바르게 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("FULL_DAY", startDate, endDate);

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(9 * 60); // 9시간 = 540분
    });

    it("오전 반차의 근무 시간 범위를 올바르게 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("HALF_DAY_AM", startDate, endDate);

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(4 * 60); // 4시간 = 240분
    });

    it("오후 반차의 근무 시간 범위를 올바르게 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("HALF_DAY_PM", startDate, endDate);

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(4 * 60); // 4시간 = 240분
    });

    it("반반차의 시작/종료 시간을 올바르게 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes(
        "QUARTER_DAY",
        startDate,
        endDate,
        "09:00",
        "11:00"
      );

      expect(ranges).toHaveLength(1);
      expect(ranges[0].end - ranges[0].start).toBe(2 * 60); // 2시간 = 120분
    });

    it("여러 날에 걸친 전일 휴가를 올바르게 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17"); // 3일
      const ranges = getLeaveMinutes("FULL_DAY", startDate, endDate);

      expect(ranges).toHaveLength(3);
      ranges.forEach((range) => {
        expect(range.end - range.start).toBe(9 * 60); // 각 날짜마다 9시간
      });
    });

    it("시간 정보가 없는 반반차는 빈 범위를 반환해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");
      const ranges = getLeaveMinutes("QUARTER_DAY", startDate, endDate);

      expect(ranges).toHaveLength(0);
    });
  });

  describe("rangesOverlap", () => {
    it("겹치는 시간 범위를 올바르게 감지해야 함", () => {
      const range1 = { start: 100, end: 200 };
      const range2 = { start: 150, end: 250 };

      expect(rangesOverlap(range1, range2)).toBe(true);
    });

    it("겹치지 않는 시간 범위를 올바르게 감지해야 함", () => {
      const range1 = { start: 100, end: 200 };
      const range2 = { start: 200, end: 300 };

      expect(rangesOverlap(range1, range2)).toBe(false);
    });

    it("완전히 포함된 시간 범위를 겹침으로 감지해야 함", () => {
      const range1 = { start: 100, end: 300 };
      const range2 = { start: 150, end: 250 };

      expect(rangesOverlap(range1, range2)).toBe(true);
    });

    it("정확히 붙어있는 시간 범위는 겹치지 않음으로 감지해야 함", () => {
      const range1 = { start: 100, end: 200 };
      const range2 = { start: 200, end: 300 };

      expect(rangesOverlap(range1, range2)).toBe(false);
    });
  });

  describe("calculateDays", () => {
    it("전일 휴가의 일수를 올바르게 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");

      const days = calculateDays("FULL_DAY", startDate, endDate);

      expect(days).toBe(3);
    });

    it("하루 전일 휴가는 1일로 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("FULL_DAY", startDate, endDate);

      expect(days).toBe(1);
    });

    it("오전 반차는 0.5일로 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("HALF_DAY_AM", startDate, endDate);

      expect(days).toBe(0.5);
    });

    it("오후 반차는 0.5일로 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("HALF_DAY_PM", startDate, endDate);

      expect(days).toBe(0.5);
    });

    it("반반차는 0.25일로 계산해야 함", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const days = calculateDays("QUARTER_DAY", startDate, endDate);

      expect(days).toBe(0.25);
    });
  });
});
