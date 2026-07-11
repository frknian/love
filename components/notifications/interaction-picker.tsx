"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { NotificationAnimation } from "@/components/notifications/notification-animation";
import { Card } from "@/components/ui/card";
import { triggerHaptic } from "@/lib/notifications/haptics";
import {
  getInteraction,
  interactionCatalog,
} from "@/lib/notifications/interactions";
import { notificationsService } from "@/services/notifications/notifications-service";
import type { InteractionDefinition } from "@/types/notifications";

interface InteractionPickerProps {
  coupleId: string;
  currentUserId: string;
  partnerId: string;
  partnerName: string;
}

export function InteractionPicker({
  coupleId,
  currentUserId,
  partnerId,
  partnerName,
}: InteractionPickerProps) {
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [sentInteraction, setSentInteraction] =
    useState<InteractionDefinition | null>(null);
  const [error, setError] = useState<string>();
  const dismissTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(dismissTimer.current);
  }, []);

  async function handleSend(interaction: InteractionDefinition) {
    if (sendingType) return;
    setSendingType(interaction.type);
    setError(undefined);
    try {
      await notificationsService.send(
        notificationsService.buildInteractionInput(
          interaction.type,
          coupleId,
          currentUserId,
          partnerId,
        ),
      );
      triggerHaptic(interaction.hapticPattern);
      setSentInteraction(getInteraction(interaction.type));
      window.clearTimeout(dismissTimer.current);
      dismissTimer.current = window.setTimeout(
        () => setSentInteraction(null),
        2800,
      );
    } catch {
      setError("Etkileşim gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setSendingType(null);
    }
  }

  return (
    <Card aria-label="Duygusal etkileşim gönder" role="group">
      <h2 className="text-lg font-semibold tracking-tight text-slate-800">
        Bugün ona ne göndermek istersin?
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Tek dokunuşla {partnerName} anında haberdar olur.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {interactionCatalog.map((interaction) => (
          <button
            aria-label={`${interaction.title} gönder`}
            className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 disabled:opacity-50 ${interaction.color.surface}`}
            disabled={sendingType !== null}
            key={interaction.type}
            onClick={() => handleSend(interaction)}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl">
              {sendingType === interaction.type ? (
                <motion.span
                  animate={{ scale: [1, 1.35, 1] }}
                  className="inline-block"
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {interaction.icon}
                </motion.span>
              ) : (
                interaction.icon
              )}
            </span>
            <span
              className={`text-[10px] font-semibold leading-tight ${interaction.color.accent}`}
            >
              {interaction.title}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <AnimatePresence>
        {sentInteraction ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-live="polite"
            className="fixed inset-0 z-[65] grid place-items-center bg-slate-900/20 backdrop-blur-[2px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setSentInteraction(null)}
          >
            <div className="relative h-72 w-full max-w-sm">
              <NotificationAnimation animation={sentInteraction.animation} />
              <motion.p
                animate={{ y: 0, opacity: 1 }}
                className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/90 px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-lg"
                initial={{ y: 12, opacity: 0 }}
              >
                {sentInteraction.icon} {partnerName} kişisine gönderildi ♡
              </motion.p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
