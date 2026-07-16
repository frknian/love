import { type NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/login";
const SIGNUP_PATH = "/kayit";
const AUTH_CALLBACK_PATH = "/auth/callback";
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;
const COOKIE_CHUNK_SIZE = 3180;

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user?: { email?: string };
}

interface SupabaseUser {
  email?: string;
}

function getCookieName(supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

function decodeSession(value: string | undefined): SupabaseSession | null {
  if (!value?.startsWith("base64-")) return null;

  try {
    const base64 = value
      .slice("base64-".length)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    );
    return JSON.parse(new TextDecoder().decode(bytes)) as SupabaseSession;
  } catch {
    return null;
  }
}

function encodeSession(session: SupabaseSession) {
  const bytes = new TextEncoder().encode(JSON.stringify(session));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `base64-${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

function getSession(request: NextRequest, cookieName: string) {
  const direct = request.cookies.get(cookieName)?.value;
  if (direct) return decodeSession(direct);

  const chunks = request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith(`${cookieName}.`))
    .sort(
      (first, second) =>
        Number(first.name.slice(cookieName.length + 1)) -
        Number(second.name.slice(cookieName.length + 1)),
    );

  return decodeSession(chunks.map((chunk) => chunk.value).join(""));
}

function writeSession(
  response: NextResponse,
  request: NextRequest,
  cookieName: string,
  session: SupabaseSession,
) {
  request.cookies
    .getAll()
    .filter(
      (cookie) =>
        cookie.name === cookieName || cookie.name.startsWith(`${cookieName}.`),
    )
    .forEach((cookie) =>
      response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 }),
    );

  const value = encodeSession(session);
  const chunks = Array.from(
    { length: Math.ceil(value.length / COOKIE_CHUNK_SIZE) },
    (_, index) =>
      value.slice(index * COOKIE_CHUNK_SIZE, (index + 1) * COOKIE_CHUNK_SIZE),
  );
  chunks.forEach((chunk, index) =>
    response.cookies.set(
      chunks.length === 1 ? cookieName : `${cookieName}.${index}`,
      chunk,
      {
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: COOKIE_MAX_AGE,
      },
    ),
  );
}

async function fetchUser(url: string, key: string, accessToken: string) {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as SupabaseUser;
}

async function refreshSession(url: string, key: string, refreshToken: string) {
  const response = await fetch(
    `${url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  if (!response.ok) return null;
  return (await response.json()) as SupabaseSession;
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  const cookieName = getCookieName(url);
  const response = NextResponse.next({ request });
  let session = getSession(request, cookieName);
  let user = session ? await fetchUser(url, key, session.access_token) : null;

  if (!user && session?.refresh_token) {
    const refreshedSession = await refreshSession(
      url,
      key,
      session.refresh_token,
    );
    if (refreshedSession) {
      session = refreshedSession;
      user =
        refreshedSession.user ??
        (await fetchUser(url, key, refreshedSession.access_token));
      writeSession(response, request, cookieName, refreshedSession);
    }
  }

  const redirect = (pathname: string, parameters?: Record<string, string>) => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname;
    redirectUrl.search = "";
    Object.entries(parameters ?? {}).forEach(([name, value]) =>
      redirectUrl.searchParams.set(name, value),
    );
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies
      .getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  };

  const isLoginRoute = request.nextUrl.pathname === LOGIN_PATH;
  const isSignupRoute = request.nextUrl.pathname === SIGNUP_PATH;
  const isAuthCallbackRoute = request.nextUrl.pathname === AUTH_CALLBACK_PATH;
  const isDevelopmentLoginRoute =
    process.env.NODE_ENV === "development" &&
    request.nextUrl.pathname === "/api/auth/development-login";
  const isPublicRoute =
    isLoginRoute ||
    isSignupRoute ||
    isAuthCallbackRoute ||
    isDevelopmentLoginRoute;
  if (!user && !isPublicRoute)
    return redirect(LOGIN_PATH, { next: request.nextUrl.pathname });
  if (user && isSignupRoute) {
    const invite = request.nextUrl.searchParams.get("invite");
    return redirect("/onboarding", invite ? { invite } : undefined);
  }
  if (user && isLoginRoute) return redirect("/");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline|icons/|images/).*)",
  ],
};
