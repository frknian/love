import type {
  LocationDataState,
  LocationPermissionState,
  LocationSharingState,
} from "@/types/location";

export type LocationCardStatus =
  | "loading"
  | "sharing_disabled"
  | "permission_denied"
  | "permission_prompt"
  | "unsupported"
  | "unavailable"
  | "timeout"
  | "position_error"
  | "own_location_missing"
  | "partner_location_missing"
  | "partner_sharing_disabled"
  | "distance_available";

interface LocationCardStatusInput {
  isLoading: boolean;
  permission: LocationPermissionState;
  sharing: LocationSharingState;
  dataState: LocationDataState;
  hasOwnCoordinates: boolean;
  hasPartnerLocation: boolean;
  partnerSharingEnabled: boolean;
  hasPartnerCoordinates: boolean;
}

/** Returns one mutually exclusive card state in user-facing priority order. */
export function resolveLocationCardStatus({
  isLoading,
  permission,
  sharing,
  dataState,
  hasOwnCoordinates,
  hasPartnerLocation,
  partnerSharingEnabled,
  hasPartnerCoordinates,
}: LocationCardStatusInput): LocationCardStatus {
  if (isLoading || dataState === "loading") return "loading";
  if (sharing === "disabled") return "sharing_disabled";
  if (permission === "denied") return "permission_denied";
  if (permission === "prompt") return "permission_prompt";
  if (permission === "unsupported") return "unsupported";
  if (dataState === "unavailable") return "unavailable";
  if (dataState === "timeout") return "timeout";
  if (dataState === "position_error") return "position_error";
  if (!hasOwnCoordinates) return "own_location_missing";
  if (!hasPartnerLocation) return "partner_location_missing";
  if (!partnerSharingEnabled) return "partner_sharing_disabled";
  if (!hasPartnerCoordinates) return "partner_location_missing";
  return "distance_available";
}

interface ResumeRefreshInput {
  sharing: LocationSharingState;
  backgroundUpdatesEnabled: boolean;
  previousPermission: LocationPermissionState;
  nextPermission: LocationPermissionState;
}

/** Refreshes after a newly granted permission even when background updates are off. */
export function shouldRefreshLocationOnResume({
  sharing,
  backgroundUpdatesEnabled,
  previousPermission,
  nextPermission,
}: ResumeRefreshInput): boolean {
  return (
    sharing === "enabled" &&
    nextPermission === "granted" &&
    (backgroundUpdatesEnabled || previousPermission !== "granted")
  );
}

export function shouldProbeUnknownPermissionOnResume({
  sharing,
  previousPermission,
  nextPermission,
}: Pick<
  ResumeRefreshInput,
  "sharing" | "previousPermission" | "nextPermission"
>): boolean {
  return (
    sharing === "enabled" &&
    previousPermission === "denied" &&
    nextPermission === "unknown"
  );
}
