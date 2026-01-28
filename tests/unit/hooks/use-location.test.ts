import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocation } from "@/hooks/use-location";
import axios from "axios";

// Mock usePreciseLocation hook
vi.mock("@/hooks/use-precise-location", () => ({
  usePreciseLocation: vi.fn(),
}));

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Import the mocked usePreciseLocation
import { usePreciseLocation } from "@/hooks/use-precise-location";
const mockedUsePreciseLocation = vi.mocked(usePreciseLocation);

// Helper function to wait for async updates
const waitForNextUpdate = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

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

    // Default mock for usePreciseLocation
    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 0,
      longitude: 0,
      accuracy: Infinity,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });
  });

  it("should return loading state when geolocation is loading", () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: true,
      latitude: 0,
      longitude: 0,
      accuracy: Infinity,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.loading).toBe(true);
    expect(result.current.latitude).toBe(null);
    expect(result.current.longitude).toBe(null);
  });

  it("should return location data when available", async () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 37.5665,
      longitude: 126.978,
      accuracy: 50,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    mockedAxios.post.mockResolvedValue({
      data: {
        isWithinRadius: true,
        distance: 100,
        allowedRadius: 500,
      },
    });

    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: true }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBe(37.5665);
    expect(result.current.longitude).toBe(126.978);
    expect(result.current.accuracy).toBe(50);

    // Wait for validation to complete using act
    await waitForNextUpdate();

    expect(result.current.validation?.isWithinRadius).toBe(true);
  });

  it("should handle location too inaccurate error", () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 0,
      longitude: 0,
      accuracy: Infinity,
      error: "Location too inaccurate",
      errorCode: "LOCATION_TOO_INACCURATE",
      errorAccuracy: 600,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.error).toBe("Location too inaccurate");
  });

  it("should handle geolocation not supported error", () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 0,
      longitude: 0,
      accuracy: Infinity,
      error: "Geolocation not supported",
      errorCode: "GEOLOCATION_NOT_SUPPORTED",
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.error).toBe("Geolocation not supported");
  });

  it("should detect insecure origin", () => {
    global.window = {
      isSecureContext: false,
      location: {
        hostname: "example.com",
      },
    } as unknown as Window & typeof globalThis;

    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 0,
      longitude: 0,
      accuracy: Infinity,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    expect(result.current.error).toBe("INSECURE_ORIGIN");
  });

  it("should allow localhost in insecure context", async () => {
    global.window = {
      isSecureContext: false,
      location: {
        hostname: "localhost",
      },
    } as unknown as Window & typeof globalThis;

    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 37.5665,
      longitude: 126.978,
      accuracy: 50,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    // Disable server validation to avoid act warnings from async validation
    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false }),
    );

    // Wait for useEffect to complete
    await waitForNextUpdate();

    // Should not have insecure origin error for localhost
    expect(result.current.error).not.toBe("INSECURE_ORIGIN");
  });

  it("should return location data via getLocationData", async () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 37.5665,
      longitude: 126.978,
      accuracy: 50,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    // Disable server validation to avoid act warnings
    const { result } = renderHook(() =>
      useLocation({ enabled: true, validateOnServer: false }),
    );

    // Wait for useEffect to settle
    await waitForNextUpdate();

    const locationData = result.current.getLocationData();
    expect(locationData).toEqual({
      latitude: 37.5665,
      longitude: 126.978,
    });
  });

  it("should return null from getLocationData when location is not available", () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: true,
      latitude: 0,
      longitude: 0,
      accuracy: Infinity,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    const { result } = renderHook(() => useLocation({ enabled: true }));

    const locationData = result.current.getLocationData();
    expect(locationData).toBe(null);
  });

  it("should not validate when disabled", async () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 37.5665,
      longitude: 126.978,
      accuracy: 50,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    renderHook(() => useLocation({ enabled: false }));

    // Wait a tick to ensure no validation call is made
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("should skip server validation when validateOnServer is false", async () => {
    mockedUsePreciseLocation.mockReturnValue({
      loading: false,
      latitude: 37.5665,
      longitude: 126.978,
      accuracy: 50,
      error: null,
      errorCode: null,
      errorAccuracy: null,
      warning: null,
      warningCode: null,
      warningAccuracy: null,
      getPreciseLocation: vi.fn(),
    });

    renderHook(() => useLocation({ enabled: true, validateOnServer: false }));

    // Wait a tick to ensure no validation call is made
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
