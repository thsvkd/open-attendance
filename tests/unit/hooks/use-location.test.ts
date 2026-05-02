import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLocation } from "@/hooks/use-location";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

type SuccessCb = (position: GeolocationPosition) => void;
type ErrorCb = (error: GeolocationPositionError) => void;

interface MockGeo {
  watchPosition: ReturnType<typeof vi.fn>;
  clearWatch: ReturnType<typeof vi.fn>;
}

const PERMISSION_DENIED_CODE = 1;
const POSITION_UNAVAILABLE_CODE = 2;
const TIMEOUT_CODE = 3;

function setupSecureContext(host = "localhost", isSecure = true) {
  Object.defineProperty(window, "isSecureContext", {
    value: isSecure,
    configurable: true,
    writable: true,
  });
  // happy-dom's location is read-only; replace just the hostname.
  Object.defineProperty(window.location, "hostname", {
    value: host,
    configurable: true,
    writable: true,
  });
}

function makePositionError(code: number): GeolocationPositionError {
  return {
    code,
    message: "mock",
    PERMISSION_DENIED: PERMISSION_DENIED_CODE,
    POSITION_UNAVAILABLE: POSITION_UNAVAILABLE_CODE,
    TIMEOUT: TIMEOUT_CODE,
  } as GeolocationPositionError;
}

function makePosition(
  latitude: number,
  longitude: number,
  accuracy: number,
): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition;
}

