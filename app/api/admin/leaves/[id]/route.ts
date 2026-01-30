import { db } from "@/lib/db";
import {
  requireAdmin,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!id || typeof id !== "string") {
    return errorResponse("Leave request ID required", 400);
  }

  try {
    const leave = await db.leaveRequest.findUnique({
      where: { id },
    });

    if (!leave) {
      return errorResponse("Leave request not found", 404);
    }

    // Only allow deletion of non-PENDING leaves
    if (leave.status === "PENDING") {
      return errorResponse("Pending leave requests cannot be deleted", 400);
    }

    const deletedLeave = await db.leaveRequest.delete({
      where: { id },
    });

    // Recalculate usedLeaves if it was ANNUAL type
    if (deletedLeave.type === "ANNUAL") {
      const approvedLeaves = await db.leaveRequest.findMany({
        where: {
          userId: deletedLeave.userId,
          type: "ANNUAL",
          status: "APPROVED",
        },
      });

      // Use effectiveDays if available, otherwise fall back to days
      const totalUsed = approvedLeaves.reduce(
        (sum: number, item: { days: number; effectiveDays?: number | null }) =>
          sum + (item.effectiveDays ?? item.days),
        0,
      );

      await db.user.update({
        where: { id: deletedLeave.userId },
        data: { usedLeaves: totalUsed },
      });
    }

    return successResponse(deletedLeave);
  } catch (e) {
    console.error("[ADMIN_LEAVES_DELETE]", e);
    return internalErrorResponse();
  }
}
