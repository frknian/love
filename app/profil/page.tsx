import { CalendarHeart, Heart, UsersRound } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { CoupleStoryCard } from "@/components/profile/couple-story-card";
import { ProfileStatsGrid } from "@/components/profile/profile-stats-grid";
import { RealtimePageRefresh } from "@/components/realtime/realtime-page-refresh";
import { Card } from "@/components/ui/card";
import { daysSince, formatDateTr, fromIsoDate } from "@/lib/date-utils";
import { getEngagementContext } from "@/lib/notifications/queries";
import { getCoupleProfileData } from "@/lib/profile/queries";

export default async function ProfilePage() {
  const context = await getEngagementContext();
  const profile = context
    ? await getCoupleProfileData(context.coupleId, context.userId)
    : null;
  const daysTogether = profile?.relationshipStartDate
    ? daysSince(profile.relationshipStartDate)
    : null;

  return (
    <PageShell>
      {context ? (
        <RealtimePageRefresh
          channelName={"couple-profile:" + context.coupleId}
          subscriptions={[
            { table: "couples", filter: "id=eq." + context.coupleId },
            { table: "profiles", filter: "couple_id=eq." + context.coupleId },
            { table: "couple_stories", filter: "couple_id=eq." + context.coupleId },
            { table: "memories", filter: "couple_id=eq." + context.coupleId },
            { table: "bucket_items", filter: "couple_id=eq." + context.coupleId },
          ]}
        />
      ) : null}
      <section className="pt-2">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <Heart className="size-7 fill-current" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Ortak Profil
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          İkinize ait hikâye, anılar ve küçük ama güzel istatistikler.
        </p>

        {profile ? (
          <div className="mt-7 space-y-4">
            <Card className="overflow-hidden bg-gradient-to-br from-rose-100/90 via-white/70 to-violet-100/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                    Birlikte
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                    {profile.coupleName}
                  </h2>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-white/80 text-rose-500 shadow-sm dark:bg-white/10">
                  <UsersRound className="size-5" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-2">
                {profile.members.map((member) => (
                  <span
                    className="grid size-10 place-items-center rounded-full border-2 border-white bg-rose-500 text-sm font-bold text-white shadow-sm dark:border-slate-900"
                    key={member.id}
                    title={member.displayName}
                  >
                    {member.displayName.slice(0, 1).toLocaleUpperCase("tr-TR")}
                  </span>
                ))}
                <p className="min-w-0 truncate text-sm text-slate-500 dark:text-slate-300">
                  {profile.members.map((member) => member.displayName).join(" ve ")}
                </p>
              </div>
              {profile.relationshipStartDate ? (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3 dark:bg-slate-900/25">
                  <CalendarHeart className="size-5 shrink-0 text-rose-500" />
                  <p className="text-sm text-slate-600 dark:text-slate-200">
                    {formatDateTr(fromIsoDate(profile.relationshipStartDate))} tarihinden beri{" "}
                    <strong className="font-bold text-rose-600 dark:text-rose-300">
                      {daysTogether} gün
                    </strong>{" "}
                    birlikte.
                  </p>
                </div>
              ) : null}
            </Card>

            <CoupleStoryCard
              initialStory={profile.story}
              versions={profile.storyVersions}
            />
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Ortak istatistikler
                </h2>
                <span className="text-xs text-slate-400">Canlı güncellenir</span>
              </div>
              <ProfileStatsGrid stats={profile.stats} />
            </section>
          </div>
        ) : (
          <Card className="mt-7 text-center text-sm text-slate-500">
            Ortak profil oluşturmak için önce partnerinle eşleş.
          </Card>
        )}
      </section>
    </PageShell>
  );
}
