"use client";

import dynamic from "next/dynamic";

import { AnimatePresence } from "framer-motion";
import { ListChecks, Plus, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";

import { BucketListCard } from "@/components/bucket/bucket-list-card";
import { BucketListDetail } from "@/components/bucket/bucket-list-detail";
import { useToast } from "@/components/ui/toast-provider";
import { useBucketList } from "@/hooks/use-bucket-list";
import { withProgress } from "@/lib/bucket/bucket-mapper";
import {
  bucketService,
  type BucketListInput,
} from "@/services/bucket/bucket-service";
import type { BucketItem, BucketList } from "@/types/bucket";

// Yalnızca kullanıcı açtığında yüklenir; ilk paket boyutunu küçültür.
const BucketListSheet = dynamic(
  () =>
    import("@/components/bucket/bucket-list-sheet").then(
      (m) => m.BucketListSheet,
    ),
  { ssr: false },
);

interface BucketListsWorkspaceProps {
  initialLists: BucketList[];
  initialItems: BucketItem[];
  coupleId: string;
  currentUserId: string;
}

export function BucketListsWorkspace({
  initialLists,
  initialItems,
  coupleId,
  currentUserId,
}: BucketListsWorkspaceProps) {
  const {
    lists,
    itemsByListId,
    realtimeError,
    upsertList,
    upsertItem,
    removeItem,
    removeList,
  } = useBucketList({ initialLists, initialItems, coupleId });
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [error, setError] = useState<string>();
  const { showToast } = useToast();

  const listsWithProgress = useMemo(
    () =>
      lists.map((list) => withProgress(list, itemsByListId.get(list.id) ?? [])),
    [itemsByListId, lists],
  );

  const selectedList = listsWithProgress.find(
    (list) => list.id === selectedListId,
  );

  async function handleCreateList(input: BucketListInput) {
    setError(undefined);
    const row = await bucketService.createList(coupleId, currentUserId, input);
    upsertList({
      id: row.id,
      coupleId: row.couple_id,
      title: row.title,
      description: row.description,
      coverImage: row.cover_image,
      color: row.color,
      createdBy: row.created_by,
      createdAt: row.created_at,
    });
    showToast("Liste oluşturuldu.");
  }

  if (selectedList) {
    return (
      <BucketListDetail
        coupleId={coupleId}
        currentUserId={currentUserId}
        items={itemsByListId.get(selectedList.id) ?? []}
        list={selectedList}
        onBack={() => setSelectedListId(null)}
        onItemRemoved={removeItem}
        onItemUpserted={upsertItem}
        onListDeleted={removeList}
      />
    );
  }

  return (
    <div className="relative">
      {realtimeError ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <WifiOff className="size-3.5" />
          {realtimeError}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {listsWithProgress.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {listsWithProgress.map((list) => (
              <BucketListCard
                key={list.id}
                list={list}
                onOpen={(item) => setSelectedListId(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <ListChecks
            aria-hidden="true"
            className="mx-auto size-8 text-rose-300"
          />
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            Henüz bir liste yok
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Birlikte yapmak istediklerinizi listeleyin. ♡
          </p>
        </div>
      )}
      <button
        aria-label="Yeni liste ekle"
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-rose-500 text-white shadow-[0_12px_25px_rgba(244,63,94,0.35)] transition hover:scale-105 sm:bottom-8 sm:right-8"
        onClick={() => setIsSheetOpen(true)}
        type="button"
      >
        <Plus className="size-6" />
      </button>
      {isSheetOpen ? (
        <BucketListSheet
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleCreateList}
        />
      ) : null}
    </div>
  );
}
