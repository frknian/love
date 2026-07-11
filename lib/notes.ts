import { createClient } from "@/lib/supabase/server";
import { toNote } from "@/lib/note-mapper";
import type { Note, NoteRow } from "@/types/notes";

interface NoteQueryRow extends NoteRow {
  profiles: { display_name: string }[] | null;
}

export async function getNotesContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("couple_id, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    userId: user.id,
    coupleId: data.couple_id,
    displayName: data.display_name,
  };
}

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(
      "id, couple_id, author_id, title, content, color, pinned, created_at, updated_at, profiles!notes_author_id_fkey(display_name)",
    )
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Notlar yüklenemedi.");

  return ((data ?? []) as NoteQueryRow[]).map((row) =>
    toNote(row, row.profiles?.[0]?.display_name ?? "Partner"),
  );
}
