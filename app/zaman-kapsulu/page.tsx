import { Hourglass } from "lucide-react";

import { CapsulesWorkspace } from "@/components/capsule/capsules-workspace";
import { PageShell } from "@/components/layout/page-shell";
import { getTimeCapsules } from "@/lib/capsule/queries";
import { getEngagementContext } from "@/lib/notifications/queries";

export default async function TimeCapsulePage() {
  const [context, capsules] = await Promise.all([
    getEngagementContext(),
    getTimeCapsules(),
  ]);

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <Hourglass className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Zaman Kapsülü
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Geleceğe bir mesaj bırakın; açılma tarihine kadar kimse okuyamaz.
        </p>
        {context ? (
          <CapsulesWorkspace
            coupleId={context.coupleId}
            currentUserId={context.userId}
            currentUserName={context.displayName}
            initialCapsules={capsules}
            partnerName={context.partnerName ?? "Partner"}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
