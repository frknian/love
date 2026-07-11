"use client";

import { motion } from "framer-motion";
import { Check, GripVertical, Trash2 } from "lucide-react";
import { type DragEvent, useState } from "react";

import { getPriorityDefinition } from "@/lib/bucket/bucket-catalog";
import { formatDateTr } from "@/lib/date-utils";
import type { BucketItem } from "@/types/bucket";

interface BucketItemRowProps {
  item: BucketItem;
  onToggle: (item: BucketItem) => void;
  onDelete: (item: BucketItem) => void;
  onDragStart: (item: BucketItem) => void;
  onDragOverItem: (item: BucketItem) => void;
  onDrop: () => void;
}

export function BucketItemRow({
  item,
  onToggle,
  onDelete,
  onDragStart,
  onDragOverItem,
  onDrop,
}: BucketItemRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const priorityDefinition = getPriorityDefinition(item.priority);

  function handleDragStart(event: DragEvent<HTMLLIElement>) {
    event.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    onDragStart(item);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>) {
    event.preventDefault();
    onDragOverItem(item);
  }

  return (
    <li
      draggable
      onDragEnd={() => setIsDragging(false)}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={onDrop}
    >
      <motion.div
        animate={{ opacity: 1 }}
        className={`flex items-start gap-2.5 rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-xl transition dark:border-white/10 dark:bg-white/[0.04] ${
          isDragging ? "opacity-40" : ""
        } ${item.completed ? "opacity-70" : ""}`}
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        layout
      >
        <span
          aria-hidden="true"
          className="mt-1.5 cursor-grab text-slate-300 active:cursor-grabbing dark:text-slate-600"
        >
          <GripVertical className="size-4" />
        </span>
        <button
          aria-checked={item.completed}
          aria-label={
            item.completed
              ? `${item.title} maddesini tamamlanmadı yap`
              : `${item.title} maddesini tamamlandı yap`
          }
          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition ${
            item.completed
              ? "border-emerald-400 bg-emerald-400 text-white"
              : "border-slate-300 text-transparent dark:border-slate-600"
          }`}
          onClick={() => onToggle(item)}
          role="checkbox"
          type="button"
        >
          <Check className="size-3" strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium text-slate-800 dark:text-slate-100 ${
              item.completed ? "line-through decoration-slate-400" : ""
            }`}
          >
            {item.title}
          </p>
          {item.description ? (
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {item.description}
            </p>
          ) : null}
          {item.completed && item.completedAt ? (
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              {item.completedByName ?? "Partner"} tamamladı •{" "}
              {formatDateTr(new Date(item.completedAt))}
            </p>
          ) : (
            <span
              className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityDefinition.badge}`}
            >
              {priorityDefinition.label}
            </span>
          )}
        </div>
        <button
          aria-label={`${item.title} maddesini sil`}
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
          onClick={() => onDelete(item)}
          type="button"
        >
          <Trash2 className="size-3.5" />
        </button>
      </motion.div>
    </li>
  );
}
