import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendWebPushToUser } from "@/lib/notifications/web-push-server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sendSchema = z.object({
  notificationId: z.string().uuid(),
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

  const rateLimit = checkRateLimit(`push:${user.id}`, 30, 60_000);
  if (!rateLimit.allowed)
    return NextResponse.json(
      { error: "Too many push requests." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      },
    );

  const parsed = sendSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid notification." },
      { status: 400 },
    );

  const admin = getSupabaseAdminClient();
  const { data: notification } = await admin
    .from("notifications")
    .select(
      "id, sender_id, receiver_id, notification_type, title, message, icon",
    )
    .eq("id", parsed.data.notificationId)
    .maybeSingle();

  if (!notification || notification.sender_id !== user.id)
    return NextResponse.json(
      { error: "Notification not found." },
      { status: 404 },
    );

  const delivery = await sendWebPushToUser(
    notification.receiver_id,
    {
      title: `${notification.icon} ${notification.title}`,
      body: notification.message,
      icon: "/icons/icon-192.png",
      tag: `interaction:${notification.id}`,
      url: "/bildirimler",
    },
    notification.notification_type,
  );

  return NextResponse.json(delivery, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
