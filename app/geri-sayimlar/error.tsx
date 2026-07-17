"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function GeriSayimlarError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Bağlantını kontrol edip tekrar deneyebilirsin."
      retry={reset}
      title="Geri sayımlar şu anda yüklenemedi."
    />
  );
}
