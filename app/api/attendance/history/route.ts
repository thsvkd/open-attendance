import { db } from "@/lib/db";
import {
  requireAuth,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const history = await db.attendance.findMany({
      where: { userId: session!.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    return successResponse(history);
  } catch (e) {
    console.error("HISTORY_GET_ERROR", e);
    return internalErrorResponse();
  }
}
