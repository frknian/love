import { describe, expect, it } from "vitest";

import {
  resolveLocationCardStatus,
  shouldProbeUnknownPermissionOnResume,
  shouldRefreshLocationOnResume,
} from "@/lib/location/status";

const available = {
  isLoading: false,
  permission: "granted" as const,
  sharing: "enabled" as const,
  dataState: "available" as const,
  hasOwnCoordinates: true,
  hasPartnerLocation: true,
  partnerSharingEnabled: true,
  hasPartnerCoordinates: true,
};

describe("location card status", () => {
  it("shows partner missing only when permission and own location are valid", () => {
    expect(
      resolveLocationCardStatus({
        ...available,
        hasPartnerLocation: false,
        partnerSharingEnabled: false,
        hasPartnerCoordinates: false,
      }),
    ).toBe("partner_location_missing");
  });

  it("shows distance when both users have shared coordinates", () => {
    expect(resolveLocationCardStatus(available)).toBe("distance_available");
  });

  it.each([
    ["prompt", "permission_prompt"],
    ["denied", "permission_denied"],
    ["unsupported", "unsupported"],
  ] as const)("maps %s permission to %s", (permission, expected) => {
    expect(resolveLocationCardStatus({ ...available, permission })).toBe(
      expected,
    );
  });

  it.each([
    ["unavailable", "unavailable"],
    ["timeout", "timeout"],
    ["position_error", "position_error"],
  ] as const)("maps %s data to %s", (dataState, expected) => {
    expect(resolveLocationCardStatus({ ...available, dataState })).toBe(
      expected,
    );
  });

  it("prioritizes the user's disabled sharing over a stale denied state", () => {
    expect(
      resolveLocationCardStatus({
        ...available,
        sharing: "disabled",
        permission: "denied",
      }),
    ).toBe("sharing_disabled");
  });

  it("never shows partner missing together with a real denial", () => {
    expect(
      resolveLocationCardStatus({
        ...available,
        permission: "denied",
        hasPartnerLocation: false,
        partnerSharingEnabled: false,
        hasPartnerCoordinates: false,
      }),
    ).toBe("permission_denied");
  });
});

describe("location resume refresh", () => {
  it("refreshes when permission changes from denied to granted", () => {
    expect(
      shouldRefreshLocationOnResume({
        sharing: "enabled",
        backgroundUpdatesEnabled: false,
        previousPermission: "denied",
        nextPermission: "granted",
      }),
    ).toBe(true);
  });

  it("does not refresh while sharing is disabled", () => {
    expect(
      shouldRefreshLocationOnResume({
        sharing: "disabled",
        backgroundUpdatesEnabled: true,
        previousPermission: "denied",
        nextPermission: "granted",
      }),
    ).toBe(false);
  });

  it("probes geolocation after resume when Permissions API cannot clear denial", () => {
    expect(
      shouldProbeUnknownPermissionOnResume({
        sharing: "enabled",
        previousPermission: "denied",
        nextPermission: "unknown",
      }),
    ).toBe(true);
  });
});
