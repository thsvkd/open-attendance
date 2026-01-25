"use client";

import { useGeolocation } from "@uidotdev/usehooks";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

/**
 * Custom hook that wraps @uidotdev/usehooks' useGeolocation
 * with additional location validation functionality.
 *
 * Features:
 * - Automatic geolocation tracking using browser API
 * - Server-side location validation against company location
 * - Error handling for permission denied, insecure context, etc.
 * - Retry functionality to re-fetch location
 */

interface LocationValidation {
  isWithinRadius: boolean;
  distance: number;
  allowedRadius: number;
}

interface UseLocationOptions {
  /** Whether location validation is enabled (company location is configured) */
  enabled?: boolean;
  /** Whether to validate location against company location on the server */
  validateOnServer?: boolean;
}

interface UseLocationReturn {
  /** Whether location is currently being fetched */
  loading: boolean;
  /** Current latitude */
  latitude: number | null;
  /** Current longitude */
  longitude: number | null;
  /** Accuracy of the location in meters */
  accuracy: number | null;
  /** Timestamp when location was last updated */
  timestamp: number | null;
  /** Error message if location fetch failed */
  error: string | null;
  /** Whether validation against company location is in progress */
  validating: boolean;
  /** Result of server-side location validation */
  validation: LocationValidation | null;
  /** Re-fetch location and validate */
  refresh: () => Promise<void>;
  /** Get current location data for API calls */
  getLocationData: () => { latitude: number; longitude: number } | null;
}

/**
 * Hook for managing geolocation with server-side validation
 *
 * @param options - Configuration options
 * @returns Location state and utilities
 *
 * @example
 * ```tsx
 * const {
 *   loading,
 *   latitude,
 *   longitude,
 *   error,
 *   validation,
 *   refresh,
 *   getLocationData
 * } = useLocation({ enabled: true, validateOnServer: true });
 *
 * // Check if user is within allowed radius
 * if (validation?.isWithinRadius) {
 *   // Allow check-in
 * }
 * ```
 */
export function useLocation(
  options: UseLocationOptions = {},
): UseLocationReturn {
  const { enabled = true, validateOnServer = true } = options;

  // Use @uidotdev/usehooks' useGeolocation for automatic position tracking
  const geoState = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<LocationValidation | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  /**
   * Converts geolocation errors to user-friendly messages
   */
  const getErrorMessage = useCallback(
    (error: GeolocationPositionError | null): string | null => {
      if (!error) return null;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          return "PERMISSION_DENIED";
        case error.POSITION_UNAVAILABLE:
          return "POSITION_UNAVAILABLE";
        case error.TIMEOUT:
          return "TIMEOUT";
        default:
          return "UNKNOWN_ERROR";
      }
    },
    [],
  );

  /**
   * Validate location against company location on the server
   */
  const validateLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!validateOnServer) return;

      setValidating(true);
      setCustomError(null);

      try {
        const res = await axios.post("/api/location/validate", {
          latitude,
          longitude,
        });
        setValidation(res.data);
      } catch (error) {
        console.error("Location validation error:", error);
        setValidation(null);
      } finally {
        setValidating(false);
      }
    },
    [validateOnServer],
  );

  // Check for secure context on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSecure =
        window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "[::1]";

      if (!isSecure) {
        setCustomError("INSECURE_ORIGIN");
      }
    }
  }, []);

  // Validate location when position changes
  useEffect(() => {
    if (!enabled || geoState.loading || geoState.error) return;
    if (geoState.latitude === null || geoState.longitude === null) return;

    validateLocation(geoState.latitude, geoState.longitude);
  }, [
    enabled,
    geoState.loading,
    geoState.error,
    geoState.latitude,
    geoState.longitude,
    validateLocation,
  ]);

  /**
   * Refresh location by reloading the page
   * (useGeolocation from @uidotdev/usehooks uses watchPosition internally,
   * so we can trigger a re-validation by calling validateLocation directly)
   */
  const refresh = useCallback(async () => {
    if (geoState.latitude !== null && geoState.longitude !== null) {
      await validateLocation(geoState.latitude, geoState.longitude);
    }
  }, [geoState.latitude, geoState.longitude, validateLocation]);

  /**
   * Get current location data for API calls
   */
  const getLocationData = useCallback(() => {
    if (geoState.latitude === null || geoState.longitude === null) {
      return null;
    }
    return {
      latitude: geoState.latitude,
      longitude: geoState.longitude,
    };
  }, [geoState.latitude, geoState.longitude]);

  // Determine the error to display
  const displayError = customError || getErrorMessage(geoState.error);

  return {
    loading: geoState.loading,
    latitude: geoState.latitude,
    longitude: geoState.longitude,
    accuracy: geoState.accuracy,
    timestamp: geoState.timestamp,
    error: displayError,
    validating,
    validation,
    refresh,
    getLocationData,
  };
}
