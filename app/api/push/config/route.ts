import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  if (!publicKey)
    return NextResponse.json(
      { error: "Web Push is not configured." },
      { status: 503 },
    );

  return NextResponse.json(
    { publicKey },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
