export type UserRole = "owner" | "partner";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface DevelopmentDemoAccount {
  role: UserRole;
  email: string;
}
