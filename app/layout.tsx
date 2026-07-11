import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { OfflineSyncProvider } from "@/components/providers/offline-sync-provider";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";
import { ThemeProvider } from "@/components/settings/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getOrCreateUserSettings } from "@/lib/settings/queries";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";
import type { ThemeOption } from "@/types/settings";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bizim Hikâyemiz",
  description: "Birlikte biriktirdiğiniz güzel anlar için özel alanınız.",
  applicationName: "Bizim Hikâyemiz",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bizim Hikâyemiz",
  },
  icons: { apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#fff7f9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function noFlashThemeScript(initialTheme: ThemeOption) {
  return `(function(){try{var theme=${JSON.stringify(initialTheme)};var resolved=theme==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;document.documentElement.classList.toggle('dark',resolved==='dark');document.documentElement.style.colorScheme=resolved;}catch(e){}})();`;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentAppUser();
  const settings = user ? await getOrCreateUserSettings(user.id) : null;
  const initialTheme: ThemeOption = settings?.theme ?? "system";

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: noFlashThemeScript(initialTheme) }}
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider initialTheme={initialTheme} userId={user?.id ?? null}>
            <ToastProvider>
              <ServiceWorkerProvider />
              <OfflineSyncProvider />
              {children}
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
