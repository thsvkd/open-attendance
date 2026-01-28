import { db } from "@/lib/db";
import { calculateAnnualLeave } from "@/lib/annual-leave-calculator";
import {
  requireAdmin,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

/**
 * Update annual leave balances for all users based on their join date.
 * This endpoint should be called periodically (e.g., daily via cron job)
 * to ensure annual leave balances are up to date.
 */
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        joinDate: true,
        totalLeaves: true,
      },
    });

    const updates: Array<{
      id: string;
      oldBalance: number;
      newBalance: number;
    }> = [];
    const currentDate = new Date();

    // Collect all updates first
    const updatePromises = users
      .map((user) => {
        const calculatedLeave = calculateAnnualLeave(
          user.joinDate,
          currentDate,
        );

        // Only update if the calculated leave is different from current
        if (calculatedLeave !== user.totalLeaves) {
          updates.push({
            id: user.id,
            oldBalance: user.totalLeaves,
            newBalance: calculatedLeave,
          });

          return db.user.update({
            where: { id: user.id },
            data: { totalLeaves: calculatedLeave },
          });
        }
        return null;
      })
      .filter(Boolean);

    // Execute all updates in parallel
    await Promise.all(updatePromises);

    return successResponse({
      message: `Updated ${updates.length} user(s) annual leave balance`,
      updates,
    });
  } catch (e) {
    console.error("[ANNUAL_LEAVE_UPDATE]", e);
    return internalErrorResponse();
  }
}
