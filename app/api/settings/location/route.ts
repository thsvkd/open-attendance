import { db } from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

// GET - Get current company location settings
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const location = await db.companyLocation.findFirst({
      where: { isActive: true },
      include: {
        registeredWifiNetworks: true,
      },
    });

    if (!location) {
      return successResponse(null);
    }

    return successResponse(location);
  } catch (e) {
    console.error("GET_LOCATION_ERROR", e);
    return internalErrorResponse();
  }
}

// POST - Create or update company location settings (admin only)
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { latitude, longitude, radius, address } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof radius !== "number"
    ) {
      return errorResponse("Invalid location data", 400);
    }

    // Deactivate existing location
    await db.companyLocation.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active location
    const location = await db.companyLocation.create({
      data: {
        latitude,
        longitude,
        radius,
        address: address || null,
        isActive: true,
      },
    });

    return successResponse(location);
  } catch (e) {
    console.error("UPDATE_LOCATION_ERROR", e);
    return internalErrorResponse();
  }
}
