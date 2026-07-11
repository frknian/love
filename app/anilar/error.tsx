"use client";

export default function MemoriesError() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl place-items-center px-5 text-center">
      <div>
        <p className="text-lg font-semibold text-slate-800">
          Anılar şu anda yüklenemedi.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Bağlantını kontrol edip sayfayı yenilemeyi dene.
        </p>
      </div>
    </main>
  );
}
