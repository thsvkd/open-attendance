import { db } from "@/lib/db";
import {
  requireAuth,
  findTodayAttendance,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import { calculateDistance } from "@/lib/location-utils";

// POST - Verify location and complete attendance via QR code scan
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { sessionToken, latitude, longitude, wifiSsid, wifiBssid } = body;

    if (!sessionToken) {
      return errorResponse("Session token required", 400);
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return errorResponse("Invalid location data", 400);
    }

    // Get QR session
    const qrSession = await db.attendanceSession.findUnique({
      where: { sessionToken },
    });

    if (!qrSession) {
      return errorResponse("Invalid session", 404);
    }

    // Check if session has expired
    if (new Date() > qrSession.expiresAt) {
      await db.attendanceSession.update({
        where: { id: qrSession.id },
        data: { status: "EXPIRED" },
      });
      return errorResponse("Session expired", 400);
    }

    // Check if session is already used
    if (qrSession.status !== "PENDING") {
      return errorResponse("Session already used", 400);
    }

    // Check if session belongs to the current user
    if (qrSession.userId !== session!.user.id) {
      return errorResponse("Unauthorized", 403);
    }

    // Get active company location
    const companyLocation = await db.companyLocation.findFirst({
      where: { isActive: true },
      include: {
        registeredWifiNetworks: true,
      },
    });

    if (!companyLocation) {
      await db.attendanceSession.update({
        where: { id: qrSession.id },
        data: { status: "FAILED" },
      });
      return errorResponse("Company location not configured", 400);
    }

    // Calculate distance from company location
    const distance = calculateDistance(
      latitude,
      longitude,
      companyLocation.latitude,
      companyLocation.longitude,
    );

    // Check if within allowed radius
    if (distance > companyLocation.radius) {
      await db.attendanceSession.update({
        where: { id: qrSession.id },
        data: {
          status: "FAILED",
          latitude,
          longitude,
          wifiSsid: wifiSsid || null,
          wifiBssid: wifiBssid || null,
        },
      });
      return errorResponse(
        `Location verification failed. You are ${Math.round(distance)}m away from the office (max ${companyLocation.radius}m allowed)`,
        403,
      );
    }

    // Update session with location data and mark as verified
    await db.attendanceSession.update({
      where: { id: qrSession.id },
      data: {
        status: "VERIFIED",
        latitude,
        longitude,
        wifiSsid: wifiSsid || null,
        wifiBssid: wifiBssid || null,
        verifiedAt: new Date(),
      },
    });

    // Perform the check-in or check-out
    const now = new Date();
    const roundedDistance = Math.round(distance);

    if (qrSession.action === "CHECK_IN") {
      const existing = await findTodayAttendance(session!.user.id);

      if (existing) {
        return errorResponse("Already checked in", 400);
      }

      await db.attendance.create({
        data: {
          userId: session!.user.id,
          date: now,
          checkIn: now,
          status: "PRESENT",
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkInDistance: roundedDistance,
          checkInWifiSsid: wifiSsid || null,
          checkInWifiBssid: wifiBssid || null,
        },
      });
    } else {
      // CHECK_OUT
      const existing = await findTodayAttendance(session!.user.id);

      if (!existing) {
        return errorResponse("No check-in record found", 400);
      }

      await db.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: now,
          checkOutLatitude: latitude,
          checkOutLongitude: longitude,
          checkOutDistance: roundedDistance,
          checkOutWifiSsid: wifiSsid || null,
          checkOutWifiBssid: wifiBssid || null,
        },
      });
    }

    return successResponse({ success: true, action: qrSession.action });
  } catch (e) {
    console.error("QR_VERIFY_ERROR", e);
    return internalErrorResponse();
  }
}
