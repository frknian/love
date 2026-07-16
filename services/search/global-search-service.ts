"use client";

import { createClient } from "@/lib/supabase/client";
import type { SearchResultGroup, SearchResultItem } from "@/types/search";

const groupLabels: Record<SearchResultGroup["category"], string> = {
  memories: "Anılar",
  notes: "Notlar",
  journals: "Günlük",
  bucket: "Bucket List",
  events: "Etkinlikler",
};

function escapePostgrestValue(value: string) {
  return value.replace(/[\\(),]/g, "\\$&");
}

async function searchMemories(query: string): Promise<SearchResultItem[]> {
  const { data } = await createClient()
    .from("memories")
    .select("id, title, memory_date")
    .ilike("title", `%${query}%`)
    .limit(5);
  return (data ?? []).map((row) => ({
    id: row.id,
    category: "memories" as const,
    title: row.title,
    subtitle: row.memory_date ?? undefined,
    href: "/anilar",
    icon: "📸",
  }));
}

async function searchNotes(query: string): Promise<SearchResultItem[]> {
  const safeQuery = escapePostgrestValue(query);
  const { data } = await createClient()
    .from("notes")
    .select("id, title, content")
    .or(`title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
    .limit(5);
  return (data ?? []).map((row) => ({
    id: row.id,
    category: "notes" as const,
    title: row.title,
    subtitle: row.content,
    href: "/notlar",
    icon: "💌",
  }));
}

async function searchJournals(query: string): Promise<SearchResultItem[]> {
  const safeQuery = escapePostgrestValue(query);
  const { data } = await createClient()
    .from("journals")
    .select("id, title, content")
    .or(`title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
    .limit(5);
  return (data ?? []).map((row) => ({
    id: row.id,
    category: "journals" as const,
    title: row.title,
    subtitle: row.content,
    href: "/gunluk",
    icon: "📓",
  }));
}

async function searchBucketItems(query: string): Promise<SearchResultItem[]> {
  const { data } = await createClient()
    .from("bucket_items")
    .select("id, title, bucket_list_id")
    .ilike("title", `%${query}%`)
    .limit(5);
  return (data ?? []).map((row) => ({
    id: row.id,
    category: "bucket" as const,
    title: row.title,
    href: "/bucket-list",
    icon: "🎯",
  }));
}

async function searchEvents(query: string): Promise<SearchResultItem[]> {
  const safeQuery = escapePostgrestValue(query);
  const { data } = await createClient()
    .from("events")
    .select("id, title, description")
    .or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
    .limit(5);
  return (data ?? []).map((row) => ({
    id: row.id,
    category: "events" as const,
    title: row.title,
    subtitle: row.description ?? undefined,
    href: "/takvim",
    icon: "📅",
  }));
}

export async function runGlobalSearch(
  query: string,
): Promise<SearchResultGroup[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [memories, notes, journals, bucket, events] = await Promise.all([
    searchMemories(trimmed),
    searchNotes(trimmed),
    searchJournals(trimmed),
    searchBucketItems(trimmed),
    searchEvents(trimmed),
  ]);

  const groups: {
    category: SearchResultGroup["category"];
    items: SearchResultItem[];
  }[] = [
    { category: "memories", items: memories },
    { category: "notes", items: notes },
    { category: "journals", items: journals },
    { category: "bucket", items: bucket },
    { category: "events", items: events },
  ];

  return groups
    .filter((group) => group.items.length > 0)
    .map((group) => ({
      category: group.category,
      label: groupLabels[group.category],
      items: group.items,
    }));
}
