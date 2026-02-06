import type { LeaveType } from "@/types";
import {
  fetchHolidays,
  calculateWorkingDays,
  type Holiday,
} from "./holiday-service";

/**
 * Result of effective days calculation
 */
export interface LeaveConsumptionResult {
  requestedDays: number;
  effectiveDays: number;
  workingDays: number;
  hasWarning: boolean;
  warningMessage?: string;
}

/**
 * Calculate effective leave days for a leave request
 * Takes into account holidays and weekends based on user's country
 *
 * For FULL_DAY leaves spanning multiple days:
 * - Calculate the number of working days (excluding weekends and holidays)
 * - If all days fall on non-working days, effective days = 0 with warning
 *
 * For HALF_DAY and QUARTER_DAY leaves:
 * - These are single-day requests
 * - If the day is a non-working day, effective days = 0 with warning
 *
 * @param leaveType - Type of leave (FULL_DAY, HALF_DAY_AM, HALF_DAY_PM, QUARTER_DAY)
 * @param startDate - Start date of leave
 * @param endDate - End date of leave
 * @param requestedDays - Requested number of days (e.g., 1, 0.5, 0.25)
 * @param countryCode - ISO 3166-1 alpha-2 country code (optional)
 * @returns Effective days calculation result
 */
export async function calculateLeaveConsumption(
  leaveType: LeaveType,
  startDate: Date,
  endDate: Date,
  requestedDays: number,
  countryCode?: string | null,
): Promise<LeaveConsumptionResult> {
  // Fetch holidays for the relevant years
  // Note: Always fetch holidays (even if countryCode is empty) to ensure weekends are excluded
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  let holidays: Holiday[] = [];

  // If country code is provided, fetch public holidays
  // If not, an empty array will be used (only weekends will be excluded via calculateWorkingDays)
  if (countryCode) {
    if (startYear === endYear) {
      holidays = await fetchHolidays(countryCode, startYear);
    } else {
      // If the leave spans multiple years, fetch holidays for both years
      const holidaysStart = await fetchHolidays(countryCode, startYear);
      const holidaysEnd = await fetchHolidays(countryCode, endYear);
      holidays = [...holidaysStart, ...holidaysEnd];
    }
  }

  // For FULL_DAY leaves, calculate working days
  if (leaveType === "FULL_DAY") {
    const workingDays = calculateWorkingDays(startDate, endDate, holidays);
    const effectiveDays = workingDays;

    // Generate warning if effective days is 0
    if (effectiveDays === 0) {
      return {
        requestedDays,
        effectiveDays: 0,
        workingDays,
        hasWarning: true,
        warningMessage:
          "All requested days fall on weekends or public holidays. No annual leave will be consumed.",
      };
    }

    return {
      requestedDays,
      effectiveDays,
      workingDays,
      hasWarning: false,
    };
  }

  // For HALF_DAY and QUARTER_DAY leaves (single day)
  // Check if the single day is a working day
  const workingDays = calculateWorkingDays(startDate, startDate, holidays);

  if (workingDays === 0) {
    return {
      requestedDays,
      effectiveDays: 0,
      workingDays: 0,
      hasWarning: true,
      warningMessage:
        "The requested day falls on a weekend or public holiday. No annual leave will be consumed.",
    };
  }

  // If it's a working day, return the requested days
  return {
    requestedDays,
    effectiveDays: requestedDays,
    workingDays: 1,
    hasWarning: false,
  };
}
