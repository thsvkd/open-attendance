import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const history = await db.attendance.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 30, // 최근 30일 기록
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("HISTORY_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
