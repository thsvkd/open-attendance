import { db } from "@/lib/db";
import {
  requireAuth,
  findTodayAttendance,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import { calculateDistance } from "@/lib/location-utils";

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const existing = await findTodayAttendance(session!.user.id);

    if (!existing) {
      return errorResponse("No check-in record found", 400);
    }

    // Get location data from request
    const body = await req.json();
    const { latitude, longitude, wifiSsid, wifiBssid } = body;

    // Validate location if provided
    let distance: number | null = null;
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      typeof latitude === "number" &&
      typeof longitude === "number"
    ) {
      // Get active company location
      const companyLocation = await db.companyLocation.findFirst({
        where: { isActive: true },
        include: {
          registeredWifiNetworks: true,
        },
      });

      if (companyLocation) {
        // Calculate distance from company location
        distance = calculateDistance(
          latitude,
          longitude,
          companyLocation.latitude,
          companyLocation.longitude,
        );

        // Check if within allowed radius
        if (distance > companyLocation.radius) {
          return errorResponse(
            `Location verification failed. You are ${Math.round(distance)}m away from the office (max ${companyLocation.radius}m allowed)`,
            403,
          );
        }
      }
    }

    const attendance = await db.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: new Date(),
        checkOutLatitude: latitude || null,
        checkOutLongitude: longitude || null,
        checkOutDistance: distance !== null ? Math.round(distance) : null,
        checkOutWifiSsid: wifiSsid || null,
        checkOutWifiBssid: wifiBssid || null,
      },
    });

    return successResponse(attendance);
  } catch (e) {
    console.error("CHECKOUT_ERROR", e);
    return internalErrorResponse();
  }
}
