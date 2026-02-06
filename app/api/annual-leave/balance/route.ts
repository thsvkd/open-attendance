import { db } from "@/lib/db";
import { calculateAnnualLeave } from "@/lib/annual-leave-calculator";
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
        joinDate: true,
        usedLeaves: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Calculate annual leave in real-time based on joinDate
    const totalLeaves = calculateAnnualLeave(user.joinDate);

    return successResponse({
      totalLeaves,
      usedLeaves: user.usedLeaves,
      joinDate: user.joinDate,
    });
  } catch (e) {
    console.error("[BALANCE_GET]", e);
    return internalErrorResponse();
  }
}
