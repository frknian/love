import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatRelativeTimeTr } from "@/lib/date-utils";
import { getInteraction } from "@/lib/notifications/interactions";
import type { AppNotification } from "@/types/notifications";

interface LatestInteractionCardProps {
  notification: AppNotification | null;
  currentUserId: string;
}

export function LatestInteractionCard({
  notification,
  currentUserId,
}: LatestInteractionCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Son etkileşim</p>
        <Sparkles aria-hidden="true" className="size-4 text-rose-300" />
      </div>
      {notification ? (
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-2xl text-lg ${getInteraction(notification.type).color.bubble}`}
          >
            {notification.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-700">
              {notification.title}
            </p>
            <p className="truncate text-xs text-slate-400">
              {notification.senderId === currentUserId
                ? "Sen gönderdin"
                : `${notification.senderName} gönderdi`}{" "}
              • {formatRelativeTimeTr(notification.createdAt)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Henüz etkileşim yok. İlk kalbi sen gönder. ♡
        </p>
      )}
      <Link
        className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
        href="/bildirimler"
      >
        Tüm bildirimler
        <ChevronRight className="size-3.5" />
      </Link>
    </Card>
  );
}
