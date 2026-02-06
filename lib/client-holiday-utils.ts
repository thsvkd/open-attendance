import { isWeekend, isHoliday } from "./holiday-service";
import type { Holiday } from "./holiday-service";
import type { LeaveTypeSelection } from "@/types";

export interface LeaveBreakdown {
  totalDays: number;
  weekendDays: number;
  holidayDays: number;
  effectiveDays: number;
}

function countWeekendDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    if (isWeekend(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function countHolidayDays(start: Date, end: Date, holidays: Holiday[]): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    if (!isWeekend(current) && isHoliday(current, holidays)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function calculateLeaveBreakdown(
  leaveType: LeaveTypeSelection,
  start: Date,
  end: Date,
  holidays: Holiday[],
): LeaveBreakdown {
  if (leaveType === "FULL_DAY") {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    const totalDays =
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const weekendDays = countWeekendDays(startDate, endDate);
    const holidayDays = countHolidayDays(startDate, endDate, holidays);
    const effectiveDays = totalDays - weekendDays - holidayDays;

    return { totalDays, weekendDays, holidayDays, effectiveDays };
  }

  // HALF_DAY or QUARTER_DAY: single day
  const singleDate = new Date(start);
  singleDate.setHours(0, 0, 0, 0);
  const weekend = isWeekend(singleDate);
  const holiday = !weekend && isHoliday(singleDate, holidays);
  const isNonWorking = weekend || holiday;

  const dayValue = leaveType === "HALF_DAY" ? 0.5 : 0.25;

  return {
    totalDays: 1,
    weekendDays: weekend ? 1 : 0,
    holidayDays: holiday ? 1 : 0,
    effectiveDays: isNonWorking ? 0 : dayValue,
  };
}
