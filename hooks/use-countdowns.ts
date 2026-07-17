"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toCountdown } from "@/lib/countdowns/countdown-mapper";
import { sortCountdowns } from "@/lib/countdowns/countdown-math";
import { createClient } from "@/lib/supabase/client";
import type { Countdown, CountdownRow } from "@/types/countdowns";

interface UseCountdownsOptions {
  initialCountdowns: Countdown[];
  coupleId: string;
}

export function useCountdowns({
  initialCountdowns,
  coupleId,
}: UseCountdownsOptions) {
  const [countdowns, setCountdowns] = useState(() =>
    sortCountdowns(initialCountdowns),
  );
  const [realtimeError, setRealtimeError] = useState<string>();

  const upsert = useCallback((countdown: Countdown) => {
    setCountdowns((current) =>
      sortCountdowns([
        countdown,
        ...current.filter((item) => item.id !== countdown.id),
      ]),
    );
  }, []);

  const remove = useCallback((countdownId: string) => {
    setCountdowns((current) =>
      current.filter((countdown) => countdown.id !== countdownId),
    );
  }, []);

  useEffect(() => {
    const supabase = createClient();

    function handleChange(
      payload: RealtimePostgresChangesPayload<CountdownRow>,
    ) {
      if (payload.eventType === "DELETE") {
        remove(String(payload.old.id));
        return;
      }
      const row = payload.new as CountdownRow;
      if (row.couple_id !== coupleId) return;
      upsert(toCountdown(row));
    }

    const channel = supabase
      .channel(`countdowns:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "countdowns",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "countdowns",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "countdowns",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setRealtimeError(
            "Geri sayımların canlı senkronizasyonu geçici olarak kullanılamıyor.",
          );
        if (status === "SUBSCRIBED") setRealtimeError(undefined);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, remove, upsert]);

  return useMemo(
    () => ({ countdowns, realtimeError, upsert, remove }),
    [countdowns, realtimeError, remove, upsert],
  );
}
