"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function AnilarError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Bağlantını kontrol edip tekrar deneyebilirsin."
      retry={reset}
      title="Anılar şu anda yüklenemedi."
    />
  );
}
