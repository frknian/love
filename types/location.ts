export interface CoupleLocationRow {
  user_id: string;
  couple_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  sharing_enabled: boolean;
  background_updates_enabled: boolean;
  share_last_seen: boolean;
  platform: "web" | "android" | "ios";
  updated_at: string;
}

export type LocationPermissionState =
  "prompt" | "granted" | "denied" | "unsupported" | "unknown";

export type LocationFailure =
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unsupported"
  | "save_failed";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}
