"use client";

import { createClient } from "@/lib/supabase/client";
import type { NoteInput } from "@/services/notes/notes-service";

const DATABASE_NAME = "our-space-offline";
const STORE_NAME = "mutations";

interface QueuedNote {
  id: string;
  kind: "note:create";
  createdAt: number;
  payload: { coupleId: string; authorId: string; input: NoteInput };
}

export class OfflineQueuedError extends Error {
  constructor() {
    super(
      "Not çevrimdışı kuyruğa alındı; bağlantı geldiğinde otomatik gönderilecek.",
    );
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll(): Promise<QueuedNote[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll();
    request.onsuccess = () => {
      database.close();
      resolve(request.result as QueuedNote[]);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

async function remove(id: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .delete(id);
    request.onsuccess = () => {
      database.close();
      resolve();
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function queueNoteCreate(
  coupleId: string,
  authorId: string,
  input: NoteInput,
) {
  const database = await openDatabase();
  const item: QueuedNote = {
    id: crypto.randomUUID(),
    kind: "note:create",
    createdAt: Date.now(),
    payload: { coupleId, authorId, input },
  };
  await new Promise<void>((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put(item);
    request.onsuccess = () => {
      database.close();
      resolve();
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
  const registration = await navigator.serviceWorker?.ready;
  const syncManager = registration as
    | (ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      })
    | undefined;
  await syncManager?.sync?.register("our-space-sync");
}

export async function flushNoteQueue() {
  if (!navigator.onLine) return 0;
  const queued = await getAll();
  let completed = 0;
  for (const item of queued) {
    const { coupleId, authorId, input } = item.payload;
    const { error } = await createClient()
      .from("notes")
      .insert({ couple_id: coupleId, author_id: authorId, ...input });
    if (error) continue;
    await remove(item.id);
    completed += 1;
  }
  return completed;
}
