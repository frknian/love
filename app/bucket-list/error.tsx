"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function BucketListError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Bağlantını kontrol edip tekrar deneyebilirsin."
      retry={reset}
      title="Bucket list şu anda yüklenemedi."
    />
  );
}
