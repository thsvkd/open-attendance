import { db } from "@/lib/db";
import {
  requireAdmin,
  parseJsonBody,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import { VALID_ADMIN_LEAVE_ACTIONS } from "@/types";
import type { LeaveStatus } from "@/types";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const leaves = await db.leaveRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(leaves);
  } catch (e) {
    console.error("[ADMIN_LEAVES_GET]", e);
    return internalErrorResponse();
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody<{ id?: string; status?: string }>(req);
  if (!body) {
    return errorResponse("Invalid request body", 400);
  }

  const { id, status } = body;

  if (!id || typeof id !== "string") {
    return errorResponse("Leave request ID required", 400);
  }

  // Validate status value
  if (!status || !VALID_ADMIN_LEAVE_ACTIONS.includes(status as LeaveStatus)) {
    return errorResponse("Invalid status. Must be APPROVED or REJECTED", 400);
  }

  try {
    const updatedLeave = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: session!.user.id,
      },
    });

    // Update user's usedLeaves if leave type is ANNUAL
    if (updatedLeave.type === "ANNUAL") {
      const approvedLeaves = await db.leaveRequest.findMany({
        where: {
          userId: updatedLeave.userId,
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
        where: { id: updatedLeave.userId },
        data: { usedLeaves: totalUsed },
      });
    }

    return successResponse(updatedLeave);
  } catch (e) {
    console.error("[ADMIN_LEAVES_PATCH]", e);
    return internalErrorResponse();
  }
}
