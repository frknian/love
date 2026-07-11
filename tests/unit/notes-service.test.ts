import { describe, expect, it } from "vitest";

import { validateNoteInput } from "@/services/notes/notes-service";

describe("note validation", () => {
  it("trims valid user input", () =>
    expect(
      validateNoteInput({
        title: "  Seni seviyorum ",
        content: "  İyi ki varsın. ",
        color: "pink",
        pinned: false,
      }),
    ).toMatchObject({ title: "Seni seviyorum", content: "İyi ki varsın." }));
  it("rejects an empty note", () =>
    expect(() =>
      validateNoteInput({
        title: "",
        content: "",
        color: "pink",
        pinned: false,
      }),
    ).toThrow());
});
