import {
  requireAuth,
  findTodayAttendance,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const attendance = await findTodayAttendance(session!.user.id);
    return successResponse(attendance);
  } catch (e) {
    console.error("ATTENDANCE_GET_ERROR", e);
    return internalErrorResponse();
  }
}
