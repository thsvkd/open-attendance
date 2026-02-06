import { db } from "@/lib/db";
import {
  requireAuth,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

// GET - Check status of a QR authentication session
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { token } = await params;

    const qrSession = await db.attendanceSession.findUnique({
      where: { sessionToken: token },
    });

    if (!qrSession) {
      return errorResponse("Session not found", 404);
    }

    // Check if session belongs to the current user
    if (qrSession.userId !== session!.user.id) {
      return errorResponse("Unauthorized", 403);
    }

    // Check if session has expired
    if (new Date() > qrSession.expiresAt && qrSession.status === "PENDING") {
      await db.attendanceSession.update({
        where: { id: qrSession.id },
        data: { status: "EXPIRED" },
      });

      return successResponse({
        status: "EXPIRED",
      });
    }

    return successResponse({
      status: qrSession.status,
      action: qrSession.action,
      verifiedAt: qrSession.verifiedAt,
    });
  } catch (e) {
    console.error("GET_QR_SESSION_ERROR", e);
    return internalErrorResponse();
  }
}
