import { createClient } from "@/lib/supabase/server";

export interface ProfileStats {
  coupleName: string;
  relationshipStartDate: string | null;
  totalMemories: number;
  totalNotes: number;
  totalInteractionsSent: number;
  completedBucketItems: number;
}

export async function getProfileStats(
  coupleId: string,
  userId: string,
): Promise<ProfileStats> {
  const supabase = await createClient();

  const [couple, memories, notes, interactions, bucketItems] =
    await Promise.all([
      supabase
        .from("couples")
        .select("name, anniversary_date")
        .eq("id", coupleId)
        .maybeSingle(),
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", coupleId),
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", coupleId),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", userId),
      supabase
        .from("bucket_items")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", coupleId)
        .eq("completed", true),
    ]);

  return {
    coupleName: couple.data?.name ?? "Bizim Hikâyemiz",
    relationshipStartDate: couple.data?.anniversary_date ?? null,
    totalMemories: memories.count ?? 0,
    totalNotes: notes.count ?? 0,
    totalInteractionsSent: interactions.count ?? 0,
    completedBucketItems: bucketItems.count ?? 0,
  };
}
