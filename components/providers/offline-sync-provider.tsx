"use client";

import { useEffect } from "react";

import { flushNoteQueue } from "@/lib/offline/note-queue";

export function OfflineSyncProvider() {
  useEffect(() => {
    const flush = () => {
      void flushNoteQueue();
    };
    const handleMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "FLUSH_OFFLINE_QUEUE") flush();
    };
    window.addEventListener("online", flush);
    navigator.serviceWorker?.addEventListener("message", handleMessage);
    flush();
    return () => {
      window.removeEventListener("online", flush);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);
  return null;
}
