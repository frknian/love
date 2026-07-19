"use client";

import dynamic from "next/dynamic";

import { AnimatePresence } from "framer-motion";
import { BellOff, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";

import { NotificationCard } from "@/components/notifications/notification-card";
import { useNotifications } from "@/hooks/use-notifications";
import type {
  AppNotification,
  NotificationFilter,
} from "@/types/notifications";

// Yalnızca kullanıcı açtığında yüklenir; ilk paket boyutunu küçültür.
const NotificationDetailModal = dynamic(
  () =>
    import("@/components/notifications/notification-detail-modal").then(
      (m) => m.NotificationDetailModal,
    ),
  { ssr: false },
);

interface NotificationHistoryProps {
  initialNotifications: AppNotification[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
}

const filters: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "Hepsi" },
  { value: "unread", label: "Okunmayanlar" },
  { value: "sent", label: "Gönderdiklerim" },
  { value: "received", label: "Bana Gelenler" },
];

export function NotificationHistory({
  initialNotifications,
  coupleId,
  currentUserId,
  currentUserName,
  partnerName,
}: NotificationHistoryProps) {
  const { filterNotifications, realtimeError, markAsRead } = useNotifications({
    initialNotifications,
    coupleId,
    currentUserId,
    currentUserName,
    partnerName,
  });
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [active, setActive] = useState<AppNotification | null>(null);
  const [error, setError] = useState<string>();

  const visibleNotifications = useMemo(
    () => filterNotifications(filter),
    [filter, filterNotifications],
  );

  async function handleOpen(notification: AppNotification) {
    setActive(notification);
    setError(undefined);
    const shouldMarkRead =
      !notification.isRead && notification.receiverId === currentUserId;
    if (!shouldMarkRead) return;
    try {
      await markAsRead(notification.id);
    } catch {
      setError("Bildirim okundu olarak işaretlenemedi.");
    }
  }

  return (
    <div>
      <div
        aria-label="Bildirim filtreleri"
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
      >
        {filters.map((item) => (
          <button
            aria-selected={filter === item.value}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
              filter === item.value
                ? "bg-rose-500 text-white"
                : "bg-white/70 text-slate-500 hover:bg-rose-50"
            }`}
            key={item.value}
            onClick={() => setFilter(item.value)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {realtimeError ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <WifiOff className="size-3.5" />
          {realtimeError}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      {visibleNotifications.length ? (
        <div className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {visibleNotifications.map((notification) => (
              <NotificationCard
                currentUserId={currentUserId}
                key={notification.id}
                notification={notification}
                onOpen={handleOpen}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-12 text-center">
          <BellOff
            aria-hidden="true"
            className="mx-auto size-8 text-rose-300"
          />
          <p className="mt-3 font-semibold text-slate-700">
            {filter === "all"
              ? "Henüz bildirim yok"
              : "Bu filtrede bildirim yok"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {filter === "all"
              ? "Ana sayfadan ilk etkileşimini gönderebilirsin. ♡"
              : "Başka bir filtre seçmeyi dene."}
          </p>
        </div>
      )}
      {active ? (
        <NotificationDetailModal
          notification={active}
          onClose={() => setActive(null)}
        />
      ) : null}
    </div>
  );
}
