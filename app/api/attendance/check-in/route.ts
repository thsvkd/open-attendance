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

    if (existing) {
      return errorResponse("Already checked in", 400);
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

    const today = new Date();
    const attendance = await db.attendance.create({
      data: {
        userId: session!.user.id,
        date: today,
        checkIn: today,
        status: "PRESENT",
        checkInLatitude: latitude || null,
        checkInLongitude: longitude || null,
        checkInDistance: distance !== null ? Math.round(distance) : null,
        checkInWifiSsid: wifiSsid || null,
        checkInWifiBssid: wifiBssid || null,
      },
    });

    return successResponse(attendance);
  } catch (e) {
    console.error("CHECKIN_ERROR", e);
    return internalErrorResponse();
  }
}
