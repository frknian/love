import type {
  LocationDataState,
  LocationFailure,
  LocationPermissionState,
  LocationSharingState,
} from "@/types/location";

export type LocationCardStatus =
  | "loading"
  | "insecure_context"
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
  | "partner_stale"
  | "distance_available";

interface LocationCardStatusInput {
  isLoading: boolean;
  failure: LocationFailure | null;
  permission: LocationPermissionState;
  sharing: LocationSharingState;
  hasOwnLocation: boolean;
  dataState: LocationDataState;
  hasOwnCoordinates: boolean;
  hasPartnerLocation: boolean;
  partnerSharingEnabled: boolean;
  hasPartnerCoordinates: boolean;
  partnerIsStale: boolean;
}

/** Returns one mutually exclusive card state in user-facing priority order. */
export function resolveLocationCardStatus({
  isLoading,
  failure,
  permission,
  sharing,
  hasOwnLocation,
  dataState,
  hasOwnCoordinates,
  hasPartnerLocation,
  partnerSharingEnabled,
  hasPartnerCoordinates,
  partnerIsStale,
}: LocationCardStatusInput): LocationCardStatus {
  if (isLoading || dataState === "loading") return "loading";
  if (failure === "insecure_context") return "insecure_context";
  if (permission === "unsupported" || failure === "unsupported")
    return "unsupported";
  if (hasOwnLocation && sharing === "disabled") return "sharing_disabled";
  if (permission === "denied") return "permission_denied";
  if (permission === "prompt" || permission === "unknown")
    return "permission_prompt";
  if (dataState === "unavailable") return "unavailable";
  if (dataState === "timeout") return "timeout";
  if (dataState === "position_error") return "position_error";
  if (!hasOwnCoordinates) return "own_location_missing";
  if (!hasPartnerLocation) return "partner_location_missing";
  if (!partnerSharingEnabled) return "partner_sharing_disabled";
  if (!hasPartnerCoordinates) return "partner_location_missing";
  if (partnerIsStale) return "partner_stale";
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
