import { differenceInDays } from "date-fns";
import type { LeaveType } from "@/types";

/**
 * 휴가 요청을 분 단위 범위로 변환하여 겹침 감지에 사용합니다.
 */
export function getLeaveMinutes(
  leaveType: LeaveType,
  startDate: Date,
  endDate: Date,
  startTime?: string,
  endTime?: string
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];

  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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
 * 두 시간 범위가 겹치는지 확인합니다.
 */
export function rangesOverlap(
  range1: { start: number; end: number },
  range2: { start: number; end: number }
): boolean {
  return range1.start < range2.end && range1.end > range2.start;
}

/**
 * 휴가 유형에 따라 사용 일수를 계산합니다.
 */
export function calculateDays(
  leaveType: LeaveType,
  startDate: Date,
  endDate: Date
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
