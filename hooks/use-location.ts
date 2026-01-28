"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  usePreciseLocation,
  LocationErrorCode,
  LocationWarningCode,
} from "./use-precise-location";

/**
 * Custom hook for high-precision geolocation with server validation
 *
 * Features:
 * - High-precision location using watchPosition API (via usePreciseLocation)
 * - 5-second timeout with best available location
 * - Server-side location validation against company location
 * - Error handling for permission denied, insecure context, etc.
 * - Warning system for accuracy thresholds (100m, 500m)
 * - Manual refresh functionality
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
  /** Whether to automatically fetch location on mount */
  autoFetch?: boolean;
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
  /** Error code for localization (from usePreciseLocation or custom) */
  errorCode: LocationErrorCode | "INSECURE_ORIGIN" | null;
  /** Accuracy value when error occurred */
  errorAccuracy: number | null;
  /** Warning message for sub-optimal accuracy */
  warning: string | null;
  /** Warning code for localization */
  warningCode: LocationWarningCode | null;
  /** Accuracy value when warning occurred */
  warningAccuracy: number | null;
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
 *   accuracy,
 *   error,
 *   warning,
 *   validation,
 *   refresh,
 *   getLocationData
 * } = useLocation({ enabled: true, validateOnServer: true, autoFetch: true });
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
  const { enabled = true, validateOnServer = true, autoFetch = true } = options;

  // Use the new usePreciseLocation hook for high-precision location
  const preciseLocation = usePreciseLocation();

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<LocationValidation | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  /**
   * Validate location against company location on the server
   */
  const validateLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!validateOnServer) return;

      setValidating(true);

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

  // Automatically fetch location on mount if autoFetch is enabled
  useEffect(() => {
    if (
      enabled &&
      autoFetch &&
      !preciseLocation.loading &&
      preciseLocation.latitude === 0
    ) {
      preciseLocation.getPreciseLocation();
    }
  }, [enabled, autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate location when position is successfully obtained
  useEffect(() => {
    if (!enabled || preciseLocation.loading || preciseLocation.error) return;
    if (preciseLocation.latitude === 0 || preciseLocation.longitude === 0)
      return;

    setTimestamp(Date.now());
    validateLocation(preciseLocation.latitude, preciseLocation.longitude);
  }, [
    enabled,
    preciseLocation.loading,
    preciseLocation.error,
    preciseLocation.latitude,
    preciseLocation.longitude,
    validateLocation,
  ]);

  /**
   * Refresh location by calling getPreciseLocation again
   */
  const refresh = useCallback(async () => {
    setCustomError(null);
    preciseLocation.getPreciseLocation();
  }, [preciseLocation]);

  /**
   * Get current location data for API calls
   */
  const getLocationData = useCallback(() => {
    if (
      preciseLocation.latitude === 0 ||
      preciseLocation.longitude === 0 ||
      preciseLocation.latitude === null ||
      preciseLocation.longitude === null
    ) {
      return null;
    }
    return {
      latitude: preciseLocation.latitude,
      longitude: preciseLocation.longitude,
    };
  }, [preciseLocation.latitude, preciseLocation.longitude]);

  // Determine the error to display (custom error takes precedence)
  const displayError = customError || preciseLocation.error;
  // Determine the error code (custom error code takes precedence)
  const displayErrorCode: LocationErrorCode | "INSECURE_ORIGIN" | null =
    customError ? "INSECURE_ORIGIN" : preciseLocation.errorCode;

  return {
    loading: preciseLocation.loading,
    latitude: preciseLocation.latitude === 0 ? null : preciseLocation.latitude,
    longitude:
      preciseLocation.longitude === 0 ? null : preciseLocation.longitude,
    accuracy:
      preciseLocation.accuracy === Infinity ? null : preciseLocation.accuracy,
    timestamp,
    error: displayError,
    errorCode: displayErrorCode,
    errorAccuracy: preciseLocation.errorAccuracy,
    warning: preciseLocation.warning,
    warningCode: preciseLocation.warningCode,
    warningAccuracy: preciseLocation.warningAccuracy,
    validating,
    validation,
    refresh,
    getLocationData,
  };
}
