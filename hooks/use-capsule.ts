"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toTimeCapsuleMeta } from "@/lib/capsule/capsule-mapper";
import { capsuleService } from "@/services/capsule/capsule-service";
import type { TimeCapsuleMeta, TimeCapsuleRow } from "@/types/capsule";

interface UseCapsuleOptions {
  initialCapsules: TimeCapsuleMeta[];
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
}

function orderCapsules(capsules: TimeCapsuleMeta[]) {
  return [...capsules].sort(
    (first, second) =>
      new Date(first.unlockDate).getTime() -
      new Date(second.unlockDate).getTime(),
  );
}

/**
 * time_capsules realtime yayınına eklenmez (bkz. migration notu): mesaj
 * içeriği açılmadan önce sızabilir. Bu yüzden liste yalnızca ilk yüklemeden
 * ve yerel iyimser güncellemelerden beslenir; açılma anı `useNow` ile
 * istemci tarafında zaman karşılaştırmasıyla saptanır.
 */
export function useCapsule({
  initialCapsules,
  currentUserId,
  currentUserName,
  partnerName,
}: UseCapsuleOptions) {
  const [capsules, setCapsules] = useState(() =>
    orderCapsules(initialCapsules),
  );
  const capsulesRef = useRef(capsules);
  const revealedRef = useRef(new Set<string>());

  useEffect(() => {
    capsulesRef.current = capsules;
  }, [capsules]);

  const upsertRow = useCallback(
    (row: TimeCapsuleRow, now = new Date()) => {
      const authorName =
        row.author_id === currentUserId ? currentUserName : partnerName;
      setCapsules((current) =>
        orderCapsules([
          toTimeCapsuleMeta(row, authorName, now),
          ...current.filter((capsule) => capsule.id !== row.id),
        ]),
      );
    },
    [currentUserId, currentUserName, partnerName],
  );

  const remove = useCallback((capsuleId: string) => {
    setCapsules((current) =>
      current.filter((capsule) => capsule.id !== capsuleId),
    );
  }, []);

  const markOpened = useCallback(async (capsuleId: string) => {
    await capsuleService.markOpened(capsuleId);
    setCapsules((current) =>
      current.map((capsule) =>
        capsule.id === capsuleId
          ? { ...capsule, opened: true, openedAt: new Date().toISOString() }
          : capsule,
      ),
    );
  }, []);

  /** `now` her tick'te tüm kapsülleri tazeler; ilk kez unlock olanları döndürür. */
  const refreshUnlockState = useCallback((now: Date) => {
    const newlyUnlocked: TimeCapsuleMeta[] = [];
    let changed = false;
    const updated = capsulesRef.current.map((capsule) => {
      const isUnlocked =
        new Date(capsule.unlockDate).getTime() <= now.getTime();
      if (isUnlocked === capsule.isUnlocked) return capsule;
      changed = true;
      const next = { ...capsule, isUnlocked };
      if (isUnlocked && !revealedRef.current.has(capsule.id)) {
        revealedRef.current.add(capsule.id);
        newlyUnlocked.push(next);
      }
      return next;
    });

    if (changed) {
      capsulesRef.current = updated;
      setCapsules(updated);
    }
    return newlyUnlocked;
  }, []);

  return useMemo(
    () => ({ capsules, upsertRow, remove, markOpened, refreshUnlockState }),
    [capsules, markOpened, refreshUnlockState, remove, upsertRow],
  );
}
