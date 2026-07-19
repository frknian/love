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
 * JWT imzasını Supabase'in JWKS anahtarlarıyla doğrular. Yeni projelerdeki
 * asimetrik anahtarlar sayesinde JWKS süreç içinde önbelleklenir ve her sayfa
 * isteğinde Auth sunucusuna ayrı bir ağ turu yapılmaz. `cache` aynı render
 * içindeki tüm tüketicilerin tek doğrulama sonucunu paylaşmasını sağlar.
 */
export const getAuthUser = cache(async function getAuthUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub || !data.claims.email) return null;
  return { id: data.claims.sub, email: data.claims.email };
});

/**
 * Çiftin tüm profilleri + couples bilgisi, istek başına TEK sorgu.
 * RLS zaten yalnızca kullanıcının kendi çiftinin üyelerini döndürür;
 * bu yüzden filtre gerekmez. `getCurrentAppUser`, `getEngagementContext`
 * ve benzeri yardımcılar aynı sonucu paylaşır.
 */
export const getCoupleMembers = cache(async function getCoupleMembers() {
  // Bilinçli olarak `getAuthUser()` beklenmez: RLS zaten yalnızca çağıranın
  // kendi çiftinin satırlarını döndürür (oturum yoksa boş küme). Böylece
  // kimlik doğrulama ile profil sorgusu paralel çalışır ve her sayfa
  // yüklemesinden bir tam gidiş-dönüş tasarruf edilir.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, couple_id, display_name, avatar_url, role, couples(anniversary_date)",
    );
  if (error) return [] as CoupleMemberRow[];
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
