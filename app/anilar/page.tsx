import { Heart } from "lucide-react";

import { MemoriesManager } from "@/components/memories/memories-manager";
import { MemoryCard } from "@/components/memories/memory-card";
import { MemoryHighlights } from "@/components/memories/memory-highlights";
import { PageShell } from "@/components/layout/page-shell";
import { RealtimePageRefresh } from "@/components/realtime/realtime-page-refresh";
import { Card } from "@/components/ui/card";
import {
  getAlbums,
  getMemories,
  getMemoriesContext,
  getMemoryHighlights,
} from "@/lib/memories";

export default async function MemoriesPage() {
  const [context, albums, memories, highlightData] = await Promise.all([
    getMemoriesContext(),
    getAlbums(),
    getMemories(),
    getMemoryHighlights(),
  ]);
  const albumsWithPreviews = albums.map((album) => {
    const preview =
      (album.coverImage
        ? memories.find((memory) => memory.imagePath === album.coverImage)
        : undefined) ?? memories.find((memory) => memory.albumId === album.id);
    return { ...album, coverImageUrl: preview?.imageUrl ?? undefined };
  });

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <Heart className="size-7 fill-current" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800">
          Anılar
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Birlikte biriktirdiğiniz güzel anları güvenle saklayın.
        </p>

        {context ? (
          <MemoryHighlights
            context={context}
            highlights={highlightData.highlights}
            items={highlightData.items}
            memories={memories}
          />
        ) : null}

        {context ? (
          <div className="mt-6">
            <RealtimePageRefresh
              channelName={"memories:" + context.coupleId}
              subscriptions={[
                "albums",
                "memories",
                "memory_highlights",
                "memory_highlight_items",
              ].map((table) => ({
                table,
                filter: "couple_id=eq." + context.coupleId,
              }))}
            />
            <MemoriesManager albums={albumsWithPreviews} context={context} />
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Tüm anılar</h2>
          <span className="text-xs text-slate-400">{memories.length} anı</span>
        </div>
        {memories.length ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        ) : (
          <Card className="mt-3 py-10 text-center">
            <Heart className="mx-auto size-7 text-rose-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Henüz bir anı yok
            </p>
            <p className="mt-1 text-sm text-slate-400">
              İlk fotoğrafınızı ekleyerek başlayın. ♡
            </p>
          </Card>
        )}
      </section>
    </PageShell>
  );
}
