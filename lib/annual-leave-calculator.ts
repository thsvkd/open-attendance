import { differenceInMonths, differenceInYears } from "date-fns";

/**
 * Calculate annual leave balance based on Korean labor law
 *
 * Rules:
 * 1. If joinDate is not set, return 0
 * 2. During the first year: 1 day of annual leave is granted per completed month
 * 3. After completing 1 year: 15 days of annual leave are granted at once
 *
 * @param joinDate - Employee's hire/join date (nullable)
 * @param currentDate - Current date for calculation (defaults to today)
 * @returns Total annual leave days the employee is entitled to
 */
export function calculateAnnualLeave(
  joinDate: Date | null,
  currentDate: Date = new Date(),
): number {
  // If joinDate is not set, return 0
  if (!joinDate) {
    return 0;
  }

  const monthsWorked = differenceInMonths(currentDate, joinDate);
  const yearsWorked = differenceInYears(currentDate, joinDate);

  // If less than 1 month worked, no annual leave yet
  if (monthsWorked < 1) {
    return 0;
  }

  // After 1 year of employment, grant 15 days
  if (yearsWorked >= 1) {
    return 15;
  }

  // During the first year: 1 day per completed month (max 11 days)
  // Note: After 12 months, they should get 15 days, not 12
  return Math.min(monthsWorked, 11);
}
