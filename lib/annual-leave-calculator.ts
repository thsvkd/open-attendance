import { differenceInMonths, differenceInYears } from "date-fns";

/**
 * Calculate annual leave balance based on Korean labor law
 *
 * Rules:
 * 1. During the first year: 1 day of annual leave is granted per completed month
 * 2. After completing 1 year: 15 days of annual leave are granted at once
 *
 * @param joinDate - Employee's hire/join date
 * @param currentDate - Current date for calculation (defaults to today)
 * @returns Total annual leave days the employee is entitled to
 */
export function calculateAnnualLeave(
  joinDate: Date,
  currentDate: Date = new Date(),
): number {
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
