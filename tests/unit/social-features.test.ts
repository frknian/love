import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { nextStoryIndex, partnerCallLabel } from "@/lib/social/mood-catalog";
import { socialService } from "@/services/social/social-service";

describe("Sprint 2 social helpers", () => {
  it("uses the new section names in primary UI files", () => {
    const files = [
      "app/bucket-list/page.tsx",
      "components/navigation/more-menu-sheet.tsx",
      "components/home/bucket-progress-card.tsx",
      "components/home/upcoming-capsule-card.tsx",
    ].map((file) => readFileSync(resolve(process.cwd(), file), "utf8"));
    expect(files.join("\n")).not.toContain("Bucket List");
    expect(files.join("\n")).not.toContain("Yaklaşan Time Capsule");
    expect(files.join("\n")).toContain("Yapmak İstediklerimiz");
  });

  it("creates Turkish partner call labels dynamically", () => {
    expect(partnerCallLabel("Furkan")).toBe("Furkan'ı Çağır");
    expect(partnerCallLabel("Nejla")).toBe("Nejla'yı Çağır");
  });

  it("moves forward and backward in the story viewer", () => {
    expect(nextStoryIndex(0, 1, 3)).toBe(1);
    expect(nextStoryIndex(2, 1, 3)).toBe(0);
    expect(nextStoryIndex(0, -1, 3)).toBe(2);
    expect(nextStoryIndex(0, 1, 0)).toBe(0);
  });

  it("validates and normalizes hunger alert text", () => {
    expect(socialService.validateHunger("  Pizza   ve kola ")).toBe(
      "Pizza ve kola",
    );
    expect(() => socialService.validateHunger("   ")).toThrow();
    expect(() => socialService.validateHunger("<script>")).toThrow();
  });

  it("validates plan proposals", () => {
    expect(
      socialService.validatePlan({
        title: "Aynı filmi izleyelim",
        description: "Akşam birlikte",
        date: "2026-07-18",
        time: "21:00",
        meetingType: "online",
      }),
    ).toMatchObject({ title: "Aynı filmi izleyelim", meetingType: "online" });
    expect(() =>
      socialService.validatePlan({
        title: "",
        date: "yarın",
        time: "",
        meetingType: "online",
      }),
    ).toThrow();
  });
});
