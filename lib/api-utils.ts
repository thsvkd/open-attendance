import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

/**
 * 인증된 세션을 가져옵니다. 인증되지 않은 경우 null을 반환합니다.
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * 인증된 세션을 가져오고, 인증되지 않은 경우 401 응답을 반환합니다.
 * 성공 시 session 객체, 실패 시 NextResponse를 반환합니다.
 */
export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return { session: null, error: unauthorizedResponse() };
  }
  return { session, error: null };
}

/**
 * 관리자 세션을 가져오고, 관리자가 아닌 경우 401 응답을 반환합니다.
 */
export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { session: null, error: unauthorizedResponse() };
  }
  return { session, error: null };
}

/**
 * 401 Unauthorized 응답을 반환합니다.
 */
export function unauthorizedResponse() {
  return new NextResponse("Unauthorized", { status: 401 });
}

/**
 * JSON 에러 응답을 반환합니다.
 */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

/**
 * 500 Internal Error 응답을 반환합니다.
 */
export function internalErrorResponse() {
  return new NextResponse("Internal Error", { status: 500 });
}

/**
 * JSON 성공 응답을 반환합니다.
 */
export function successResponse(data: unknown) {
  return NextResponse.json(data);
}

/**
 * 요청 body의 JSON을 안전하게 파싱합니다.
 * 파싱 실패 시 null을 반환합니다.
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
 * 현재 사용자의 오늘 출석 기록을 조회합니다.
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
