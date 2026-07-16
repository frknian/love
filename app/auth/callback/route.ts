import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const destination = getSafeDestination(next, requestUrl.origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation", requestUrl.origin),
  );
}

function getSafeDestination(next: string | null, origin: string) {
  if (!next?.startsWith("/") || next.startsWith("//")) return "/onboarding";

  try {
    const destination = new URL(next, origin);
    if (destination.origin !== origin) return "/onboarding";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/onboarding";
  }
}
