import { Heart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";

interface SignupPageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [user, params] = await Promise.all([getCurrentAppUser(), searchParams]);
  const onboardingPath = params.invite?.trim()
    ? `/onboarding?invite=${encodeURIComponent(params.invite.trim())}`
    : "/onboarding";

  if (user) {
    redirect(user.coupleId ? "/" : onboardingPath);
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-5 py-10">
      <section className="w-full rounded-3xl border border-white/70 bg-white/65 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <Heart className="size-7 fill-current" />
        </span>
        <p className="mt-6 text-sm font-medium text-rose-500">
          Aranızda özel bir alan
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">
          Kayıt Ol
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Hesabını oluştur, ardından çiftini kur ya da partnerinin davet koduyla
          ona katıl.
        </p>
        <SignupForm />
        <p className="mt-5 text-center text-sm text-slate-500">
          Zaten hesabın var mı?{" "}
          <Link
            className="font-semibold text-rose-500"
            href={`/login?next=${encodeURIComponent(onboardingPath)}`}
          >
            Giriş yap
          </Link>
        </p>
      </section>
    </main>
  );
}
