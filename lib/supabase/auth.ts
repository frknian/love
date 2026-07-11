import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AppUser } from "@/types/auth";

interface ProfileRow {
  couple_id: string;
  display_name: string;
  avatar_url: string | null;
  role: "owner" | "partner";
}

/**
 * Kimliği doğrulanmış her kullanıcı geçerlidir; erişim bir e-posta listesiyle
 * değil, `profiles` satırının varlığıyla (yani bir çifte katılmış olmasıyla)
 * belirlenir. Henüz katılmamışsa `coupleId` null döner ve çağıran taraf
 * onboarding'e yönlendirmelidir.
 */
export async function toAppUser(
  supabase: SupabaseClient,
  user: User,
): Promise<AppUser | null> {
  if (!user.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id, display_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return {
    id: user.id,
    email: user.email,
    name: profile?.display_name ?? user.email.split("@")[0],
    role: profile?.role ?? null,
    avatarUrl: profile?.avatar_url ?? undefined,
    coupleId: profile?.couple_id ?? null,
  };
}
