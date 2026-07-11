import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";

interface WelcomeCardProps {
  partnerNames: string;
}

export function WelcomeCard({ partnerNames }: WelcomeCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-rose-100/80 via-white/80 to-violet-100/70">
      <Sparkles className="absolute right-5 top-5 size-5 text-rose-400" />
      <p className="text-sm font-medium text-rose-500">Birlikte güzel</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">
        {partnerNames}
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
        Anılarınızı, küçük notlarınızı ve sevginizi bir arada tutan özel
        alanınız.
      </p>
    </Card>
  );
}
