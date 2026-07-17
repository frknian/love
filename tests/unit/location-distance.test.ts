import { describe, expect, it } from "vitest";

import {
  formatDistanceTr,
  haversineDistanceMeters,
  isLocationStale,
  isValidCoordinates,
} from "@/lib/location/distance";

describe("location distance helpers", () => {
  it("calculates Haversine distance between Istanbul and Ankara", () => {
    const distance = haversineDistanceMeters(
      { latitude: 41.0082, longitude: 28.9784 },
      { latitude: 39.9334, longitude: 32.8597 },
    );
    expect(distance).not.toBeNull();
    expect((distance ?? 0) / 1_000).toBeGreaterThan(348);
    expect((distance ?? 0) / 1_000).toBeLessThan(354);
  });

  it("formats meters and kilometers in Turkish", () => {
    expect(formatDistanceTr(640)).toBe("640 m");
    expect(formatDistanceTr(12_400)).toBe("12,4 km");
    expect(formatDistanceTr(508_400)).toBe("508 km");
  });

  it("rejects missing and invalid coordinates", () => {
    expect(isValidCoordinates(undefined)).toBe(false);
    expect(isValidCoordinates({ latitude: 91, longitude: 20 })).toBe(false);
    expect(
      haversineDistanceMeters(
        { latitude: Number.NaN, longitude: 1 },
        { latitude: 1, longitude: 1 },
      ),
    ).toBeNull();
  });

  it("detects stale and fresh location timestamps", () => {
    const now = Date.UTC(2026, 6, 17, 12);
    expect(isLocationStale(new Date(now - 60_000).toISOString(), now)).toBe(
      false,
    );
    expect(
      isLocationStale(new Date(now - 4 * 60 * 60 * 1_000).toISOString(), now),
    ).toBe(true);
    expect(isLocationStale(null, now)).toBe(true);
  });
});
