import { CloudOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <section className="max-w-sm rounded-3xl border border-white/70 bg-white/70 p-8 shadow-soft backdrop-blur-xl">
        <CloudOff className="mx-auto size-10 text-rose-400" />
        <h1 className="mt-5 text-xl font-semibold text-slate-800">
          Çevrimdışısın
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Son görüntülediğin içerikler kullanılabilir. Bağlantı geri geldiğinde
          uygulama otomatik olarak yenilenecek.
        </p>
      </section>
    </main>
  );
}
