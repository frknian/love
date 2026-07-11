import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import type { Memory } from "@/types/memories";

export function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-[4/3] bg-rose-50">
        {memory.imageUrl ? (
          <Image
            alt={memory.title}
            className="object-cover"
            fill
            sizes="(max-width: 640px) 100vw, 24rem"
            src={memory.imageUrl}
          />
        ) : null}
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-slate-800">{memory.title}</h2>
        {memory.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">
            {memory.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          {memory.memoryDate ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
                new Date(`${memory.memoryDate}T12:00:00`),
              )}
            </span>
          ) : null}
          {memory.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {memory.location}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
