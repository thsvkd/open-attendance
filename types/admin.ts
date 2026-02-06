export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
}

export interface AdminLeave {
  id: string;
  type: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  days: number;
  effectiveDays?: number | null;
  status: string;
  user: { name: string; email: string };
}

export interface AdminAttendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  user: { name: string; email: string };
}
