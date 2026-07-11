export default function NotesLoading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <div className="h-14 w-14 animate-pulse rounded-2xl bg-rose-100" />
      <div className="mt-5 h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
      <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-8 h-12 animate-pulse rounded-2xl bg-white/70" />
      <div className="mt-5 columns-1 gap-4 sm:columns-2">
        <div className="mb-4 h-48 animate-pulse break-inside-avoid rounded-3xl bg-amber-100/60" />
        <div className="mb-4 h-56 animate-pulse break-inside-avoid rounded-3xl bg-rose-100/60" />
      </div>
    </main>
  );
}
