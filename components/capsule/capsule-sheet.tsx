"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Paperclip, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { ZodError } from "zod";

import type { CapsuleInput } from "@/services/capsule/capsule-service";

interface CapsuleSheetProps {
  onClose: () => void;
  onSubmit: (input: CapsuleInput, attachments: File[]) => Promise<void>;
}

const MAX_ATTACHMENTS = 5;

export function CapsuleSheet({ onClose, onSubmit }: CapsuleSheetProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(
      0,
      MAX_ATTACHMENTS,
    );
    setAttachments(files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(
        {
          title: String(formData.get("title") ?? ""),
          message: String(formData.get("message") ?? ""),
          unlockDate: String(formData.get("unlockDate") ?? ""),
        },
        attachments,
      );
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : submissionError instanceof Error
            ? submissionError.message
            : "Zaman kapsülü kaydedilemedi. Lütfen tekrar dene.",
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
          aria-label="Yeni zaman kapsülü"
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
              Yeni zaman kapsülü
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
          <p className="mt-2 text-xs text-slate-400">
            Açılma tarihinden önce bu mesaj ve ekler kimse tarafından
            görüntülenemez.
          </p>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              maxLength={120}
              name="title"
              placeholder="Başlık (herkese açık görünür)"
              required
            />
            <textarea
              className="min-h-32 w-full resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              maxLength={4000}
              name="message"
              placeholder="Geleceğe bırakmak istediğin mesaj..."
              required
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Açılma tarihi
              </span>
              <input
                className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                name="unlockDate"
                required
                type="datetime-local"
              />
            </label>
            <div>
              <input
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf"
                className="sr-only"
                id="capsule-attachments"
                multiple
                onChange={handleFilesChange}
                type="file"
              />
              <label
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                htmlFor="capsule-attachments"
              >
                <span className="inline-flex items-center gap-2 truncate">
                  <Paperclip className="size-4 shrink-0" />
                  {attachments.length
                    ? `${attachments.length} dosya seçildi`
                    : "Fotoğraf, video veya dosya ekle (opsiyonel)"}
                </span>
                <span className="ml-3 shrink-0 font-medium text-rose-600 dark:text-rose-300">
                  Seç
                </span>
              </label>
            </div>
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
              {isSubmitting ? "Kaydediliyor" : "Kapsülü Gömün"}
            </button>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
