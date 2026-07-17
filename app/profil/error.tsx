"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function ProfileError({ reset }: { reset: () => void }) {
  return <RouteErrorState retry={reset} title="Profil şu anda yüklenemedi." />;
}
