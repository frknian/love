"use client";

import { motion } from "framer-motion";

import { formatRelativeTimeTr } from "@/lib/date-utils";
import { getInteraction } from "@/lib/notifications/interactions";
import type { AppNotification } from "@/types/notifications";

interface NotificationCardProps {
  notification: AppNotification;
  currentUserId: string;
  onOpen: (notification: AppNotification) => void;
}

export function NotificationCard({
  notification,
  currentUserId,
  onOpen,
}: NotificationCardProps) {
  const interaction = getInteraction(notification.type);
  const isMine = notification.senderId === currentUserId;
  const isUnread = !notification.isRead && !isMine;

  return (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      aria-label={`${notification.title} bildirimini aç`}
      className="flex w-full items-center gap-3 rounded-3xl border border-white/70 bg-white/65 p-4 text-left shadow-sm backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      layout
      onClick={() => onOpen(notification)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`grid size-12 shrink-0 place-items-center rounded-2xl text-xl ${interaction.color.bubble}`}
      >
        {notification.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-800">
            {notification.title}
          </span>
          {isUnread ? (
            <span
              aria-label="Okunmadı"
              className="size-2 shrink-0 rounded-full bg-rose-500"
            />
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-400">
          {isMine ? "Sen gönderdin" : `${notification.senderName} gönderdi`} •{" "}
          {formatRelativeTimeTr(notification.createdAt)}
        </span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
          isMine ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-600"
        }`}
      >
        {isMine ? "Gönderilen" : "Sana"}
      </span>
    </motion.button>
  );
}
