"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getPushProvider } from "@/services/notifications/push-provider";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    // Aynı cihazda farklı hesaba geçildiğinde eski kullanıcıya push
    // gönderilmesini önlemek için aboneliği oturum kapanmadan kaldır.
    await getPushProvider()
      .unsubscribe()
      .catch(() => undefined);
    await createClient().auth.signOut();
    navigator.serviceWorker?.controller?.postMessage({
      type: "CLEAR_PRIVATE_CACHE",
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="size-4" />
      {isLoading ? "Çıkış yapılıyor" : "Çıkış Yap"}
    </button>
  );
}
