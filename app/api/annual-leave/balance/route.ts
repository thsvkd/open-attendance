import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        totalLeaves: true,
        usedLeaves: true,
        joinDate: true,
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
