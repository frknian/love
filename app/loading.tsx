function Pulse({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white/70 ${className}`} />
  );
}

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Pulse className="size-10 rounded-2xl" />
          <div className="space-y-2">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Pulse className="size-10 rounded-full" />
          <Pulse className="size-10 rounded-full" />
        </div>
      </div>
      <Pulse className="h-32 w-full rounded-3xl" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Pulse className="h-36 rounded-3xl" />
        <Pulse className="h-36 rounded-3xl" />
        <Pulse className="h-28 rounded-3xl" />
        <Pulse className="h-28 rounded-3xl" />
      </div>
    </main>
  );
}
