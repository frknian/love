import Image from "next/image";

import { Card } from "@/components/ui/card";
import type { HomeSnapshot } from "@/types/home";

type LatestPhotoCardProps = HomeSnapshot["latestPhoto"];

export function LatestPhotoCard({
  title,
  date,
  imageUrl,
}: LatestPhotoCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-[16/9] bg-rose-50">
        <Image
          alt="Son eklenen anı için yer tutucu"
          className="object-cover"
          fill
          sizes="(max-width: 640px) 100vw, 42rem"
          src={imageUrl}
        />
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-500">Son eklenen anı</p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <time className="shrink-0 text-xs text-slate-400">{date}</time>
        </div>
      </div>
    </Card>
  );
}
