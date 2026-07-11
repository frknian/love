"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Hourglass } from "lucide-react";

import { NotificationAnimation } from "@/components/notifications/notification-animation";
import type { TimeCapsuleMeta } from "@/types/capsule";

interface CapsuleUnlockModalProps {
  capsule: TimeCapsuleMeta;
  onOpenNow: () => void;
  onLater: () => void;
}

/** Kapsül açılma anının konfeti + kalpler + blur ile karşılandığı yumuşak geçişli sahne. */
export function CapsuleUnlockModal({
  capsule,
  onOpenNow,
  onLater,
}: CapsuleUnlockModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
        className="fixed inset-0 z-[75] grid place-items-center bg-slate-900/40 px-5"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.6 }}
      >
        <motion.section
          animate={{ scale: 1, y: 0, opacity: 1 }}
          aria-label="Zaman kapsülü açıldı"
          aria-modal="true"
          className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-[#fffafd] shadow-2xl dark:bg-slate-900"
          exit={{ scale: 0.9, opacity: 0 }}
          initial={{ scale: 0.85, y: 24, opacity: 0 }}
          role="dialog"
          transition={{ type: "spring", damping: 20, stiffness: 220 }}
        >
          <div className="relative h-48 bg-gradient-to-b from-rose-100 to-transparent dark:from-rose-500/10">
            <NotificationAnimation animation="confetti" />
            <NotificationAnimation animation="floating-hearts" />
            <motion.span
              animate={{ scale: [0.9, 1.05, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
              transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Hourglass aria-hidden="true" className="size-16 text-rose-400" />
            </motion.span>
          </div>
          <div className="px-6 pb-7 pt-4 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              Zamanı geldi!
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              &ldquo;{capsule.title}&rdquo; zaman kapsülünüz artık açılmaya
              hazır.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
                onClick={onOpenNow}
                type="button"
              >
                Şimdi Aç
              </button>
              <button
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300"
                onClick={onLater}
                type="button"
              >
                Daha Sonra
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
