export type UserRole = "owner" | "partner";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  avatarUrl?: string;
  /** Kullanıcı henüz bir çifte katılmadıysa null; onboarding'e yönlendirilmeli. */
  coupleId: string | null;
}

export interface DevelopmentDemoAccount {
  role: UserRole;
  email: string;
}
