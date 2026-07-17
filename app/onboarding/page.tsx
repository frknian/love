import { HeartHandshake } from "lucide-react";
import { redirect } from "next/navigation";

import { OnboardingWorkspace } from "@/components/onboarding/onboarding-workspace";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";

interface OnboardingPageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const [user, params] = await Promise.all([getCurrentAppUser(), searchParams]);

  if (!user) {
    redirect("/login");
  }
  if (user.coupleId) {
    redirect("/");
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-5 py-10">
      <section className="w-full rounded-3xl border border-white/70 bg-white/65 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <HeartHandshake className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-800">
          Neredeyse hazır
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Yeni bir çift oluştur ya da partnerinin sana gönderdiği davet koduyla
          ona katıl.
        </p>
        <OnboardingWorkspace
          initialInviteCode={params.invite?.trim().slice(0, 16)}
          userId={user.id}
        />
      </section>
    </main>
  );
}
