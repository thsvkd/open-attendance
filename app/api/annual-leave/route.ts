import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { differenceInDays } from "date-fns";

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
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Create a new annual leave request
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { startDate, endDate, reason } = await req.json();

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;

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
        startDate: start,
        endDate: end,
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
