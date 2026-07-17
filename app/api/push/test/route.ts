import { NextRequest, NextResponse } from "next/server";

import { sendWebPushToUser } from "@/lib/notifications/web-push-server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getAuthUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimit = checkRateLimit(`push-test:${user.id}`, 3, 60_000);
  if (!rateLimit.allowed)
    return NextResponse.json(
      { error: "Please wait before testing again." },
      { status: 429 },
    );

  const delivery = await sendWebPushToUser(user.id, {
    title: "🔔 Bildirimler hazır",
    body: "Bizim Hikâyemiz bildirimleri bu cihazda çalışıyor.",
    icon: "/icons/icon-192.png",
    tag: "push-test",
    url: "/ayarlar",
  });

  if (delivery.sent === 0)
    return NextResponse.json(
      { error: "No active push subscription was found." },
      { status: 409 },
    );

  return NextResponse.json(delivery);
}
