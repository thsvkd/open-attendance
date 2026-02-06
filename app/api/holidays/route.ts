import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fetchHolidays } from "@/lib/holiday-service";
import {
  requireAuth,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2000 || year > 2100) {
    return errorResponse("Invalid year parameter", 400);
  }

  try {
    const companyLocation = await db.companyLocation.findFirst({
      where: { isActive: true },
      select: { country: true },
    });

    const countryCode = companyLocation?.country || "KR";
    const holidays = await fetchHolidays(countryCode, year);

    return successResponse({ holidays, countryCode });
  } catch (e) {
    console.error("[HOLIDAYS_GET]", e);
    return internalErrorResponse();
  }
}
