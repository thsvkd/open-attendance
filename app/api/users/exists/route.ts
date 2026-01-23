import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const count = await db.user.count();
    return NextResponse.json({ exists: count > 0, count });
  } catch (error) {
    console.error("USER_EXISTS_CHECK_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
