import { Hourglass } from "lucide-react";

import { CountdownsWorkspace } from "@/components/countdowns/countdowns-workspace";
import { PageShell } from "@/components/layout/page-shell";
import { getCountdowns } from "@/lib/countdowns/queries";
import { getEngagementContext } from "@/lib/notifications/queries";

export default async function CountdownsPage() {
  const [context, countdowns] = await Promise.all([
    getEngagementContext(),
    getCountdowns(),
  ]);

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <Hourglass className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800">
          Geri Sayımlar
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Heyecanla beklediğiniz günlere kalan süreyi birlikte izleyin.
        </p>
        {context ? (
          <CountdownsWorkspace
            coupleId={context.coupleId}
            currentUserId={context.userId}
            initialCountdowns={countdowns}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
