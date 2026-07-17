import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { OfflineSyncProvider } from "@/components/providers/offline-sync-provider";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";
import { ThemeProvider } from "@/components/settings/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { THEME_STORAGE_KEY } from "@/lib/settings/theme";

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
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff7f9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function noFlashThemeScript() {
  return `(function(){try{var stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var theme=stored==='light'||stored==='dark'||stored==='system'?stored:'system';var resolved=theme==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;document.documentElement.classList.toggle('dark',resolved==='dark');document.documentElement.style.colorScheme=resolved;}catch(e){}})();`;
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript() }} />
      </head>
      <body>
        <ThemeProvider initialTheme="system">
          <ToastProvider>
            <ServiceWorkerProvider />
            <OfflineSyncProvider />
            {children}
            <Analytics />
            <SpeedInsights />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
