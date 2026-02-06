import { db } from "@/lib/db";
import {
  requireAdmin,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

// POST - Add a WiFi network to the active company location
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { ssid, bssid } = body;

    if (!ssid || typeof ssid !== "string") {
      return errorResponse("SSID is required", 400);
    }

    if (bssid && typeof bssid === "string") {
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
      if (!macRegex.test(bssid)) {
        return errorResponse("Invalid MAC address format", 400);
      }
    }

    // Get active company location
    const location = await db.companyLocation.findFirst({
      where: { isActive: true },
    });

    if (!location) {
      return errorResponse("Company location not set", 400);
    }

    // Create WiFi network
    const wifiNetwork = await db.registeredWifiNetwork.create({
      data: {
        companyLocationId: location.id,
        ssid,
        bssid: bssid ? bssid.toUpperCase() : null,
      },
    });

    return successResponse(wifiNetwork);
  } catch (e) {
    console.error("ADD_WIFI_ERROR", e);
    return internalErrorResponse();
  }
}
