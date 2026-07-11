import { NotebookPen } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { NotesWorkspace } from "@/components/notes/notes-workspace";
import { getNotes, getNotesContext } from "@/lib/notes";

export default async function NotesPage() {
  const [context, notes] = await Promise.all([getNotesContext(), getNotes()]);

  return (
    <PageShell>
      <section>
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <NotebookPen className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800">
          Notlar
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Birbirinize bırakacağınız küçük sevgi notları.
        </p>
        {context ? (
          <NotesWorkspace
            coupleId={context.coupleId}
            currentUserId={context.userId}
            currentUserName={context.displayName}
            initialNotes={notes}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
