"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toBucketItem, toBucketList } from "@/lib/bucket/bucket-mapper";
import { createClient } from "@/lib/supabase/client";
import type {
  BucketItem,
  BucketItemRow,
  BucketList,
  BucketListRow,
} from "@/types/bucket";

interface UseBucketListOptions {
  initialLists: BucketList[];
  initialItems: BucketItem[];
  coupleId: string;
}

function orderLists(lists: BucketList[]) {
  return [...lists].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}

export function useBucketList({
  initialLists,
  initialItems,
  coupleId,
}: UseBucketListOptions) {
  const [lists, setLists] = useState(() => orderLists(initialLists));
  const [items, setItems] = useState(initialItems);
  const [realtimeError, setRealtimeError] = useState<string>();
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const upsertList = useCallback((list: BucketList) => {
    setLists((current) =>
      orderLists([list, ...current.filter((item) => item.id !== list.id)]),
    );
  }, []);

  const removeList = useCallback((listId: string) => {
    setLists((current) => current.filter((list) => list.id !== listId));
    setItems((current) =>
      current.filter((item) => item.bucketListId !== listId),
    );
  }, []);

  const upsertItem = useCallback((item: BucketItem) => {
    setItems((current) => [
      item,
      ...current.filter((existing) => existing.id !== item.id),
    ]);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    function handleListChange(
      payload: RealtimePostgresChangesPayload<BucketListRow>,
    ) {
      if (payload.eventType === "DELETE") {
        removeList(String(payload.old.id));
        return;
      }
      const row = payload.new as BucketListRow;
      if (row.couple_id !== coupleId) return;
      upsertList(toBucketList(row));
    }

    function handleItemChange(
      payload: RealtimePostgresChangesPayload<BucketItemRow>,
    ) {
      if (payload.eventType === "DELETE") {
        removeItem(String(payload.old.id));
        return;
      }
      const row = payload.new as BucketItemRow;
      if (row.couple_id !== coupleId) return;
      const existing = itemsRef.current.find((item) => item.id === row.id);
      upsertItem(toBucketItem(row, existing?.completedByName ?? null));
    }

    const channel = supabase
      .channel(`bucket:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bucket_lists",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleListChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bucket_items",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleItemChange,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setRealtimeError("Bucket list canlı senkronizasyonu kullanılamıyor.");
        if (status === "SUBSCRIBED") setRealtimeError(undefined);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, removeItem, removeList, upsertItem, upsertList]);

  const itemsByListId = useMemo(() => {
    const map = new Map<string, BucketItem[]>();
    for (const item of items) {
      const bucket = map.get(item.bucketListId) ?? [];
      bucket.push(item);
      map.set(
        item.bucketListId,
        [...bucket].sort((a, b) => a.position - b.position),
      );
    }
    return map;
  }, [items]);

  return useMemo(
    () => ({
      lists,
      items,
      itemsByListId,
      realtimeError,
      upsertList,
      removeList,
      upsertItem,
      removeItem,
      setItems,
    }),
    [
      items,
      itemsByListId,
      lists,
      realtimeError,
      removeItem,
      removeList,
      upsertItem,
      upsertList,
    ],
  );
}
