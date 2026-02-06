import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Retrieves authenticated session. Returns null if not authenticated.
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Retrieves authenticated session, returns 401 response if not authenticated.
 * Returns session object on success, NextResponse on failure.
 */
export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return { session: null, error: unauthorizedResponse() };
  }

  // Verify user.id exists in session
  if (!session.user?.id) {
    console.error("Session exists but user.id is missing");
    return { session: null, error: unauthorizedResponse() };
  }

  return { session, error: null };
}

/**
 * Verifies that user exists in database.
 * If user.id doesn't exist in DB, tries to find by email.
 * Returns false if user not found, true otherwise.
 */
export async function verifyUserExists(
  userId: string,
  userEmail?: string,
): Promise<{ exists: boolean; actualUserId?: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (user) {
      return { exists: true, actualUserId: user.id };
    }

    // Try to find by email as fallback
    if (userEmail) {
      const userByEmail = await db.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });

      if (userByEmail) {
        return { exists: true, actualUserId: userByEmail.id };
      }
    }

    return { exists: false };
  } catch (e) {
    console.error("Error verifying user in database:", e);
    return { exists: false };
  }
}

/**
 * Retrieves admin session, returns 401 response if not an admin.
 */
export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { session: null, error: unauthorizedResponse() };
  }
  return { session, error: null };
}

/**
 * Returns 401 Unauthorized response.
 */
export function unauthorizedResponse() {
  return new NextResponse("Unauthorized", { status: 401 });
}

/**
 * Returns a JSON error response.
 */
export function errorResponse(error: string, status: number) {
  return NextResponse.json({ error, message: error }, { status });
}

/**
 * Returns a 500 Internal Error response.
 */
export function internalErrorResponse() {
  return new NextResponse("Internal Error", { status: 500 });
}

/**
 * Returns a JSON success response.
 */
export function successResponse(data: unknown) {
  return NextResponse.json(data);
}

/**
 * Safely parses JSON from the request body.
 * Returns null on failure.
 */
export async function parseJsonBody<T = unknown>(
  req: Request,
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Retrieves today's attendance record for the current user.
 */
export async function findTodayAttendance(userId: string) {
  const today = new Date();
  return await db.attendance.findFirst({
    where: {
      userId,
      date: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
  });
}
