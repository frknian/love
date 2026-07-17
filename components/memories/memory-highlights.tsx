"use client";

import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { nextStoryIndex } from "@/lib/social/mood-catalog";
import { notificationsService } from "@/services/notifications/notifications-service";
import type { MemoriesContext, Memory } from "@/types/memories";
import type {
  MemoryHighlightItemRow,
  MemoryHighlightRow,
} from "@/types/social";

interface MemoryHighlightsProps {
  context: MemoriesContext;
  highlights: MemoryHighlightRow[];
  items: MemoryHighlightItemRow[];
  memories: Memory[];
}

export function MemoryHighlights({
  context,
  highlights,
  items,
  memories,
}: MemoryHighlightsProps) {
  const router = useRouter();
  const photos = useMemo(
    () =>
      memories.filter(
        (memory) => memory.mediaType === "photo" && memory.imageUrl,
      ),
    [memories],
  );
  const [activeHighlight, setActiveHighlight] =
    useState<MemoryHighlightRow | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [managing, setManaging] = useState<MemoryHighlightRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const swipeStart = useRef<number | null>(null);

  function highlightPhotos(highlightId: string) {
    const memoryIds = items
      .filter((item) => item.highlight_id === highlightId)
      .map((item) => item.memory_id);
    return memoryIds
      .map((id) => photos.find((memory) => memory.id === id))
      .filter((memory): memory is Memory => Boolean(memory));
  }

  function open(highlight: MemoryHighlightRow) {
    if (!highlightPhotos(highlight.id).length) {
      setManaging(highlight);
      return;
    }
    setActiveHighlight(highlight);
    setActiveIndex(0);
  }

  function navigate(direction: -1 | 1) {
    if (!activeHighlight) return;
    const groupPhotos = highlightPhotos(activeHighlight.id);
    setActiveIndex((current) =>
      nextStoryIndex(current, direction, groupPhotos.length),
    );
  }

  async function createHighlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    const title = String(new FormData(event.currentTarget).get("title") ?? "")
      .trim()
      .slice(0, 60);
    const { error: insertError } = await createClient()
      .from("memory_highlights")
      .insert({
        couple_id: context.coupleId,
        created_by: context.userId,
        title,
        position: highlights.length,
      });
    if (insertError) setError("Öne çıkan grup oluşturulamadı.");
    else {
      if (context.partnerId)
        void notificationsService
          .send({
            coupleId: context.coupleId,
            senderId: context.userId,
            receiverId: context.partnerId,
            type: "highlight_memory",
            title: "Yeni öne çıkan anı",
            message: `${context.displayName}, “${title}” grubunu oluşturdu.`,
            icon: "⭕",
            animation: "camera",
          })
          .catch(() => undefined);
      setIsCreating(false);
      router.refresh();
    }
    setIsSaving(false);
  }

  async function toggleMemory(
    highlight: MemoryHighlightRow,
    memory: Memory,
    selected: boolean,
  ) {
    setIsSaving(true);
    setError(undefined);
    const supabase = createClient();
    if (selected) {
      const groupItems = items.filter(
        (item) => item.highlight_id === highlight.id,
      );
      const { error: insertError } = await supabase
        .from("memory_highlight_items")
        .insert({
          highlight_id: highlight.id,
          couple_id: context.coupleId,
          memory_id: memory.id,
          created_by: context.userId,
          position: groupItems.length,
        });
      if (insertError) setError("Fotoğraf gruba eklenemedi.");
      else {
        if (!highlight.cover_memory_id)
          await supabase
            .from("memory_highlights")
            .update({ cover_memory_id: memory.id })
            .eq("id", highlight.id);
        if (context.partnerId)
          void notificationsService
            .send({
              coupleId: context.coupleId,
              senderId: context.userId,
              receiverId: context.partnerId,
              type: "highlight_memory",
              title: "Öne çıkanlara fotoğraf eklendi",
              message: `${context.displayName}, “${highlight.title}” grubuna yeni bir fotoğraf ekledi.`,
              icon: "📸",
              animation: "camera",
            })
            .catch(() => undefined);
      }
    } else {
      const { error: deleteError } = await supabase
        .from("memory_highlight_items")
        .delete()
        .eq("highlight_id", highlight.id)
        .eq("memory_id", memory.id);
      if (deleteError) setError("Fotoğraf gruptan çıkarılamadı.");
      else if (highlight.cover_memory_id === memory.id) {
        const replacement = items.find(
          (item) =>
            item.highlight_id === highlight.id && item.memory_id !== memory.id,
        );
        await supabase
          .from("memory_highlights")
          .update({ cover_memory_id: replacement?.memory_id ?? null })
          .eq("id", highlight.id);
      }
    }
    setIsSaving(false);
    router.refresh();
  }

  async function removeHighlight(highlight: MemoryHighlightRow) {
    if (!window.confirm(`“${highlight.title}” grubunu silmek istiyor musun?`))
      return;
    setIsSaving(true);
    const { error: deleteError } = await createClient()
      .from("memory_highlights")
      .delete()
      .eq("id", highlight.id);
    if (deleteError) setError("Grup silinemedi.");
    else {
      setManaging(null);
      router.refresh();
    }
    setIsSaving(false);
  }

  async function setCover(highlightId: string, memoryId: string | null) {
    setIsSaving(true);
    setError(undefined);
    const { error: updateError } = await createClient()
      .from("memory_highlights")
      .update({ cover_memory_id: memoryId })
      .eq("id", highlightId);
    if (updateError) setError("Kapak fotoğrafı değiştirilemedi.");
    else router.refresh();
    setIsSaving(false);
  }

  async function move(highlight: MemoryHighlightRow, direction: -1 | 1) {
    const currentIndex = highlights.findIndex(
      (item) => item.id === highlight.id,
    );
    const swapWith = highlights[currentIndex + direction];
    if (!swapWith) return;
    setIsSaving(true);
    const supabase = createClient();
    const results = await Promise.all([
      supabase
        .from("memory_highlights")
        .update({ position: swapWith.position })
        .eq("id", highlight.id),
      supabase
        .from("memory_highlights")
        .update({ position: highlight.position })
        .eq("id", swapWith.id),
    ]);
    if (results.some((result) => result.error))
      setError("Grup sırası değiştirilemedi.");
    setIsSaving(false);
    router.refresh();
  }

  const activePhotos = activeHighlight
    ? highlightPhotos(activeHighlight.id)
    : [];
  const activePhoto = activePhotos[activeIndex];

  return (
    <>
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Öne çıkan anılar
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Hikâyelerinize hızlıca göz atın.
            </p>
          </div>
          <button
            className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-rose-100 px-3 text-xs font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            <Plus className="size-3.5" /> Yeni grup
          </button>
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {highlights.map((highlight) => {
            const groupPhotos = highlightPhotos(highlight.id);
            const cover =
              groupPhotos.find(
                (memory) => memory.id === highlight.cover_memory_id,
              ) ?? groupPhotos[0];
            return (
              <div className="w-20 shrink-0 text-center" key={highlight.id}>
                <button
                  aria-label={`${highlight.title} grubunu aç`}
                  className="size-18 relative mx-auto block rounded-full bg-gradient-to-br from-rose-400 via-pink-400 to-violet-400 p-[3px] shadow-sm"
                  onClick={() => open(highlight)}
                  type="button"
                >
                  <span className="relative block size-full overflow-hidden rounded-full border-2 border-white bg-rose-50 dark:border-slate-900">
                    {cover?.imageUrl ? (
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="72px"
                        src={cover.imageUrl}
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-xl">
                        ♡
                      </span>
                    )}
                  </span>
                </button>
                <p className="mt-1.5 truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {highlight.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  {groupPhotos.length} fotoğraf
                </p>
              </div>
            );
          })}
          {!highlights.length ? (
            <button
              className="flex min-w-36 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 px-4 py-4 text-xs font-medium text-rose-500"
              onClick={() => setIsCreating(true)}
              type="button"
            >
              <Plus className="mb-1 size-5" />
              İlk grubunu oluştur
            </button>
          ) : null}
        </div>
      </div>

      {activeHighlight && activePhoto?.imageUrl ? (
        <div
          className="fixed inset-0 z-[100] bg-slate-950 text-white"
          onTouchEnd={(event) => {
            if (swipeStart.current === null) return;
            const delta = event.changedTouches[0].clientX - swipeStart.current;
            if (Math.abs(delta) > 45) navigate(delta > 0 ? -1 : 1);
            swipeStart.current = null;
          }}
          onTouchStart={(event) => {
            swipeStart.current = event.touches[0].clientX;
          }}
        >
          <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            {activePhotos.map((photo, index) => (
              <span
                className={`h-1 flex-1 rounded-full ${
                  index <= activeIndex ? "bg-white" : "bg-white/30"
                }`}
                key={photo.id}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 top-8 z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <p className="text-sm font-semibold">{activeHighlight.title}</p>
            <div className="flex gap-2">
              <button
                aria-label="Öne çıkan grubu düzenle"
                className="grid size-10 place-items-center rounded-full bg-black/35"
                onClick={() => {
                  setManaging(activeHighlight);
                  setActiveHighlight(null);
                }}
                type="button"
              >
                <Pencil className="size-4" />
              </button>
              <button
                aria-label="Hikâye görüntüleyicisini kapat"
                className="grid size-10 place-items-center rounded-full bg-black/35"
                onClick={() => setActiveHighlight(null)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <Image
            alt={activePhoto.title}
            className="object-contain"
            fill
            priority
            sizes="100vw"
            src={activePhoto.imageUrl}
          />
          <button
            aria-label="Önceki fotoğraf"
            className="absolute inset-y-20 left-0 z-10 w-1/3"
            onClick={() => navigate(-1)}
            type="button"
          />
          <button
            aria-label="Sonraki fotoğraf"
            className="absolute inset-y-20 right-0 z-10 w-1/3"
            onClick={() => navigate(1)}
            type="button"
          />
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
            <p className="font-semibold">{activePhoto.title}</p>
            {activePhoto.description ? (
              <p className="mt-1 text-sm text-white/80">
                {activePhoto.description}
              </p>
            ) : null}
            {activePhoto.memoryDate ? (
              <p className="mt-2 text-xs text-white/60">
                {new Intl.DateTimeFormat("tr-TR", {
                  dateStyle: "long",
                }).format(new Date(`${activePhoto.memoryDate}T12:00:00`))}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isCreating ? (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-900/35 p-4 backdrop-blur-sm sm:place-items-center">
          <form
            className="w-full max-w-md rounded-3xl bg-[#fffafd] p-5 dark:bg-slate-900"
            onSubmit={createHighlight}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                Yeni öne çıkan grup
              </h2>
              <button
                aria-label="Kapat"
                onClick={() => setIsCreating(false)}
                type="button"
              >
                <X className="size-5 text-slate-400" />
              </button>
            </div>
            <input
              className="mt-4 w-full rounded-xl border border-rose-100 bg-white px-3 py-3 text-sm"
              maxLength={60}
              name="title"
              placeholder="Örn. İlk Buluşma"
              required
            />
            {error ? (
              <p className="mt-3 text-xs text-rose-600">{error}</p>
            ) : null}
            <button
              className="mt-4 min-h-11 w-full rounded-xl bg-rose-500 text-sm font-semibold text-white"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Oluşturuluyor…" : "Grubu oluştur"}
            </button>
          </form>
        </div>
      ) : null}

      {managing ? (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-900/35 p-4 backdrop-blur-sm sm:place-items-center">
          <section className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#fffafd] p-5 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-500">Grubu düzenle</p>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                  {managing.title}
                </h2>
              </div>
              <button
                aria-label="Düzenlemeyi kapat"
                onClick={() => setManaging(null)}
                type="button"
              >
                <X className="size-5 text-slate-400" />
              </button>
            </div>
            {highlightPhotos(managing.id).length ? (
              <label className="mt-4 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Kapak fotoğrafı
                <select
                  className="mt-2 w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm dark:bg-slate-800"
                  disabled={isSaving}
                  onChange={(event) =>
                    void setCover(managing.id, event.target.value || null)
                  }
                  value={managing.cover_memory_id ?? ""}
                >
                  <option value="">İlk fotoğrafı kullan</option>
                  {highlightPhotos(managing.id).map((memory) => (
                    <option key={memory.id} value={memory.id}>
                      {memory.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {photos.map((memory) => {
                const selected = items.some(
                  (item) =>
                    item.highlight_id === managing.id &&
                    item.memory_id === memory.id,
                );
                return (
                  <button
                    aria-pressed={selected}
                    className={`border-3 relative aspect-square overflow-hidden rounded-2xl ${
                      selected ? "border-rose-500" : "border-transparent"
                    }`}
                    disabled={isSaving}
                    key={memory.id}
                    onClick={() =>
                      void toggleMemory(managing, memory, !selected)
                    }
                    type="button"
                  >
                    {memory.imageUrl ? (
                      <Image
                        alt={memory.title}
                        className="object-cover"
                        fill
                        sizes="(max-width: 640px) 33vw, 10rem"
                        src={memory.imageUrl}
                      />
                    ) : null}
                    {selected ? (
                      <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] text-white">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {!photos.length ? (
              <p className="mt-4 text-sm text-slate-400">
                Önce normal anılar akışına bir fotoğraf ekle.
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-xs text-rose-600">{error}</p>
            ) : null}
            <div className="mt-5 flex gap-2">
              <button
                aria-label="Grubu sola taşı"
                className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500"
                onClick={() => void move(managing, -1)}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                aria-label="Grubu sağa taşı"
                className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500"
                onClick={() => void move(managing, 1)}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-50 px-3 text-xs font-semibold text-rose-600"
                onClick={() => void removeHighlight(managing)}
                type="button"
              >
                {isSaving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Grubu sil
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
