import { db } from "@/lib/db";
import {
  requireAuth,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const companyLocation = await db.companyLocation.findFirst({
      where: { isActive: true },
    });

    if (!companyLocation) {
      return successResponse({
        country: "KR", // Default country
      });
    }

    return successResponse({
      id: companyLocation.id,
      name: companyLocation.name,
      latitude: companyLocation.latitude,
      longitude: companyLocation.longitude,
      radius: companyLocation.radius,
      address: companyLocation.address,
      country: companyLocation.country,
    });
  } catch (e) {
    console.error("[COMPANY_SETTINGS_GET]", e);
    return internalErrorResponse();
  }
}

export async function PATCH(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) {
      return error;
    }

    const body = await req.json();
    const { country } = body;

    if (!country) {
      return errorResponse("Country code is required", 400);
    }

    // Find or create company location
    let companyLocation = await db.companyLocation.findFirst({
      where: { isActive: true },
    });

    if (!companyLocation) {
      // Create default company location if it doesn't exist
      companyLocation = await db.companyLocation.create({
        data: {
          name: "Company Office",
          latitude: 0,
          longitude: 0,
          radius: 100,
          country,
          isActive: true,
        },
      });
    } else {
      // Update existing company location
      companyLocation = await db.companyLocation.update({
        where: { id: companyLocation.id },
        data: { country },
      });
    }

    return successResponse({
      id: companyLocation.id,
      name: companyLocation.name,
      country: companyLocation.country,
    });
  } catch (e) {
    return internalErrorResponse();
  }
}
