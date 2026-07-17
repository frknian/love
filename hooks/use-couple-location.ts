"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { isLocationStale } from "@/lib/location/distance";
import { shouldRefreshLocationOnResume } from "@/lib/location/status";
import { createClient } from "@/lib/supabase/client";
import {
  deleteCurrentLocation,
  getLocationAvailabilityFailure,
  getLocationClientPlatform,
  getLocationPermission,
  getLocationRuntime,
  isLocationPermissionsApiSupported,
  locationFailureMessage,
  LocationServiceError,
  observeLocationPermission,
  reconcileLocationPermission,
  requestAndSaveCurrentLocation,
  updateCurrentLocation,
  updateLocationPreferences,
} from "@/services/location/location-service";
import type {
  CoupleLocationRow,
  LocationDataState,
  LocationFailure,
  LocationPermissionState,
  LocationSharingState,
} from "@/types/location";

interface UseCoupleLocationOptions {
  coupleId: string;
  currentUserId: string;
  partnerId: string | null;
}

function failureDataState(failure: LocationFailure): LocationDataState {
  if (failure === "timeout") return "timeout";
  if (failure === "position_unavailable" || failure === "unsupported")
    return "unavailable";
  return "position_error";
}

export function useCoupleLocation({
  coupleId,
  currentUserId,
  partnerId,
}: UseCoupleLocationOptions) {
  const [locations, setLocations] = useState<CoupleLocationRow[]>([]);
  const [permission, setPermission] =
    useState<LocationPermissionState>("unknown");
  const permissionRef = useRef<LocationPermissionState>("unknown");
  const [failure, setFailure] = useState<LocationFailure | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  // Her uygulama/site açılışında yalnızca bir kez taze konum isteği başlatılır.
  const refreshedOnOpenRef = useRef(false);

  const updatePermission = useCallback((next: LocationPermissionState) => {
    permissionRef.current = next;
    setPermission(next);
    if (next === "granted")
      setFailure((current) =>
        current === "permission_denied" ? null : current,
      );
  }, []);

  const load = useCallback(async () => {
    const { data, error: queryError } = await createClient()
      .from("couple_locations")
      .select("*")
      .eq("couple_id", coupleId);
    if (queryError) throw new Error("Konum durumları yüklenemedi.");
    setLocations((data ?? []) as CoupleLocationRow[]);
    setLoadError(undefined);
  }, [coupleId]);

  const handleLocationFailure = useCallback(
    async (requestError: unknown) => {
      const reportedFailure: LocationFailure =
        requestError instanceof LocationServiceError
          ? requestError.code
          : "unknown";
      const permissionAfter = await getLocationPermission();
      const nextFailure: LocationFailure =
        reportedFailure === "permission_denied" && permissionAfter === "granted"
          ? "position_unavailable"
          : reportedFailure;
      setFailure(nextFailure);
      updatePermission(
        nextFailure === "permission_denied" ? "denied" : permissionAfter,
      );
    },
    [updatePermission],
  );

  /** Called directly by a click/switch handler; service starts geolocation synchronously. */
  const requestLocation = useCallback((): Promise<void> => {
    setIsUpdating(true);
    setFailure(null);
    setLoadError(undefined);
    const request = requestAndSaveCurrentLocation(
      currentUserId,
      coupleId,
      permissionRef.current,
    );
    return request
      .then(async () => {
        updatePermission("granted");
        await load();
      })
      .catch(handleLocationFailure)
      .finally(() => setIsUpdating(false));
  }, [coupleId, currentUserId, handleLocationFailure, load, updatePermission]);

  /** Background/resume refresh; never opens a permission prompt. */
  const refresh = useCallback(
    async (force = false) => {
      const currentPermission = await getLocationPermission();
      updatePermission(currentPermission);
      if (currentPermission !== "granted") return;
      setIsUpdating(true);
      setFailure(null);
      try {
        await updateCurrentLocation(currentUserId, coupleId, force);
        await load();
      } catch (updateError) {
        await handleLocationFailure(updateError);
      } finally {
        setIsUpdating(false);
      }
    },
    [coupleId, currentUserId, handleLocationFailure, load, updatePermission],
  );

  const setPreference = useCallback(
    async (
      preferences: Partial<
        Pick<
          CoupleLocationRow,
          "sharing_enabled" | "background_updates_enabled" | "share_last_seen"
        >
      >,
    ) => {
      setLoadError(undefined);
      try {
        await updateLocationPreferences(currentUserId, coupleId, preferences);
        await load();
      } catch (preferenceError) {
        setLoadError("Konum tercihi kaydedilemedi. Lütfen tekrar dene.");
        throw preferenceError;
      }
    },
    [coupleId, currentUserId, load],
  );

  const removeLocation = useCallback(async () => {
    try {
      await deleteCurrentLocation(currentUserId);
      await load();
      setFailure(null);
    } catch (deleteError) {
      setLoadError("Konum verisi silinemedi. Lütfen tekrar dene.");
      throw deleteError;
    }
  }, [currentUserId, load]);

  useEffect(() => {
    const availabilityFailure = getLocationAvailabilityFailure();
    if (availabilityFailure) setFailure(availabilityFailure);
    void Promise.all([load(), getLocationPermission()])
      .then(([, permissionState]) => updatePermission(permissionState))
      .catch(() => setLoadError("Konum bilgileri yüklenemedi."))
      .finally(() => setIsLoading(false));
  }, [load, updatePermission]);

  useEffect(() => {
    const supabase = createClient();
    const handleChange = (
      payload: RealtimePostgresChangesPayload<CoupleLocationRow>,
    ) => {
      if (payload.eventType === "DELETE") {
        const deletedId = String(payload.old.user_id);
        setLocations((current) =>
          current.filter((location) => location.user_id !== deletedId),
        );
        return;
      }
      const row = payload.new as CoupleLocationRow;
      if (row.couple_id !== coupleId) return;
      setLocations((current) => [
        row,
        ...current.filter((location) => location.user_id !== row.user_id),
      ]);
    };
    const channel = supabase
      .channel(`couple-location:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_locations",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const ownLocation = locations.find(
    (location) => location.user_id === currentUserId,
  );
  const partnerLocation = locations.find(
    (location) => location.user_id === partnerId,
  );
  const sharing: LocationSharingState = ownLocation?.sharing_enabled
    ? "enabled"
    : "disabled";

  const recheckPermission = useCallback(async () => {
    const previousPermission = permissionRef.current;
    const observedPermission = await getLocationPermission();
    const nextPermission = reconcileLocationPermission(
      previousPermission,
      observedPermission,
    );
    updatePermission(nextPermission);
    if (
      shouldRefreshLocationOnResume({
        sharing,
        backgroundUpdatesEnabled:
          ownLocation?.background_updates_enabled ?? false,
        previousPermission,
        nextPermission,
      })
    )
      await refresh(false);
  }, [
    ownLocation?.background_updates_enabled,
    refresh,
    sharing,
    updatePermission,
  ]);

  useEffect(() => {
    const stopObserving = observeLocationPermission((observedPermission) => {
      const previousPermission = permissionRef.current;
      const nextPermission = reconcileLocationPermission(
        previousPermission,
        observedPermission,
      );
      updatePermission(nextPermission);
      if (
        shouldRefreshLocationOnResume({
          sharing,
          backgroundUpdatesEnabled:
            ownLocation?.background_updates_enabled ?? false,
          previousPermission,
          nextPermission,
        })
      )
        void refresh(false);
    });
    return stopObserving;
  }, [
    ownLocation?.background_updates_enabled,
    refresh,
    sharing,
    updatePermission,
  ]);

  useEffect(() => {
    const handleFocus = () => void recheckPermission();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void recheckPermission();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [recheckPermission]);

  useEffect(() => {
    if (
      sharing === "enabled" &&
      permission === "granted" &&
      !refreshedOnOpenRef.current
    ) {
      refreshedOnOpenRef.current = true;
      void refresh(true);
    }
  }, [permission, refresh, sharing]);

  const hasOwnCoordinates =
    ownLocation?.latitude != null && ownLocation.longitude != null;
  const dataState: LocationDataState = isLoading
    ? "loading"
    : failure
      ? failureDataState(failure)
      : hasOwnCoordinates
        ? isLocationStale(ownLocation?.updated_at)
          ? "stale"
          : "available"
        : "idle";
  const error =
    loadError ?? (failure ? locationFailureMessage(failure) : undefined);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("[location] state", {
      platform: getLocationClientPlatform(),
      runtime: getLocationRuntime(),
      permissionsApi: isLocationPermissionsApiSupported(),
      permission,
      sharing,
      dataState,
      failure,
      hasOwnLocation: Boolean(ownLocation),
      hasPartnerLocation: Boolean(partnerLocation),
      updatedAt: ownLocation?.updated_at ?? null,
    });
  }, [dataState, failure, ownLocation, partnerLocation, permission, sharing]);

  return useMemo(
    () => ({
      ownLocation,
      partnerLocation,
      permission,
      sharing,
      dataState,
      failure,
      isLoading,
      isUpdating,
      error,
      requestLocation,
      enable: requestLocation,
      refresh,
      setPreference,
      removeLocation,
    }),
    [
      ownLocation,
      partnerLocation,
      permission,
      sharing,
      dataState,
      failure,
      isLoading,
      isUpdating,
      error,
      requestLocation,
      refresh,
      setPreference,
      removeLocation,
    ],
  );
}
