export default function TimeCapsuleLoading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <div className="h-14 w-14 animate-pulse rounded-2xl bg-rose-100" />
      <div className="mt-5 h-9 w-48 animate-pulse rounded-xl bg-slate-100" />
      <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-48 animate-pulse rounded-3xl bg-rose-100/60" />
        <div className="h-48 animate-pulse rounded-3xl bg-white/70" />
      </div>
    </main>
  );
}
