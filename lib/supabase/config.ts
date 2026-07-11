function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseConfig() {
  return {
    // NEXT_PUBLIC_* değerleri yalnızca statik `process.env.X` erişimlerinde
    // derleme zamanında client bundle'a gömülür; dinamik `process.env[name]`
    // erişimi bu inlining'i atlatır ve tarayıcıda değer her zaman undefined
    // kalır. Bu yüzden her değişkene ayrı, statik olarak erişiyoruz.
    url: requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    key: requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}
