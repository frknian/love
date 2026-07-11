"use client";

import { AnimatePresence } from "framer-motion";
import { Hourglass, Plus, WifiOff } from "lucide-react";
import { useState } from "react";

import { CountdownCard } from "@/components/countdowns/countdown-card";
import { CountdownSheet } from "@/components/countdowns/countdown-sheet";
import { useCountdowns } from "@/hooks/use-countdowns";
import { useNow } from "@/hooks/use-now";
import { toCountdown } from "@/lib/countdowns/countdown-mapper";
import {
  countdownsService,
  type CountdownInput,
} from "@/services/countdowns/countdowns-service";
import type { Countdown } from "@/types/countdowns";

interface CountdownsWorkspaceProps {
  initialCountdowns: Countdown[];
  coupleId: string;
  currentUserId: string;
}

export function CountdownsWorkspace({
  initialCountdowns,
  coupleId,
  currentUserId,
}: CountdownsWorkspaceProps) {
  const { countdowns, realtimeError, upsert, remove } = useCountdowns({
    initialCountdowns,
    coupleId,
  });
  const now = useNow(1000);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function handleCreate(input: CountdownInput) {
    setError(undefined);
    const row = await countdownsService.create(coupleId, currentUserId, input);
    upsert(toCountdown(row));
  }

  async function handleDelete(countdown: Countdown) {
    const confirmed = window.confirm(
      `“${countdown.title}” geri sayımını silmek istiyor musun?`,
    );
    if (!confirmed) return;
    setError(undefined);
    try {
      await countdownsService.remove(countdown.id);
      remove(countdown.id);
    } catch {
      setError("Geri sayım silinemedi. Lütfen tekrar dene.");
    }
  }

  return (
    <div className="relative">
      {realtimeError ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <WifiOff className="size-3.5" />
          {realtimeError}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {countdowns.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {countdowns.map((countdown) => (
              <CountdownCard
                countdown={countdown}
                key={countdown.id}
                now={now}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-12 text-center">
          <Hourglass
            aria-hidden="true"
            className="mx-auto size-8 text-rose-300"
          />
          <p className="mt-3 font-semibold text-slate-700">
            Henüz geri sayım yok
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Heyecanla beklediğiniz ilk günü ekleyin. ♡
          </p>
        </div>
      )}
      <button
        aria-label="Yeni geri sayım ekle"
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-rose-500 text-white shadow-[0_12px_25px_rgba(244,63,94,0.35)] transition hover:scale-105 sm:bottom-8 sm:right-8"
        onClick={() => setIsSheetOpen(true)}
        type="button"
      >
        <Plus className="size-6" />
      </button>
      {isSheetOpen ? (
        <CountdownSheet
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}
