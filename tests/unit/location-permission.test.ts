import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyGeolocationFailure,
  getLocationAvailabilityFailure,
  getLocationPermission,
  getLocationRuntime,
  mapGeolocationErrorCode,
  observeLocationPermission,
  reconcileLocationPermission,
} from "@/services/location/location-service";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubSecureWindow() {
  vi.stubGlobal("window", {
    isSecureContext: true,
    location: { hostname: "love.example" },
  });
}

describe("location permission service", () => {
  it("maps browser geolocation errors without conflating their causes", () => {
    expect(mapGeolocationErrorCode(1)).toBe("permission_denied");
    expect(mapGeolocationErrorCode(2)).toBe("position_unavailable");
    expect(mapGeolocationErrorCode(3)).toBe("timeout");
    expect(mapGeolocationErrorCode(99)).toBe("unknown");
  });

  it("does not overwrite granted permission with a conflicting code 1 error", () => {
    expect(classifyGeolocationFailure(1, "granted", "granted")).toBe(
      "position_unavailable",
    );
    expect(classifyGeolocationFailure(1, "granted", "unknown")).toBe(
      "position_unavailable",
    );
  });

  it("keeps a confirmed denial as permission denied", () => {
    expect(classifyGeolocationFailure(1, "prompt", "denied")).toBe(
      "permission_denied",
    );
    expect(classifyGeolocationFailure(1, "granted", "denied")).toBe(
      "permission_denied",
    );
  });

  it("returns unknown instead of denied when Permissions API is unavailable", async () => {
    stubSecureWindow();
    vi.stubGlobal("navigator", { geolocation: {} });
    await expect(getLocationPermission()).resolves.toBe("unknown");
  });

  it("preserves successful grants but clears stale denials when the API is unknown", () => {
    expect(reconcileLocationPermission("granted", "unknown")).toBe("granted");
    expect(reconcileLocationPermission("denied", "unknown")).toBe("unknown");
    expect(reconcileLocationPermission("prompt", "unknown")).toBe("unknown");
  });

  it("observes browser permission changes and removes its listener", async () => {
    stubSecureWindow();
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

  it("reports insecure contexts without calling them denied", () => {
    vi.stubGlobal("window", {
      isSecureContext: false,
      location: { hostname: "192.168.1.10" },
    });
    vi.stubGlobal("navigator", { geolocation: {} });
    expect(getLocationAvailabilityFailure()).toBe("insecure_context");
  });

  it("reports browsers without geolocation as unsupported", () => {
    stubSecureWindow();
    vi.stubGlobal("navigator", {});
    expect(getLocationAvailabilityFailure()).toBe("unsupported");
  });
});
