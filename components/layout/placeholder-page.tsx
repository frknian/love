import type { LucideIcon } from "lucide-react";

import { AnimatedPlaceholderContent } from "@/components/layout/animated-placeholder-content";
import { PageShell } from "@/components/layout/page-shell";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export async function PlaceholderPage({
  title,
  description,
  icon,
}: PlaceholderPageProps) {
  return (
    <PageShell>
      <AnimatedPlaceholderContent
        description={description}
        icon={icon}
        title={title}
      />
    </PageShell>
  );
}
