import { BucketProgressCard } from "@/components/home/bucket-progress-card";
import { CountdownStrip } from "@/components/home/countdown-strip";
import { LatestCountdownCard } from "@/components/home/latest-countdown-card";
import { LatestInteractionCard } from "@/components/home/latest-interaction-card";
import { LatestJournalCard } from "@/components/home/latest-journal-card";
import { StatCard } from "@/components/home/stat-card";
import { UpcomingCapsuleCard } from "@/components/home/upcoming-capsule-card";
import { UpcomingEventsCard } from "@/components/home/upcoming-events-card";
import { WelcomeCard } from "@/components/home/welcome-card";
import { PageShell } from "@/components/layout/page-shell";
import { InteractionPicker } from "@/components/notifications/interaction-picker";
import { getBucketItems, getBucketLists } from "@/lib/bucket/queries";
import { withProgress } from "@/lib/bucket/bucket-mapper";
import { getNextLockedCapsule } from "@/lib/capsule/queries";
import { getCountdowns, getLatestCountdown } from "@/lib/countdowns/queries";
import { toUpcomingOccurrences } from "@/lib/events/calendar";
import { getEvents } from "@/lib/events/queries";
import { getLatestJournalEntry } from "@/lib/journal/queries";
import { homeSnapshot } from "@/lib/mock-data";
import {
  getEngagementContext,
  getLatestNotification,
} from "@/lib/notifications/queries";

export default async function HomePage() {
  const [
    context,
    latestNotification,
    events,
    countdowns,
    latestCountdown,
    bucketLists,
    bucketItems,
    latestJournalEntry,
    nextCapsule,
  ] = await Promise.all([
    getEngagementContext(),
    getLatestNotification().catch(() => null),
    getEvents().catch(() => []),
    getCountdowns().catch(() => []),
    getLatestCountdown().catch(() => null),
    getBucketLists().catch(() => []),
    getBucketItems().catch(() => []),
    getLatestJournalEntry().catch(() => null),
    getNextLockedCapsule().catch(() => null),
  ]);

  const upcomingOccurrences = toUpcomingOccurrences(events).slice(0, 3);
  const nearestCountdowns = countdowns
    .filter((countdown) => new Date(countdown.targetDate) > new Date())
    .slice(0, 5);
  const activeBucketList = bucketLists.length
    ? withProgress(bucketLists[0], bucketItems)
    : null;

  return (
    <PageShell>
      <div className="space-y-4">
        <WelcomeCard partnerNames={homeSnapshot.partnerNames} />
        {context?.partnerId ? (
          <InteractionPicker
            coupleId={context.coupleId}
            currentUserId={context.userId}
            partnerId={context.partnerId}
            partnerName={context.partnerName ?? "Partnerin"}
          />
        ) : null}
        <CountdownStrip countdowns={nearestCountdowns} />
        <div className="grid gap-4 sm:grid-cols-2">
          <UpcomingEventsCard occurrences={upcomingOccurrences} />
          {context ? (
            <LatestInteractionCard
              currentUserId={context.userId}
              notification={latestNotification}
            />
          ) : null}
          <LatestJournalCard entry={latestJournalEntry} />
          <BucketProgressCard list={activeBucketList} />
          <UpcomingCapsuleCard capsule={nextCapsule} />
          <LatestCountdownCard countdown={latestCountdown} />
          <StatCard days={homeSnapshot.daysTogether} />
        </div>
      </div>
    </PageShell>
  );
}
