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
 *
 * Uses watchPosition with progressive accuracy: keeps the best fix as the
 * GPS warms up, settles when accuracy ≤ 50m or when the soft (8s) /
 * hard (15s) deadlines elapse.
 *
 * @param onProgress - Optional callback fired on every accuracy update
 * @returns Promise with latitude, longitude and accuracy in meters
 * @throws {InsecureOriginError} When not using HTTPS or localhost
 * @throws {PermissionDeniedError} When user denies location permission
 * @throws {GeolocationPositionError} When location cannot be obtained
 */
export async function getCurrentLocation(
  onProgress?: (accuracy: number) => void,
): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  if (!isSecureLocationContext()) {
    throw new InsecureOriginError(
      "Geolocation API blocked: use HTTPS or localhost for location access",
    );
  }

  const permissionState = await getGeolocationPermissionState();
  if (permissionState === "denied") {
    throw new PermissionDeniedError(
      "Geolocation permission denied. Enable location access to continue.",
    );
  }

  const GOOD_ENOUGH_M = 50;
  const ACCEPTABLE_M = 100;
  const SOFT_TIMEOUT_MS = 8000;
  const HARD_TIMEOUT_MS = 15000;
  const CACHE_MAX_AGE_MS = 30_000;

  return new Promise((resolve, reject) => {
    let best: { latitude: number; longitude: number; accuracy: number } | null =
      null;
    let watchId: number | null = null;
    let softTimer: ReturnType<typeof setTimeout> | null = null;
    let hardTimer: ReturnType<typeof setTimeout> | null = null;
    let retried = false;
    let settled = false;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (softTimer) clearTimeout(softTimer);
      if (hardTimer) clearTimeout(hardTimer);
    };

    const finishOk = (fix: {
      latitude: number;
      longitude: number;
      accuracy: number;
    }) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(fix);
    };

    const finishErr = (err: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const start = (highAccuracy: boolean) => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const fix = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          if (onProgress) onProgress(fix.accuracy);
          if (!best || fix.accuracy < best.accuracy) best = fix;
          if (fix.accuracy <= GOOD_ENOUGH_M) finishOk(best);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            finishErr(error);
            return;
          }
          if (highAccuracy && !retried) {
            retried = true;
            start(false);
            return;
          }
          if (best) {
            finishOk(best);
            return;
          }
          finishErr(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          maximumAge: CACHE_MAX_AGE_MS,
          timeout: highAccuracy ? HARD_TIMEOUT_MS : SOFT_TIMEOUT_MS,
        },
      );
    };

    softTimer = setTimeout(() => {
      if (best && best.accuracy <= ACCEPTABLE_M) finishOk(best);
    }, SOFT_TIMEOUT_MS);

    hardTimer = setTimeout(() => {
      if (best) finishOk(best);
      else finishErr(new Error("Location request timed out"));
    }, HARD_TIMEOUT_MS);

    start(true);
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

// Error thrown when Geolocation API is blocked due to insecure context
export class InsecureOriginError extends Error {
  code = "INSECURE_ORIGIN" as const;

  constructor(message = "Geolocation requires a secure origin") {
    super(message);
    this.name = "InsecureOriginError";
  }
}

// Error thrown when geolocation permission is explicitly denied
export class PermissionDeniedError extends Error {
  code = "PERMISSION_DENIED" as const;

  constructor(message = "Geolocation permission denied") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

// Determine if current origin is allowed to use Geolocation
function isSecureLocationContext(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return true;

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

async function getGeolocationPermissionState(): Promise<
  PermissionState | "unknown"
> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }

  try {
    const status = await navigator.permissions.query({
      name: "geolocation",
    } as PermissionDescriptor);
    return status.state;
  } catch {
    return "unknown";
  }
}
