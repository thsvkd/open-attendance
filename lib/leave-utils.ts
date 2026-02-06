import { differenceInDays } from "date-fns";
import type { LeaveType } from "@/types";

/**
 * Converts leave request to minute ranges for overlap detection.
 */
export function getLeaveMinutes(
  leaveType: LeaveType,
  startDate: Date,
  endDate: Date,
  startTime?: string,
  endTime?: string,
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];

  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  for (let dayOffset = 0; dayOffset <= daysDiff; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const baseMinutes = dayStart.getTime() / (1000 * 60);

    switch (leaveType) {
      case "FULL_DAY":
        ranges.push({
          start: baseMinutes + 9 * 60,
          end: baseMinutes + 18 * 60,
        });
        break;
      case "HALF_DAY_AM":
        ranges.push({
          start: baseMinutes + 9 * 60,
          end: baseMinutes + 13 * 60,
        });
        break;
      case "HALF_DAY_PM":
        ranges.push({
          start: baseMinutes + 14 * 60,
          end: baseMinutes + 18 * 60,
        });
        break;
      case "QUARTER_DAY":
        if (startTime && endTime) {
          const [startHour, startMin] = startTime.split(":").map(Number);
          const [endHour, endMin] = endTime.split(":").map(Number);
          ranges.push({
            start: baseMinutes + startHour * 60 + startMin,
            end: baseMinutes + endHour * 60 + endMin,
          });
        }
        break;
    }
  }

  return ranges;
}

/**
 * Checks if two time ranges overlap.
 */
export function rangesOverlap(
  range1: { start: number; end: number },
  range2: { start: number; end: number },
): boolean {
  return range1.start < range2.end && range1.end > range2.start;
}

/**
 * Calculates used days based on leave type.
 */
export function calculateDays(
  leaveType: LeaveType,
  startDate: Date,
  endDate: Date,
): number {
  switch (leaveType) {
    case "HALF_DAY_AM":
    case "HALF_DAY_PM":
      return 0.5;
    case "QUARTER_DAY":
      return 0.25;
    case "FULL_DAY":
    default:
      return differenceInDays(endDate, startDate) + 1;
  }
}

/**
 * Calculates total used annual leave days from approved leave records.
 * Uses effectiveDays if available, otherwise falls back to days.
 */
export function calculateUsedLeaves(
  leaves: { days: number; effectiveDays?: number | null; status: string }[],
): number {
  return leaves
    .filter((leave) => leave.status === "APPROVED")
    .reduce((sum, leave) => sum + (leave.effectiveDays ?? leave.days), 0);
}
