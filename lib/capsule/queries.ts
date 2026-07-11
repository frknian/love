import { toTimeCapsuleMeta } from "@/lib/capsule/capsule-mapper";
import { createClient } from "@/lib/supabase/server";
import type { TimeCapsuleMeta, TimeCapsuleRow } from "@/types/capsule";

interface CapsuleQueryRow extends TimeCapsuleRow {
  author: { display_name: string } | null;
}

export async function getTimeCapsules(): Promise<TimeCapsuleMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_capsules")
    .select(
      "id, couple_id, author_id, title, unlock_date, opened, opened_at, created_at, author:profiles!time_capsules_author_id_fkey(display_name)",
    )
    .order("unlock_date", { ascending: true });
  if (error) throw new Error("Zaman kapsülleri yüklenemedi.");

  return ((data ?? []) as unknown as CapsuleQueryRow[]).map((row) =>
    toTimeCapsuleMeta(row, row.author?.display_name ?? "Partner"),
  );
}

export async function getNextLockedCapsule(): Promise<TimeCapsuleMeta | null> {
  const capsules = await getTimeCapsules();
  return capsules.find((capsule) => !capsule.isUnlocked) ?? null;
}
