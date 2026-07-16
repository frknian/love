"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { runGlobalSearch } from "@/services/search/global-search-service";
import type { SearchResultGroup } from "@/types/search";

interface GlobalSearchDialogProps {
  onClose: () => void;
}

const DEBOUNCE_MS = 300;

export function GlobalSearchDialog({ onClose }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const results = await runGlobalSearch(trimmed);
        if (!cancelled) setGroups(results);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const hasResults = groups.some((group) => group.items.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[90] bg-slate-900/30 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.section
          animate={{ y: 0, opacity: 1 }}
          aria-label="Genel arama"
          aria-modal="true"
          className="mx-auto mt-16 max-h-[75dvh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl bg-[#fffafd] shadow-2xl dark:bg-slate-900"
          exit={{ y: -16, opacity: 0 }}
          initial={{ y: -16, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
        >
          <div className="flex items-center gap-2 border-b border-rose-100 px-4 py-3 dark:border-white/10">
            <Search
              aria-hidden="true"
              className="size-4 shrink-0 text-slate-400"
            />
            <input
              aria-label="Anılar, notlar, günlük, bucket list ve etkinliklerde ara"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Anılar, notlar, günlük, etkinlikler..."
              ref={inputRef}
              value={query}
            />
            {isLoading ? (
              <LoaderCircle className="size-4 shrink-0 animate-spin text-rose-400" />
            ) : null}
            <button
              aria-label="Aramayı kapat"
              className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 hover:text-rose-500"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-[60dvh] overflow-y-auto p-3">
            {query.trim().length < 2 ? (
              <p className="px-2 py-8 text-center text-sm text-slate-400">
                Aramak için en az 2 karakter yaz.
              </p>
            ) : !isLoading && !hasResults ? (
              <p className="px-2 py-8 text-center text-sm text-slate-400">
                &ldquo;{query}&rdquo; için sonuç bulunamadı.
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.category}>
                    <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {group.label}
                    </h3>
                    <ul className="mt-1.5 space-y-1">
                      {group.items.map((item) => (
                        <li key={`${item.category}-${item.id}`}>
                          <Link
                            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition hover:bg-rose-50 dark:hover:bg-white/5"
                            href={item.href}
                            onClick={onClose}
                          >
                            <span aria-hidden="true">{item.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-slate-700 dark:text-slate-200">
                                {item.title}
                              </span>
                              {item.subtitle ? (
                                <span className="block truncate text-xs text-slate-400">
                                  {item.subtitle}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
