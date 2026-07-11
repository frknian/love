"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

interface AnimatedPlaceholderContentProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function AnimatedPlaceholderContent({
  title,
  description,
  icon: Icon,
}: AnimatedPlaceholderContentProps) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="pt-6"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
        <Icon className="size-7" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800">
        {title}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      <Card className="mt-8 border-dashed py-10 text-center">
        <p className="font-medium text-slate-700">Yakında burada</p>
        <p className="mt-1 text-sm text-slate-400">
          Bu alan birlikte büyüyecek. ♡
        </p>
      </Card>
    </motion.section>
  );
}
