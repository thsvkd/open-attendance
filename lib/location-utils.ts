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
 * @returns Promise with latitude and longitude
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
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
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}
