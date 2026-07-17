"use client";

import { locationConfig } from "@/lib/location/config";
import { haversineDistanceMeters } from "@/lib/location/distance";
import { createClient } from "@/lib/supabase/client";
import type {
  CoupleLocationRow,
  LocationFailure,
  LocationPermissionState,
} from "@/types/location";

let pendingRequest: Promise<CoupleLocationRow> | null = null;

function platform(): CoupleLocationRow["platform"] {
  const agent = navigator.userAgent.toLowerCase();
  if (agent.includes("android")) return "android";
  if (/iphone|ipad|ipod/.test(agent)) return "ios";
  return "web";
}

export class LocationServiceError extends Error {
  constructor(
    public readonly code: LocationFailure,
    message: string,
  ) {
    super(message);
  }
}

export async function getLocationPermission(): Promise<LocationPermissionState> {
  if (!("geolocation" in navigator)) return "unsupported";
  if (!navigator.permissions) return "unknown";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unknown";
  }
}

function acquirePosition(): Promise<GeolocationPosition> {
  if (!("geolocation" in navigator))
    return Promise.reject(
      new LocationServiceError(
        "unsupported",
        "Bu cihaz konum özelliğini desteklemiyor.",
      ),
    );
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const code: LocationFailure =
          error.code === error.PERMISSION_DENIED
            ? "permission_denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "position_unavailable";
        reject(new LocationServiceError(code, error.message));
      },
      {
        enableHighAccuracy: locationConfig.enableHighAccuracy,
        timeout: locationConfig.requestTimeoutMs,
        maximumAge: locationConfig.maximumCachedAgeMs,
      },
    );
  });
}

export async function updateCurrentLocation(
  userId: string,
  coupleId: string,
  force = false,
): Promise<CoupleLocationRow> {
  if (pendingRequest) return pendingRequest;
  pendingRequest = (async () => {
    const supabase = createClient();
    let existing: CoupleLocationRow | null = null;
    if (!force) {
      const { data } = await supabase
        .from("couple_locations")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      existing = data as CoupleLocationRow | null;
      if (
        existing?.updated_at &&
        Date.now() - new Date(existing.updated_at).getTime() <
          locationConfig.minimumUpdateIntervalMs
      )
        return existing;
    }
    const position = await acquirePosition();
    const movement =
      existing?.latitude !== null &&
      existing?.longitude !== null &&
      existing?.latitude !== undefined &&
      existing?.longitude !== undefined
        ? haversineDistanceMeters(
            {
              latitude: existing.latitude,
              longitude: existing.longitude,
            },
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          )
        : null;
    if (
      !force &&
      existing &&
      movement !== null &&
      movement < locationConfig.minimumMovementMeters
    )
      return existing;
    const { data, error } = await supabase
      .from("couple_locations")
      .upsert(
        {
          user_id: userId,
          couple_id: coupleId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: position.coords.accuracy,
          sharing_enabled: true,
          platform: platform(),
          updated_at: new Date(position.timestamp).toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error)
      throw new LocationServiceError(
        "save_failed",
        "Konum güvenli şekilde kaydedilemedi.",
      );
    return data as CoupleLocationRow;
  })();
  try {
    return await pendingRequest;
  } finally {
    pendingRequest = null;
  }
}

export async function updateLocationPreferences(
  userId: string,
  coupleId: string,
  preferences: Partial<
    Pick<
      CoupleLocationRow,
      "sharing_enabled" | "background_updates_enabled" | "share_last_seen"
    >
  >,
): Promise<void> {
  const { error } = await createClient()
    .from("couple_locations")
    .upsert(
      { user_id: userId, couple_id: coupleId, ...preferences },
      { onConflict: "user_id" },
    );
  if (error) throw new Error("Konum tercihi kaydedilemedi.");
}

export async function deleteCurrentLocation(userId: string): Promise<void> {
  const { error } = await createClient()
    .from("couple_locations")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error("Konum verisi silinemedi.");
}
