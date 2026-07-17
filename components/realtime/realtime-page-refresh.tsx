"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

export interface RealtimeSubscription {
  table: string;
  filter: string;
}

interface RealtimePageRefreshProps {
  channelName: string;
  subscriptions: RealtimeSubscription[];
}

/**
 * Server Component ile yüklenen ekranları, ilgili çift verisi değiştiğinde
 * yeniler. Kısa debounce aynı işlemdeki çoklu tablo olaylarını tek render'a
 * indirir; bu yüzden Realtime, arayüzü gereksiz yere yormaz.
 */
export function RealtimePageRefresh({
  channelName,
  subscriptions,
}: RealtimePageRefreshProps) {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current !== null) return;
    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null;
      router.refresh();
    }, 250);
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(channelName);

    for (const subscription of subscriptions) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: subscription.table,
          filter: subscription.filter,
        },
        scheduleRefresh,
      );
    }

    channel.subscribe();
    return () => {
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [channelName, scheduleRefresh, subscriptions]);

  return null;
}
