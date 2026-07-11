"use client";

import { Search } from "lucide-react";

import type { JournalSearchField } from "@/types/journal";

interface JournalSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  fields: JournalSearchField[];
  onFieldsChange: (fields: JournalSearchField[]) => void;
}

const fieldOptions: { value: JournalSearchField; label: string }[] = [
  { value: "title", label: "Başlık" },
  { value: "content", label: "İçerik" },
  { value: "author", label: "Yazan" },
  { value: "date", label: "Tarih" },
];

export function JournalSearchBar({
  query,
  onQueryChange,
  fields,
  onFieldsChange,
}: JournalSearchBarProps) {
  function toggleField(field: JournalSearchField) {
    if (fields.includes(field)) {
      if (fields.length === 1) return;
      onFieldsChange(fields.filter((item) => item !== field));
    } else {
      onFieldsChange([...fields, field]);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <Search aria-hidden="true" className="size-4 text-slate-400" />
        <input
          aria-label="Günlükte ara"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Başlık, içerik, yazan kişi veya tarihte ara"
          value={query}
        />
      </div>
      <div
        aria-label="Arama alanları"
        className="mt-2 flex gap-2 overflow-x-auto pb-1"
        role="group"
      >
        {fieldOptions.map((option) => (
          <button
            aria-pressed={fields.includes(option.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              fields.includes(option.value)
                ? "bg-rose-500 text-white"
                : "bg-white/70 text-slate-500 hover:bg-rose-50 dark:bg-white/5 dark:text-slate-400"
            }`}
            key={option.value}
            onClick={() => toggleField(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
