"use client";

import { CalendarDays, LoaderCircle, MapPin, Pencil, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Memory } from "@/types/memories";

export function MemoryCard({ memory }: { memory: Memory }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const { error: updateError } = await createClient()
      .from("memories")
      .update({
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
        location: String(formData.get("location") ?? "").trim() || null,
        memory_date: String(formData.get("memory-date") ?? "") || null,
      })
      .eq("id", memory.id);

    if (updateError) {
      setError("Anı güncellenemedi. Lütfen tekrar dene.");
      setIsSaving(false);
      return;
    }

    setIsEditing(false);
    setIsSaving(false);
    router.refresh();
  }

  return (
    <>
      <Card className="overflow-hidden p-0">
        <button
          aria-label={`${memory.title} anısını düzenle`}
          className="group relative block aspect-[4/3] w-full cursor-pointer bg-rose-50 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-rose-500"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          {memory.imageUrl ? (
            <Image
              alt={memory.title}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, 24rem"
              src={memory.imageUrl}
            />
          ) : null}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-1 items-center justify-center gap-1 bg-slate-900/55 px-3 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            <Pencil className="size-3.5" /> Düzenle
          </span>
        </button>
        <div className="p-4">
          <h2 className="font-semibold text-slate-800">{memory.title}</h2>
          {memory.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">
              {memory.description}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
            {memory.memoryDate ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {new Intl.DateTimeFormat("tr-TR", {
                  dateStyle: "medium",
                }).format(new Date(`${memory.memoryDate}T12:00:00`))}
              </span>
            ) : null}
            {memory.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {memory.location}
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      {isEditing ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-end bg-slate-900/35 p-4 backdrop-blur-sm sm:place-items-center"
          onClick={() => !isSaving && setIsEditing(false)}
        >
          <form
            className="w-full max-w-lg rounded-3xl bg-[#fffafd] p-5 shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                  Anı düzenle
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">
                  {memory.title}
                </h2>
              </div>
              <button
                aria-label="Düzenlemeyi kapat"
                className="grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <input
                className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300"
                defaultValue={memory.title}
                maxLength={160}
                name="title"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300"
                  defaultValue={memory.location ?? ""}
                  name="location"
                  placeholder="Konum"
                />
                <input
                  className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300"
                  defaultValue={memory.memoryDate ?? ""}
                  name="memory-date"
                  type="date"
                />
              </div>
              <textarea
                className="min-h-24 w-full resize-none rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300"
                defaultValue={memory.description ?? ""}
                maxLength={1000}
                name="description"
                placeholder="Açıklama"
              />
            </div>
            {error ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            ) : null}
            <button
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {isSaving ? "Kaydediliyor" : "Değişiklikleri kaydet"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
