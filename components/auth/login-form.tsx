"use client";

import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { DevelopmentDemoAccount, UserRole } from "@/types/auth";

interface LoginFormProps {
  demoAccounts: DevelopmentDemoAccount[];
  nextPath: string;
  initialError?: string;
}

export function LoginForm({
  demoAccounts,
  nextPath,
  initialError,
}: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function finishSignIn() {
    router.replace(nextPath.startsWith("/") ? nextPath : "/");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const { error: signInError } = await createClient().auth.signInWithPassword(
      {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      },
    );

    if (signInError) {
      setError(
        "E-posta veya şifre hatalı. Bilgilerini kontrol edip tekrar deneyebilirsin.",
      );
      setIsSubmitting(false);
      return;
    }

    finishSignIn();
  }

  async function handleDevelopmentLogin(role: UserRole) {
    setError(undefined);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/development-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Demo girişi yapılamadı.");
        return;
      }

      finishSignIn();
    } catch {
      setError("Demo girişi sırasında bir bağlantı sorunu oluştu.");
    } finally {
      setIsSubmitting(false);
    }
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
            autoComplete="current-password"
            className="w-full bg-transparent text-sm text-slate-700 caret-rose-500 outline-none placeholder:text-slate-400"
            name="password"
            placeholder="Şifren"
            required
            type="password"
          />
        </span>
      </label>
      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm leading-5 text-rose-600">
          {error}
        </p>
      ) : null}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(244,63,94,0.25)] transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {isSubmitting ? "Giriş yapılıyor" : "Giriş Yap"}
      </button>
      {demoAccounts.length ? (
        <div className="border-t border-rose-100 pt-4">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-rose-400">
            Geliştirme hesapları
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                className="rounded-2xl border border-rose-100 bg-rose-50/70 px-3 py-2.5 text-left transition hover:border-rose-200 hover:bg-rose-100/70 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                key={account.role}
                onClick={() => handleDevelopmentLogin(account.role)}
                type="button"
              >
                <span className="block text-sm font-semibold text-rose-700">
                  {account.role === "owner"
                    ? "Login as Owner"
                    : "Login as Partner"}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {account.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
