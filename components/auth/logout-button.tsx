"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await createClient().auth.signOut();
    navigator.serviceWorker?.controller?.postMessage({
      type: "CLEAR_PRIVATE_CACHE",
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-70"
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="size-4" />
      {isLoading ? "Çıkış yapılıyor" : "Çıkış Yap"}
    </button>
  );
}
