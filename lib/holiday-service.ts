import axios from "axios";
import { isSaturday, isSunday } from "date-fns";

/**
 * Holiday data from Nager.Date API
 */
export interface Holiday {
  date: string; // ISO 8601 date format (YYYY-MM-DD)
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

/**
 * Cache entry with timestamp
 */
interface CacheEntry {
  holidays: Holiday[];
  timestamp: number;
}

/**
 * Cache for holiday data to avoid excessive API calls
 * Key format: "countryCode-year"
 * Entries expire after 24 hours
 */
const holidayCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch public holidays for a specific country and year from Nager.Date API
 * Results are cached for 24 hours to minimize API calls
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "KR", "US")
 * @param year - Year to fetch holidays for
 * @returns Array of holidays for the specified country and year
 */
export async function fetchHolidays(
  countryCode: string,
  year: number,
): Promise<Holiday[]> {
  const cacheKey = `${countryCode}-${year}`;

  // Check cache and validate TTL
  const cachedEntry = holidayCache.get(cacheKey);
  if (cachedEntry) {
    const age = Date.now() - cachedEntry.timestamp;
    if (age < CACHE_TTL_MS) {
      return cachedEntry.holidays;
    }
    // Cache expired, remove it
    holidayCache.delete(cacheKey);
  }

  try {
    const response = await axios.get<Holiday[]>(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
      {
        timeout: 5000, // 5 second timeout
      },
    );

    const holidays = response.data;
    holidayCache.set(cacheKey, { holidays, timestamp: Date.now() });
    return holidays;
  } catch (error) {
    console.error(
      `[HOLIDAY_SERVICE] Error fetching holidays for ${countryCode} ${year}:`,
      error,
    );
    // Return empty array if API fails - graceful degradation
    return [];
  }
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 *
 * @param date - Date to check
 * @returns true if the date is a weekend
 */
export function isWeekend(date: Date): boolean {
  return isSaturday(date) || isSunday(date);
}

/**
 * Check if a date is a public holiday
 *
 * @param date - Date to check
 * @param holidays - Array of holidays to check against
 * @returns true if the date is a public holiday
 */
export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  // Format date as YYYY-MM-DD without timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  return holidays.some((holiday) => holiday.date === dateStr);
}

/**
 * Check if a date is a working day (not weekend and not holiday)
 *
 * @param date - Date to check
 * @param holidays - Array of holidays to check against
 * @returns true if the date is a working day
 */
export function isWorkingDay(date: Date, holidays: Holiday[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Calculate the number of working days between two dates (inclusive)
 * Excludes weekends and public holidays
 *
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @param holidays - Array of holidays to exclude
 * @returns Number of working days
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: Holiday[],
): number {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    if (isWorkingDay(currentDate, holidays)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Clear the holiday cache (useful for testing)
 */
export function clearHolidayCache(): void {
  holidayCache.clear();
}
