"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { GlobalSearchDialog } from "@/components/search/global-search-dialog";

export function GlobalSearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Ara"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white/80 text-slate-500 shadow-sm transition hover:text-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 dark:bg-white/10 dark:text-slate-300"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Search className="size-5" />
      </button>
      {isOpen ? <GlobalSearchDialog onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}
