import { CheckCircle2, Images, NotebookPen, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ProfileStats } from "@/lib/profile/queries";

interface ProfileStatsGridProps {
  stats: ProfileStats;
}

export function ProfileStatsGrid({ stats }: ProfileStatsGridProps) {
  const tiles = [
    {
      label: "Paylaşılan Anı",
      value: stats.totalMemories,
      icon: Images,
      color: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
    },
    {
      label: "Yazılan Not",
      value: stats.totalNotes,
      icon: NotebookPen,
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    },
    {
      label: "Gönderilen Etkileşim",
      value: stats.totalInteractionsSent,
      icon: Sparkles,
      color: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    },
    {
      label: "Tamamlanan Bucket Maddesi",
      value: stats.completedBucketItems,
      icon: CheckCircle2,
      color:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <Card className="p-4" key={tile.label}>
          <span
            className={`grid size-9 place-items-center rounded-xl ${tile.color}`}
          >
            <tile.icon className="size-4" />
          </span>
          <p className="mt-2.5 text-2xl font-bold text-slate-800 dark:text-slate-100">
            {tile.value}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{tile.label}</p>
        </Card>
      ))}
    </div>
  );
}
