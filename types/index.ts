export type LeaveType =
  | "FULL_DAY"
  | "HALF_DAY_AM"
  | "HALF_DAY_PM"
  | "QUARTER_DAY";
export type LeaveTypeSelection = "FULL_DAY" | "HALF_DAY" | "QUARTER_DAY";
export type HalfDayPeriod = "AM" | "PM";
export type LeaveCategory = "ANNUAL" | "SICK" | "OFFICIAL" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY";
export type UserRole = "ADMIN" | "USER";

export const VALID_LEAVE_STATUSES: LeaveStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];
export const VALID_ADMIN_LEAVE_ACTIONS: LeaveStatus[] = [
  "APPROVED",
  "REJECTED",
];

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export interface LeaveRequestRecord {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  leaveType?: LeaveType;
  startTime?: string;
  endTime?: string;
}

export interface UserBalance {
  id: string;
  totalLeaves: number;
  usedLeaves: number;
  joinDate: Date | null;
}
