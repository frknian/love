import { CalendarHeart } from "lucide-react";

import { Card } from "@/components/ui/card";

interface StatCardProps {
  days: number;
}

export function StatCard({ days }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-500">
        <CalendarHeart className="size-6" />
      </span>
      <div>
        <p className="text-sm text-slate-500">Birlikte geçen zaman</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-800">
          {days}{" "}
          <span className="text-base font-medium text-slate-500">gün</span>
        </p>
      </div>
    </Card>
  );
}