function installGeoMock(
  permissionState: PermissionState | "unknown" = "granted",
): MockGeo & {
  successFor: (call: number) => SuccessCb;
  errorFor: (call: number) => ErrorCb;
} {
  const watchPosition = vi.fn();
  const clearWatch = vi.fn();
  Object.defineProperty(navigator, "geolocation", {
    value: { watchPosition, clearWatch },
    writable: true,
    configurable: true,
  });

  if (permissionState === "unknown") {
    Object.defineProperty(navigator, "permissions", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(navigator, "permissions", {
      value: {
        query: vi.fn().mockResolvedValue({ state: permissionState }),
      },
      writable: true,
      configurable: true,
    });
  }

  return {
    watchPosition,
    clearWatch,
    successFor: (call: number) =>
      watchPosition.mock.calls[call][0] as SuccessCb,
    errorFor: (call: number) => watchPosition.mock.calls[call][1] as ErrorCb,
  };
}

describe("useLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSecureContext();
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { isWithinRadius: true, distance: 10, allowedRadius: 100 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with no location and not loading when autoFetch is false", () => {
    installGeoMock();
    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
  });

  it("settles immediately when accuracy is good enough (≤50m)", async () => {
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(captured).toBeDefined());

    act(() => captured!(makePosition(37.5665, 126.978, 30)));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.latitude).toBe(37.5665);
    expect(result.current.longitude).toBe(126.978);
    expect(result.current.accuracy).toBe(30);
    expect(result.current.error).toBeNull();
  });

  it("keeps the best fix across multiple watch callbacks", async () => {
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(captured).toBeDefined());

    act(() => captured!(makePosition(37.5, 127.0, 800))); // first crude fix
    act(() => captured!(makePosition(37.5665, 126.978, 25))); // GPS-good fix

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accuracy).toBe(25);
  });

  it("immediately surfaces PERMISSION_DENIED from the error callback", async () => {
    const geo = installGeoMock();
    let captureErr: ErrorCb | undefined;
    geo.watchPosition.mockImplementation((_success, error) => {
      captureErr = error;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(captureErr).toBeDefined());

    act(() => captureErr!(makePositionError(PERMISSION_DENIED_CODE)));

    await waitFor(() => expect(result.current.error).toBe("PERMISSION_DENIED"));
    expect(result.current.loading).toBe(false);
  });

  it("retries with low accuracy when high-accuracy errors with POSITION_UNAVAILABLE", async () => {
    const geo = installGeoMock();
    geo.watchPosition.mockImplementation(() => 1);

    renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(geo.watchPosition).toHaveBeenCalledTimes(1));

    const firstCallOptions = geo.watchPosition.mock
      .calls[0][2] as PositionOptions;
    expect(firstCallOptions.enableHighAccuracy).toBe(true);

    act(() => geo.errorFor(0)(makePositionError(POSITION_UNAVAILABLE_CODE)));

    await waitFor(() => expect(geo.watchPosition).toHaveBeenCalledTimes(2));

    const retryOptions = geo.watchPosition.mock.calls[1][2] as PositionOptions;
    expect(retryOptions.enableHighAccuracy).toBe(false);
  });

  it("detects insecure origin synchronously on mount", () => {
    setupSecureContext("example.com", false);
    installGeoMock();
    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );
    expect(result.current.error).toBe("INSECURE_ORIGIN");
  });

  it("treats localhost as secure even when isSecureContext is false", () => {
    setupSecureContext("localhost", false);
    installGeoMock();
    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );
    expect(result.current.error).not.toBe("INSECURE_ORIGIN");
  });

  it("getLocationData returns latest fix and null when none available", async () => {
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    expect(result.current.getLocationData()).toBeNull();

    await waitFor(() => expect(captured).toBeDefined());
    act(() => captured!(makePosition(37.5665, 126.978, 30)));

    await waitFor(() =>
      expect(result.current.getLocationData()).toEqual({
        latitude: 37.5665,
        longitude: 126.978,
      }),
    );
  });

  it("getFreshLocation returns the cached fix when within maxAge", async () => {
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(captured).toBeDefined());
    act(() => captured!(makePosition(37.5665, 126.978, 30)));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const before = geo.watchPosition.mock.calls.length;
    let fresh: {
      latitude: number;
      longitude: number;
      accuracy: number;
    } | null = null;
    await act(async () => {
      fresh = await result.current.getFreshLocation();
    });
    expect(fresh).toEqual({
      latitude: 37.5665,
      longitude: 126.978,
      accuracy: 30,
    });
    expect(geo.watchPosition.mock.calls.length).toBe(before);
  });

  it("getFreshLocation triggers a new watch when fix is stale", async () => {
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(captured).toBeDefined());
    act(() => captured!(makePosition(37.5665, 126.978, 30)));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const before = geo.watchPosition.mock.calls.length;
    // Force stale by requesting a 0ms-fresh fix.
    let pendingFresh: Promise<unknown> | undefined;
    act(() => {
      pendingFresh = result.current.getFreshLocation(0);
    });
    await waitFor(() =>
      expect(geo.watchPosition.mock.calls.length).toBe(before + 1),
    );
    // Resolve the new watch so the promise settles before unmount.
    const nextSuccess = geo.watchPosition.mock.calls[before][0] as SuccessCb;
    act(() => nextSuccess(makePosition(37.5665, 126.978, 20)));
    await pendingFresh;
  });

  it("does not validate against the server when validateOnServer is false", async () => {
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(captured).toBeDefined());
    act(() => captured!(makePosition(37.5665, 126.978, 30)));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("validates against the server when a fix is obtained", async () => {
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    renderHook(() =>
      useLocation({ enabled: true, validateOnServer: true, autoFetch: true }),
    );

    await waitFor(() => expect(captured).toBeDefined());
    act(() => captured!(makePosition(37.5665, 126.978, 30)));

    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/location/validate", {
        latitude: 37.5665,
        longitude: 126.978,
      }),
    );
  });

  it("aborts watch when permission is denied via Permissions API", async () => {
    const geo = installGeoMock("denied");

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    await waitFor(() => expect(result.current.error).toBe("PERMISSION_DENIED"));
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it("does not start a watch when origin is insecure on mount", async () => {
    setupSecureContext("example.com", false);
    const geo = installGeoMock();

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );
    // Give the auto-fetch effect a tick to run.
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current.error).toBe("INSECURE_ORIGIN");
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it("settles with warning at the hard deadline when accuracy is between 100m and 500m", async () => {
    vi.useFakeTimers();
    const geo = installGeoMock();
    let captured: SuccessCb | undefined;
    geo.watchPosition.mockImplementation((success) => {
      captured = success;
      return 1;
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    // Wait for the async permission query and the watch to register.
    await vi.waitFor(() => expect(captured).toBeDefined());

    act(() => captured!(makePosition(37.5665, 126.978, 250)));
    // Advance past the hard deadline (15s).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(result.current.latitude).toBe(37.5665);
    expect(result.current.accuracy).toBe(250);
    expect(result.current.warning).toMatch(/정확도가 다소 낮습니다/);
    vi.useRealTimers();
  });

  it("resolves the inflight promise to null when unmounted mid-fetch", async () => {
    const geo = installGeoMock();
    geo.watchPosition.mockImplementation(() => 1);

    const { result, unmount } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: false }),
    );

    let pending: Promise<unknown> | undefined;
    act(() => {
      pending = result.current.refresh();
    });
    unmount();
    await expect(pending).resolves.toBeUndefined();
  });
});
