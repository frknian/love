"use client";

import {
  CalendarDays,
  Heart,
  House,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  MoreMenuSheet,
  useMoreMenu,
} from "@/components/navigation/more-menu-sheet";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/types/navigation";

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Ana Sayfa", icon: House },
  { href: "/takvim", label: "Takvim", icon: CalendarDays },
  { href: "/anilar", label: "Anılar", icon: Heart },
  { href: "/profil", label: "Profil", icon: UserRound },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const moreMenu = useMoreMenu();

  return (
    <>
      <nav
        aria-label="Ana navigasyon"
        className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center justify-around rounded-[1.75rem] border border-white/80 bg-white/80 px-2 py-2 shadow-[0_8px_30px_rgba(112,68,78,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85 sm:bottom-6"
      >
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
                  : "text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400",
              )}
              href={href}
              key={href}
            >
              <Icon
                aria-hidden="true"
                className="size-[19px]"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <button
          aria-label="Diğer modüller"
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium text-slate-400 transition-colors hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
          onClick={moreMenu.open}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" className="size-[19px]" />
          <span className="truncate">Diğer</span>
        </button>
      </nav>
      <MoreMenuSheet isOpen={moreMenu.isOpen} onClose={moreMenu.close} />
    </>
  );
}
