"use client";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** Ayarlar sayfasındaki tüm aç/kapat satırlarının paylaştığı tek switch bileşeni. */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        ) : null}
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
          checked ? "bg-rose-500" : "bg-slate-200 dark:bg-white/10"
        }`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
