"use client";

import { History, LoaderCircle, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { formatRelativeTimeTr } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/client";
import type { CoupleStory, StoryVersion } from "@/types/premium";

interface CoupleStoryCardProps {
  initialStory: CoupleStory;
  versions: StoryVersion[];
}

export function CoupleStoryCard({
  initialStory,
  versions,
}: CoupleStoryCardProps) {
  const [content, setContent] = useState(initialStory.content);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const lastSavedContent = useRef(initialStory.content);

  useEffect(() => {
    setContent(initialStory.content);
    lastSavedContent.current = initialStory.content;
  }, [initialStory.content]);

  useEffect(() => {
    if (content === lastSavedContent.current) return;
    const timeoutId = window.setTimeout(async () => {
      setState("saving");
      const { error } = await createClient().rpc("save_couple_story", {
        p_content: content,
      });
      if (error) {
        setState("error");
        return;
      }
      lastSavedContent.current = content;
      setState("saved");
    }, 850);
    return () => window.clearTimeout(timeoutId);
  }, [content]);

  const statusText =
    state === "saving"
      ? "Kaydediliyor…"
      : state === "saved"
        ? "Otomatik kaydedildi"
        : state === "error"
          ? "Kaydedilemedi; bağlantını kontrol et."
          : initialStory.updatedAt
            ? `${initialStory.updatedByName ?? "Partnerin"} düzenledi · ${formatRelativeTimeTr(initialStory.updatedAt)}`
            : "İkinizin de yazabileceği ortak alan.";

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
            Bizim Hikâyemiz
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">
            Birlikte yazılan bir sayfa
          </h2>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300">
          {state === "saving" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
        </span>
      </div>
      <textarea
        aria-label="Ortak hikâye"
        className="mt-4 min-h-44 w-full resize-y rounded-2xl border border-rose-100 bg-white/75 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-rose-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
        maxLength={12000}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Hikâyenizi buraya birlikte yazın…"
        value={content}
      />
      <p
        className={`mt-2 text-xs ${state === "error" ? "text-rose-600" : "text-slate-400"}`}
        role={state === "error" ? "alert" : "status"}
      >
        {statusText}
      </p>
      {versions.length ? (
        <details className="mt-4 border-t border-rose-100 pt-4 dark:border-white/10">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-600 marker:hidden dark:text-slate-300">
            <History className="size-4 text-rose-500" />
            Sürüm geçmişi ({versions.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {versions.map((version) => (
              <li
                className="rounded-xl bg-rose-50/70 px-3 py-2 text-xs text-slate-500 dark:bg-white/[0.04] dark:text-slate-400"
                key={version.id}
              >
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Sürüm {version.version}
                </span>
                <span className="ml-2">
                  {version.editedByName ?? "Partnerin"} ·{" "}
                  {formatRelativeTimeTr(version.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
