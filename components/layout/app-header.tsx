import { Heart } from "lucide-react";

import { GlobalSearchButton } from "@/components/search/global-search-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { AppUser } from "@/types/auth";

interface AppHeaderProps {
  user: AppUser;
  currentUserId?: string;
  coupleNames?: string;
}

export function AppHeader({
  user,
  currentUserId,
  coupleNames,
}: AppHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <Heart className="size-5 fill-current" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Bizim Hikâyemiz
          </p>
          <p className="max-w-32 truncate text-xs text-slate-400 dark:text-slate-500">
            {coupleNames || user.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <GlobalSearchButton />
        {currentUserId ? (
          <NotificationBell currentUserId={currentUserId} />
        ) : null}
        <span
          aria-label={`${user.name} profil fotoğrafı`}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-300 to-pink-500 text-sm font-semibold text-white"
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  );
}
