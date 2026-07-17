import { Target } from "lucide-react";

import { BucketListsWorkspace } from "@/components/bucket/bucket-lists-workspace";
import { PageShell } from "@/components/layout/page-shell";
import { getBucketItems, getBucketLists } from "@/lib/bucket/queries";
import { getEngagementContext } from "@/lib/notifications/queries";

export default async function BucketListPage() {
  const [context, lists, items] = await Promise.all([
    getEngagementContext(),
    getBucketLists(),
    getBucketItems(),
  ]);

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <Target className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Yapmak İstediklerimiz
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Birlikte yapmak istediğiniz her şeyi listeleyin, tamamladıkça
          işaretleyin.
        </p>
        {context ? (
          <BucketListsWorkspace
            coupleId={context.coupleId}
            currentUserId={context.userId}
            initialItems={items}
            initialLists={lists}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
