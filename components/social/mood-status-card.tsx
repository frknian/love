"use client";

import { CalendarPlus, ChevronDown, LoaderCircle, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatRelativeTimeTr } from "@/lib/date-utils";
import {
  getMoodDefinition,
  moodsForGender,
  partnerCallLabel,
} from "@/lib/social/mood-catalog";
import { createClient } from "@/lib/supabase/client";
import { notificationsService } from "@/services/notifications/notifications-service";
import {
  socialService,
  type PlanInput,
} from "@/services/social/social-service";
import { canUsePeriodMode, type Gender } from "@/types/profile";
import type {
  MoodEntryRow,
  PlanRequestRow,
  QuickStatusRow,
} from "@/types/social";

interface MoodStatusCardProps {
  coupleId: string;
  currentUserGender: Gender;
  currentUserId: string;
  currentUserName: string;
  partnerId: string;
  partnerName: string;
}

const QUICK_COOLDOWN_MS = 30_000;

export function MoodStatusCard({
  coupleId,
  currentUserGender,
  currentUserId,
  currentUserName,
  partnerId,
  partnerName,
}: MoodStatusCardProps) {
  const { showToast } = useToast();
  const [moods, setMoods] = useState<MoodEntryRow[]>([]);
  const [statuses, setStatuses] = useState<QuickStatusRow[]>([]);
  const [plans, setPlans] = useState<PlanRequestRow[]>([]);
  const [showMoods, setShowMoods] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [hungerText, setHungerText] = useState("");
  const [showHunger, setShowHunger] = useState(false);
  const [callNote, setCallNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const periodModeEnabled = canUsePeriodMode(currentUserGender);
  const availableMoods = moodsForGender(currentUserGender);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [moodResult, statusResult, planResult] = await Promise.all([
      supabase
        .from("mood_entries")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("quick_statuses").select("*").eq("couple_id", coupleId),
      supabase
        .from("plan_requests")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    if (!moodResult.error) setMoods((moodResult.data ?? []) as MoodEntryRow[]);
    if (!statusResult.error)
      setStatuses((statusResult.data ?? []) as QuickStatusRow[]);
    if (!planResult.error)
      setPlans((planResult.data ?? []) as PlanRequestRow[]);
  }, [coupleId]);

  useEffect(() => {
    void load();
    const supabase = createClient();
    const channel = supabase
      .channel(`mood-status:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mood_entries",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => void load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quick_statuses",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => void load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "plan_requests",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, load]);

  const myMood = moods.find(
    (mood) =>
      mood.created_by === currentUserId &&
      (mood.mood !== "period" || periodModeEnabled),
  );
  const partnerMood = moods.find((mood) => mood.created_by === partnerId);
  const myStatuses = statuses.filter(
    (status) => status.created_by === currentUserId && status.active,
  );
  const partnerStatuses = statuses.filter(
    (status) => status.created_by === partnerId && status.active,
  );
  const pendingPlans = plans.filter(
    (plan) => plan.recipient_id === currentUserId && plan.status === "pending",
  );

  async function notifyPartner(
    type: string,
    title: string,
    message: string,
    icon: string,
  ) {
    await notificationsService.send({
      coupleId,
      senderId: currentUserId,
      receiverId: partnerId,
      type,
      title,
      message,
      icon,
      animation: "floating-hearts",
    });
  }

  async function selectMood(mood: MoodEntryRow["mood"]) {
    if (mood === "period" && !periodModeEnabled) {
      showToast("Regl modu bu profil için kullanılamaz.", "error");
      return;
    }
    if (myMood?.mood === mood) {
      setShowMoods(false);
      showToast("Bu mod zaten seçili.");
      return;
    }
    setIsSaving(true);
    try {
      await socialService.setMood(coupleId, currentUserId, mood);
      const definition = getMoodDefinition(mood);
      await notifyPartner(
        "mood_changed",
        "Modunu güncelledi",
        `${currentUserName} bugün ${definition?.label.toLocaleLowerCase("tr-TR")} hissediyor.`,
        definition?.emoji ?? "🙂",
      );
      if (mood === "period")
        await socialService.setQuickStatus(
          coupleId,
          currentUserId,
          "period",
          null,
        );
      setShowMoods(false);
      showToast("Modun güncellendi.");
      await load();
    } catch {
      showToast("Modun güncellenemedi.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function callPartner() {
    if (Date.now() < cooldownUntil || isSaving) return;
    setIsSaving(true);
    try {
      await socialService.setQuickStatus(
        coupleId,
        currentUserId,
        "period",
        callNote,
      );
      await notifyPartner(
        "partner_call",
        `${currentUserName} sana ihtiyaç duyuyor ❤️`,
        callNote.trim() || "Müsait olduğunda onu arar mısın?",
        "❤️",
      );
      const nextCooldown = Date.now() + QUICK_COOLDOWN_MS;
      setCooldownUntil(nextCooldown);
      window.setTimeout(() => setCooldownUntil(0), QUICK_COOLDOWN_MS);
      setCallNote("");
      showToast(`${partnerName} haberdar edildi.`);
    } catch {
      showToast("Çağrı gönderilemedi.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function callPartnerFromActivePeriodCard() {
    if (Date.now() < cooldownUntil || isSaving) return;
    setIsSaving(true);
    try {
      await notifyPartner(
        "partner_call",
        `${currentUserName} seni çağırıyor ❤️`,
        "Müsait olduğunda onunla konuşur musun?",
        "❤️",
      );
      const nextCooldown = Date.now() + QUICK_COOLDOWN_MS;
      setCooldownUntil(nextCooldown);
      window.setTimeout(() => setCooldownUntil(0), QUICK_COOLDOWN_MS);
      showToast(`${partnerName} haberdar edildi.`);
    } catch {
      showToast("Çağrı gönderilemedi.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function sendHunger() {
    setIsSaving(true);
    try {
      const food = await socialService.setQuickStatus(
        coupleId,
        currentUserId,
        "hunger",
        hungerText,
      );
      await notifyPartner(
        "hunger_alert",
        "Açlık Alarmı",
        `${currentUserName}’ın canı ${food?.toLocaleLowerCase("tr-TR")} çekiyor 🍕`,
        "🍕",
      );
      setHungerText(food ?? "");
      showToast("Açlık Alarmı gönderildi.");
      await load();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Açlık Alarmı gönderilemedi.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const form = new FormData(event.currentTarget);
    const input: PlanInput = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      date: String(form.get("date") ?? ""),
      time: String(form.get("time") ?? ""),
      meetingType:
        form.get("meetingType") === "in_person" ? "in_person" : "online",
    };
    try {
      await socialService.setQuickStatus(
        coupleId,
        currentUserId,
        "bored",
        null,
      );
      await socialService.proposePlan(
        coupleId,
        currentUserId,
        partnerId,
        input,
      );
      await notifyPartner(
        "plan_request",
        "Yeni plan önerisi",
        `${currentUserName} seninle “${input.title.trim()}” planı yapmak istiyor 🎬`,
        "🎬",
      );
      setShowPlan(false);
      showToast("Plan önerisi gönderildi.");
      await load();
    } catch {
      showToast("Plan önerisi gönderilemedi.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function respond(
    plan: PlanRequestRow,
    response: "accepted" | "rejected",
  ) {
    setIsSaving(true);
    try {
      await socialService.respondToPlan(plan.id, response);
      await notificationsService.send({
        coupleId,
        senderId: currentUserId,
        receiverId: plan.created_by,
        type: "plan_response",
        title:
          response === "accepted" ? "Plan kabul edildi" : "Plan reddedildi",
        message:
          response === "accepted"
            ? `${currentUserName}, “${plan.title}” planını kabul etti ✅`
            : `${currentUserName}, “${plan.title}” planını şu an kabul edemedi.`,
        icon: response === "accepted" ? "✅" : "💬",
        animation: "floating-hearts",
      });
      showToast(
        response === "accepted"
          ? "Plan takvime eklendi."
          : "Plan önerisi reddedildi.",
      );
      await load();
    } catch {
      showToast("Plan yanıtlanamadı.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function closeStatus(status: QuickStatusRow) {
    await socialService
      .setQuickStatus(coupleId, currentUserId, status.status_type, null, false)
      .then(load)
      .catch(() => showToast("Durum kapatılamadı.", "error"));
  }

  const renderMood = (
    name: string,
    mood: MoodEntryRow | undefined,
    fallback: string,
  ) => {
    const definition = getMoodDefinition(mood?.mood);
    return (
      <div className="rounded-2xl bg-white/70 px-3 py-3 dark:bg-white/[0.05]">
        <p className="text-xs text-slate-400">{name}</p>
        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {definition ? `${definition.emoji} ${definition.label}` : fallback}
        </p>
        {mood ? (
          <p className="mt-1 text-[11px] text-slate-400">
            {formatRelativeTimeTr(mood.created_at)}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
            Modumuz
          </p>
          <h2 className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
            Bugün nasıl hissediyorsunuz?
          </h2>
        </div>
        <button
          className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-violet-100 px-3 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
          onClick={() => setShowMoods((current) => !current)}
          type="button"
        >
          Modumu değiştir <ChevronDown className="size-3.5" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {renderMood(currentUserName, myMood, "Henüz seçmedin")}
        {renderMood(partnerName, partnerMood, "Henüz paylaşmadı")}
      </div>

      {showMoods ? (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {availableMoods.map((mood) => (
            <button
              aria-label={`Modumu ${mood.label} yap`}
              className="rounded-2xl bg-slate-50 px-1 py-2 text-center transition hover:bg-rose-50 disabled:opacity-50 dark:bg-white/[0.04]"
              disabled={isSaving}
              key={mood.key}
              onClick={() => void selectMood(mood.key)}
              type="button"
            >
              <span className="block text-xl">{mood.emoji}</span>
              <span className="mt-1 block truncate text-[10px] font-medium text-slate-500">
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 border-t border-rose-100 pt-4 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
          Hızlı durumlar
        </p>
        <div
          className={`mt-3 grid gap-2 ${
            periodModeEnabled ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {periodModeEnabled ? (
            <button
              className="rounded-2xl bg-pink-50 px-2 py-3 text-xs font-semibold text-pink-700"
              onClick={() => {
                const status = myStatuses.find(
                  (item) => item.status_type === "period",
                );
                setCallNote(status?.details ?? "");
                void socialService
                  .setQuickStatus(coupleId, currentUserId, "period", null)
                  .then(load)
                  .catch(() =>
                    showToast("Regl modu etkinleştirilemedi.", "error"),
                  );
              }}
              type="button"
            >
              🌸 Regl Oldum
            </button>
          ) : null}
          <button
            className="rounded-2xl bg-amber-50 px-2 py-3 text-xs font-semibold text-amber-700"
            onClick={() => {
              setHungerText(
                myStatuses.find((status) => status.status_type === "hunger")
                  ?.details ?? "",
              );
              setShowHunger(true);
            }}
            type="button"
          >
            🍕 Açlık Alarmı
          </button>
          <button
            className="rounded-2xl bg-sky-50 px-2 py-3 text-xs font-semibold text-sky-700"
            onClick={() => setShowPlan(true)}
            type="button"
          >
            🎬 Canım Sıkıldı
          </button>
        </div>
      </div>

      {periodModeEnabled &&
      myStatuses.some((status) => status.status_type === "period") ? (
        <div className="mt-3 rounded-2xl bg-pink-50 p-3 dark:bg-pink-500/10">
          <p className="mb-2 text-sm font-semibold text-pink-700 dark:text-pink-300">
            Regl Modu Aktif
          </p>
          <input
            className="w-full rounded-xl border border-pink-100 bg-white px-3 py-2 text-sm"
            maxLength={160}
            onChange={(event) => setCallNote(event.target.value)}
            placeholder="Kısa bir not ekle (isteğe bağlı)"
            value={callNote}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="min-h-10 flex-1 rounded-xl bg-pink-500 px-3 text-xs font-semibold text-white disabled:opacity-50"
              disabled={isSaving || Date.now() < cooldownUntil}
              onClick={() => void callPartner()}
              type="button"
            >
              {partnerCallLabel(partnerName)}
            </button>
            <button
              aria-label="Regl durumunu kapat"
              className="grid size-10 place-items-center rounded-xl bg-white text-slate-400"
              onClick={() => {
                const status = myStatuses.find(
                  (item) => item.status_type === "period",
                );
                if (status) void closeStatus(status);
              }}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {showHunger ||
      myStatuses.some((status) => status.status_type === "hunger") ? (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <label className="text-xs font-semibold text-amber-700">
            Canın ne çekiyor?
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm"
            maxLength={80}
            onChange={(event) => setHungerText(event.target.value)}
            placeholder="Pizza, çikolata, kahve…"
            value={hungerText}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="min-h-10 flex-1 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white disabled:opacity-50"
              disabled={isSaving || !hungerText.trim()}
              onClick={() => void sendHunger()}
              type="button"
            >
              Açlık Alarmı Gönder
            </button>
            <button
              aria-label="Açlık Alarmını kapat"
              className="grid size-10 place-items-center rounded-xl bg-white text-slate-400"
              onClick={() => {
                setShowHunger(false);
                const status = myStatuses.find(
                  (item) => item.status_type === "hunger",
                );
                if (status) void closeStatus(status);
              }}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {myStatuses.some((status) => status.status_type === "bored") ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-sky-50 p-3 dark:bg-sky-500/10">
          <p className="flex-1 text-xs text-sky-700 dark:text-sky-300">
            🎬 Birlikte plan yapma durumun aktif.
          </p>
          <button
            aria-label="Plan yapma durumunu kapat"
            className="grid size-9 place-items-center rounded-xl bg-white text-slate-400"
            onClick={() => {
              const status = myStatuses.find(
                (item) => item.status_type === "bored",
              );
              if (status) void closeStatus(status);
            }}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {partnerStatuses.length ? (
        <div className="mt-3 space-y-2">
          {partnerStatuses.map((status) =>
            status.status_type === "period" ? (
              <div
                className="rounded-xl bg-pink-50 px-3 py-3 text-xs text-slate-600 dark:bg-pink-500/10 dark:text-slate-300"
                key={status.id}
              >
                <p className="font-semibold text-pink-700 dark:text-pink-300">
                  🌸 Regl Modu Aktif
                </p>
                <p className="mt-1">
                  {partnerName} bugün biraz ilgiye ihtiyaç duyabilir.
                </p>
                {status.details ? (
                  <p className="mt-2 rounded-lg bg-white/80 px-2 py-1.5 italic dark:bg-white/[0.06]">
                    “{status.details}”
                  </p>
                ) : null}
                <button
                  className="mt-2 min-h-9 w-full rounded-lg bg-pink-500 px-3 text-xs font-semibold text-white disabled:opacity-50"
                  disabled={isSaving || Date.now() < cooldownUntil}
                  onClick={() => void callPartnerFromActivePeriodCard()}
                  type="button"
                >
                  {partnerCallLabel(partnerName)}
                </button>
              </div>
            ) : (
              <p
                className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-slate-600 dark:bg-white/[0.04] dark:text-slate-300"
                key={status.id}
              >
                {status.status_type === "hunger"
                  ? `🍕 ${partnerName}’ın canı ${status.details ?? "bir şeyler"} çekiyor.`
                  : `🎬 ${partnerName} birlikte bir plan yapmak istiyor.`}
              </p>
            ),
          )}
        </div>
      ) : null}

      {pendingPlans.map((plan) => (
        <div
          className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3 dark:border-sky-500/20 dark:bg-sky-500/10"
          key={plan.id}
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {plan.title}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {plan.plan_date} {plan.plan_time?.slice(0, 5)} ·{" "}
            {plan.meeting_type === "online" ? "Online" : "Yüz yüze"}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className="min-h-9 flex-1 rounded-xl bg-emerald-500 text-xs font-semibold text-white"
              onClick={() => void respond(plan, "accepted")}
              type="button"
            >
              Kabul et
            </button>
            <button
              className="min-h-9 flex-1 rounded-xl bg-white text-xs font-semibold text-slate-500"
              onClick={() => void respond(plan, "rejected")}
              type="button"
            >
              Reddet
            </button>
          </div>
        </div>
      ))}

      {showPlan ? (
        <div className="fixed inset-0 z-[85] grid place-items-end bg-slate-900/35 p-4 backdrop-blur-sm sm:place-items-center">
          <form
            className="w-full max-w-lg rounded-3xl bg-[#fffafd] p-5 shadow-2xl dark:bg-slate-900"
            onSubmit={submitPlan}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                Plan Yapalım
              </h2>
              <button
                aria-label="Plan panelini kapat"
                onClick={() => setShowPlan(false)}
                type="button"
              >
                <X className="size-5 text-slate-400" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm"
                maxLength={120}
                name="title"
                placeholder="Örn. Aynı filmi izleyelim"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm"
                  name="date"
                  required
                  type="date"
                />
                <input
                  className="rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm"
                  name="time"
                  type="time"
                />
              </div>
              <select
                className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm"
                name="meetingType"
              >
                <option value="online">Online</option>
                <option value="in_person">Yüz yüze</option>
              </select>
              <textarea
                className="min-h-20 w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm"
                maxLength={500}
                name="description"
                placeholder="Kısa açıklama"
              />
            </div>
            <button
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 text-sm font-semibold text-white disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CalendarPlus className="size-4" />
              )}
              Partnerime gönder
            </button>
          </form>
        </div>
      ) : null}
    </Card>
  );
}
