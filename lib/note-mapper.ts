import type { Note, NoteRow } from "@/types/notes";

export function toNote(row: NoteRow, authorName = "Partner"): Note {
  return {
    id: row.id,
    coupleId: row.couple_id,
    authorId: row.author_id,
    authorName,
    title: row.title,
    content: row.content,
    color: row.color,
    pinned: row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
