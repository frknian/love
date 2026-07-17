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

export function getLocationRuntime(): "web" {
  // This project is a web/PWA build; Android and iOS use the browser permission source.
  return "web";
}

export function isLocationPermissionsApiSupported(): boolean {
  return "permissions" in navigator && Boolean(navigator.permissions);
}

export function getLocationClientPlatform(): CoupleLocationRow["platform"] {
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

export function mapGeolocationErrorCode(code: number): LocationFailure {
  if (code === 1) return "permission_denied";
  if (code === 3) return "timeout";
  return "position_unavailable";
}

export function classifyGeolocationFailure(
  errorCode: number,
  permissionBefore: LocationPermissionState,
  permissionAfter: LocationPermissionState,
): LocationFailure {
  if (errorCode !== 1) return mapGeolocationErrorCode(errorCode);
  if (permissionAfter === "denied") return "permission_denied";
  if (
    permissionAfter === "granted" ||
    (permissionAfter === "unknown" && permissionBefore === "granted")
  )
    return "position_unavailable";
  return "permission_denied";
}

export function locationFailureMessage(failure: LocationFailure): string {
  switch (failure) {
    case "permission_denied":
      return "Konum izni reddedildi. Tarayıcı veya cihaz ayarlarından izin verebilirsin.";
    case "timeout":
      return "Konum alınırken zaman aşımı oluştu. Tekrar deneyebilirsin.";
    case "unsupported":
      return "Bu tarayıcı veya cihaz konum paylaşımını desteklemiyor.";
    case "position_unavailable":
      return "Konum şu anda alınamıyor. Cihazının konum servisinin açık olduğundan emin ol.";
    case "save_failed":
      return "Konum güvenli şekilde kaydedilemedi. Lütfen tekrar dene.";
  }
}

export function reconcileLocationPermission(
  previous: LocationPermissionState,
  observed: LocationPermissionState,
): LocationPermissionState {
  // An unavailable Permissions API is not evidence that a successful/failed
  // geolocation result changed. Preserve the last definitive runtime result.
  if (
    observed === "unknown" &&
    (previous === "granted" || previous === "denied")
  )
    return previous;
  return observed;
}

export async function getLocationPermission(): Promise<LocationPermissionState> {
  if (!("geolocation" in navigator)) return "unsupported";
  if (!isLocationPermissionsApiSupported()) return "unknown";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unknown";
  }
}

export function observeLocationPermission(
  onChange: (permission: LocationPermissionState) => void,
): () => void {
  let disposed = false;
  let status: PermissionStatus | null = null;
  const handleChange = () => {
    if (!disposed && status) onChange(status.state);
  };

  if (!("geolocation" in navigator)) {
    onChange("unsupported");
    return () => {
      disposed = true;
    };
  }
  if (!isLocationPermissionsApiSupported()) {
    onChange("unknown");
    return () => {
      disposed = true;
    };
  }

  void navigator.permissions
    .query({ name: "geolocation" })
    .then((permissionStatus) => {
      if (disposed) return;
      status = permissionStatus;
      onChange(status.state);
      status.addEventListener("change", handleChange);
    })
    .catch(() => {
      if (!disposed) onChange("unknown");
    });

  return () => {
    disposed = true;
    status?.removeEventListener("change", handleChange);
  };
}

function acquirePosition(
  permissionBefore: LocationPermissionState,
): Promise<GeolocationPosition> {
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
      async (error) => {
        const permissionAfter = await getLocationPermission();
        const code = classifyGeolocationFailure(
          error.code,
          permissionBefore,
          permissionAfter,
        );
        if (process.env.NODE_ENV === "development")
          console.debug("[location] geolocation failure", {
            platform: getLocationClientPlatform(),
            errorCode: error.code,
            failure: code,
            permissionBefore,
            permissionAfter,
          });
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
    const permission = await getLocationPermission();
    if (permission === "denied")
      throw new LocationServiceError(
        "permission_denied",
        locationFailureMessage("permission_denied"),
      );
    if (permission === "unsupported")
      throw new LocationServiceError(
        "unsupported",
        locationFailureMessage("unsupported"),
      );

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
        permission === "granted" &&
        existing?.updated_at &&
        Date.now() - new Date(existing.updated_at).getTime() <
          locationConfig.minimumUpdateIntervalMs
      )
        return existing;
    }
    const position = await acquirePosition(permission);
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
          platform: getLocationClientPlatform(),
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
