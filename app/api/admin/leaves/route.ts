import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const leaves = await db.leaveRequest.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leaves);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    const updatedLeave = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: session.user.id
      },
    });

    // 연차(ANNUAL)인 경우 사용자의 usedLeaves 업데이트
    if (updatedLeave.type === "ANNUAL") {
      const approvedLeaves = await db.leaveRequest.findMany({
        where: {
          userId: updatedLeave.userId,
          type: "ANNUAL",
          status: "APPROVED"
        }
      });

      const totalUsed = approvedLeaves.reduce((sum, item) => sum + item.days, 0);

      await db.user.update({
        where: { id: updatedLeave.userId },
        data: { usedLeaves: totalUsed }
      });
    }

    return NextResponse.json(updatedLeave);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
