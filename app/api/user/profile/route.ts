import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        joinDate: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, currentPassword } = body;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;

    // Allow email updates with validation
    if (email && email !== user.email) {
      // Check if email is already taken by another user
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return new NextResponse("Email already in use", { status: 409 });
      }

      updateData.email = email;
    }

    if (password) {
      if (!currentPassword) {
        return new NextResponse("Current password required", { status: 400 });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password!);
      if (!isPasswordValid) {
        return new NextResponse("Incorrect current password", { status: 403 });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return new NextResponse("No fields to update", { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        joinDate: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
