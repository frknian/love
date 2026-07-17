"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function ZamanKapsuluError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Bağlantını kontrol edip tekrar deneyebilirsin."
      retry={reset}
      title="Zaman kapsülü şu anda yüklenemedi."
    />
  );
}
