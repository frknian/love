"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function GunlukError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Bağlantını kontrol edip tekrar deneyebilirsin."
      retry={reset}
      title="Günlük şu anda yüklenemedi."
    />
  );
}
