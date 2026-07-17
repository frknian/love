"use client";

import { useEffect } from "react";

export function OfflineSyncProvider() {
  useEffect(() => {
    const flush = () => {
      void import("@/lib/offline/note-queue").then(({ flushNoteQueue }) =>
        flushNoteQueue(),
      );
    };
    const handleMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "FLUSH_OFFLINE_QUEUE") flush();
    };
    window.addEventListener("online", flush);
    navigator.serviceWorker?.addEventListener("message", handleMessage);
    const idleId = window.setTimeout(flush, 1_500);
    return () => {
      window.clearTimeout(idleId);
      window.removeEventListener("online", flush);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);
  return null;
}
