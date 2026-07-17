import { type NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/login";
const SIGNUP_PATH = "/kayit";
const AUTH_CALLBACK_PATH = "/auth/callback";
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;
const COOKIE_CHUNK_SIZE = 3180;
/** Token bitimine bu kadar kala yenileme başlatılır. */
const TOKEN_EXPIRY_MARGIN_MS = 30_000;

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user?: { email?: string };
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

/**
 * Access token'ın `exp` alanını yerel olarak okur; ağ isteği yapmaz.
 * Middleware yalnızca bir yönlendirme kapısıdır: asıl kimlik doğrulaması
 * sunucu bileşenlerindeki `auth.getUser()` ve veritabanındaki RLS
 * politikalarında yapılır. Bu yüzden burada imza doğrulamak yerine sadece
 * sürenin geçip geçmediğine bakmak hem güvenli hem de her istekte
 * Supabase'e gidilen bir ağ turunu ortadan kaldırdığı için çok daha hızlıdır.
 */
function getJwtExpiry(accessToken: string): number | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    );
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as {
      exp?: number;
    };
    return typeof claims.exp === "number" ? claims.exp : null;
  } catch {
    return null;
  }
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
  const session = getSession(request, cookieName);

  // Token süresi dolmadıysa ağa hiç çıkmadan devam et; yalnızca süre
  // dolmak üzereyken/refresh gerektiğinde Supabase'e tek istek atılır.
  let isAuthenticated = false;
  if (session?.access_token) {
    const expiry = getJwtExpiry(session.access_token);
    if (
      expiry !== null &&
      expiry * 1000 > Date.now() + TOKEN_EXPIRY_MARGIN_MS
    ) {
      isAuthenticated = true;
    } else if (session.refresh_token) {
      const refreshedSession = await refreshSession(
        url,
        key,
        session.refresh_token,
      );
      if (refreshedSession) {
        writeSession(response, request, cookieName, refreshedSession);
        isAuthenticated = true;
      }
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
  if (!isAuthenticated && !isPublicRoute)
    return redirect(LOGIN_PATH, { next: request.nextUrl.pathname });
  if (isAuthenticated && isSignupRoute) {
    const invite = request.nextUrl.searchParams.get("invite");
    return redirect("/onboarding", invite ? { invite } : undefined);
  }
  if (isAuthenticated && isLoginRoute) return redirect("/");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline|icons/|images/).*)",
  ],
};
