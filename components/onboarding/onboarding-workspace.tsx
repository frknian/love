"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  ImagePlus,
  LoaderCircle,
  Share2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { ZodError } from "zod";

import { onboardingService } from "@/services/onboarding/onboarding-service";
import type { OnboardingMode } from "@/types/onboarding";

interface OnboardingWorkspaceProps {
  initialInviteCode?: string;
  userId: string;
}

export function OnboardingWorkspace({
  initialInviteCode,
  userId,
}: OnboardingWorkspaceProps) {
  const router = useRouter();
  const [mode, setMode] = useState<OnboardingMode>(
    initialInviteCode ? "join" : "create",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [createdInvite, setCreatedInvite] = useState<string>();
  const [isCopied, setIsCopied] = useState(false);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get("displayName") ?? "");

    try {
      if (mode === "create") {
        const result = await onboardingService.createCouple(
          userId,
          displayName,
          avatarFile,
        );
        setCreatedInvite(result.inviteCode);
      } else {
        await onboardingService.joinCouple(
          userId,
          String(formData.get("inviteCode") ?? ""),
          displayName,
          avatarFile,
        );
        router.replace("/");
        router.refresh();
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof ZodError
          ? submissionError.issues[0]?.message
          : submissionError instanceof Error
            ? submissionError.message
            : "Bir şeyler ters gitti. Lütfen tekrar dene.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function getInviteUrl() {
    if (!createdInvite) return;
    const inviteUrl = new URL("/kayit", window.location.origin);
    inviteUrl.searchParams.set("invite", createdInvite);
    return inviteUrl.toString();
  }

  async function handleCopyInvite() {
    const inviteUrl = getInviteUrl();
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  }

  async function handleShareCode() {
    const inviteUrl = getInviteUrl();
    if (!inviteUrl) return;

    const shareText =
      "Bizim Hikâyemiz'e katılman için sana bir davet gönderdim.";
    if (navigator.share) {
      await navigator
        .share({
          title: "Bizim Hikâyemiz daveti",
          text: shareText,
          url: inviteUrl,
        })
        .catch(() => undefined);
      return;
    }
    await handleCopyInvite();
  }

  if (createdInvite) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-3xl border border-rose-100 bg-rose-50/70 p-6 text-center"
        initial={{ opacity: 0, y: 8 }}
      >
        <Sparkles aria-hidden="true" className="mx-auto size-8 text-rose-400" />
        <p className="mt-3 font-semibold text-slate-800">
          Çiftiniz oluşturuldu!
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Partnerine davet bağlantısını gönder; kayıt olduktan sonra çifte
          katılım ekranı onun için hazır olacak.
        </p>
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-2xl font-bold tracking-[0.3em] text-rose-600">
          {createdInvite}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
            onClick={handleCopyInvite}
            type="button"
          >
            {isCopied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {isCopied ? "Kopyalandı" : "Bağlantıyı kopyala"}
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
            onClick={handleShareCode}
            type="button"
          >
            <Share2 className="size-4" />
            Paylaş
          </button>
        </div>
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-semibold text-white"
          onClick={() => {
            router.replace("/");
            router.refresh();
          }}
          type="button"
        >
          Devam Et
        </button>
      </motion.div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div
        aria-label="Nasıl devam etmek istersin?"
        className="grid grid-cols-2 gap-2"
        role="radiogroup"
      >
        <button
          aria-checked={mode === "create"}
          className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
            mode === "create"
              ? "bg-rose-500 text-white"
              : "bg-rose-50 text-slate-600 hover:bg-rose-100"
          }`}
          onClick={() => setMode("create")}
          role="radio"
          type="button"
        >
          Yeni çift oluştur
        </button>
        <button
          aria-checked={mode === "join"}
          className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
            mode === "join"
              ? "bg-rose-500 text-white"
              : "bg-rose-50 text-slate-600 hover:bg-rose-100"
          }`}
          onClick={() => setMode("join")}
          role="radio"
          type="button"
        >
          Davet koduyla katıl
        </button>
      </div>

      <div className="flex items-center gap-4">
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="onboarding-avatar"
          onChange={handleAvatarChange}
          type="file"
        />
        <label
          className="grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-rose-100 text-rose-500"
          htmlFor="onboarding-avatar"
        >
          {avatarPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt="Avatar önizlemesi"
              className="size-full object-cover"
              src={avatarPreview}
            />
          ) : (
            <UserRound className="size-7" />
          )}
        </label>
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-rose-500"
          htmlFor="onboarding-avatar"
        >
          <ImagePlus className="size-4" />
          {avatarFile ? "Fotoğrafı değiştir" : "Fotoğraf ekle (opsiyonel)"}
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Adın
        </span>
        <input
          className="w-full rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-300"
          maxLength={80}
          name="displayName"
          placeholder="Görünen adın"
          required
        />
      </label>

      <AnimatePresence initial={false}>
        {mode === "join" ? (
          <motion.label
            animate={{ opacity: 1, height: "auto" }}
            className="block overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Davet kodu
            </span>
            <input
              className="w-full rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm uppercase tracking-widest text-slate-700 outline-none focus:border-rose-300"
              maxLength={16}
              name="inviteCode"
              defaultValue={initialInviteCode}
              placeholder="ör. AB12CD34"
              required={mode === "join"}
            />
          </motion.label>
        ) : null}
      </AnimatePresence>

      {error ? (
        <p
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {isSubmitting
          ? "Kaydediliyor"
          : mode === "create"
            ? "Çiftimi Oluştur"
            : "Çifte Katıl"}
      </button>
    </form>
  );
}
