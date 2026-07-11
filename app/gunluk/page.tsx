import { BookHeart } from "lucide-react";

import { JournalWorkspace } from "@/components/journal/journal-workspace";
import { PageShell } from "@/components/layout/page-shell";
import { getJournalEntries } from "@/lib/journal/queries";
import { getEngagementContext } from "@/lib/notifications/queries";

export default async function JournalPage() {
  const [context, entries] = await Promise.all([
    getEngagementContext(),
    getJournalEntries(),
  ]);

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <BookHeart className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Ortak Günlük
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Günlerinizi, ruh halinizi ve anlarınızı birlikte kayıt altına alın.
        </p>
        {context ? (
          <JournalWorkspace
            coupleId={context.coupleId}
            currentUserId={context.userId}
            currentUserName={context.displayName}
            initialEntries={entries}
            partnerName={context.partnerName ?? "Partner"}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
