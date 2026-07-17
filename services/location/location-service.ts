"use client";

import { locationConfig } from "@/lib/location/config";
import {
  haversineDistanceMeters,
  isValidCoordinates,
} from "@/lib/location/distance";
import { createClient } from "@/lib/supabase/client";
import type {
  CoupleLocationRow,
  LocationFailure,
  LocationPermissionState,
} from "@/types/location";

let pendingRequest: Promise<CoupleLocationRow> | null = null;

export function getLocationRuntime(): "web" {
  return "web";
}

export function getLocationClientPlatform(): CoupleLocationRow["platform"] {
  const agent = navigator.userAgent.toLowerCase();
  if (agent.includes("android")) return "android";
  if (/iphone|ipad|ipod/.test(agent)) return "ios";
  return "web";
}

export function isSecureLocationContext(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    window.isSecureContext ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export function getLocationAvailabilityFailure(): LocationFailure | null {
  if (!isSecureLocationContext()) return "insecure_context";
  if (!("geolocation" in navigator)) return "unsupported";
  return null;
}

export function isLocationPermissionsApiSupported(): boolean {
  return "permissions" in navigator && Boolean(navigator.permissions);
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
  if (code === 2) return "position_unavailable";
  if (code === 3) return "timeout";
  return "unknown";
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
    case "position_unavailable":
      return "Konum şu anda alınamıyor. Cihazının konum servisinin açık olduğundan emin ol.";
    case "timeout":
      return "Konum alınırken zaman aşımı oluştu. Tekrar deneyebilirsin.";
    case "insecure_context":
      return "Konum özelliğini kullanabilmek için uygulamayı HTTPS üzerinden açmalısın.";
    case "unsupported":
      return "Bu tarayıcı konum özelliğini desteklemiyor.";
    case "save_failed":
      return "Konum alındı ancak kaydedilemedi. Tekrar deneyebilirsin.";
    case "unknown":
      return "Konum alınamadı. Lütfen tekrar dene.";
  }
}

export function reconcileLocationPermission(
  previous: LocationPermissionState,
  observed: LocationPermissionState,
): LocationPermissionState {
  // Unknown is not a denial. Preserve only a position request that succeeded.
  if (observed === "unknown" && previous === "granted") return "granted";
  return observed;
}

export async function getLocationPermission(): Promise<LocationPermissionState> {
  if (getLocationAvailabilityFailure()) return "unsupported";
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
  const unavailable = getLocationAvailabilityFailure();
  if (unavailable) {
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
  const unavailable = getLocationAvailabilityFailure();
  if (unavailable)
    return Promise.reject(
      new LocationServiceError(
        unavailable,
        locationFailureMessage(unavailable),
      ),
    );

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        void getLocationPermission().then((permissionAfter) => {
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
          reject(new LocationServiceError(code, locationFailureMessage(code)));
        });
      },
      {
        enableHighAccuracy: locationConfig.enableHighAccuracy,
        timeout: locationConfig.requestTimeoutMs,
        maximumAge: locationConfig.maximumCachedAgeMs,
      },
    );
  });
}

async function readExistingLocation(
  userId: string,
): Promise<CoupleLocationRow | null> {
  const { data, error } = await createClient()
    .from("couple_locations")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new LocationServiceError("unknown", "Konum bilgisi okunamadı.");
  return data as CoupleLocationRow | null;
}

async function savePosition(
  userId: string,
  coupleId: string,
  position: GeolocationPosition,
): Promise<CoupleLocationRow> {
  const coordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
  if (!isValidCoordinates(coordinates))
    throw new LocationServiceError(
      "unknown",
      locationFailureMessage("unknown"),
    );

  const { data, error } = await createClient()
    .from("couple_locations")
    .upsert(
      {
        user_id: userId,
        couple_id: coupleId,
        ...coordinates,
        accuracy_meters: position.coords.accuracy,
        sharing_enabled: true,
        platform: getLocationClientPlatform(),
        updated_at: new Date(position.timestamp).toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) {
    if (process.env.NODE_ENV === "development")
      console.error("[location] save failed", { code: error.code });
    throw new LocationServiceError(
      "save_failed",
      locationFailureMessage("save_failed"),
    );
  }
  return data as CoupleLocationRow;
}

/** Starts getCurrentPosition synchronously from the user's click call stack. */
export function requestAndSaveCurrentLocation(
  userId: string,
  coupleId: string,
  permissionBefore: LocationPermissionState,
): Promise<CoupleLocationRow> {
  if (pendingRequest) return pendingRequest;
  const positionRequest = acquirePosition(permissionBefore);
  pendingRequest = positionRequest.then((position) =>
    savePosition(userId, coupleId, position),
  );
  return pendingRequest.finally(() => {
    pendingRequest = null;
  });
}

/** Silent refresh: never prompts and only runs after a confirmed grant. */
export async function updateCurrentLocation(
  userId: string,
  coupleId: string,
  force = false,
): Promise<CoupleLocationRow> {
  if (pendingRequest) return pendingRequest;
  const permission = await getLocationPermission();
  if (permission !== "granted")
    throw new LocationServiceError(
      permission === "denied" ? "permission_denied" : "unknown",
      permission === "denied"
        ? locationFailureMessage("permission_denied")
        : "Sessiz konum güncellemesi için izin doğrulanamadı.",
    );

  const existing = force ? null : await readExistingLocation(userId);
  if (
    existing?.updated_at &&
    Date.now() - new Date(existing.updated_at).getTime() <
      locationConfig.minimumUpdateIntervalMs
  )
    return existing;

  pendingRequest = (async () => {
    const position = await acquirePosition(permission);
    if (
      !force &&
      existing?.latitude != null &&
      existing.longitude != null &&
      (haversineDistanceMeters(
        { latitude: existing.latitude, longitude: existing.longitude },
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      ) ?? Number.POSITIVE_INFINITY) < locationConfig.minimumMovementMeters
    )
      return existing;
    return savePosition(userId, coupleId, position);
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
