"use client";

import { AlertTriangle, LocateFixed, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { useCoupleLocation } from "@/hooks/use-couple-location";
import {
  formatDistanceTr,
  haversineDistanceMeters,
  isLocationStale,
} from "@/lib/location/distance";
import { formatRelativeTimeTr } from "@/lib/date-utils";

interface LocationDistanceCardProps {
  coupleId: string;
  currentUserId: string;
  partnerId: string | null;
}

export function LocationDistanceCard({
  coupleId,
  currentUserId,
  partnerId,
}: LocationDistanceCardProps) {
  const location = useCoupleLocation({
    coupleId,
    currentUserId,
    partnerId,
  });
  const bothEnabled =
    location.ownLocation?.sharing_enabled &&
    location.partnerLocation?.sharing_enabled;
  const distance = bothEnabled
    ? haversineDistanceMeters(
        {
          latitude: location.ownLocation?.latitude ?? Number.NaN,
          longitude: location.ownLocation?.longitude ?? Number.NaN,
        },
        {
          latitude: location.partnerLocation?.latitude ?? Number.NaN,
          longitude: location.partnerLocation?.longitude ?? Number.NaN,
        },
      )
    : null;
  const formattedDistance = formatDistanceTr(distance);
  const isStale =
    isLocationStale(location.ownLocation?.updated_at) ||
    isLocationStale(location.partnerLocation?.updated_at);

  let message = "Mesafeyi görebilmek için konum paylaşımını aç.";
  if (location.isLoading) message = "Konum durumu yükleniyor…";
  else if (location.ownLocation?.sharing_enabled && !location.partnerLocation)
    message = "Partnerin henüz konumunu paylaşmadı.";
  else if (
    location.ownLocation?.sharing_enabled &&
    location.partnerLocation &&
    !location.partnerLocation.sharing_enabled
  )
    message = "Partnerinin konum paylaşımı kapalı.";
  else if (formattedDistance)
    message = `Birbirinize ${formattedDistance} uzaklıktasınız`;

  const lastUpdate = [location.ownLocation, location.partnerLocation]
    .filter((item) => item?.sharing_enabled)
    .map((item) => item?.updated_at)
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
          <MapPin className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
            Aranızdaki mesafe
          </p>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-700 dark:text-slate-100">
            {message}
          </p>
          {lastUpdate &&
          location.ownLocation?.share_last_seen !== false &&
          location.partnerLocation?.share_last_seen !== false ? (
            <p className="mt-1 text-xs text-slate-400">
              En eski güncelleme {formatRelativeTimeTr(lastUpdate)}
            </p>
          ) : null}
        </div>
        <span
          className={`mt-1 size-2.5 shrink-0 rounded-full ${
            bothEnabled ? "bg-emerald-400" : "bg-slate-300"
          }`}
          title={bothEnabled ? "Konum paylaşımı açık" : "Konum paylaşımı pasif"}
        />
      </div>
      {formattedDistance ? (
        <p className="mt-3 text-xs text-slate-400">
          Yaklaşık kuş uçuşu mesafedir; kesin koordinatlar gösterilmez.
        </p>
      ) : null}
      {isStale && bothEnabled ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="size-3.5" />
          Konum bilgisi güncel olmayabilir.
        </p>
      ) : null}
      {location.error ? (
        <p className="mt-3 text-xs text-rose-600" role="alert">
          {location.error}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        {location.ownLocation?.sharing_enabled ? (
          <button
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-100 px-3 text-xs font-semibold text-sky-700 disabled:opacity-60 dark:bg-sky-500/20 dark:text-sky-300"
            disabled={location.isUpdating}
            onClick={() => void location.refresh(true)}
            type="button"
          >
            <RefreshCw
              className={`size-3.5 ${location.isUpdating ? "animate-spin" : ""}`}
            />
            Şimdi güncelle
          </button>
        ) : (
          <button
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 text-xs font-semibold text-white disabled:opacity-60"
            disabled={location.isUpdating}
            onClick={() => void location.enable()}
            type="button"
          >
            <LocateFixed className="size-3.5" />
            Konumu etkinleştir
          </button>
        )}
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300"
          href="/ayarlar#konum"
        >
          Ayarlar
        </Link>
      </div>
    </Card>
  );
}
