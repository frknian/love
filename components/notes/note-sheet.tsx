"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Pin, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ZodError } from "zod";

import type { Note, NoteColor } from "@/types/notes";
import type { NoteInput } from "@/services/notes/notes-service";

const colors: { value: NoteColor; label: string; className: string }[] = [
  { value: "yellow", label: "Sarı", className: "bg-amber-200" },
  { value: "pink", label: "Pembe", className: "bg-rose-200" },
  { value: "blue", label: "Mavi", className: "bg-sky-200" },
  { value: "green", label: "Yeşil", className: "bg-emerald-200" },
  { value: "purple", label: "Mor", className: "bg-violet-200" },
];

interface NoteSheetProps {
  note?: Note;
  onClose: () => void;
  onSubmit: (input: NoteInput) => Promise<void>;
}

export function NoteSheet({ note, onClose, onSubmit }: NoteSheetProps) {
  const [color, setColor] = useState<NoteColor>(note?.color ?? "yellow");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onSubmit({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        color,
        pinned,
      });
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : "Not kaydedilemedi. Lütfen tekrar dene.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-slate-900/25 backdrop-blur-[2px]"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.section
          animate={{ y: 0 }}
          aria-label={note ? "Notu düzenle" : "Yeni not"}
          className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl rounded-t-[2rem] bg-[#fffafd] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
          exit={{ y: "100%" }}
          initial={{ y: "100%" }}
          onClick={(event) => event.stopPropagation()}
          transition={{ type: "spring", damping: 28, stiffness: 290 }}
        >
          <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {note ? "Notu düzenle" : "Yeni not"}
            </h2>
            <button
              aria-label="Kapat"
              className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300"
              defaultValue={note?.title}
              maxLength={120}
              name="title"
              placeholder="Başlık"
              required
            />
            <textarea
              className="min-h-32 w-full resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-rose-300"
              defaultValue={note?.content}
              maxLength={2000}
              name="content"
              placeholder="Kalbinden geçenleri yaz..."
              required
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {colors.map((item) => (
                  <button
                    aria-label={item.label}
                    className={`size-7 rounded-full ${item.className} ${color === item.value ? "ring-2 ring-rose-500 ring-offset-2" : ""}`}
                    key={item.value}
                    onClick={() => setColor(item.value)}
                    type="button"
                  />
                ))}
              </div>
              <button
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${pinned ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}`}
                onClick={() => setPinned((current) => !current)}
                type="button"
              >
                <Pin className={`size-3.5 ${pinned ? "fill-current" : ""}`} />
                Sabitle
              </button>
            </div>
            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            ) : null}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {isSubmitting
                ? "Kaydediliyor"
                : note
                  ? "Değişiklikleri Kaydet"
                  : "Notu Bırak"}
            </button>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
