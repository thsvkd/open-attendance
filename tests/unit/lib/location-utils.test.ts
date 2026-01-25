import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateDistance,
  getCurrentLocation,
  isWithinRadius,
  isMobileDevice,
  InsecureOriginError,
  PermissionDeniedError,
} from "@/lib/location-utils";

// Mock the global navigator and window objects
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

const mockPermissions = {
  query: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();

  // Setup default mocks
  global.navigator = {
    geolocation: mockGeolocation,
    permissions: mockPermissions,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  } as unknown as Navigator;

  global.window = {
    isSecureContext: true,
    location: {
      hostname: "localhost",
    },
  } as unknown as Window & typeof globalThis;

  // Default permission state: granted
  mockPermissions.query.mockResolvedValue({ state: "granted" });
});

describe("calculateDistance", () => {
  it("should calculate distance between two coordinates", () => {
    // Seoul Station to Gangnam Station (approximately 8km)
    const lat1 = 37.5547;
    const lon1 = 126.9707;
    const lat2 = 37.4979;
    const lon2 = 127.0276;

    const distance = calculateDistance(lat1, lon1, lat2, lon2);

    // Distance should be around 8km (8000m)
    expect(distance).toBeGreaterThan(7500);
    expect(distance).toBeLessThan(8500);
  });

  it("should return 0 for same coordinates", () => {
    const distance = calculateDistance(37.5665, 126.978, 37.5665, 126.978);
    expect(distance).toBe(0);
  });
});

describe("isWithinRadius", () => {
  it("should return true when within radius", () => {
    const result = isWithinRadius(
      37.5665,
      126.978,
      37.5665,
      126.978,
      100, // 100m radius
    );

    expect(result.isWithinRadius).toBe(true);
    expect(result.distance).toBe(0);
  });

  it("should return false when outside radius", () => {
    const result = isWithinRadius(
      37.5665,
      126.978,
      37.5547,
      126.9707, // ~1.5km away
      100, // 100m radius
    );

    expect(result.isWithinRadius).toBe(false);
    expect(result.distance).toBeGreaterThan(100);
  });

  it("should round distance to nearest meter", () => {
    const result = isWithinRadius(37.5665, 126.978, 37.5666, 126.978, 1000);
    expect(Number.isInteger(result.distance)).toBe(true);
  });
});

describe("isMobileDevice", () => {
  it("should detect mobile devices", () => {
    global.navigator = {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    } as Navigator;

    expect(isMobileDevice()).toBe(true);
  });

  it("should detect Android devices", () => {
    global.navigator = {
      userAgent: "Mozilla/5.0 (Linux; Android 10; SM-G973F)",
    } as Navigator;

    expect(isMobileDevice()).toBe(true);
  });

  it("should detect desktop devices", () => {
    global.navigator = {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    } as Navigator;

    expect(isMobileDevice()).toBe(false);
  });

  it("should return false when navigator is undefined", () => {
    global.navigator = undefined as unknown as Navigator;
    expect(isMobileDevice()).toBe(false);
  });
});

describe("getCurrentLocation", () => {
  it("should throw InsecureOriginError when not in secure context", async () => {
    global.window = {
      isSecureContext: false,
      location: { hostname: "example.com" },
    } as unknown as Window & typeof globalThis;

    await expect(getCurrentLocation()).rejects.toThrow(InsecureOriginError);
    await expect(getCurrentLocation()).rejects.toThrow(
      /Geolocation API blocked/,
    );
  });

  it("should throw PermissionDeniedError when permission is denied", async () => {
    mockPermissions.query.mockResolvedValue({ state: "denied" });

    await expect(getCurrentLocation()).rejects.toThrow(PermissionDeniedError);
    await expect(getCurrentLocation()).rejects.toThrow(/permission denied/i);
  });

  it("should return location successfully", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success: PositionCallback) => {
        success({
          coords: {
            latitude: 37.5665,
            longitude: 126.978,
            accuracy: 50,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    );

    const result = await getCurrentLocation();

    expect(result.latitude).toBe(37.5665);
    expect(result.longitude).toBe(126.978);
    expect(result.accuracy).toBe(50);
  });

  it("should call onProgress callback when provided", async () => {
    const onProgress = vi.fn();

    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success: PositionCallback) => {
        success({
          coords: {
            latitude: 37.5665,
            longitude: 126.978,
            accuracy: 50,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    );

    const result = await getCurrentLocation(onProgress);

    expect(result.accuracy).toBe(50);
    expect(onProgress).toHaveBeenCalledWith(50);
    expect(onProgress).toHaveBeenCalledTimes(1);
  });

  it("should handle geolocation errors", async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((_success, error) => {
      error({
        code: 2,
        message: "Position unavailable",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    });

    await expect(getCurrentLocation()).rejects.toThrow(/Position unavailable/);
  });

  it("should throw error when geolocation is not supported", async () => {
    global.navigator = {
      geolocation: undefined,
    } as unknown as Navigator;

    await expect(getCurrentLocation()).rejects.toThrow(
      /Geolocation is not supported/,
    );
  });

  it("should allow localhost in non-secure context", async () => {
    global.window = {
      isSecureContext: false,
      location: { hostname: "localhost" },
    } as unknown as Window & typeof globalThis;

    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 37.5665, longitude: 126.978, accuracy: 50 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    );

    const result = await getCurrentLocation();
    expect(result.latitude).toBe(37.5665);
  });

  it("should allow 127.0.0.1 in non-secure context", async () => {
    global.window = {
      isSecureContext: false,
      location: { hostname: "127.0.0.1" },
    } as unknown as Window & typeof globalThis;

    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 37.5665, longitude: 126.978, accuracy: 50 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    );

    const result = await getCurrentLocation();
    expect(result.latitude).toBe(37.5665);
  });

  it("should use high accuracy settings", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success: PositionCallback, _error, options) => {
        expect(options?.enableHighAccuracy).toBe(true);
        expect(options?.timeout).toBe(10000);
        expect(options?.maximumAge).toBe(0);

        success({
          coords: { latitude: 37.5665, longitude: 126.978, accuracy: 30 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    );

    const result = await getCurrentLocation();
    expect(result.accuracy).toBe(30);
  });
});
