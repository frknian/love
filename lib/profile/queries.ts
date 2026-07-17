import { createClient } from "@/lib/supabase/server";
import type {
  CoupleMember,
  CoupleStory,
  StoryVersion,
} from "@/types/premium";


export interface CoupleProfileData {
  coupleName: string;
  coverImage: string | null;
  relationshipStartDate: string | null;
  members: CoupleMember[];
  story: CoupleStory;
  storyVersions: StoryVersion[];
  stats: ProfileStats;
}

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


export async function getCoupleProfileData(
  coupleId: string,
  userId: string,
): Promise<CoupleProfileData> {
  const supabase = await createClient();
  const [coupleResult, membersResult, storyResult, versionsResult, stats] =
    await Promise.all([
      supabase.from("couples").select("name, anniversary_date, cover_image").eq("id", coupleId).maybeSingle(),
      supabase.from("profiles").select("id, display_name, avatar_url").eq("couple_id", coupleId).order("created_at", { ascending: true }),
      supabase.from("couple_stories").select("id, content, version, updated_at, updated_by").eq("couple_id", coupleId).maybeSingle(),
      supabase.from("couple_story_versions").select("id, content, version, created_at, edited_by").eq("couple_id", coupleId).order("version", { ascending: false }).limit(8),
      getProfileStats(coupleId, userId),
    ]);
  if (coupleResult.error || membersResult.error || storyResult.error || versionsResult.error) throw new Error("Ortak profil bilgileri yüklenemedi.");
  const members = (membersResult.data ?? []).map((member) => ({ id: member.id, displayName: member.display_name, avatarUrl: member.avatar_url }));
  const memberNameById = new Map(members.map((member) => [member.id, member.displayName]));
  const story = storyResult.data;
  const derivedName = members.map((member) => member.displayName).join(" 🤍 ");
  return {
    coupleName: coupleResult.data?.name ?? (derivedName || "Bizim Hikâyemiz"),
    coverImage: coupleResult.data?.cover_image ?? null,
    relationshipStartDate: coupleResult.data?.anniversary_date ?? null,
    members,
    story: { id: story?.id ?? null, content: story?.content ?? "", version: story?.version ?? 0, updatedAt: story?.updated_at ?? null, updatedByName: story?.updated_by ? memberNameById.get(story.updated_by) ?? null : null },
    storyVersions: (versionsResult.data ?? []).map((version) => ({ id: version.id, content: version.content, version: version.version, createdAt: version.created_at, editedByName: version.edited_by ? memberNameById.get(version.edited_by) ?? null : null })),
    stats,
  };
}
