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
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

const mockPermissions = {
  query: vi.fn(),
};

function setHostname(host: string) {
  Object.defineProperty(window.location, "hostname", {
    value: host,
    configurable: true,
    writable: true,
  });
}

function setSecureContext(secure: boolean) {
  Object.defineProperty(window, "isSecureContext", {
    value: secure,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(navigator, "geolocation", {
    value: mockGeolocation,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(navigator, "permissions", {
    value: mockPermissions,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(navigator, "userAgent", {
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    configurable: true,
    writable: true,
  });

  setSecureContext(true);
  setHostname("localhost");

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
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      configurable: true,
      writable: true,
    });
    expect(isMobileDevice()).toBe(true);
  });

  it("should detect Android devices", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 10; SM-G973F)",
      configurable: true,
      writable: true,
    });
    expect(isMobileDevice()).toBe(true);
  });

  it("should detect desktop devices", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      configurable: true,
      writable: true,
    });
    expect(isMobileDevice()).toBe(false);
  });
});

describe("getCurrentLocation", () => {
  function mockGoodFix(
    coords = { latitude: 37.5665, longitude: 126.978, accuracy: 30 },
  ) {
    mockGeolocation.watchPosition.mockImplementationOnce(
      (success: PositionCallback) => {
        // Schedule on a microtask so the watchId is assigned before invocation,
        // matching real browser behaviour and letting our cleanup run.
        Promise.resolve().then(() =>
          success({
            coords: { ...coords, altitude: null } as GeolocationCoordinates,
            timestamp: Date.now(),
          } as GeolocationPosition),
        );
        return 1;
      },
    );
  }

  it("should throw InsecureOriginError when not in secure context", async () => {
    setSecureContext(false);
    setHostname("example.com");

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
    mockGoodFix({ latitude: 37.5665, longitude: 126.978, accuracy: 30 });

    const result = await getCurrentLocation();

    expect(result.latitude).toBe(37.5665);
    expect(result.longitude).toBe(126.978);
    expect(result.accuracy).toBe(30);
  });

  it("should call onProgress callback when provided", async () => {
    const onProgress = vi.fn();
    mockGoodFix({ latitude: 37.5665, longitude: 126.978, accuracy: 30 });

    const result = await getCurrentLocation(onProgress);

    expect(result.accuracy).toBe(30);
    expect(onProgress).toHaveBeenCalledWith(30);
  });

  it("should reject on PERMISSION_DENIED from the watch error callback", async () => {
    mockGeolocation.watchPosition.mockImplementationOnce((_success, error) => {
      Promise.resolve().then(() =>
        error({
          code: 1,
          message: "Permission denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError),
      );
      return 1;
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({ code: 1 });
  });

  it("should throw error when geolocation is not supported", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    await expect(getCurrentLocation()).rejects.toThrow(
      /Geolocation is not supported/,
    );
  });

  it("should allow localhost in non-secure context", async () => {
    setSecureContext(false);
    setHostname("localhost");
    mockGoodFix();

    const result = await getCurrentLocation();
    expect(result.latitude).toBe(37.5665);
  });

  it("should allow 127.0.0.1 in non-secure context", async () => {
    setSecureContext(false);
    setHostname("127.0.0.1");
    mockGoodFix();

    const result = await getCurrentLocation();
    expect(result.latitude).toBe(37.5665);
  });

  it("should request high-accuracy on the first watchPosition call", async () => {
    mockGeolocation.watchPosition.mockImplementationOnce(
      (success: PositionCallback, _err, options) => {
        expect(options?.enableHighAccuracy).toBe(true);
        Promise.resolve().then(() =>
          success({
            coords: {
              latitude: 37.5665,
              longitude: 126.978,
              accuracy: 30,
              altitude: null,
            } as GeolocationCoordinates,
            timestamp: Date.now(),
          } as GeolocationPosition),
        );
        return 1;
      },
    );

    const result = await getCurrentLocation();
    expect(result.accuracy).toBe(30);
  });
});
