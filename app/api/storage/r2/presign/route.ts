import { NextResponse } from "next/server";

import { createR2UploadUrl, isR2Configured, toR2Path } from "@/lib/r2/client";
import { getAuthUser, getCoupleMembers } from "@/lib/supabase/session";

export const runtime = "nodejs";

const MAX_R2_OBJECT_SIZE = 5 * 1024 * 1024 * 1024;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]);

export async function POST(request: Request) {
  if (!isR2Configured())
    return NextResponse.json({ configured: false }, { status: 503 });

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const members = await getCoupleMembers();
  const member = members.find((item) => item.id === user.id);
  if (!member)
    return NextResponse.json({ error: "Couple membership required" }, { status: 403 });

  const body = (await request.json()) as {
    contentType?: string;
    fileName?: string;
    size?: number;
  };
  if (
    !body.contentType ||
    !allowedTypes.has(body.contentType) ||
    !body.size ||
    body.size < 1 ||
    body.size > MAX_R2_OBJECT_SIZE
  )
    return NextResponse.json({ error: "Invalid media" }, { status: 400 });

  const extension = body.fileName?.split(".").pop()?.toLowerCase() || "bin";
  const key = `memories/${member.couple_id}/${user.id}/${crypto.randomUUID()}.${extension}`;
  const uploadUrl = await createR2UploadUrl(key, body.contentType);
  return NextResponse.json({ uploadUrl, path: toR2Path(key) });
}
