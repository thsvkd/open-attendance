import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const today = new Date();

  try {
    const existing = await db.attendance.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        }
      }
    });

    if (!existing) {
      return new NextResponse("No check-in record found", { status: 400 });
    }

    const attendance = await db.attendance.update({
      where: {
        id: existing.id
      },
      data: {
        checkOut: today
      }
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("CHECKOUT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
