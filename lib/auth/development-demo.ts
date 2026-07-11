import type { DevelopmentDemoAccount, UserRole } from "@/types/auth";

interface DevelopmentDemoCredentials extends DevelopmentDemoAccount {
  password: string;
}

const demoEnvironmentVariables: Record<
  UserRole,
  {
    email: "DEV_DEMO_OWNER_EMAIL" | "DEV_DEMO_PARTNER_EMAIL";
    password: "DEV_DEMO_OWNER_PASSWORD" | "DEV_DEMO_PARTNER_PASSWORD";
  }
> = {
  owner: {
    email: "DEV_DEMO_OWNER_EMAIL",
    password: "DEV_DEMO_OWNER_PASSWORD",
  },
  partner: {
    email: "DEV_DEMO_PARTNER_EMAIL",
    password: "DEV_DEMO_PARTNER_PASSWORD",
  },
};

export function getDevelopmentDemoCredentials(
  role: UserRole,
): DevelopmentDemoCredentials | null {
  if (process.env.NODE_ENV !== "development") return null;

  const variables = demoEnvironmentVariables[role];
  const email = process.env[variables.email]?.trim();
  const password = process.env[variables.password];

  if (!email || !password) return null;

  return { role, email, password };
}

export function getDevelopmentDemoAccounts(): DevelopmentDemoAccount[] {
  if (process.env.NODE_ENV !== "development") return [];

  return (["owner", "partner"] as const).map((role) => ({
    role,
    email:
      process.env[demoEnvironmentVariables[role].email]?.trim() ??
      "Demo hesabı",
  }));
}
