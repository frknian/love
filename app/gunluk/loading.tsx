export default function JournalLoading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <div className="h-14 w-14 animate-pulse rounded-2xl bg-rose-100" />
      <div className="mt-5 h-9 w-44 animate-pulse rounded-xl bg-slate-100" />
      <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-6 h-12 animate-pulse rounded-2xl bg-white/70" />
      <div className="mt-5 space-y-3">
        <div className="h-24 animate-pulse rounded-3xl bg-rose-100/60" />
        <div className="h-24 animate-pulse rounded-3xl bg-white/70" />
      </div>
    </main>
  );
}
