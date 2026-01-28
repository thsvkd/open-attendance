"use client";

import { useState, useCallback, useRef } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// Error codes for localization
export type LocationErrorCode =
  | "GEOLOCATION_NOT_SUPPORTED"
  | "LOCATION_TOO_INACCURATE";

// Warning codes for localization
export type LocationWarningCode = "LOCATION_ACCURACY_LOW";

interface LocationState extends LocationData {
  error: string | null;
  errorCode: LocationErrorCode | null;
  errorAccuracy: number | null; // Accuracy value when error occurred
  warning: string | null;
  warningCode: LocationWarningCode | null;
  warningAccuracy: number | null; // Accuracy value when warning occurred
  loading: boolean;
}

/**
 * Hook for obtaining high-precision location using watchPosition API
 *
 * Features:
 * - Uses watchPosition to continuously monitor for better accuracy
 * - Returns immediately when accuracy is within 100m
 * - 5-second timeout with best available location
 * - Provides warnings for 100m-500m accuracy
 * - Provides errors for >500m or no location data
 *
 * @returns Location state and getPreciseLocation function
 *
 * @example
 * ```tsx
 * const { latitude, longitude, accuracy, error, warning, loading, getPreciseLocation } = usePreciseLocation();
 *
 * <button onClick={getPreciseLocation} disabled={loading}>
 *   {loading ? 'Getting location...' : 'Get Location'}
 * </button>
 *
 * {warning && <div className="warning">{warning}</div>}
 * {error && <div className="error">{error}</div>}
 * ```
 */
export const usePreciseLocation = () => {
  const [state, setState] = useState<LocationState>({
    latitude: 0,
    longitude: 0,
    accuracy: Infinity,
    error: null,
    errorCode: null,
    errorAccuracy: null,
    warning: null,
    warningCode: null,
    warningAccuracy: null,
    loading: false,
  });

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

  const getPreciseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        errorCode: "GEOLOCATION_NOT_SUPPORTED",
        errorAccuracy: null,
        loading: false,
      }));
      return;
    }

    // Reset state - clear error/warning when starting new location fetch
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
    }));
    bestCaptured.current = null;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000, // API internal timeout
    };

    // 1. Start watchPosition
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentData = { latitude, longitude, accuracy };

        // Store the best accuracy so far
        if (!bestCaptured.current || accuracy < bestCaptured.current.accuracy) {
          bestCaptured.current = currentData;
        }

        // [Condition 1] If accuracy is within 100m, return immediately
        if (accuracy <= 100) {
          clearResources();
          setState({
            ...currentData,
            error: null,
            errorCode: null,
            errorAccuracy: null,
            warning: null,
            warningCode: null,
            warningAccuracy: null,
            loading: false,
          });
        }
      },
      (error) => {
        console.error("GPS Error:", error);
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
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Location too inaccurate",
          errorCode: "LOCATION_TOO_INACCURATE",
          errorAccuracy: best?.accuracy ? Math.round(best.accuracy) : null,
        }));
      } else if (best.accuracy > 100) {
        // [Condition 2] Between 100m-500m (warning with result)
        setState({
          ...best,
          loading: false,
          error: null,
          errorCode: null,
          errorAccuracy: null,
          warning: "Location accuracy low",
          warningCode: "LOCATION_ACCURACY_LOW",
          warningAccuracy: Math.round(best.accuracy),
        });
      }
    }, 5000); // 5-second timeout
  }, []);

  return { ...state, getPreciseLocation };
};
