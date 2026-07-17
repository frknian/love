"use client";

import { BellRing, CheckCircle2, LoaderCircle, Share } from "lucide-react";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { getPushProvider } from "@/services/notifications/push-provider";
import type { PushClientState } from "@/types/push";

export function NotificationPermissionSettingsCard() {
  const [state, setState] = useState<PushClientState>();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let active = true;
    const provider = getPushProvider();
    provider.prepare();
    void provider.getState().then((nextState) => {
      if (active) setState(nextState);
    });
    return () => {
      active = false;
    };
  }, []);

  async function requestPermission() {
    setIsRequesting(true);
    setMessage(undefined);
    try {
      await getPushProvider().requestPermission();
      const nextState = await getPushProvider().getState();
      setState(nextState);
      setMessage(
        nextState.subscribed
          ? "Bu cihaz bildirimlere başarıyla kaydedildi."
          : "Cihaz kaydı tamamlanamadı. Lütfen tekrar dene.",
      );
    } catch {
      setMessage(
        "Bildirim aboneliği oluşturulamadı. Bağlantını kontrol edip tekrar dene.",
      );
    } finally {
      setIsRequesting(false);
    }
  }

  async function sendTest() {
    setIsTesting(true);
    setMessage(undefined);
    try {
      await getPushProvider().sendTest();
      setMessage("Test bildirimi gönderildi.");
    } catch {
      setMessage(
        "Test bildirimi gönderilemedi. Sistem bildirim ayarlarını kontrol et.",
      );
    } finally {
      setIsTesting(false);
    }
  }

  const isActive =
    state?.availability === "supported" &&
    state.permission === "granted" &&
    state.subscribed;

  const description = !state
    ? "Bildirim durumu kontrol ediliyor…"
    : state.availability === "requires-install"
      ? "iPhone'da bildirim almak için uygulamayı önce Ana Ekran'a eklemelisin."
      : state.availability === "insecure"
        ? "Bildirimler yalnızca güvenli HTTPS bağlantısında kullanılabilir."
        : state.availability === "unsupported"
          ? "Bu tarayıcı standart Web Push bildirimlerini desteklemiyor."
          : state.permission === "denied"
            ? "Bildirim engellenmiş. iPhone Ayarları > Bildirimler > Bizim Hikâyemiz bölümünden izin ver."
            : isActive
              ? "Uygulama kapalıyken ve ekran kilitliyken bildirim alabilirsin."
              : "Bu cihazı partnerinden gelen bildirimlere kaydet.";

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          {state?.availability === "requires-install" ? (
            <Share className="size-4" />
          ) : isActive ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <BellRing className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Cihaz bildirimleri
          </p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>
        <span
          aria-label={
            isActive ? "Bildirimler aktif" : "Bildirimler aktif değil"
          }
          className={`size-2.5 rounded-full ${
            isActive ? "bg-emerald-400" : "bg-slate-300"
          }`}
        />
      </div>

      {state?.availability === "requires-install" ? (
        <ol className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <li>1. Safari araç çubuğundaki Paylaş simgesine dokun.</li>
          <li>2. “Ana Ekrana Ekle” seçeneğini seç.</li>
          <li>3. Uygulamayı ana ekrandaki yeni ikonundan aç.</li>
          <li>4. Ayarlar&apos;dan “Bildirimleri etkinleştir”e dokun.</li>
        </ol>
      ) : null}

      {state?.availability === "supported" &&
      state.permission !== "denied" &&
      !isActive ? (
        <button
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isRequesting}
          onClick={() => void requestPermission()}
          type="button"
        >
          {isRequesting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <BellRing className="size-4" />
          )}
          {isRequesting ? "Cihaz kaydediliyor…" : "Bildirimleri etkinleştir"}
        </button>
      ) : null}

      {isActive ? (
        <button
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:bg-white/10 dark:text-slate-100"
          disabled={isTesting}
          onClick={() => void sendTest()}
          type="button"
        >
          {isTesting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <BellRing className="size-4" />
          )}
          {isTesting ? "Gönderiliyor…" : "Test bildirimi gönder"}
        </button>
      ) : null}

      {message ? (
        <p className="mt-3 text-xs text-slate-500" role="status">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
