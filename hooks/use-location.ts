"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

/**
 * High-precision geolocation hook with progressive accuracy, automatic
 * fallback, and optional server-side validation.
 *
 * Strategy:
 *  1. Pre-check Permissions API to fail fast on denied state.
 *  2. Use watchPosition (high accuracy) and accumulate the best fix.
 *  3. Settle as soon as accuracy is "good enough" or stalled.
 *  4. Soft timeout accepts ≤ ACCEPTABLE_M; hard timeout returns best-effort.
 *  5. On TIMEOUT/UNAVAILABLE, retry once with enableHighAccuracy:false
 *     (network-based positioning) which usually succeeds indoors.
 */

// --- Tunables --------------------------------------------------------------

/** Accuracy that immediately ends the watch. */
const ACCURACY_GOOD_ENOUGH_M = 50;
/** Accuracy that satisfies the soft timeout. */
const ACCURACY_ACCEPTABLE_M = 100;
/** Accuracy treated as a warning rather than an error. */
const ACCURACY_WARNING_M = 500;
/** First deadline – if we already have ≤ ACCEPTABLE_M, settle. */
const SOFT_TIMEOUT_MS = 8000;
/** Final deadline – settle with whatever we have. */
const HARD_TIMEOUT_MS = 15000;
/** Without improvement for this long, stop watching. */
const STALL_WINDOW_MS = 2000;
/** Improvement smaller than this fraction is not "improvement". */
const STALL_IMPROVEMENT_RATIO = 0.05;
/** Browser may reuse a cached position no older than this for fast restart. */
const CACHE_MAX_AGE_MS = 30_000;
/** Fresh-fetch threshold – callers can request a guaranteed-recent fix. */
const DEFAULT_FRESH_AGE_MS = 60_000;

// --- Types -----------------------------------------------------------------

interface LocationValidation {
  isWithinRadius: boolean;
  distance: number;
  allowedRadius: number;
}

