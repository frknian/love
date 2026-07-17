import { Suspense } from "react";

import { BucketProgressCard } from "@/components/home/bucket-progress-card";
import { CountdownStrip } from "@/components/home/countdown-strip";
import {
  DeferredHomeSocialCards,
  DeferredInteractionPicker,
} from "@/components/home/deferred-home-sections";
import { LatestCountdownCard } from "@/components/home/latest-countdown-card";
import { LatestInteractionCard } from "@/components/home/latest-interaction-card";
import { LatestJournalCard } from "@/components/home/latest-journal-card";
import { StatCard } from "@/components/home/stat-card";
import { UpcomingCapsuleCard } from "@/components/home/upcoming-capsule-card";
import { UpcomingEventsCard } from "@/components/home/upcoming-events-card";
import { WelcomeCard } from "@/components/home/welcome-card";
import { PageShell } from "@/components/layout/page-shell";
import { InteractionUnavailableCard } from "@/components/notifications/interaction-unavailable-card";
import { RealtimePageRefresh } from "@/components/realtime/realtime-page-refresh";
import { getHomeBucketProgress } from "@/lib/bucket/queries";
import { getNextLockedCapsule } from "@/lib/capsule/queries";
import { getCountdowns } from "@/lib/countdowns/queries";
import { toUpcomingOccurrences } from "@/lib/events/calendar";
import { getEvents } from "@/lib/events/queries";
import { getLatestJournalSummary } from "@/lib/journal/queries";
import {
  getEngagementContext,
  getLatestNotification,
} from "@/lib/notifications/queries";
import { getMyGender } from "@/lib/profile/gender";

const homeRealtimeTables = [
  "albums",
  "bucket_items",
  "bucket_lists",
  "countdowns",
  "events",
  "journals",
  "memories",
  "notes",
  "notifications",
];

function CardSkeleton({ className = "h-36" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-3xl border border-white/70 bg-white/55 ${className}`}
    />
  );
}

type HomePromises = ReturnType<typeof startHomeRequests>;

function startHomeRequests() {
  return {
    context: getEngagementContext(),
    countdowns: getCountdowns().catch(() => []),
    gender: getMyGender(),
    cards: Promise.all([
      getLatestNotification().catch(() => null),
      getEvents().catch(() => []),
      getHomeBucketProgress().catch(() => null),
      getLatestJournalSummary().catch(() => null),
      getNextLockedCapsule().catch(() => null),
    ]),
  };
}

async function HomeHero({ requests }: { requests: HomePromises }) {
  const context = await requests.context;
  const partnerNames = context
    ? [context.displayName, context.partnerName].filter(Boolean).join(" 🤍 ")
    : "Bizim Hikâyemiz";
  const subscriptions = context
    ? [
        ...homeRealtimeTables.map((table) => ({
          table,
          filter: `couple_id=eq.${context.coupleId}`,
        })),
        { table: "couples", filter: `id=eq.${context.coupleId}` },
        { table: "profiles", filter: `couple_id=eq.${context.coupleId}` },
      ]
    : [];

  return (
    <>
      {context ? (
        <RealtimePageRefresh
          channelName={`home:${context.coupleId}`}
          subscriptions={subscriptions}
        />
      ) : null}
      <WelcomeCard partnerNames={partnerNames} />
    </>
  );
}

async function HomeInteraction({ requests }: { requests: HomePromises }) {
  const context = await requests.context;
  if (!context) return null;
  if (!context.partnerId) return <InteractionUnavailableCard />;
  return (
    <DeferredInteractionPicker
      coupleId={context.coupleId}
      currentUserId={context.userId}
      partnerId={context.partnerId}
      partnerName={context.partnerName ?? "Partnerin"}
    />
  );
}

async function HomeCountdowns({ requests }: { requests: HomePromises }) {
  const countdowns = await requests.countdowns;
  const now = new Date();
  const nearestCountdowns = countdowns
    .filter((countdown) => new Date(countdown.targetDate) > now)
    .slice(0, 5);
  return <CountdownStrip countdowns={nearestCountdowns} />;
}

async function HomeSocial({ requests }: { requests: HomePromises }) {
  const [context, gender] = await Promise.all([
    requests.context,
    requests.gender,
  ]);
  if (!context) return null;
  return (
    <DeferredHomeSocialCards
      coupleId={context.coupleId}
      currentUserGender={gender}
      currentUserId={context.userId}
      currentUserName={context.displayName}
      partnerId={context.partnerId}
      partnerName={context.partnerName ?? "Partnerin"}
    />
  );
}

async function HomeCards({ requests }: { requests: HomePromises }) {
  const [context, countdowns, cards] = await Promise.all([
    requests.context,
    requests.countdowns,
    requests.cards,
  ]);
  const [latestNotification, events, bucketProgress, journal, nextCapsule] =
    cards;
  const upcomingOccurrences = toUpcomingOccurrences(events).slice(0, 3);
  const latestCountdown = countdowns.reduce<(typeof countdowns)[number] | null>(
    (latest, countdown) =>
      !latest || countdown.createdAt > latest.createdAt ? countdown : latest,
    null,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <UpcomingEventsCard occurrences={upcomingOccurrences} />
      {context ? (
        <LatestInteractionCard
          currentUserId={context.userId}
          notification={latestNotification}
        />
      ) : null}
      <LatestJournalCard entry={journal} />
      <BucketProgressCard list={bucketProgress} />
      <UpcomingCapsuleCard capsule={nextCapsule} />
      <LatestCountdownCard countdown={latestCountdown} />
      <StatCard
        relationshipStartDate={context?.relationshipStartDate ?? null}
      />
    </div>
  );
}

export default function HomePage() {
  // Tüm I/O hemen başlar; Suspense sınırları hızlı bölümleri yavaşlardan ayırır.
  const requests = startHomeRequests();
  return (
    <PageShell>
      <div className="space-y-4">
        <Suspense fallback={<CardSkeleton className="h-40" />}>
          <HomeHero requests={requests} />
        </Suspense>
        <Suspense fallback={<CardSkeleton className="h-28" />}>
          <HomeInteraction requests={requests} />
        </Suspense>
        <Suspense fallback={<CardSkeleton className="h-24" />}>
          <HomeCountdowns requests={requests} />
        </Suspense>
        <Suspense
          fallback={
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton className="h-44" />
            </div>
          }
        >
          <HomeSocial requests={requests} />
        </Suspense>
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton className="h-28" />
              <CardSkeleton className="h-28" />
            </div>
          }
        >
          <HomeCards requests={requests} />
        </Suspense>
      </div>
    </PageShell>
  );
}
