"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

interface RouteErrorStateProps {
  title: string;
  description?: string;
  retry: () => void;
}

/** Tüm route hata sınırlarında kullanılan erişilebilir, tutarlı durum ekranı. */
export function RouteErrorState({
  title,
  description = "Bağlantını kontrol edip tekrar deneyebilirsin.",
  retry,
}: RouteErrorStateProps) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl place-items-center px-5 text-center">
      <section className="w-full max-w-sm rounded-3xl border border-rose-100 bg-white/80 p-7 shadow-soft dark:border-white/10 dark:bg-slate-900/80">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
        <button
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          onClick={retry}
          type="button"
        >
          <RefreshCw className="size-4" />
          Tekrar dene
        </button>
      </section>
    </main>
  );
}
