import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { differenceInDays, format } from "date-fns";

type LeaveType = "FULL_DAY" | "HALF_DAY_AM" | "HALF_DAY_PM" | "QUARTER_DAY";

// Convert leave request to minute ranges for overlap detection
function getLeaveMinutes(
  leaveType: LeaveType,
  startDate: Date,
  endDate: Date,
  startTime?: string,
  endTime?: string
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];

  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let dayOffset = 0; dayOffset <= daysDiff; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const baseMinutes = dayStart.getTime() / (1000 * 60);

    switch (leaveType) {
      case "FULL_DAY":
        // 09:00 - 18:00
        ranges.push({
          start: baseMinutes + 9 * 60,
          end: baseMinutes + 18 * 60,
        });
        break;
      case "HALF_DAY_AM":
        // 09:00 - 13:00
        ranges.push({
          start: baseMinutes + 9 * 60,
          end: baseMinutes + 13 * 60,
        });
        break;
      case "HALF_DAY_PM":
        // 14:00 - 18:00
        ranges.push({
          start: baseMinutes + 14 * 60,
          end: baseMinutes + 18 * 60,
        });
        break;
      case "QUARTER_DAY":
        if (startTime && endTime) {
          const [startHour, startMin] = startTime.split(":").map(Number);
          const [endHour, endMin] = endTime.split(":").map(Number);
          ranges.push({
            start: baseMinutes + startHour * 60 + startMin,
            end: baseMinutes + endHour * 60 + endMin,
          });
        }
        break;
    }
  }

  return ranges;
}

// Check if two time ranges overlap
function rangesOverlap(range1: { start: number; end: number }, range2: { start: number; end: number }): boolean {
  return range1.start < range2.end && range1.end > range2.start;
}

// Calculate days based on leave type
function calculateDays(leaveType: LeaveType, startDate: Date, endDate: Date): number {
  switch (leaveType) {
    case "HALF_DAY_AM":
    case "HALF_DAY_PM":
      return 0.5;
    case "QUARTER_DAY":
      return 0.25;
    case "FULL_DAY":
    default:
      return differenceInDays(endDate, startDate) + 1;
  }
}

// Get all annual leave requests for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const leaves = await db.leaveRequest.findMany({
      where: {
        userId: session.user.id,
        type: "ANNUAL"
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leaves);
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Create a new annual leave request
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { startDate, endDate, reason, leaveType = "FULL_DAY", startTime, endTime } = await req.json();

    const start = new Date(startDate);
    // For half-day and quarter-day, endDate is the same as startDate
    const end = leaveType === "FULL_DAY" && endDate ? new Date(endDate) : start;
    const days = calculateDays(leaveType as LeaveType, start, end);

    // Validate quarter day time range (must be 2 hours)
    if (leaveType === "QUARTER_DAY" && startTime && endTime) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      if (durationMinutes !== 120) {
        return NextResponse.json(
          { message: "Quarter day leave must be exactly 2 hours." },
          { status: 400 }
        );
      }
    }

    // Get user's current leave balance
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { totalLeaves: true, usedLeaves: true }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const remainingLeaves = user.totalLeaves - user.usedLeaves;

    if (days > remainingLeaves) {
      return NextResponse.json(
        { message: `Insufficient leave balance. You have ${remainingLeaves} days remaining.` },
        { status: 400 }
      );
    }

    // Check for overlapping leave requests
    const existingLeaves = await db.leaveRequest.findMany({
      where: {
        userId: session.user.id,
        type: "ANNUAL",
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    // Get time ranges for the new request
    const newRanges = getLeaveMinutes(leaveType as LeaveType, start, end, startTime, endTime);

    // Check each existing leave for overlap
    for (const existingLeave of existingLeaves) {
      const existingRanges = getLeaveMinutes(
        existingLeave.leaveType as LeaveType,
        new Date(existingLeave.startDate),
        new Date(existingLeave.endDate),
        existingLeave.startTime || undefined,
        existingLeave.endTime || undefined
      );

      // Check if any ranges overlap
      for (const newRange of newRanges) {
        for (const existingRange of existingRanges) {
          if (rangesOverlap(newRange, existingRange)) {
            return NextResponse.json(
              {
                message: `This leave request overlaps with an existing ${existingLeave.status.toLowerCase()} request from ${format(new Date(existingLeave.startDate), "MM/dd")} to ${format(new Date(existingLeave.endDate), "MM/dd")}.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    const leave = await db.leaveRequest.create({
      data: {
        userId: session.user.id,
        type: "ANNUAL",
        leaveType: leaveType as string,
        startDate: start,
        endDate: end,
        startTime: leaveType === "QUARTER_DAY" ? startTime : null,
        endTime: leaveType === "QUARTER_DAY" ? endTime : null,
        days,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error("Error creating annual leave:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
