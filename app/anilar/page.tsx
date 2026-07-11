import { Heart, Images } from "lucide-react";

import { MemoriesManager } from "@/components/memories/memories-manager";
import { MemoryCard } from "@/components/memories/memory-card";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getAlbums, getMemories, getMemoriesContext } from "@/lib/memories";

export default async function MemoriesPage() {
  const [context, albums, memories] = await Promise.all([
    getMemoriesContext(),
    getAlbums(),
    getMemories(),
  ]);

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

        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Albümler</h2>
          <span className="text-xs text-slate-400">{albums.length} albüm</span>
        </div>
        {albums.length ? (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {albums.map((album) => (
              <Card className="min-w-36 shrink-0 p-4" key={album.id}>
                <Images className="size-5 text-rose-400" />
                <p className="mt-3 max-w-28 truncate text-sm font-semibold text-slate-700">
                  {album.title}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-3 py-6 text-center">
            <p className="text-sm text-slate-500">
              İlk anınızı eklemek için bir albüm oluşturun.
            </p>
          </Card>
        )}

        {context ? (
          <div className="mt-6">
            <MemoriesManager albums={albums} context={context} />
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
