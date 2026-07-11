import { Settings } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { getOrCreateUserSettings } from "@/lib/settings/queries";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";

export default async function SettingsPage() {
  const user = await getCurrentAppUser();
  const settings = user ? await getOrCreateUserSettings(user.id) : null;

  return (
    <PageShell>
      <section className="pt-2">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <Settings className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Ayarlar
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Uygulama tercihlerini ve oturumunu yönet.
        </p>
        {user && settings ? (
          <SettingsWorkspace initialSettings={settings} userId={user.id} />
        ) : null}
      </section>
    </PageShell>
  );
}
