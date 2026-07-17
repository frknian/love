import { UserRound } from "lucide-react";

import { ProfileCard } from "@/components/auth/profile-card";
import { PageShell } from "@/components/layout/page-shell";
import { RealtimePageRefresh } from "@/components/realtime/realtime-page-refresh";
import { CoupleInfoCard } from "@/components/profile/couple-info-card";
import { ProfileStatsGrid } from "@/components/profile/profile-stats-grid";
import { getEngagementContext } from "@/lib/notifications/queries";
import { getProfileStats } from "@/lib/profile/queries";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";

export default async function ProfilePage() {
  const [user, context] = await Promise.all([
    getCurrentAppUser(),
    getEngagementContext(),
  ]);
  const stats = context
    ? await getProfileStats(context.coupleId, context.userId)
    : null;

  return (
    <PageShell>
      {context ? (
        <RealtimePageRefresh
          channelName={"profile:" + context.coupleId}
          subscriptions={[
            { table: "couples", filter: "id=eq." + context.coupleId },
            { table: "profiles", filter: "couple_id=eq." + context.coupleId },
          ]}
        />
      ) : null}
      <section className="pt-2">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <UserRound className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Profil
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Uygulamadaki hesabın, ilişkiniz ve birlikte biriktirdikleriniz.
        </p>
        {user ? (
          <div className="mt-8 space-y-4">
            <ProfileCard user={user} />
            {stats ? (
              <>
                <CoupleInfoCard
                  coupleName={stats.coupleName}
                  relationshipStartDate={stats.relationshipStartDate}
                />
                <ProfileStatsGrid stats={stats} />
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
