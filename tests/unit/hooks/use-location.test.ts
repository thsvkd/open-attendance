import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocation } from "@/hooks/use-location";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("useLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default window mock
    global.window = {
      isSecureContext: true,
      location: {
        hostname: "localhost",
      },
    } as unknown as Window & typeof globalThis;

    // Mock navigator.geolocation
    const mockGeolocation = {
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, "geolocation", {
      value: mockGeolocation,
      writable: true,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should return loading state when geolocation is loading", () => {
    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBe(null);
    expect(result.current.longitude).toBe(null);
  });

  it("should return location data when available", () => {
    let successCallback: ((position: GeolocationPosition) => void) | null =
      null;

    vi.mocked(navigator.geolocation.watchPosition).mockImplementation(
      (success) => {
        successCallback = success;
        return 1;
      },
    );

    mockedAxios.post.mockResolvedValue({
      data: {
        isWithinRadius: true,
        distance: 100,
        allowedRadius: 500,
      },
    });

    const { result, rerender } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: true, autoFetch: true }),
    );

    // Simulate location update within 100m accuracy (should return immediately)
    act(() => {
      successCallback?.({
        coords: {
          latitude: 37.5665,
          longitude: 126.978,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    expect(result.current.latitude).toBe(37.5665);
    expect(result.current.longitude).toBe(126.978);
    expect(result.current.accuracy).toBe(50);
    expect(result.current.loading).toBe(false);

    // Advance timers to allow validation to complete
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender();

    // Validation should have been called
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/location/validate", {
      latitude: 37.5665,
      longitude: 126.978,
    });
  });

  it("should handle permission denied error", () => {
    vi.mocked(navigator.geolocation.watchPosition).mockImplementation(() => 1);

    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );

    // Manually call refresh
    act(() => {
      result.current.refresh();
    });

    // Simulate geolocation timeout with no location data
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // After timeout, no location data triggers error state
    expect(result.current.error).toBeTruthy();
  });

  it("should handle position unavailable error", () => {
    vi.mocked(navigator.geolocation.watchPosition).mockImplementation(() => 1);

    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );

    // Manually call refresh
    act(() => {
      result.current.refresh();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.error).toBeTruthy();
  });

  it("should handle timeout error", () => {
    vi.mocked(navigator.geolocation.watchPosition).mockImplementation(() => 1);

    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );

    // Manually call refresh
    act(() => {
      result.current.refresh();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Timeout with no location should set error
    expect(result.current.error).toBeTruthy();
  });

  it("should detect insecure origin", () => {
    global.window = {
      isSecureContext: false,
      location: {
        hostname: "example.com",
      },
    } as unknown as Window & typeof globalThis;

    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );

    expect(result.current.error).toBe("INSECURE_ORIGIN");
  });

  it("should allow localhost in insecure context", () => {
    global.window = {
      isSecureContext: false,
      location: {
        hostname: "localhost",
      },
    } as unknown as Window & typeof globalThis;

    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );

    expect(result.current.error).not.toBe("INSECURE_ORIGIN");
  });

  it("should return location data via getLocationData", () => {
    let successCallback: ((position: GeolocationPosition) => void) | null =
      null;

    vi.mocked(navigator.geolocation.watchPosition).mockImplementation(
      (success) => {
        successCallback = success;
        return 1;
      },
    );

    const { result } = renderHook(() =>
      useLocation({
        enabled: true,
        validateOnServer: false,
        autoFetch: true,
      }),
    );

    act(() => {
      successCallback?.({
        coords: {
          latitude: 37.5665,
          longitude: 126.978,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    const locationData = result.current.getLocationData();
    expect(locationData).toEqual({
      latitude: 37.5665,
      longitude: 126.978,
    });
  });

  it("should return null from getLocationData when location is not available", () => {
    const { result } = renderHook(() =>
      useLocation({ enabled: true, autoFetch: false }),
    );

    const locationData = result.current.getLocationData();
    expect(locationData).toBe(null);
  });

  it("should not validate when disabled", () => {
    vi.mocked(navigator.geolocation.watchPosition).mockImplementation(() => 1);

    renderHook(() => useLocation({ enabled: false, autoFetch: false }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("should skip server validation when validateOnServer is false", () => {
    let successCallback: ((position: GeolocationPosition) => void) | null =
      null;

    vi.mocked(navigator.geolocation.watchPosition).mockImplementation(
      (success) => {
        successCallback = success;
        return 1;
      },
    );

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false, autoFetch: true }),
    );

    act(() => {
      successCallback?.({
        coords: {
          latitude: 37.5665,
          longitude: 126.978,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    expect(result.current.latitude).toBe(37.5665);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
