"use client";

import { motion } from "framer-motion";
import { CalendarDays, Pin, Trash2 } from "lucide-react";

import type { Note } from "@/types/notes";

const colorClasses = {
  yellow: "bg-amber-100/85 border-amber-200",
  pink: "bg-rose-100/85 border-rose-200",
  blue: "bg-sky-100/85 border-sky-200",
  green: "bg-emerald-100/85 border-emerald-200",
  purple: "bg-violet-100/85 border-violet-200",
};

interface NoteCardProps {
  note: Note;
  canEdit: boolean;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteCard({ note, canEdit, onEdit, onDelete }: NoteCardProps) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`break-inside-avoid rounded-3xl border p-4 shadow-[0_10px_28px_rgba(104,82,91,0.08)] ${colorClasses[note.color]}`}
      exit={{ opacity: 0, scale: 0.96 }}
      initial={{ opacity: 0, y: 18 }}
      layout
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div className="flex items-start gap-3">
        <h2 className="min-w-0 flex-1 font-semibold leading-5 text-slate-800">
          {note.title}
        </h2>
        {note.pinned ? (
          <span
            aria-label="Sabitlendi"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-white/55 text-rose-500"
          >
            <Pin className="size-3.5 fill-current" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {note.content}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-xs text-slate-500">
          <p className="font-medium">{note.authorName}</p>
          <p className="mt-1 inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
              new Date(note.updatedAt),
            )}
          </p>
        </div>
        <div className="flex gap-1">
          {canEdit ? (
            <button
              aria-label="Notu düzenle"
              className="rounded-xl bg-white/50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/80"
              onClick={() => onEdit(note)}
              type="button"
            >
              Düzenle
            </button>
          ) : null}
          <button
            aria-label="Notu sil"
            className="grid size-8 place-items-center rounded-xl bg-white/50 text-rose-500 hover:bg-white/80"
            onClick={() => onDelete(note)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
