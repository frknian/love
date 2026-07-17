"use client";

import { LoaderCircle, LockKeyhole, Mail, MailCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ZodError } from "zod";

import { signupService } from "@/services/auth/signup-service";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const inviteCode = searchParams.get("invite")?.trim();
  const onboardingPath = inviteCode
    ? `/onboarding?invite=${encodeURIComponent(inviteCode)}`
    : "/onboarding";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await signupService.signUp(
        {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          confirmPassword: String(formData.get("confirmPassword") ?? ""),
        },
        {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(onboardingPath)}`,
        },
      );

      if (result.hasSession) {
        router.replace(onboardingPath);
        router.refresh();
        return;
      }

      setAwaitingConfirmation(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : submissionError instanceof Error
            ? submissionError.message
            : "Kayıt oluşturulamadı. Lütfen tekrar dene.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-center">
        <MailCheck
          aria-hidden="true"
          className="mx-auto size-8 text-emerald-500"
        />
        <p className="mt-3 font-semibold text-slate-800">
          E-postana bir onay bağlantısı gönderdik
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Onayladıktan sonra giriş yapıp çiftini oluşturabilir veya bir davet
          koduyla katılabilirsin.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          E-posta
        </span>
        <span className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 shadow-sm transition focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100/60">
          <Mail aria-hidden="true" className="size-5 text-rose-400" />
          <input
            autoComplete="email"
            className="w-full bg-transparent text-sm text-slate-700 caret-rose-500 outline-none placeholder:text-slate-400"
            name="email"
            placeholder="ornek@email.com"
            required
            type="email"
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Şifre
        </span>
        <span className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 shadow-sm transition focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100/60">
          <LockKeyhole aria-hidden="true" className="size-5 text-rose-400" />
          <input
            autoComplete="new-password"
            className="w-full bg-transparent text-sm text-slate-700 caret-rose-500 outline-none placeholder:text-slate-400"
            minLength={8}
            name="password"
            placeholder="En az 8 karakter"
            required
            type="password"
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Şifre (tekrar)
        </span>
        <span className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 shadow-sm transition focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100/60">
          <LockKeyhole aria-hidden="true" className="size-5 text-rose-400" />
          <input
            autoComplete="new-password"
            className="w-full bg-transparent text-sm text-slate-700 caret-rose-500 outline-none placeholder:text-slate-400"
            minLength={8}
            name="confirmPassword"
            placeholder="Şifreni tekrar gir"
            required
            type="password"
          />
        </span>
      </label>
      {error ? (
        <p
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm leading-5 text-rose-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(244,63,94,0.25)] transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {isSubmitting ? "Kayıt oluşturuluyor" : "Kayıt Ol"}
      </button>
    </form>
  );
}
