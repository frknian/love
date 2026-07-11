import { toCoupleEvent } from "@/lib/events/event-mapper";
import { createClient } from "@/lib/supabase/server";
import type { CoupleEvent, EventRow } from "@/types/events";

interface EventQueryRow extends EventRow {
  creator: { display_name: string } | null;
}

export async function getEvents(): Promise<CoupleEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, couple_id, title, description, event_type, event_date, repeat_yearly, cover_image, created_by, created_at, creator:profiles!events_created_by_fkey(display_name)",
    )
    .order("event_date", { ascending: true });
  if (error) throw new Error("Etkinlikler yüklenemedi.");

  return ((data ?? []) as unknown as EventQueryRow[]).map((row) =>
    toCoupleEvent(row, row.creator?.display_name ?? "Partner"),
  );
}
