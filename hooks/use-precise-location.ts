"use client";

import { useState, useCallback, useRef } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationState extends LocationData {
  error: string | null;
  warning: string | null;
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
    warning: null,
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
        error: "브라우저가 위치 정보를 지원하지 않습니다.",
        loading: false,
      }));
      return;
    }

    // Reset state
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      warning: null,
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
            warning: null,
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
          error: `위치 정보가 너무 부정확합니다 (오차 ${Math.round(best?.accuracy || 0)}m). 장소 이동 후 다시 시도해주세요.`,
        }));
      } else if (best.accuracy > 100) {
        // [Condition 2] Between 100m-500m (warning with result)
        setState({
          ...best,
          loading: false,
          error: null,
          warning: `정확도가 다소 낮습니다(오차 ${Math.round(best.accuracy)}m). 100m 이내 정확도를 확보하지 못해 가장 최선의 값을 반환합니다.`,
        });
      }
    }, 5000); // 5-second timeout
  }, []);

  return { ...state, getPreciseLocation };
};
