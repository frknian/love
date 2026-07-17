import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLocationPermission,
  getLocationRuntime,
  mapGeolocationErrorCode,
  observeLocationPermission,
  reconcileLocationPermission,
} from "@/services/location/location-service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("location permission service", () => {
  it("maps browser geolocation errors without conflating their causes", () => {
    expect(mapGeolocationErrorCode(1)).toBe("permission_denied");
    expect(mapGeolocationErrorCode(2)).toBe("position_unavailable");
    expect(mapGeolocationErrorCode(3)).toBe("timeout");
  });

  it("returns unknown instead of denied when Permissions API is unavailable", async () => {
    vi.stubGlobal("navigator", { geolocation: {} });
    await expect(getLocationPermission()).resolves.toBe("unknown");
  });

  it("preserves a definitive runtime result when Permissions API is unknown", () => {
    expect(reconcileLocationPermission("granted", "unknown")).toBe("granted");
    expect(reconcileLocationPermission("denied", "unknown")).toBe("denied");
    expect(reconcileLocationPermission("prompt", "unknown")).toBe("unknown");
  });

  it("observes browser permission changes and removes its listener", async () => {
    const permissionStatus = new EventTarget() as EventTarget & {
      state: PermissionState;
    };
    permissionStatus.state = "prompt";
    vi.stubGlobal("navigator", {
      geolocation: {},
      permissions: {
        query: vi.fn().mockResolvedValue(permissionStatus),
      },
    });
    const states: string[] = [];
    const stop = observeLocationPermission((state) => states.push(state));
    await Promise.resolve();
    expect(states).toEqual(["prompt"]);

    permissionStatus.state = "granted";
    permissionStatus.dispatchEvent(new Event("change"));
    expect(states).toEqual(["prompt", "granted"]);

    stop();
    permissionStatus.state = "denied";
    permissionStatus.dispatchEvent(new Event("change"));
    expect(states).toEqual(["prompt", "granted"]);
  });

  it("uses web permission semantics for this PWA on desktop, Android and iOS", () => {
    expect(getLocationRuntime()).toBe("web");
  });
});
