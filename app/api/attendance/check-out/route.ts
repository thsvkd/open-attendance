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

    if (!existing) {
      return errorResponse("No check-in record found", 400);
    }

    const attendance = await db.attendance.update({
      where: { id: existing.id },
      data: { checkOut: new Date() },
    });

    return successResponse(attendance);
  } catch (e) {
    console.error("CHECKOUT_ERROR", e);
    return internalErrorResponse();
  }
}
