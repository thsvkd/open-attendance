import { db } from "@/lib/db";
import {
  requireAuth,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import { calculateDistance } from "@/lib/location-utils";

// POST - Validate if user's location is within allowed radius
export async function POST(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { latitude, longitude, wifiSsid, wifiBssid } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return errorResponse("Invalid location data", 400);
    }

    // Get active company location
    const companyLocation = await db.companyLocation.findFirst({
      where: { isActive: true },
      include: {
        registeredWifiNetworks: true,
      },
    });

    if (!companyLocation) {
      return errorResponse("Company location not configured", 400);
    }

    // Calculate distance
    const distance = calculateDistance(
      latitude,
      longitude,
      companyLocation.latitude,
      companyLocation.longitude,
    );

    const isWithinRadius = distance <= companyLocation.radius;

    // Check WiFi if provided
    let isWifiValid = false;
    if (wifiSsid && companyLocation.registeredWifiNetworks.length > 0) {
      isWifiValid = companyLocation.registeredWifiNetworks.some((wifi) => {
        if (wifiBssid && wifi.bssid) {
          return wifi.ssid === wifiSsid && wifi.bssid === wifiBssid;
        }
        return wifi.ssid === wifiSsid;
      });
    }

    return successResponse({
      isWithinRadius,
      distance: Math.round(distance),
      isWifiValid,
      allowedRadius: companyLocation.radius,
    });
  } catch (e) {
    console.error("VALIDATE_LOCATION_ERROR", e);
    return internalErrorResponse();
  }
}
