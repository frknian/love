"use client";

import { languageOptions } from "@/types/settings";
import type { LanguageOption } from "@/types/settings";

interface LanguageSwitcherProps {
  value: LanguageOption;
  onChange: (language: LanguageOption) => void;
  disabled?: boolean;
}

const languageLabels: Record<LanguageOption, string> = {
  tr: "Türkçe",
  en: "English",
};

export function LanguageSwitcher({
  value,
  onChange,
  disabled,
}: LanguageSwitcherProps) {
  return (
    <div aria-label="Dil seçimi" className="flex gap-2" role="radiogroup">
      {languageOptions.map((option) => {
        const isActive = value === option;
        return (
          <button
            aria-checked={isActive}
            className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
              isActive
                ? "bg-rose-500 text-white"
                : "bg-slate-50 text-slate-500 hover:bg-rose-50 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
            }`}
            disabled={disabled}
            key={option}
            onClick={() => onChange(option)}
            role="radio"
            type="button"
          >
            {languageLabels[option]}
          </button>
        );
      })}
    </div>
  );
}
