import type { User } from "@supabase/supabase-js";

import type { AppUser, UserRole } from "@/types/auth";

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getAllowedEmails() {
  const productionEmails = (process.env.ALLOWED_USER_EMAILS ?? "")
    .split(",")
    .map(normalizedEmail)
    .filter(Boolean);

  const developmentDemoEmails =
    process.env.NODE_ENV === "development"
      ? [process.env.DEV_DEMO_OWNER_EMAIL, process.env.DEV_DEMO_PARTNER_EMAIL]
          .filter((email): email is string => Boolean(email))
          .map(normalizedEmail)
      : [];

  return [...new Set([...productionEmails, ...developmentDemoEmails])];
}

export function isAllowedEmail(email: string | undefined) {
  return Boolean(email && getAllowedEmails().includes(normalizedEmail(email)));
}

export function getUserRole(email: string): UserRole {
  const ownerEmail =
    process.env.APP_OWNER_EMAIL ??
    (process.env.NODE_ENV === "development"
      ? process.env.DEV_DEMO_OWNER_EMAIL
      : "");

  return normalizedEmail(email) === normalizedEmail(ownerEmail ?? "")
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
