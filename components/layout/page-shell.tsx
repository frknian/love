import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { RealtimeNotificationListener } from "@/components/notifications/realtime-notification-listener";
import { NotificationPermissionCard } from "@/components/notifications/notification-permission-card";
import { getEngagementContext } from "@/lib/notifications/queries";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";

interface PageShellProps {
  children: ReactNode;
}

export async function PageShell({ children }: PageShellProps) {
  const [user, engagement] = await Promise.all([
    getCurrentAppUser(),
    getEngagementContext(),
  ]);

  if (!user) {
    redirect("/login");
  }
  if (!user.coupleId) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <AppHeader currentUserId={engagement?.userId} user={user} />
      {children}
      <BottomNavigation />
      <NotificationPermissionCard />
      {engagement ? (
        <RealtimeNotificationListener
          coupleId={engagement.coupleId}
          currentUserId={engagement.userId}
          partnerName={engagement.partnerName ?? "Partner"}
        />
      ) : null}
    </main>
  );
}
