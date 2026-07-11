"use client";

import { AnimatePresence } from "framer-motion";
import { Hourglass, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { CapsuleContentModal } from "@/components/capsule/capsule-content-modal";
import { CapsuleLockedCard } from "@/components/capsule/capsule-locked-card";
import { CapsuleSheet } from "@/components/capsule/capsule-sheet";
import { CapsuleUnlockModal } from "@/components/capsule/capsule-unlock-modal";
import { useToast } from "@/components/ui/toast-provider";
import { useCapsule } from "@/hooks/use-capsule";
import { useNow } from "@/hooks/use-now";
import { differenceInDays } from "@/lib/date-utils";
import {
  capsuleService,
  type CapsuleInput,
} from "@/services/capsule/capsule-service";
import type { CapsuleAttachment, TimeCapsuleMeta } from "@/types/capsule";

interface CapsulesWorkspaceProps {
  initialCapsules: TimeCapsuleMeta[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
}

export function CapsulesWorkspace({
  initialCapsules,
  coupleId,
  currentUserId,
  currentUserName,
  partnerName,
}: CapsulesWorkspaceProps) {
  const { capsules, upsertRow, remove, markOpened, refreshUnlockState } =
    useCapsule({
      initialCapsules,
      currentUserId,
      currentUserName,
      partnerName,
    });
  const now = useNow(20_000);
  const [revealQueue, setRevealQueue] = useState<TimeCapsuleMeta[]>([]);
  const [content, setContent] = useState<{
    capsule: TimeCapsuleMeta;
    message: string;
    attachments: CapsuleAttachment[];
  } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string>();
  const { showToast } = useToast();

  useEffect(() => {
    const newlyUnlocked = refreshUnlockState(now);
    if (newlyUnlocked.length) {
      setRevealQueue((current) => [...current, ...newlyUnlocked]);
    }
  }, [now, refreshUnlockState]);

  const revealingCapsule = revealQueue[0];

  async function handleCreate(input: CapsuleInput, attachmentFiles: File[]) {
    setError(undefined);
    const row = await capsuleService.create(
      coupleId,
      currentUserId,
      input,
      attachmentFiles,
    );
    upsertRow(row, now);
    showToast("Zaman kapsülü oluşturuldu.");
  }

  async function openCapsuleContent(capsule: TimeCapsuleMeta) {
    setIsOpening(true);
    setError(undefined);
    try {
      const capsuleContent = await capsuleService.getContent(capsule.id);
      if (!capsule.opened) await markOpened(capsule.id);
      setContent({ capsule, ...capsuleContent });
    } catch {
      setError("Mesaj açılamadı. Lütfen tekrar dene.");
    } finally {
      setIsOpening(false);
    }
  }

  async function handleRevealOpenNow() {
    if (!revealingCapsule) return;
    await openCapsuleContent(revealingCapsule);
    setRevealQueue((current) => current.slice(1));
  }

  function handleRevealLater() {
    setRevealQueue((current) => current.slice(1));
  }

  async function handleDelete(capsule: TimeCapsuleMeta) {
    const confirmed = window.confirm(
      `"${capsule.title}" zaman kapsülünü silmek istiyor musun?`,
    );
    if (!confirmed) return;
    setError(undefined);
    try {
      await capsuleService.remove(capsule.id);
      remove(capsule.id);
    } catch {
      setError("Zaman kapsülü silinemedi.");
    }
  }

  return (
    <div className="relative">
      {error ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {capsules.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {capsules.map((capsule) => (
              <CapsuleLockedCard
                capsule={capsule}
                daysRemaining={Math.max(
                  0,
                  differenceInDays(new Date(capsule.unlockDate), now),
                )}
                key={capsule.id}
                onDelete={
                  capsule.authorId === currentUserId ? handleDelete : undefined
                }
                onOpen={() => void openCapsuleContent(capsule)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <Hourglass
            aria-hidden="true"
            className="mx-auto size-8 text-rose-300"
          />
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            Henüz zaman kapsülü yok
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Geleceğe bir mesaj bırakın. ♡
          </p>
        </div>
      )}
      {isOpening ? (
        <p className="mt-4 text-center text-xs text-slate-400">
          Mesaj açılıyor...
        </p>
      ) : null}
      <button
        aria-label="Yeni zaman kapsülü oluştur"
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-rose-500 text-white shadow-[0_12px_25px_rgba(244,63,94,0.35)] transition hover:scale-105 sm:bottom-8 sm:right-8"
        onClick={() => setIsSheetOpen(true)}
        type="button"
      >
        <Plus className="size-6" />
      </button>
      {isSheetOpen ? (
        <CapsuleSheet
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
      {revealingCapsule ? (
        <CapsuleUnlockModal
          capsule={revealingCapsule}
          onLater={handleRevealLater}
          onOpenNow={() => void handleRevealOpenNow()}
        />
      ) : null}
      {content ? (
        <CapsuleContentModal
          attachments={content.attachments}
          capsule={content.capsule}
          message={content.message}
          onClose={() => setContent(null)}
        />
      ) : null}
    </div>
  );
}
