import type { User } from "@supabase/supabase-js";

import type { AppUser, UserRole } from "@/types/auth";

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getAllowedEmails() {
  return (process.env.ALLOWED_USER_EMAILS ?? "")
    .split(",")
    .map(normalizedEmail)
    .filter(Boolean);
}

export function isAllowedEmail(email: string | undefined) {
  return Boolean(email && getAllowedEmails().includes(normalizedEmail(email)));
}

export function getUserRole(email: string): UserRole {
  return normalizedEmail(email) ===
    normalizedEmail(process.env.APP_OWNER_EMAIL ?? "")
    ? "owner"
    : "partner";
}

export function toAppUser(user: User): AppUser | null {
  if (!user.email || !isAllowedEmail(user.email)) {
    return null;
  }

  const metadata = user.user_metadata;
  const name =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : user.email.split("@")[0];
  const avatarUrl =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined;

  return {
    id: user.id,
    email: user.email,
    name,
    role: getUserRole(user.email),
    avatarUrl,
  };
}
