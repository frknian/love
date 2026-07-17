import { cache } from "react";

import { getAuthUser, getCoupleMembers } from "@/lib/supabase/session";
import type { AppUser } from "@/types/auth";

/**
 * Kimliği doğrulanmış her kullanıcı geçerlidir; erişim, `profiles` satırının
 * varlığıyla (yani bir çifte katılmış olmasıyla) belirlenir. Henüz
 * katılmamışsa `coupleId` null döner ve çağıran taraf onboarding'e
 * yönlendirmelidir. Auth ve profil verisi istek başına önbellekli
 * yardımcılardan gelir; bu fonksiyon ek ağ isteği yapmaz.
 */
export const getCurrentAppUser = cache(
  async function getCurrentAppUser(): Promise<AppUser | null> {
    const user = await getAuthUser();
    if (!user?.email) return null;

    const members = await getCoupleMembers();
    const me = members.find((member) => member.id === user.id);

    return {
      id: user.id,
      email: user.email,
      name: me?.display_name ?? user.email.split("@")[0],
      role: me?.role ?? null,
      avatarUrl: me?.avatar_url ?? undefined,
      coupleId: me?.couple_id ?? null,
    };
  },
);
