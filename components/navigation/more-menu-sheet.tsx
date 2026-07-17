"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  BookHeart,
  Hourglass,
  NotebookPen,
  Settings,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const moreLinks = [
  { href: "/notlar", label: "Notlar", icon: NotebookPen },
  { href: "/gunluk", label: "Ortak Günlük", icon: BookHeart },
  { href: "/bucket-list", label: "Yapmak İstediklerimiz", icon: Target },
  { href: "/zaman-kapsulu", label: "Zaman Kapsülü", icon: Hourglass },
  { href: "/geri-sayimlar", label: "Geri Sayımlar", icon: Sparkles },
  { href: "/bildirimler", label: "Bildirimler", icon: BellRing },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

export function MoreMenuSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] bg-slate-900/25 backdrop-blur-[2px]"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            animate={{ y: 0 }}
            aria-label="Diğer modüller"
            aria-modal="true"
            className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl rounded-t-[2rem] bg-[#fffafd] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900"
            exit={{ y: "100%" }}
            initial={{ y: "100%" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ type: "spring", damping: 28, stiffness: 290 }}
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Diğer
              </h2>
              <button
                aria-label="Kapat"
                className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"
                onClick={onClose}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
                        : "bg-slate-50 text-slate-600 hover:bg-rose-50 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    }`}
                    href={href}
                    key={href}
                    onClick={onClose}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function useMoreMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
