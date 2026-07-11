"use client";

interface TimeCapsuleErrorProps {
  reset: () => void;
}

export default function TimeCapsuleError({ reset }: TimeCapsuleErrorProps) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl place-items-center px-5 text-center">
      <div>
        <p className="text-lg font-semibold text-slate-800">
          Zaman kapsülü şu anda yüklenemedi.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Bağlantını kontrol edip tekrar deneyebilirsin.
        </p>
        <button
          className="mt-5 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Tekrar Dene
        </button>
      </div>
    </main>
  );
}
