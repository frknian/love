import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/70 bg-white/65 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
      {...props}
    />
  );
}
