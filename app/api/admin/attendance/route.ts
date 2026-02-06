import { db } from "@/lib/db";
import {
  requireAdmin,
  parseJsonBody,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const attendance = await db.attendance.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
    return successResponse(attendance);
  } catch (e) {
    console.error("[ADMIN_ATTENDANCE_GET]", e);
    return internalErrorResponse();
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody<{ id?: string }>(req);
  if (!body || !body.id) {
    return errorResponse("Attendance ID required", 400);
  }

  const { id } = body;

  try {
    const attendance = await db.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      return errorResponse("Attendance record not found", 404);
    }

    const deletedAttendance = await db.attendance.delete({
      where: { id },
    });

    return successResponse(deletedAttendance);
  } catch (e) {
    console.error("[ADMIN_ATTENDANCE_DELETE]", e);
    return internalErrorResponse();
  }
}
