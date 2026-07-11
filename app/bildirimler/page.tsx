import { BellRing } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { NotificationHistory } from "@/components/notifications/notification-history";
import {
  getEngagementContext,
  getNotifications,
} from "@/lib/notifications/queries";

export default async function NotificationsPage() {
  const [context, notifications] = await Promise.all([
    getEngagementContext(),
    getNotifications(),
  ]);

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <BellRing className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800">
          Bildirimler
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Birbirinize gönderdiğiniz tüm küçük duygusal dokunuşlar.
        </p>
        {context ? (
          <NotificationHistory
            coupleId={context.coupleId}
            currentUserId={context.userId}
            currentUserName={context.displayName}
            initialNotifications={notifications}
            partnerName={context.partnerName ?? "Partner"}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
