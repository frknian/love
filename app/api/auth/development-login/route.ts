import { NextResponse } from "next/server";

import { getDevelopmentDemoCredentials } from "@/lib/auth/development-demo";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

const roles: UserRole[] = ["owner", "partner"];

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const role =
    body &&
    typeof body === "object" &&
    "role" in body &&
    typeof body.role === "string" &&
    roles.includes(body.role as UserRole)
      ? (body.role as UserRole)
      : null;

  if (!role) {
    return NextResponse.json(
      { error: "Geçersiz demo hesabı." },
      { status: 400 },
    );
  }

  const credentials = getDevelopmentDemoCredentials(role);
  if (!credentials) {
    return NextResponse.json(
      { error: "Demo hesabı bu ortamda yapılandırılmamış." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return NextResponse.json(
      { error: "Demo hesabıyla giriş yapılamadı. Yapılandırmayı kontrol et." },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
