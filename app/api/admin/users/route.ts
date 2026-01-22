import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name, email, password, role, joinDate } = await req.json();

    if (!email || !password || !name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
        joinDate: joinDate ? new Date(joinDate) : new Date(),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, currentPassword, ...updateData } = body;

    if (!id) {
      return new NextResponse("User ID required", { status: 400 });
    }

    // Security: If an admin is editing themselves, require current password for password changes
    if (id === session.user.id && updateData.password) {
      if (!currentPassword) {
        return new NextResponse("Current password required for self-update", { status: 400 });
      }

      const currentUser = await db.user.findUnique({ where: { id: session.user.id } });
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser!.password!);
      if (!isPasswordValid) {
        return new NextResponse("Incorrect current password", { status: 403 });
      }
    }

    if (updateData.joinDate) {
      updateData.joinDate = new Date(updateData.joinDate);
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
