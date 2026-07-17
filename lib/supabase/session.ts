import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

interface CoupleRelation {
  anniversary_date: string | null;
}

export interface CoupleMemberRow {
  id: string;
  couple_id: string;
  display_name: string;
  avatar_url: string | null;
  role: "owner" | "partner";
  couples: CoupleRelation | CoupleRelation[] | null;
}

/**
 * İstek başına tek Supabase Auth doğrulaması. `auth.getUser()` her çağrıda
 * Supabase'e ağ isteği attığı için layout, PageShell ve sayfaların hepsinin
 * ayrı ayrı çağırması gezinmeleri ciddi biçimde yavaşlatıyordu; `cache`
 * sayesinde istek başına yalnızca bir kez çalışır.
 */
export const getAuthUser = cache(async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Çiftin tüm profilleri + couples bilgisi, istek başına TEK sorgu.
 * RLS zaten yalnızca kullanıcının kendi çiftinin üyelerini döndürür;
 * bu yüzden filtre gerekmez. `getCurrentAppUser`, `getEngagementContext`
 * ve benzeri yardımcılar aynı sonucu paylaşır.
 */
export const getCoupleMembers = cache(async function getCoupleMembers() {
  const user = await getAuthUser();
  if (!user) return [] as CoupleMemberRow[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, couple_id, display_name, avatar_url, role, couples(anniversary_date)",
    );
  return (data as CoupleMemberRow[] | null) ?? [];
});

/** PostgREST ilişkiyi nesne veya dizi döndürebilir; ikisini de normalize eder. */
export function coupleAnniversary(
  member: CoupleMemberRow | undefined,
): string | null {
  const relation = member?.couples;
  if (!relation) return null;
  return Array.isArray(relation)
    ? (relation[0]?.anniversary_date ?? null)
    : relation.anniversary_date;
}
