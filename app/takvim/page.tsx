import { CalendarHeart } from "lucide-react";

import { EventsWorkspace } from "@/components/events/events-workspace";
import { PageShell } from "@/components/layout/page-shell";
import { getEvents } from "@/lib/events/queries";
import { getEngagementContext } from "@/lib/notifications/queries";

export default async function CalendarPage() {
  const [context, events] = await Promise.all([
    getEngagementContext(),
    getEvents(),
  ]);

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <CalendarHeart className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800">
          Takvim
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Özel günleriniz, yıldönümleriniz ve planlarınız tek bir yerde.
        </p>
        {context ? (
          <EventsWorkspace
            coupleId={context.coupleId}
            currentUserId={context.userId}
            currentUserName={context.displayName}
            initialEvents={events}
            partnerName={context.partnerName ?? "Partner"}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
