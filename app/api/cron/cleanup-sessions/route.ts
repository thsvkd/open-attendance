import { db } from "@/lib/db";
import { successResponse, internalErrorResponse } from "@/lib/api-utils";

// Clean up expired QR sessions (can be called via cron)
export async function GET() {
  try {
    const now = new Date();

    // Mark expired sessions
    await db.attendanceSession.updateMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Delete old sessions (older than 24 hours)
    const deleteBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = await db.attendanceSession.deleteMany({
      where: {
        createdAt: {
          lt: deleteBefore,
        },
      },
    });

    return successResponse({
      cleaned: result.count,
      timestamp: now.toISOString(),
    });
  } catch (e) {
    console.error("CLEANUP_ERROR", e);
    return internalErrorResponse();
  }
}
