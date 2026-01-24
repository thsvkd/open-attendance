import { db } from "@/lib/db";
import { internalErrorResponse, successResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const count = await db.user.count();
    return successResponse({ exists: count > 0, count });
  } catch (e) {
    console.error("USER_EXISTS_CHECK_ERROR", e);
    return internalErrorResponse();
  }
}
