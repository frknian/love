"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ZodError } from "zod";

import { bucketPriorityCatalog } from "@/lib/bucket/bucket-catalog";
import type { BucketItemInput } from "@/services/bucket/bucket-service";
import type { BucketItemPriority } from "@/types/bucket";

interface BucketItemSheetProps {
  onClose: () => void;
  onSubmit: (input: BucketItemInput) => Promise<void>;
}

export function BucketItemSheet({ onClose, onSubmit }: BucketItemSheetProps) {
  const [priority, setPriority] = useState<BucketItemPriority>("medium");
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
        priority,
      });
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : "Madde eklenemedi. Lütfen tekrar dene.",
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
          aria-label="Yeni madde"
          aria-modal="true"
          className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl rounded-t-[2rem] bg-[#fffafd] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900"
          exit={{ y: "100%" }}
          initial={{ y: "100%" }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 28, stiffness: 290 }}
        >
          <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Yeni madde
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
              maxLength={160}
              name="title"
              placeholder="Ne yapmak istiyorsunuz?"
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
                Öncelik
              </legend>
              <div className="flex gap-2">
                {bucketPriorityCatalog.map((definition) => (
                  <button
                    aria-pressed={priority === definition.value}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      priority === definition.value
                        ? "bg-rose-500 text-white"
                        : definition.badge
                    }`}
                    key={definition.value}
                    onClick={() => setPriority(definition.value)}
                    type="button"
                  >
                    {definition.label}
                  </button>
                ))}
              </div>
            </fieldset>
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
              {isSubmitting ? "Kaydediliyor" : "Maddeyi Ekle"}
            </button>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
