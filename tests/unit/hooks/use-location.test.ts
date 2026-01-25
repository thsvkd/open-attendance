import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLocation } from "@/hooks/use-location";
import axios from "axios";

// Mock @uidotdev/usehooks
vi.mock("@uidotdev/usehooks", () => ({
  useGeolocation: vi.fn(),
}));

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Import the mocked useGeolocation
import { useGeolocation } from "@uidotdev/usehooks";
const mockedUseGeolocation = vi.mocked(useGeolocation);

describe("useLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default window mock
    global.window = {
      isSecureContext: true,
      location: {
        hostname: "localhost",
      },
    } as unknown as Window & typeof globalThis;
  });

  it("should return loading state when geolocation is loading", () => {
    mockedUseGeolocation.mockReturnValue({
      loading: true,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
      timestamp: null,
      error: null,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.loading).toBe(true);
    expect(result.current.latitude).toBe(null);
    expect(result.current.longitude).toBe(null);
  });

  it("should return location data when available", async () => {
    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: 50,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: 37.5665,
      longitude: 126.978,
      speed: null,
      timestamp: Date.now(),
      error: null,
    });

    mockedAxios.post.mockResolvedValue({
      data: {
        isWithinRadius: true,
        distance: 100,
        allowedRadius: 500,
      },
    });

    const { result, rerender } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: true }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBe(37.5665);
    expect(result.current.longitude).toBe(126.978);
    expect(result.current.accuracy).toBe(50);

    // Wait for validation to complete
    await vi.waitFor(
      () => {
        rerender();
        expect(result.current.validation).not.toBe(null);
      },
      { timeout: 1000 },
    );

    expect(result.current.validation?.isWithinRadius).toBe(true);
  });

  it("should handle permission denied error", () => {
    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
      timestamp: null,
      error: {
        code: 1, // PERMISSION_DENIED
        message: "User denied geolocation",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.error).toBe("PERMISSION_DENIED");
  });

  it("should handle position unavailable error", () => {
    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
      timestamp: null,
      error: {
        code: 2, // POSITION_UNAVAILABLE
        message: "Position unavailable",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.error).toBe("POSITION_UNAVAILABLE");
  });

  it("should handle timeout error", () => {
    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
      timestamp: null,
      error: {
        code: 3, // TIMEOUT
        message: "Timeout",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.error).toBe("TIMEOUT");
  });

  it("should detect insecure origin", () => {
    global.window = {
      isSecureContext: false,
      location: {
        hostname: "example.com",
      },
    } as unknown as Window & typeof globalThis;

    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
      timestamp: null,
      error: null,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.error).toBe("INSECURE_ORIGIN");
  });

  it("should allow localhost in insecure context", () => {
    global.window = {
      isSecureContext: false,
      location: {
        hostname: "localhost",
      },
    } as unknown as Window & typeof globalThis;

    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: 50,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: 37.5665,
      longitude: 126.978,
      speed: null,
      timestamp: Date.now(),
      error: null,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    // Should not have insecure origin error
    expect(result.current.error).not.toBe("INSECURE_ORIGIN");
  });

  it("should return location data via getLocationData", () => {
    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: 50,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: 37.5665,
      longitude: 126.978,
      speed: null,
      timestamp: Date.now(),
      error: null,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    const locationData = result.current.getLocationData();
    expect(locationData).toEqual({
      latitude: 37.5665,
      longitude: 126.978,
    });
  });

  it("should return null from getLocationData when location is not available", () => {
    mockedUseGeolocation.mockReturnValue({
      loading: true,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
      timestamp: null,
      error: null,
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    const locationData = result.current.getLocationData();
    expect(locationData).toBe(null);
  });

  it("should not validate when disabled", async () => {
    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: 50,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: 37.5665,
      longitude: 126.978,
      speed: null,
      timestamp: Date.now(),
      error: null,
    });

    renderHook(() => useLocation({ enabled: false }));

    // Wait a tick to ensure no validation call is made
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("should skip server validation when validateOnServer is false", async () => {
    mockedUseGeolocation.mockReturnValue({
      loading: false,
      accuracy: 50,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: 37.5665,
      longitude: 126.978,
      speed: null,
      timestamp: Date.now(),
      error: null,
    });

    renderHook(() => useLocation({ enabled: true, validateOnServer: false }));

    // Wait a tick to ensure no validation call is made
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
