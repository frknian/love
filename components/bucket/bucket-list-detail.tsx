"use client";

import dynamic from "next/dynamic";

import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { BucketItemRow } from "@/components/bucket/bucket-item-row";
import { getBucketColorDefinition } from "@/lib/bucket/bucket-catalog";
import { useToast } from "@/components/ui/toast-provider";
import {
  bucketService,
  type BucketItemInput,
} from "@/services/bucket/bucket-service";
import type { BucketItem, BucketListWithProgress } from "@/types/bucket";

// Yalnızca kullanıcı açtığında yüklenir; ilk paket boyutunu küçültür.
const BucketItemSheet = dynamic(
  () =>
    import("@/components/bucket/bucket-item-sheet").then(
      (m) => m.BucketItemSheet,
    ),
  { ssr: false },
);

interface BucketListDetailProps {
  list: BucketListWithProgress;
  items: BucketItem[];
  coupleId: string;
  currentUserId: string;
  onBack: () => void;
  onItemUpserted: (item: BucketItem) => void;
  onItemRemoved: (itemId: string) => void;
  onListDeleted: (listId: string) => void;
}

const AUTO_SORT_STORAGE_KEY = "ask-bucket-auto-sort-completed";

export function BucketListDetail({
  list,
  items,
  coupleId,
  currentUserId,
  onBack,
  onItemUpserted,
  onItemRemoved,
  onListDeleted,
}: BucketListDetailProps) {
  const colorDefinition = getBucketColorDefinition(list.color);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [autoSort, setAutoSort] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTO_SORT_STORAGE_KEY) === "true";
  });
  const { showToast } = useToast();
  const dragItemId = useRef<string | null>(null);
  const dragOverItemId = useRef<string | null>(null);

  const orderedItems = useMemo(() => {
    if (!autoSort) return items;
    return [...items].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.position - b.position;
    });
  }, [autoSort, items]);

  function toggleAutoSort() {
    setAutoSort((current) => {
      const next = !current;
      window.localStorage.setItem(AUTO_SORT_STORAGE_KEY, String(next));
      return next;
    });
  }

  async function handleAddItem(input: BucketItemInput) {
    setError(undefined);
    const nextPosition = items.length
      ? Math.max(...items.map((item) => item.position)) + 1
      : 0;
    const row = await bucketService.createItem(
      list.id,
      coupleId,
      nextPosition,
      input,
    );
    onItemUpserted({
      id: row.id,
      bucketListId: row.bucket_list_id,
      coupleId: row.couple_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      position: row.position,
      completed: row.completed,
      completedAt: row.completed_at,
      completedBy: row.completed_by,
      completedByName: null,
      createdAt: row.created_at,
    });
    showToast("Madde eklendi.");
  }

  async function handleToggle(item: BucketItem) {
    setError(undefined);
    try {
      const row = await bucketService.toggleCompleted(
        item.id,
        !item.completed,
        currentUserId,
      );
      onItemUpserted({
        ...item,
        completed: row.completed,
        completedAt: row.completed_at,
        completedBy: row.completed_by,
        completedByName: row.completed ? "Sen" : null,
      });
      if (row.completed) showToast("Tebrikler, bir maddeyi tamamladın! 🎉");
    } catch {
      setError("Madde güncellenemedi.");
    }
  }

  async function handleDeleteItem(item: BucketItem) {
    const confirmed = window.confirm(
      `"${item.title}" maddesini silmek istiyor musun?`,
    );
    if (!confirmed) return;
    setError(undefined);
    try {
      await bucketService.removeItem(item.id);
      onItemRemoved(item.id);
    } catch {
      setError("Madde silinemedi.");
    }
  }

  async function handleDeleteList() {
    const confirmed = window.confirm(
      `"${list.title}" listesini ve tüm maddelerini silmek istiyor musun?`,
    );
    if (!confirmed) return;
    setError(undefined);
    try {
      await bucketService.removeList(list.id);
      onListDeleted(list.id);
      onBack();
    } catch {
      setError("Liste silinemedi.");
    }
  }

  function handleDragStart(item: BucketItem) {
    dragItemId.current = item.id;
  }

  function handleDragOverItem(item: BucketItem) {
    dragOverItemId.current = item.id;
  }

  async function handleDrop() {
    const fromId = dragItemId.current;
    const toId = dragOverItemId.current;
    dragItemId.current = null;
    dragOverItemId.current = null;
    if (!fromId || !toId || fromId === toId || autoSort) return;

    const currentOrder = [...items].sort((a, b) => a.position - b.position);
    const fromIndex = currentOrder.findIndex((item) => item.id === fromId);
    const toIndex = currentOrder.findIndex((item) => item.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...currentOrder];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updates = reordered.map((item, index) => ({
      id: item.id,
      position: index,
    }));
    updates.forEach(({ id, position }) => {
      const item = items.find((existing) => existing.id === id);
      if (item) onItemUpserted({ ...item, position });
    });

    try {
      await bucketService.reorderItems(updates);
    } catch {
      setError("Sıralama kaydedilemedi.");
    }
  }

  return (
    <div className="relative">
      <button
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="size-4" />
        Tüm listeler
      </button>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-slate-800 dark:text-slate-100">
            {list.title}
          </h2>
          {list.description ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {list.description}
            </p>
          ) : null}
        </div>
        <button
          aria-label="Listeyi sil"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-rose-100 hover:text-rose-600 dark:bg-white/5 dark:text-slate-400"
          onClick={handleDeleteList}
          type="button"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={list.progressPercent}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full ${colorDefinition.bar} transition-all duration-500`}
          style={{ width: `${list.progressPercent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs font-medium text-slate-400">
        {list.completedItems} tamamlandı •{" "}
        {list.totalItems - list.completedItems} kaldı • %{list.progressPercent}
      </p>
      <button
        aria-pressed={autoSort}
        className={`mt-4 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
          autoSort
            ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
            : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
        }`}
        onClick={toggleAutoSort}
        type="button"
      >
        <ArrowUpDown className="size-3.5" />
        Tamamlananları alta taşı
      </button>
      {error ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {orderedItems.length ? (
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {orderedItems.map((item) => (
              <BucketItemRow
                item={item}
                key={item.id}
                onDelete={handleDeleteItem}
                onDragOverItem={handleDragOverItem}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onToggle={handleToggle}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-10 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Bu listede henüz madde yok
          </p>
          <p className="mt-1 text-sm text-slate-400">
            İlk hayalinizi ekleyerek başlayın. ♡
          </p>
        </div>
      )}
      <button
        aria-label="Yeni madde ekle"
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-rose-500 text-white shadow-[0_12px_25px_rgba(244,63,94,0.35)] transition hover:scale-105 sm:bottom-8 sm:right-8"
        onClick={() => setIsSheetOpen(true)}
        type="button"
      >
        <Plus className="size-6" />
      </button>
      {isSheetOpen ? (
        <BucketItemSheet
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleAddItem}
        />
      ) : null}
    </div>
  );
}
