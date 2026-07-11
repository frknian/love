import { Quote } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { HomeSnapshot } from "@/types/home";

type LatestNoteCardProps = HomeSnapshot["latestNote"];

export function LatestNoteCard({ content, date }: LatestNoteCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Son not</p>
        <Quote className="size-4 text-rose-300" />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{content}</p>
      <time className="mt-3 block text-xs text-slate-400">{date}</time>
    </Card>
  );
}
