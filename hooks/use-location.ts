"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

/**
 * Custom hook for high-precision geolocation with server validation
 *
 * Features:
 * - High-precision location using watchPosition API
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

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
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
  /** Warning message for sub-optimal accuracy */
  warning: string | null;
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

  // Location state
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(Infinity);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<LocationValidation | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);

  // Refs for cleanup
  const watchId = useRef<number | null>(null);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const bestCaptured = useRef<LocationData | null>(null);

  const clearResources = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    if (timerId.current !== null) {
      clearTimeout(timerId.current);
    }
    watchId.current = null;
    timerId.current = null;
  };

  /**
   * Get precise location using watchPosition API with 5-second timeout
   */
  const getPreciseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("브라우저가 위치 정보를 지원하지 않습니다.");
      setLoading(false);
      return;
    }

    // Reset state
    setLoading(true);
    setError(null);
    setWarning(null);
    bestCaptured.current = null;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000, // API internal timeout
    };

    // 1. Start watchPosition
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const {
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        } = position.coords;
        const currentData = { latitude: lat, longitude: lng, accuracy: acc };

        // Store the best accuracy so far
        if (!bestCaptured.current || acc < bestCaptured.current.accuracy) {
          bestCaptured.current = currentData;
        }

        // [Condition 1] If accuracy is within 100m, return immediately
        if (acc <= 100) {
          clearResources();
          setLatitude(lat);
          setLongitude(lng);
          setAccuracy(acc);
          setError(null);
          setWarning(null);
          setLoading(false);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        // Don't immediately fail - wait for timeout to handle the error
      },
      options,
    );

    // 2. Set 5-second forced timeout
    timerId.current = setTimeout(() => {
      clearResources(); // Stop watching after 5 seconds

      const best = bestCaptured.current;

      if (!best || best.accuracy > 500) {
        // [Condition 3] Accuracy worse than 500m or no data (critical error)
        setLoading(false);
        setError(
          `위치 정보가 너무 부정확합니다 (오차 ${Math.round(best?.accuracy || 0)}m). 장소 이동 후 다시 시도해주세요.`,
        );
      } else if (best.accuracy > 100) {
        // [Condition 2] Between 100m-500m (warning with result)
        setLatitude(best.latitude);
        setLongitude(best.longitude);
        setAccuracy(best.accuracy);
        setLoading(false);
        setError(null);
        setWarning(
          `정확도가 다소 낮습니다(오차 ${Math.round(best.accuracy)}m). 100m 이내 정확도를 확보하지 못해 가장 최선의 값을 반환합니다.`,
        );
      }
    }, 5000); // 5-second timeout
  }, []);

  /**
   * Validate location against company location on the server
   */
  const validateLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!validateOnServer) return;

      setValidating(true);

      try {
        const res = await axios.post("/api/location/validate", {
          latitude: lat,
          longitude: lng,
        });
        setValidation(res.data);
      } catch (err) {
        console.error("Location validation error:", err);
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
        setError("INSECURE_ORIGIN");
      }
    }
  }, []);

  // Automatically fetch location on mount if autoFetch is enabled
  useEffect(() => {
    if (enabled && autoFetch && !loading && latitude === 0) {
      getPreciseLocation();
    }
  }, [enabled, autoFetch, loading, latitude, getPreciseLocation]);

  // Validate location when position is successfully obtained
  useEffect(() => {
    if (!enabled || loading || error) return;
    if (latitude === 0 || longitude === 0) return;

    setTimestamp(Date.now());
    validateLocation(latitude, longitude);
  }, [enabled, loading, error, latitude, longitude, validateLocation]);

  /**
   * Refresh location
   */
  const refresh = useCallback(async () => {
    setError(null);
    getPreciseLocation();
  }, [getPreciseLocation]);

  /**
   * Get current location data for API calls
   */
  const getLocationData = useCallback(() => {
    if (
      latitude === 0 ||
      longitude === 0 ||
      latitude === null ||
      longitude === null
    ) {
      return null;
    }
    return {
      latitude,
      longitude,
    };
  }, [latitude, longitude]);

  return {
    loading,
    latitude: latitude === 0 ? null : latitude,
    longitude: longitude === 0 ? null : longitude,
    accuracy: accuracy === Infinity ? null : accuracy,
    timestamp,
    error,
    warning,
    validating,
    validation,
    refresh,
    getLocationData,
  };
}
