"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface NotificationBellProps {
  currentUserId: string;
}

/** Okunmamış bildirim rozetiyle bildirim geçmişine giden zil. */
export function NotificationBell({ currentUserId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const { count } = await createClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [currentUserId]);

  useEffect(() => {
    void refreshCount();
    const supabase = createClient();
    const channel = supabase
      .channel(`notification-bell:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => void refreshCount(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, refreshCount]);

  return (
    <Link
      aria-label={
        unreadCount > 0
          ? `Bildirimler, ${unreadCount} okunmamış`
          : "Bildirimler"
      }
      className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white/80 text-slate-500 shadow-sm transition hover:text-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 dark:bg-white/10 dark:text-slate-300"
      href="/bildirimler"
    >
      <Bell className="size-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
