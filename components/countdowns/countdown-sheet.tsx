"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ZodError } from "zod";

import type { CountdownInput } from "@/services/countdowns/countdowns-service";

const iconOptions = [
  "⏳",
  "💍",
  "✈️",
  "🎂",
  "🏖️",
  "🎄",
  "🎓",
  "🏡",
  "💌",
  "🎉",
];

interface CountdownSheetProps {
  onClose: () => void;
  onSubmit: (input: CountdownInput) => Promise<void>;
}

export function CountdownSheet({ onClose, onSubmit }: CountdownSheetProps) {
  const [icon, setIcon] = useState(iconOptions[0]);
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
        icon,
        targetDate: String(formData.get("targetDate") ?? ""),
        coverImage: String(formData.get("coverImage") ?? ""),
      });
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : "Geri sayım kaydedilemedi. Lütfen tekrar dene.",
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
          aria-label="Yeni geri sayım"
          aria-modal="true"
          className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-2xl overflow-y-auto rounded-t-[2rem] bg-[#fffafd] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
          exit={{ y: "100%" }}
          initial={{ y: "100%" }}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 28, stiffness: 290 }}
        >
          <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Yeni geri sayım
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
              maxLength={120}
              name="title"
              placeholder="Neyi bekliyoruz? (ör. Yıldönümümüz)"
              required
            />
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-slate-500">
                Simge
              </legend>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((option) => (
                  <button
                    aria-label={`${option} simgesi`}
                    aria-pressed={icon === option}
                    className={`grid size-11 place-items-center rounded-2xl text-xl transition ${
                      icon === option
                        ? "bg-rose-500 shadow-sm"
                        : "bg-rose-50 hover:bg-rose-100"
                    }`}
                    key={option}
                    onClick={() => setIcon(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                Hedef tarih ve saat
              </span>
              <input
                className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300"
                name="targetDate"
                required
                type="datetime-local"
              />
            </label>
            <input
              className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300"
              inputMode="url"
              name="coverImage"
              placeholder="Kapak fotoğrafı URL'si (opsiyonel)"
              type="url"
            />
            {error ? (
              <p
                className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600"
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
              {isSubmitting ? "Kaydediliyor" : "Geri Sayımı Başlat"}
            </button>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
