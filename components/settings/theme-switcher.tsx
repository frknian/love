"use client";

import { Laptop, Moon, Sun } from "lucide-react";

import { themeOptions } from "@/types/settings";
import type { ThemeOption } from "@/types/settings";

interface ThemeSwitcherProps {
  value: ThemeOption;
  onChange: (theme: ThemeOption) => void;
  disabled?: boolean;
}

const themeMeta: Record<ThemeOption, { label: string; icon: typeof Sun }> = {
  light: { label: "Açık", icon: Sun },
  dark: { label: "Koyu", icon: Moon },
  system: { label: "Sistem", icon: Laptop },
};

export function ThemeSwitcher({
  value,
  onChange,
  disabled,
}: ThemeSwitcherProps) {
  return (
    <div
      aria-label="Tema seçimi"
      className="grid grid-cols-3 gap-2"
      role="radiogroup"
    >
      {themeOptions.map((option) => {
        const meta = themeMeta[option];
        const isActive = value === option;
        return (
          <button
            aria-checked={isActive}
            className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-xs font-semibold transition disabled:opacity-60 ${
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
            <meta.icon className="size-4" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
