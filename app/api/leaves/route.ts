import { db } from "@/lib/db";
import { differenceInDays } from "date-fns";
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const leaves = await db.leaveRequest.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(leaves);
  } catch (e) {
    console.error("[LEAVES_GET]", e);
    return internalErrorResponse();
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await parseJsonBody<{
    type?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  }>(req);

  if (!body) {
    return errorResponse("Invalid request body", 400);
  }

  const { type, startDate, endDate, reason } = body;

  if (!type || !startDate || !endDate) {
    return errorResponse("Missing required fields", 400);
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;

    const leave = await db.leaveRequest.create({
      data: {
        userId: session!.user.id,
        type,
        startDate: start,
        endDate: end,
        days,
        reason: reason || null,
        status: "PENDING",
      },
    });

    return successResponse(leave);
  } catch (e) {
    console.error("[LEAVES_POST]", e);
    return internalErrorResponse();
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await parseJsonBody<{ id?: string }>(req);
  if (!body || !body.id) {
    return errorResponse("Leave request ID required", 400);
  }

  const { id } = body;

  try {
    const leave = await db.leaveRequest.findUnique({
      where: { id },
    });

    if (!leave) {
      return errorResponse("Leave request not found", 404);
    }

    if (leave.userId !== session!.user.id) {
      return errorResponse("Unauthorized", 403);
    }

    if (leave.status !== "PENDING") {
      return errorResponse("Only pending requests can be cancelled", 400);
    }

    const updatedLeave = await db.leaveRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return successResponse(updatedLeave);
  } catch (e) {
    console.error("[LEAVES_PATCH]", e);
    return internalErrorResponse();
  }
}
