function getRequiredEnvironmentVariable(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseConfig() {
  return {
    url: getRequiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    key: getRequiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
