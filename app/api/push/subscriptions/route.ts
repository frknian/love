import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(4096),
  // PushSubscriptionJSON bunu tarayıcıya göre göndermeyebilir.
  expirationTime: z.number().int().nonnegative().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(20).max(512),
    auth: z.string().min(8).max(256),
  }),
});

const deleteSchema = z.object({
  endpoint: z.string().url().max(4096),
});

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = subscriptionSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid push subscription." },
      { status: 400 },
    );

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      expiration_time: parsed.data.expirationTime ?? null,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error)
    return NextResponse.json(
      { error: "Push subscription could not be saved." },
      { status: 500 },
    );

  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid push subscription." },
      { status: 400 },
    );

  const { error } = await getSupabaseAdminClient()
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", parsed.data.endpoint);
  if (error)
    return NextResponse.json(
      { error: "Push subscription could not be removed." },
      { status: 500 },
    );

  return NextResponse.json({ subscribed: false });
}
