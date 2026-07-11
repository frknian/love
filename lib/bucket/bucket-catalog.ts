import type { BucketItemPriority, BucketListColor } from "@/types/bucket";

interface BucketColorDefinition {
  value: BucketListColor;
  label: string;
  badge: string;
  surface: string;
  bar: string;
  dot: string;
}

/** Yeni bir liste rengi eklemek için `types/bucket.ts`teki `bucketListColors` dizisine ve buraya bir kayıt eklemek yeterlidir. */
export const bucketColorCatalog: BucketColorDefinition[] = [
  {
    value: "rose",
    label: "Gül",
    badge: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    surface:
      "from-rose-100 via-rose-50 to-white dark:from-rose-500/20 dark:via-rose-500/10 dark:to-transparent",
    bar: "bg-rose-400",
    dot: "bg-rose-400",
  },
  {
    value: "amber",
    label: "Kehribar",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    surface:
      "from-amber-100 via-amber-50 to-white dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  {
    value: "sky",
    label: "Gökyüzü",
    badge: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
    surface:
      "from-sky-100 via-sky-50 to-white dark:from-sky-500/20 dark:via-sky-500/10 dark:to-transparent",
    bar: "bg-sky-400",
    dot: "bg-sky-400",
  },
  {
    value: "emerald",
    label: "Zümrüt",
    badge:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    surface:
      "from-emerald-100 via-emerald-50 to-white dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-transparent",
    bar: "bg-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    value: "violet",
    label: "Menekşe",
    badge:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    surface:
      "from-violet-100 via-violet-50 to-white dark:from-violet-500/20 dark:via-violet-500/10 dark:to-transparent",
    bar: "bg-violet-400",
    dot: "bg-violet-400",
  },
  {
    value: "slate",
    label: "Gri",
    badge:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    surface:
      "from-slate-100 via-slate-50 to-white dark:from-slate-500/20 dark:via-slate-500/10 dark:to-transparent",
    bar: "bg-slate-400",
    dot: "bg-slate-400",
  },
];

const colorsByValue = new Map(
  bucketColorCatalog.map((definition) => [definition.value, definition]),
);

export function getBucketColorDefinition(color: BucketListColor) {
  return colorsByValue.get(color) ?? bucketColorCatalog[0];
}

interface PriorityDefinition {
  value: BucketItemPriority;
  label: string;
  badge: string;
}

export const bucketPriorityCatalog: PriorityDefinition[] = [
  {
    value: "low",
    label: "Düşük",
    badge:
      "bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
  },
  {
    value: "medium",
    label: "Orta",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  {
    value: "high",
    label: "Yüksek",
    badge: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  },
];

const prioritiesByValue = new Map(
  bucketPriorityCatalog.map((definition) => [definition.value, definition]),
);

export function getPriorityDefinition(priority: BucketItemPriority) {
  return prioritiesByValue.get(priority) ?? bucketPriorityCatalog[1];
}
