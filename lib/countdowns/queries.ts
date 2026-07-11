import { toCountdown } from "@/lib/countdowns/countdown-mapper";
import { createClient } from "@/lib/supabase/server";
import type { Countdown, CountdownRow } from "@/types/countdowns";

export async function getCountdowns(): Promise<Countdown[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("countdowns")
    .select(
      "id, couple_id, title, icon, target_date, cover_image, created_by, created_at",
    )
    .order("target_date", { ascending: true });
  if (error) throw new Error("Geri sayımlar yüklenemedi.");
  return ((data ?? []) as CountdownRow[]).map(toCountdown);
}

export async function getLatestCountdown(): Promise<Countdown | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("countdowns")
    .select(
      "id, couple_id, title, icon, target_date, cover_image, created_by, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Geri sayımlar yüklenemedi.");
  return data ? toCountdown(data as CountdownRow) : null;
}
