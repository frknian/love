"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ZodError } from "zod";

import { bucketColorCatalog } from "@/lib/bucket/bucket-catalog";
import type { BucketListInput } from "@/services/bucket/bucket-service";
import type { BucketListColor } from "@/types/bucket";

interface BucketListSheetProps {
  onClose: () => void;
  onSubmit: (input: BucketListInput) => Promise<void>;
}

export function BucketListSheet({ onClose, onSubmit }: BucketListSheetProps) {
  const [color, setColor] = useState<BucketListColor>("rose");
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
        description: String(formData.get("description") ?? ""),
        color,
        coverImage: String(formData.get("coverImage") ?? ""),
      });
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : "Liste oluşturulamadı. Lütfen tekrar dene.",
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
          aria-label="Yeni yapılacaklar listesi"
          aria-modal="true"
          className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-2xl overflow-y-auto rounded-t-[2rem] bg-[#fffafd] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900"
          exit={{ y: "100%" }}
          initial={{ y: "100%" }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 28, stiffness: 290 }}
        >
          <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Yeni liste
            </h2>
            <button
              aria-label="Kapat"
              className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              maxLength={120}
              name="title"
              placeholder="Liste başlığı (ör. Hayaller Listemiz)"
              required
            />
            <textarea
              className="min-h-20 w-full resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              maxLength={1000}
              name="description"
              placeholder="Açıklama (opsiyonel)"
            />
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Renk
              </legend>
              <div className="flex flex-wrap gap-2">
                {bucketColorCatalog.map((definition) => (
                  <button
                    aria-label={definition.label}
                    aria-pressed={color === definition.value}
                    className={`size-9 rounded-full bg-gradient-to-br ${definition.surface} ${
                      color === definition.value
                        ? "ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900"
                        : ""
                    }`}
                    key={definition.value}
                    onClick={() => setColor(definition.value)}
                    type="button"
                  />
                ))}
              </div>
            </fieldset>
            <input
              className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              inputMode="url"
              name="coverImage"
              placeholder="Kapak görseli URL'si (opsiyonel)"
              type="url"
            />
            {error ? (
              <p
                className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                role="alert"
              >
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
              {isSubmitting ? "Kaydediliyor" : "Listeyi Oluştur"}
            </button>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
