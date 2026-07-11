"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

import { NotificationAnimation } from "@/components/notifications/notification-animation";
import { formatDateTr, formatTimeTr } from "@/lib/date-utils";
import { getInteraction } from "@/lib/notifications/interactions";
import type { AppNotification } from "@/types/notifications";

interface NotificationDetailModalProps {
  notification: AppNotification;
  onClose: () => void;
}

export function NotificationDetailModal({
  notification,
  onClose,
}: NotificationDetailModalProps) {
  const interaction = getInteraction(notification.type);
  const createdAt = new Date(notification.createdAt);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/35 px-5 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.section
          animate={{ scale: 1, y: 0, opacity: 1 }}
          aria-label={`${notification.title} bildirimi`}
          aria-modal="true"
          className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-[#fffafd] shadow-2xl"
          exit={{ scale: 0.92, y: 16, opacity: 0 }}
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
        >
          <div className="relative h-44 bg-gradient-to-b from-rose-50 to-transparent">
            <NotificationAnimation animation={notification.animation} />
            <span
              aria-hidden="true"
              className={`absolute bottom-3 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-3xl text-3xl shadow-sm ${interaction.color.bubble}`}
            >
              {notification.icon}
            </span>
          </div>
          <button
            aria-label="Bildirimi kapat"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/85 text-slate-500 shadow-sm transition hover:text-rose-500"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
          <div className="px-6 pb-7 pt-4 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-slate-800">
              {notification.title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              <span className={`font-semibold ${interaction.color.accent}`}>
                {notification.senderName}
              </span>{" "}
              gönderdi
            </p>
            <p className="mt-4 rounded-2xl bg-rose-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
              {notification.message}
            </p>
            <time
              className="mt-4 block text-xs text-slate-400"
              dateTime={notification.createdAt}
            >
              {formatDateTr(createdAt)} • {formatTimeTr(createdAt)}
            </time>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
