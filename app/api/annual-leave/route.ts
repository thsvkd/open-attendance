import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { differenceInDays } from "date-fns";

type LeaveType = "FULL_DAY" | "HALF_DAY_AM" | "HALF_DAY_PM" | "QUARTER_DAY";

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
