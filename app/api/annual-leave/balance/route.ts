import { db } from "@/lib/db";
import {
  requireAuth,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const user = await db.user.findUnique({
      where: { id: session!.user.id },
      select: {
        totalLeaves: true,
        usedLeaves: true,
        joinDate: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(user);
  } catch (e) {
    console.error("[BALANCE_GET]", e);
    return internalErrorResponse();
  }
}