interface PositionFix {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseLocationOptions {
  /** Whether location validation is enabled. */
  enabled?: boolean;
  /** Whether to validate against company location server-side. */
  validateOnServer?: boolean;
  /** Whether to fetch automatically on mount. */
  autoFetch?: boolean;
}

interface UseLocationReturn {
  loading: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error: string | null;
  warning: string | null;
  validating: boolean;
  validation: LocationValidation | null;
  /** Re-fetch location and validate. */
  refresh: () => Promise<void>;
  /** Synchronous read of last fix (no awaiting). */
  getLocationData: () => { latitude: number; longitude: number } | null;
  /**
   * Returns a guaranteed-recent fix. If the cached fix is older than
   * `maxAgeMs` (default 60s) it triggers a refresh and awaits it.
   */
  getFreshLocation: (maxAgeMs?: number) => Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>;
}

// --- Helpers ---------------------------------------------------------------

function isSecureLocationContext(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

async function queryGeolocationPermission(): Promise<
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

// --- Hook ------------------------------------------------------------------

export function useLocation(
  options: UseLocationOptions = {},
): UseLocationReturn {
  const { enabled = true, validateOnServer = true, autoFetch = true } = options;

  // Resolve insecure-origin synchronously to avoid post-mount flash.
  const insecureOnInit =
    typeof window !== "undefined" && !isSecureLocationContext();

  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(
    insecureOnInit ? "INSECURE_ORIGIN" : null,
  );
  const [warning, setWarning] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<LocationValidation | null>(null);

  // Imperative state we don't want to trigger renders for.
  const watchIdRef = useRef<number | null>(null);
  const softTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bestFixRef = useRef<PositionFix | null>(null);
  const lastImprovementAtRef = useRef<number>(0);
  const retriedWithoutHighAccuracyRef = useRef<boolean>(false);
  // Promise queue so concurrent getFreshLocation()/refresh() share one fetch.
  const inflightRef = useRef<Promise<PositionFix | null> | null>(null);
  const inflightResolveRef = useRef<((fix: PositionFix | null) => void) | null>(
    null,
  );

  const clearTimers = () => {
    if (softTimerRef.current) {
      clearTimeout(softTimerRef.current);
      softTimerRef.current = null;
    }
    if (hardTimerRef.current) {
      clearTimeout(hardTimerRef.current);
      hardTimerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const stopWatch = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const resolveInflight = (fix: PositionFix | null) => {
    const resolve = inflightResolveRef.current;
    inflightResolveRef.current = null;
    inflightRef.current = null;
    if (resolve) resolve(fix);
  };

  const teardown = () => {
    stopWatch();
    clearTimers();
    // Resolving null on teardown prevents inflight promise leaks if the
    // component unmounts mid-fetch (e.g. during the permission query).
    resolveInflight(null);
  };

  const settleSuccess = useCallback(
    (fix: PositionFix, warningMsg: string | null = null) => {
      teardown();
      setLatitude(fix.latitude);
      setLongitude(fix.longitude);
      setAccuracy(fix.accuracy);
      setTimestamp(fix.timestamp);
      setError(null);
      setWarning(warningMsg);
      setLoading(false);
      resolveInflight(fix);
    },
    // teardown/resolveInflight only touch refs and never change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const settleFailure = useCallback((errCode: string) => {
    teardown();
    setError(errCode);
    setWarning(null);
    setLoading(false);
    resolveInflight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const armStallTimer = () => {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => {
      const best = bestFixRef.current;
      if (best && best.accuracy <= ACCURACY_ACCEPTABLE_M) {
        settleSuccess(best);
      }
    }, STALL_WINDOW_MS);
  };

  /**
   * Replace the active watchPosition handler. Used both for the initial
   * high-accuracy attempt and the low-accuracy retry. Timers are owned by
   * fetchLocation, not by this function — so retries do not extend the
   * overall HARD_TIMEOUT_MS budget.
   */
  const startWatching = useCallback(
    (highAccuracy: boolean) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        settleFailure("UNSUPPORTED");
        return;
      }
      if (!isSecureLocationContext()) {
        settleFailure("INSECURE_ORIGIN");
        return;
      }

      stopWatch();

      const positionOptions: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        maximumAge: CACHE_MAX_AGE_MS,
        timeout: highAccuracy ? HARD_TIMEOUT_MS : SOFT_TIMEOUT_MS,
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const fix: PositionFix = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp ?? Date.now(),
          };

          setAccuracy(fix.accuracy);

          const previousBest = bestFixRef.current;
          const isImprovement =
            !previousBest ||
            fix.accuracy <
              previousBest.accuracy * (1 - STALL_IMPROVEMENT_RATIO);
          if (!previousBest || fix.accuracy < previousBest.accuracy) {
            bestFixRef.current = fix;
          }
          if (isImprovement) {
            lastImprovementAtRef.current = Date.now();
            armStallTimer();
          }

          if (fix.accuracy <= ACCURACY_GOOD_ENOUGH_M) {
            settleSuccess(bestFixRef.current ?? fix);
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            settleFailure("PERMISSION_DENIED");
            return;
          }
          if (highAccuracy && !retriedWithoutHighAccuracyRef.current) {
            retriedWithoutHighAccuracyRef.current = true;
            startWatching(false);
            return;
          }
          const best = bestFixRef.current;
          if (best && best.accuracy <= ACCURACY_WARNING_M) {
            settleSuccess(
              best,
              `정확도가 다소 낮습니다 (오차 ${Math.round(best.accuracy)}m).`,
            );
            return;
          }
          settleFailure(
            err.code === err.TIMEOUT ? "TIMEOUT" : "POSITION_UNAVAILABLE",
          );
        },
        positionOptions,
      );
    },
    // armStallTimer is a stable closure over refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settleSuccess, settleFailure],
  );

  /** Soft-deadline handler – accept ≤ 100m as success. */
  const onSoftDeadline = useCallback(() => {
    const best = bestFixRef.current;
    if (best && best.accuracy <= ACCURACY_ACCEPTABLE_M) {
      settleSuccess(best);
    }
  }, [settleSuccess]);

  /** Hard-deadline handler – return best-effort or fail. */
  const onHardDeadline = useCallback(() => {
    const best = bestFixRef.current;
    if (!best) {
      if (!retriedWithoutHighAccuracyRef.current) {
        retriedWithoutHighAccuracyRef.current = true;
        startWatching(false);
        // Give the low-accuracy attempt a short residual window.
        hardTimerRef.current = setTimeout(() => {
          const b = bestFixRef.current;
          if (b) settleSuccess(b);
          else settleFailure("TIMEOUT");
        }, SOFT_TIMEOUT_MS);
        return;
      }
      settleFailure("TIMEOUT");
      return;
    }
    if (best.accuracy > ACCURACY_WARNING_M) {
      settleFailure("LOW_ACCURACY");
      return;
    }
    settleSuccess(
      best,
      best.accuracy > ACCURACY_ACCEPTABLE_M
        ? `정확도가 다소 낮습니다 (오차 ${Math.round(best.accuracy)}m). 100m 이내 정확도를 확보하지 못해 가장 최선의 값을 반환합니다.`
        : null,
    );
  }, [settleSuccess, settleFailure, startWatching]);

  const fetchLocation = useCallback(async (): Promise<PositionFix | null> => {
    if (inflightRef.current) return inflightRef.current;

    setLoading(true);
    setError(null);
    setWarning(null);
    bestFixRef.current = null;
    lastImprovementAtRef.current = 0;
    retriedWithoutHighAccuracyRef.current = false;
    clearTimers();

    const promise = new Promise<PositionFix | null>((resolve) => {
      inflightResolveRef.current = resolve;
    });
    inflightRef.current = promise;

    const permission = await queryGeolocationPermission();
    // teardown() during the await above resolves the inflight promise to null
    // and nulls the resolver. Detect that and bail out cleanly.
    if (inflightResolveRef.current === null) return promise;
    if (permission === "denied") {
      settleFailure("PERMISSION_DENIED");
      return promise;
    }

    // Arm timers exactly once for the whole fetch — retries reuse this budget.
    softTimerRef.current = setTimeout(onSoftDeadline, SOFT_TIMEOUT_MS);
    hardTimerRef.current = setTimeout(onHardDeadline, HARD_TIMEOUT_MS);

    startWatching(true);
    return promise;
  }, [startWatching, settleFailure, onSoftDeadline, onHardDeadline]);

  const validateLocationServer = useCallback(
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

  // Auto-fetch on mount (one-shot guard via ref to avoid loops).
  const didAutoFetchRef = useRef(false);
  useEffect(() => {
    if (
      !enabled ||
      !autoFetch ||
      didAutoFetchRef.current ||
      error === "INSECURE_ORIGIN"
    ) {
      return;
    }
    didAutoFetchRef.current = true;
    fetchLocation();
  }, [enabled, autoFetch, error, fetchLocation]);

  // Validate whenever a fresh fix arrives.
  useEffect(() => {
    if (!enabled || loading || error) return;
    if (latitude === null || longitude === null) return;
    validateLocationServer(latitude, longitude);
  }, [enabled, loading, error, latitude, longitude, validateLocationServer]);

  // Tear down on unmount. teardown only touches refs, never re-created.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => teardown(), []);

  const refresh = useCallback(async () => {
    await fetchLocation();
  }, [fetchLocation]);

  const getLocationData = useCallback(() => {
    if (latitude === null || longitude === null) return null;
    return { latitude, longitude };
  }, [latitude, longitude]);

  const getFreshLocation = useCallback(
    async (maxAgeMs: number = DEFAULT_FRESH_AGE_MS) => {
      if (
        timestamp !== null &&
        latitude !== null &&
        longitude !== null &&
        accuracy !== null &&
        Date.now() - timestamp <= maxAgeMs
      ) {
        return { latitude, longitude, accuracy };
      }
      const fix = await fetchLocation();
      if (!fix) return null;
      return {
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracy: fix.accuracy,
      };
    },
    [timestamp, latitude, longitude, accuracy, fetchLocation],
  );

  return {
    loading,
    latitude,
    longitude,
    accuracy,
    timestamp,
    error,
    warning,
    validating,
    validation,
    refresh,
    getLocationData,
    getFreshLocation,
  };
}
