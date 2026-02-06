import { describe, it, expect } from "vitest";
import { calculateAnnualLeave } from "@/lib/annual-leave-calculator";

describe("calculateAnnualLeave", () => {
  describe("first month of employment", () => {
    it("should return 0 days if less than 1 month has passed", () => {
      const joinDate = new Date("2024-01-15");
      const currentDate = new Date("2024-02-10"); // Less than 1 month
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(0);
    });

    it("should return 0 days on the same day as join date", () => {
      const joinDate = new Date("2024-01-15");
      const currentDate = new Date("2024-01-15");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(0);
    });
  });

  describe("first year of employment", () => {
    it("should return 1 day after 1 month", () => {
      const joinDate = new Date("2024-01-01");
      const currentDate = new Date("2024-02-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(1);
    });

    it("should return 2 days after 2 months", () => {
      const joinDate = new Date("2024-01-01");
      const currentDate = new Date("2024-03-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(2);
    });

    it("should return 6 days after 6 months", () => {
      const joinDate = new Date("2024-01-01");
      const currentDate = new Date("2024-07-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(6);
    });

    it("should return 11 days after 11 months", () => {
      const joinDate = new Date("2024-01-01");
      const currentDate = new Date("2024-12-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(11);
    });

    it("should handle mid-month join dates correctly", () => {
      const joinDate = new Date("2024-01-15");
      const currentDate = new Date("2024-03-20"); // About 2 months later
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(2);
    });
  });

  describe("after one year of employment", () => {
    it("should return 15 days after exactly 1 year", () => {
      const joinDate = new Date("2023-01-01");
      const currentDate = new Date("2024-01-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(15);
    });

    it("should return 15 days after 1 year and 1 month", () => {
      const joinDate = new Date("2023-01-01");
      const currentDate = new Date("2024-02-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(15);
    });

    it("should return 15 days after 2 years", () => {
      const joinDate = new Date("2022-01-01");
      const currentDate = new Date("2024-01-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(15);
    });
  });

  describe("graduated increase per Korean labor law (제60조 제4항)", () => {
    it("should return 16 days after 3 years", () => {
      const joinDate = new Date("2021-01-01");
      const currentDate = new Date("2024-01-01"); // 3 years
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(16);
    });

    it("should return 16 days after 4 years", () => {
      const joinDate = new Date("2020-01-01");
      const currentDate = new Date("2024-01-01"); // 4 years
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(16);
    });

    it("should return 17 days after 5 years", () => {
      const joinDate = new Date("2019-01-01");
      const currentDate = new Date("2024-01-01"); // 5 years
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(17);
    });

    it("should return 18 days after 7 years", () => {
      const joinDate = new Date("2017-01-01");
      const currentDate = new Date("2024-01-01"); // 7 years
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(18);
    });

    it("should return 19 days after 10 years (9 extra years / 2 = 4)", () => {
      const joinDate = new Date("2014-01-01");
      const currentDate = new Date("2024-01-01"); // 10 years
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(19);
    });

    it("should return 25 days after 21 years (max)", () => {
      const joinDate = new Date("2003-01-01");
      const currentDate = new Date("2024-01-01"); // 21 years
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(25);
    });

    it("should cap at 25 days after 30 years", () => {
      const joinDate = new Date("1994-01-01");
      const currentDate = new Date("2024-01-01"); // 30 years
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(25);
    });
  });

  describe("edge cases", () => {
    it("should handle leap year correctly", () => {
      const joinDate = new Date("2024-02-29"); // Leap year
      const currentDate = new Date("2024-04-01");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(1);
    });

    it("should use current date by default when not provided", () => {
      const joinDate = new Date("2023-01-01");
      const result = calculateAnnualLeave(joinDate);
      // 2023-01-01 to 2026-02-04 is 3 years -> 15 + floor(2/2) = 16
      expect(result).toBe(16);
    });

    it("should handle same day in different months correctly", () => {
      const joinDate = new Date("2024-01-31");
      const currentDate = new Date("2024-04-30");
      expect(calculateAnnualLeave(joinDate, currentDate)).toBe(2);
    });

    it("should return 0 when joinDate is null", () => {
      const currentDate = new Date("2024-06-15");
      expect(calculateAnnualLeave(null, currentDate)).toBe(0);
    });

    it("should return 0 when joinDate is not set (new employee)", () => {
      const result = calculateAnnualLeave(null);
      expect(result).toBe(0);
    });
  });
});
