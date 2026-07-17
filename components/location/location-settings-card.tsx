"use client";

import { LocateFixed, RefreshCw, Trash2 } from "lucide-react";

import { ToggleRow } from "@/components/settings/toggle-row";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useCoupleLocation } from "@/hooks/use-couple-location";

interface LocationSettingsCardProps {
  coupleId: string;
  currentUserId: string;
  partnerId: string | null;
}

export function LocationSettingsCard({
  coupleId,
  currentUserId,
  partnerId,
}: LocationSettingsCardProps) {
  const { showToast } = useToast();
  const location = useCoupleLocation({ coupleId, currentUserId, partnerId });

  async function safely(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      showToast(success);
    } catch {
      showToast("Konum ayarı güncellenemedi.", "error");
    }
  }

  return (
    <Card id="konum">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
          <LocateFixed className="size-4" />
        </span>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Konum paylaşımı
          </p>
          <p className="text-xs text-slate-400">
            Koordinatlar yalnızca eşleştiğin partnerinle paylaşılır.
          </p>
        </div>
      </div>
      <div className="mt-3 divide-y divide-rose-100/70 dark:divide-white/5">
        <ToggleRow
          checked={location.ownLocation?.sharing_enabled ?? false}
          description="Mesafenizin hesaplanması için yaklaşık konumunu paylaş."
          disabled={location.isUpdating}
          label="Konum paylaşımı"
          onChange={(enabled) =>
            void (enabled
              ? location.enable()
              : safely(
                  () => location.setPreference({ sharing_enabled: false }),
                  "Konum paylaşımı kapatıldı.",
                ))
          }
        />
        <ToggleRow
          checked={location.ownLocation?.background_updates_enabled ?? false}
          description="PWA yalnızca uygulama yeniden öne geldiğinde günceller."
          disabled={!location.ownLocation?.sharing_enabled}
          label="Arka plandan dönünce güncelle"
          onChange={(enabled) =>
            void safely(
              () =>
                location.setPreference({
                  background_updates_enabled: enabled,
                }),
              "Konum güncelleme tercihi kaydedildi.",
            )
          }
        />
        <ToggleRow
          checked={location.ownLocation?.share_last_seen ?? true}
          description="Partnerin son güncelleme zamanını görebilsin."
          label="Son güncelleme zamanını paylaş"
          onChange={(enabled) =>
            void safely(
              () => location.setPreference({ share_last_seen: enabled }),
              "Son görülme tercihi kaydedildi.",
            )
          }
        />
      </div>
      {location.error ? (
        <p className="mt-3 text-xs text-rose-600" role="alert">
          {location.error}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-100 px-3 text-sm font-semibold text-sky-700 disabled:opacity-60 dark:bg-sky-500/20 dark:text-sky-300"
          disabled={
            !location.ownLocation?.sharing_enabled || location.isUpdating
          }
          onClick={() => void location.requestLocation()}
          type="button"
        >
          <RefreshCw
            className={`size-4 ${location.isUpdating ? "animate-spin" : ""}`}
          />
          Konumu şimdi güncelle
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 text-sm font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
          onClick={() => {
            if (window.confirm("Kayıtlı son konumunu silmek istiyor musun?"))
              void safely(location.removeLocation, "Konum verin silindi.");
          }}
          type="button"
        >
          <Trash2 className="size-4" />
          Konum verilerimi sil
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">
        Web/PWA, tarayıcı tamamen kapalıyken güvenilir arka plan konumu
        sağlayamaz. Android ve iOS’ta da bu sürüm sürekli GPS kullanmaz.
      </p>
    </Card>
  );
}
