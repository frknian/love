import { toTimeCapsuleMeta } from "@/lib/capsule/capsule-mapper";
import { createClient } from "@/lib/supabase/server";
import type { TimeCapsuleMeta, TimeCapsuleRow } from "@/types/capsule";

interface CapsuleQueryRow extends TimeCapsuleRow {
  author: { display_name: string } | null;
}

const capsuleColumns =
  "id, couple_id, author_id, title, unlock_date, opened, opened_at, created_at, author:profiles!time_capsules_author_id_fkey(display_name)";

function toCapsuleMeta(row: CapsuleQueryRow): TimeCapsuleMeta {
  return toTimeCapsuleMeta(row, row.author?.display_name ?? "Partner");
}

export async function getTimeCapsules(): Promise<TimeCapsuleMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_capsules")
    .select(capsuleColumns)
    .order("unlock_date", { ascending: true });
  if (error) throw new Error("Zaman kapsülleri yüklenemedi.");

  return ((data ?? []) as unknown as CapsuleQueryRow[]).map(toCapsuleMeta);
}

/** Ana ekran için tüm kapsülleri yüklemek yerine yalnızca sıradakini getirir. */
export async function getNextLockedCapsule(): Promise<TimeCapsuleMeta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_capsules")
    .select(capsuleColumns)
    .gt("unlock_date", new Date().toISOString())
    .order("unlock_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Zaman kapsülleri yüklenemedi.");
  return data ? toCapsuleMeta(data as unknown as CapsuleQueryRow) : null;
}
