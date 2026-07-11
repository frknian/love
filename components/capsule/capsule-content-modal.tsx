"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, File as FileIcon, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { formatDateTr } from "@/lib/date-utils";
import { capsuleService } from "@/services/capsule/capsule-service";
import type { CapsuleAttachment, TimeCapsuleMeta } from "@/types/capsule";

interface CapsuleContentModalProps {
  capsule: TimeCapsuleMeta;
  message: string;
  attachments: CapsuleAttachment[];
  onClose: () => void;
}

function AttachmentRow({ attachment }: { attachment: CapsuleAttachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isImage = attachment.type.startsWith("image/");

  async function handleDownload() {
    setIsLoading(true);
    const signedUrl = await capsuleService.getAttachmentUrl(attachment.path);
    setIsLoading(false);
    if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    void capsuleService.getAttachmentUrl(attachment.path).then((signedUrl) => {
      if (!cancelled) setUrl(signedUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [attachment.path, isImage]);

  if (isImage && url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        alt={attachment.name}
        className="aspect-square w-full rounded-2xl object-cover"
        src={url}
      />
    );
  }

  return (
    <button
      className="flex items-center gap-2.5 rounded-2xl bg-white/70 px-3 py-2.5 text-left text-sm shadow-sm transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
      disabled={isLoading}
      onClick={handleDownload}
      type="button"
    >
      <FileIcon className="size-4 shrink-0 text-rose-400" />
      <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">
        {attachment.name}
      </span>
      {isLoading ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-slate-400" />
      ) : (
        <Download className="size-4 shrink-0 text-slate-400" />
      )}
    </button>
  );
}

export function CapsuleContentModal({
  capsule,
  message,
  attachments,
  onClose,
}: CapsuleContentModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const images = attachments.filter((attachment) =>
    attachment.type.startsWith("image/"),
  );
  const files = attachments.filter(
    (attachment) => !attachment.type.startsWith("image/"),
  );

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/35 px-5 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.section
          animate={{ scale: 1, y: 0, opacity: 1 }}
          aria-label={`${capsule.title} mesajı`}
          aria-modal="true"
          className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-[#fffafd] shadow-2xl dark:bg-slate-900"
          exit={{ scale: 0.92, y: 16, opacity: 0 }}
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
        >
          <button
            aria-label="Kapat"
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/85 text-slate-500 shadow-sm transition hover:text-rose-500 dark:bg-slate-800/85"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
          <div className="p-6">
            <h2 className="pr-8 text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              {capsule.title}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {capsule.authorName} •{" "}
              {formatDateTr(new Date(capsule.unlockDate))}
            </p>
            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-rose-50/70 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {message}
            </p>
            {images.length ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {images.map((attachment) => (
                  <AttachmentRow
                    attachment={attachment}
                    key={attachment.path}
                  />
                ))}
              </div>
            ) : null}
            {files.length ? (
              <div className="mt-4 space-y-2">
                {files.map((attachment) => (
                  <AttachmentRow
                    attachment={attachment}
                    key={attachment.path}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
