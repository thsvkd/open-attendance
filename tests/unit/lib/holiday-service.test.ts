import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import {
  fetchHolidays,
  isWeekend,
  isHoliday,
  isWorkingDay,
  calculateWorkingDays,
  clearHolidayCache,
  type Holiday,
} from "@/lib/holiday-service";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("holiday-service", () => {
  beforeEach(() => {
    clearHolidayCache();
    vi.clearAllMocks();
  });

  describe("fetchHolidays", () => {
    it("should fetch holidays from Nager.Date API", async () => {
      const mockHolidays: Holiday[] = [
        {
          date: "2024-01-01",
          localName: "New Year's Day",
          name: "New Year's Day",
          countryCode: "US",
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ["Public"],
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockHolidays });

      const holidays = await fetchHolidays("US", 2024);

      expect(holidays).toEqual(mockHolidays);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://date.nager.at/api/v3/PublicHolidays/2024/US",
        { timeout: 5000 },
      );
    });

    it("should cache holiday data to avoid duplicate API calls", async () => {
      const mockHolidays: Holiday[] = [
        {
          date: "2024-01-01",
          localName: "New Year's Day",
          name: "New Year's Day",
          countryCode: "US",
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ["Public"],
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockHolidays });

      // First call
      const holidays1 = await fetchHolidays("US", 2024);
      // Second call (should use cache)
      const holidays2 = await fetchHolidays("US", 2024);

      expect(holidays1).toEqual(mockHolidays);
      expect(holidays2).toEqual(mockHolidays);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it("should return empty array on API error", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("API error"));

      const holidays = await fetchHolidays("US", 2024);

      expect(holidays).toEqual([]);
    });
  });

  describe("isWeekend", () => {
    it("should return true for Saturday", () => {
      const saturday = new Date("2024-01-13"); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it("should return true for Sunday", () => {
      const sunday = new Date("2024-01-14"); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it("should return false for weekdays", () => {
      const monday = new Date("2024-01-15"); // Monday
      expect(isWeekend(monday)).toBe(false);
    });
  });

  describe("isHoliday", () => {
    it("should return true if date is a holiday", () => {
      const holidays: Holiday[] = [
        {
          date: "2024-01-01",
          localName: "New Year's Day",
          name: "New Year's Day",
          countryCode: "US",
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ["Public"],
        },
      ];

      const date = new Date("2024-01-01");
      expect(isHoliday(date, holidays)).toBe(true);
    });

    it("should return false if date is not a holiday", () => {
      const holidays: Holiday[] = [
        {
          date: "2024-01-01",
          localName: "New Year's Day",
          name: "New Year's Day",
          countryCode: "US",
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ["Public"],
        },
      ];

      const date = new Date("2024-01-02");
      expect(isHoliday(date, holidays)).toBe(false);
    });
  });

  describe("isWorkingDay", () => {
    it("should return false for weekends", () => {
      const saturday = new Date("2024-01-13"); // Saturday
      expect(isWorkingDay(saturday, [])).toBe(false);
    });

    it("should return false for holidays", () => {
      const holidays: Holiday[] = [
        {
          date: "2024-01-01",
          localName: "New Year's Day",
          name: "New Year's Day",
          countryCode: "US",
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ["Public"],
        },
      ];

      const date = new Date("2024-01-01");
      expect(isWorkingDay(date, holidays)).toBe(false);
    });

    it("should return true for working days", () => {
      const monday = new Date("2024-01-15"); // Monday
      expect(isWorkingDay(monday, [])).toBe(true);
    });
  });

  describe("calculateWorkingDays", () => {
    it("should calculate working days excluding weekends", () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 working days
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-19");

      expect(calculateWorkingDays(startDate, endDate, [])).toBe(5);
    });

    it("should calculate working days excluding weekends in a week", () => {
      // Jan 15-21, 2024 (Mon-Sun) = 5 working days (Sat, Sun excluded)
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-21");

      expect(calculateWorkingDays(startDate, endDate, [])).toBe(5);
    });

    it("should calculate working days excluding holidays", () => {
      const holidays: Holiday[] = [
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

      // Jan 15-19, 2024 (Mon-Fri) with one holiday on Jan 16 = 4 working days
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-19");

      expect(calculateWorkingDays(startDate, endDate, holidays)).toBe(4);
    });

    it("should return 0 if all days are non-working days", () => {
      // Jan 13-14, 2024 (Sat-Sun) = 0 working days
      const startDate = new Date("2024-01-13");
      const endDate = new Date("2024-01-14");

      expect(calculateWorkingDays(startDate, endDate, [])).toBe(0);
    });

    it("should handle single day correctly", () => {
      // Jan 15, 2024 (Mon) = 1 working day
      const date = new Date("2024-01-15");

      expect(calculateWorkingDays(date, date, [])).toBe(1);
    });

    it("should handle single weekend day correctly", () => {
      // Jan 13, 2024 (Sat) = 0 working days
      const date = new Date("2024-01-13");

      expect(calculateWorkingDays(date, date, [])).toBe(0);
    });
  });
});
