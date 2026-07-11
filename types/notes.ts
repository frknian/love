export const noteColors = [
  "yellow",
  "pink",
  "blue",
  "green",
  "purple",
] as const;

export type NoteColor = (typeof noteColors)[number];

export interface Note {
  id: string;
  coupleId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteRow {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type NoteFilter = "all" | "pinned" | "mine" | "partner";
