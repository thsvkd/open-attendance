import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { differenceInDays } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const leaves = await db.leaveRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leaves);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { type, startDate, endDate, reason } = await req.json();

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;

    const leave = await db.leaveRequest.create({
      data: {
        userId: session.user.id,
        type,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
