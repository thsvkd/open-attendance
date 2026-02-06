import { db } from "@/lib/db";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import {
  getLeaveMinutes,
  rangesOverlap,
  calculateDays,
} from "@/lib/leave-utils";
import { calculateLeaveConsumption } from "@/lib/leave-consumption-calculator";
import type { LeaveType } from "@/types";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const leaves = await db.leaveRequest.findMany({
      where: {
        userId: session!.user.id,
        type: "ANNUAL",
      },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(leaves);
  } catch (e) {
    console.error("[ANNUAL_LEAVE_GET]", e);
    return internalErrorResponse();
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const t = await getTranslations("annualLeave");

  const body = await parseJsonBody<{
    startDate?: string;
    endDate?: string;
    reason?: string;
    leaveType?: string;
    startTime?: string;
    endTime?: string;
  }>(req);

  if (!body) {
    return errorResponse("Invalid request body", 400);
  }

  const {
    startDate,
    endDate,
    reason,
    leaveType = "FULL_DAY",
    startTime,
    endTime,
  } = body;

  if (!startDate) {
    return errorResponse("Start date is required", 400);
  }

  try {
    const start = new Date(startDate);
    const end = leaveType === "FULL_DAY" && endDate ? new Date(endDate) : start;
    const days = calculateDays(leaveType as LeaveType, start, end);

    // Validate quarter-day leave time range (exactly 2 hours)
    if (leaveType === "QUARTER_DAY" && startTime && endTime) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      const durationMinutes =
        endHour * 60 + endMin - (startHour * 60 + startMin);

      if (durationMinutes !== 120) {
        return errorResponse("Quarter day leave must be exactly 2 hours.", 400);
      }
    }

    // Check remaining leave balance
    const user = await db.user.findUnique({
      where: { id: session!.user.id },
      select: { totalLeaves: true, usedLeaves: true },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Get company location for country setting
    const companyLocation = await db.companyLocation.findFirst({
      where: { isActive: true },
    });

    const remainingLeaves = user.totalLeaves - user.usedLeaves;

    // Calculate effective days (excluding holidays and weekends)
    // Use company's country setting instead of user's country
    const effectiveDaysResult = await calculateLeaveConsumption(
      leaveType as LeaveType,
      start,
      end,
      days,
      companyLocation?.country,
    );

    // Show warning if effective days is 0
    if (effectiveDaysResult.hasWarning) {
      return successResponse({
        warning: effectiveDaysResult.warningMessage,
        requestedDays: effectiveDaysResult.requestedDays,
        effectiveDays: effectiveDaysResult.effectiveDays,
      });
    }

    // Check if effective days exceed remaining balance
    if (effectiveDaysResult.effectiveDays > remainingLeaves) {
      return errorResponse(
        t("insufficientBalance", { remaining: remainingLeaves }),
        400,
      );
    }

    // Check for overlapping leave requests
    const existingLeaves = await db.leaveRequest.findMany({
      where: {
        userId: session!.user.id,
        type: "ANNUAL",
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    const newRanges = getLeaveMinutes(
      leaveType as LeaveType,
      start,
      end,
      startTime,
      endTime,
    );

    for (const existingLeave of existingLeaves) {
      const existingRanges = getLeaveMinutes(
        existingLeave.leaveType as LeaveType,
        new Date(existingLeave.startDate),
        new Date(existingLeave.endDate),
        existingLeave.startTime || undefined,
        existingLeave.endTime || undefined,
      );

      for (const newRange of newRanges) {
        for (const existingRange of existingRanges) {
          if (rangesOverlap(newRange, existingRange)) {
            const statusKey = existingLeave.status as keyof typeof t;
            return errorResponse(
              t("overlapError", {
                status: t(`statuses.${statusKey}`),
                start: format(new Date(existingLeave.startDate), "MM/dd"),
                end: format(new Date(existingLeave.endDate), "MM/dd"),
              }),
              400,
            );
          }
        }
      }
    }

    const leave = await db.leaveRequest.create({
      data: {
        userId: session!.user.id,
        type: "ANNUAL",
        leaveType: leaveType as string,
        startDate: start,
        endDate: end,
        startTime: leaveType === "QUARTER_DAY" ? startTime || null : null,
        endTime: leaveType === "QUARTER_DAY" ? endTime || null : null,
        days,
        effectiveDays: effectiveDaysResult.effectiveDays,
        reason: reason || null,
        status: "PENDING",
      },
    });

    return successResponse(leave);
  } catch (e) {
    console.error("[ANNUAL_LEAVE_POST]", e);
    return internalErrorResponse();
  }
}
