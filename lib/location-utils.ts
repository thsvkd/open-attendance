/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get the current device location using the Geolocation API
 * @param options - Optional Geolocation position options
 * @returns Promise with latitude, longitude and accuracy
 */
export async function getCurrentLocation(options?: PositionOptions): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      },
    );
  });
}

/**
 * Get the best possible location by trying cached location first for speed,
 * then falling back to high accuracy if needed.
 */
export async function getBestLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  try {
    // Try to get a cached position first (within 1 minute)
    // This is much faster if the device has a recent fix
    const cached = await getCurrentLocation({
      enableHighAccuracy: false,
      maximumAge: 60000,
      timeout: 2000,
    });

    // If accuracy is good enough (under 100m), return it immediately
    if (cached.accuracy < 100) {
      return cached;
    }
  } catch (error) {
    // Fall through to high accuracy request
    console.debug("Cached location failed or was inaccurate:", error);
  }

  // Request fresh high accuracy location
  return getCurrentLocation({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 15000,
  });
}

/**
 * Check if location is within the allowed radius
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param companyLat - Company latitude
 * @param companyLon - Company longitude
 * @param radius - Allowed radius in meters
 * @returns Object with isWithinRadius and distance
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  companyLat: number,
  companyLon: number,
  radius: number,
): { isWithinRadius: boolean; distance: number } {
  const distance = calculateDistance(userLat, userLon, companyLat, companyLon);
  return {
    isWithinRadius: distance <= radius,
    distance: Math.round(distance),
  };
}

/**
 * Detect if the user is on a mobile device
 * @returns True if mobile, false otherwise
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}
