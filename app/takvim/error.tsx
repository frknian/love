"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function TakvimError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Bağlantını kontrol edip tekrar deneyebilirsin."
      retry={reset}
      title="Takvim şu anda yüklenemedi."
    />
  );
}
