"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Repeat, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ZodError } from "zod";

import { eventTypeCatalog } from "@/lib/events/event-types";
import type { EventInput } from "@/services/events/events-service";
import type { CoupleEvent, EventType } from "@/types/events";

interface EventSheetProps {
  event?: CoupleEvent;
  onClose: () => void;
  onSubmit: (input: EventInput) => Promise<void>;
}

export function EventSheet({ event, onClose, onSubmit }: EventSheetProps) {
  const [eventType, setEventType] = useState<EventType>(
    event?.eventType ?? "special",
  );
  const [repeatYearly, setRepeatYearly] = useState(
    event?.repeatYearly ?? false,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onSubmit({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        eventType,
        eventDate: String(formData.get("eventDate") ?? ""),
        repeatYearly,
        coverImage: String(formData.get("coverImage") ?? ""),
      });
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : "Etkinlik kaydedilemedi. Lütfen tekrar dene.",
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
          aria-label={event ? "Etkinliği düzenle" : "Yeni etkinlik"}
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
              {event ? "Etkinliği düzenle" : "Yeni etkinlik"}
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
              defaultValue={event?.title}
              maxLength={120}
              name="title"
              placeholder="Başlık"
              required
            />
            <textarea
              className="min-h-24 w-full resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-rose-300"
              defaultValue={event?.description ?? ""}
              maxLength={1000}
              name="description"
              placeholder="Açıklama (opsiyonel)"
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                Tarih
              </span>
              <input
                className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300"
                defaultValue={event?.eventDate}
                name="eventDate"
                required
                type="date"
              />
            </label>
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-slate-500">
                Kategori
              </legend>
              <div className="flex flex-wrap gap-2">
                {eventTypeCatalog.map((definition) => (
                  <button
                    aria-pressed={eventType === definition.type}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                      eventType === definition.type
                        ? "bg-rose-500 text-white"
                        : `${definition.badge} hover:opacity-80`
                    }`}
                    key={definition.type}
                    onClick={() => setEventType(definition.type)}
                    type="button"
                  >
                    <span aria-hidden="true">{definition.icon}</span>
                    {definition.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <input
              className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300"
              defaultValue={event?.coverImage ?? ""}
              inputMode="url"
              name="coverImage"
              placeholder="Kapak fotoğrafı URL'si (opsiyonel)"
              type="url"
            />
            <button
              aria-pressed={repeatYearly}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                repeatYearly
                  ? "bg-rose-100 text-rose-600"
                  : "bg-slate-100 text-slate-500"
              }`}
              onClick={() => setRepeatYearly((current) => !current)}
              type="button"
            >
              <Repeat className="size-3.5" />
              Her yıl tekrar etsin
            </button>
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
              {isSubmitting
                ? "Kaydediliyor"
                : event
                  ? "Değişiklikleri Kaydet"
                  : "Etkinliği Oluştur"}
            </button>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
