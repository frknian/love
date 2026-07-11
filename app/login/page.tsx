import { Heart } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, params] = await Promise.all([getCurrentAppUser(), searchParams]);

  if (user) {
    redirect("/");
  }

  const nextPath =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/";
  const initialError =
    params.error === "access-denied"
      ? "Bu uygulamaya erişim yetkin bulunmuyor."
      : undefined;

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-5 py-10">
      <section className="w-full rounded-3xl border border-white/70 bg-white/65 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <Heart className="size-7 fill-current" />
        </span>
        <p className="mt-6 text-sm font-medium text-rose-500">
          Sadece ikimize özel
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">
          Bizim Hikâyemiz
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Anılarımıza kaldığımız yerden devam etmek için giriş yap.
        </p>
        <LoginForm initialError={initialError} nextPath={nextPath} />
      </section>
    </main>
  );
}
