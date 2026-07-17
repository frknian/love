"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  deleteCurrentLocation,
  getLocationPermission,
  LocationServiceError,
  updateCurrentLocation,
  updateLocationPreferences,
} from "@/services/location/location-service";
import type {
  CoupleLocationRow,
  LocationPermissionState,
} from "@/types/location";

interface UseCoupleLocationOptions {
  coupleId: string;
  currentUserId: string;
  partnerId: string | null;
}

export function useCoupleLocation({
  coupleId,
  currentUserId,
  partnerId,
}: UseCoupleLocationOptions) {
  const [locations, setLocations] = useState<CoupleLocationRow[]>([]);
  const [permission, setPermission] =
    useState<LocationPermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    const { data, error: queryError } = await createClient()
      .from("couple_locations")
      .select("*")
      .eq("couple_id", coupleId);
    if (queryError) throw new Error("Konum durumları yüklenemedi.");
    setLocations((data ?? []) as CoupleLocationRow[]);
  }, [coupleId]);

  const refresh = useCallback(
    async (force = true) => {
      setIsUpdating(true);
      setError(undefined);
      try {
        await updateCurrentLocation(currentUserId, coupleId, force);
        await load();
        setPermission("granted");
      } catch (updateError) {
        const message =
          updateError instanceof LocationServiceError
            ? updateError.code === "permission_denied"
              ? "Konum izni reddedildi. Tarayıcı veya cihaz ayarlarından izin verebilirsin."
              : updateError.code === "timeout"
                ? "Konum isteği zaman aşımına uğradı. Tekrar deneyebilirsin."
                : updateError.code === "unsupported"
                  ? "Bu cihaz konum paylaşımını desteklemiyor."
                  : "Konum alınamadı. Konum servisinin açık olduğunu kontrol et."
            : "Konum güncellenemedi. Lütfen tekrar dene.";
        setError(message);
        setPermission(await getLocationPermission());
      } finally {
        setIsUpdating(false);
      }
    },
    [coupleId, currentUserId, load],
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
      setError(undefined);
      await updateLocationPreferences(currentUserId, coupleId, preferences);
      await load();
    },
    [coupleId, currentUserId, load],
  );

  const enable = useCallback(async () => {
    await setPreference({ sharing_enabled: true });
    await refresh(true);
  }, [refresh, setPreference]);

  const removeLocation = useCallback(async () => {
    await deleteCurrentLocation(currentUserId);
    await load();
  }, [currentUserId, load]);

  useEffect(() => {
    void Promise.all([load(), getLocationPermission()])
      .then(([, permissionState]) => setPermission(permissionState))
      .catch(() => setError("Konum bilgileri yüklenemedi."))
      .finally(() => setIsLoading(false));
  }, [load]);

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

  useEffect(() => {
    if (!ownLocation?.sharing_enabled) return;
    void refresh(false);
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        ownLocation.background_updates_enabled
      )
        void refresh(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [
    ownLocation?.background_updates_enabled,
    ownLocation?.sharing_enabled,
    refresh,
  ]);

  return useMemo(
    () => ({
      ownLocation,
      partnerLocation,
      permission,
      isLoading,
      isUpdating,
      error,
      enable,
      refresh,
      setPreference,
      removeLocation,
    }),
    [
      ownLocation,
      partnerLocation,
      permission,
      isLoading,
      isUpdating,
      error,
      enable,
      refresh,
      setPreference,
      removeLocation,
    ],
  );
}
