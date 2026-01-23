import { db } from "@/lib/db";
import {
  requireAuth,
  findTodayAttendance,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const existing = await findTodayAttendance(session!.user.id);

    if (existing) {
      return errorResponse("Already checked in", 400);
    }

    const today = new Date();
    const attendance = await db.attendance.create({
      data: {
        userId: session!.user.id,
        date: today,
        checkIn: today,
        status: "PRESENT",
      },
    });

    return successResponse(attendance);
  } catch (e) {
    console.error("CHECKIN_ERROR", e);
    return internalErrorResponse();
  }
}
