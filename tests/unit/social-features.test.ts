import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  moodsForGender,
  nextStoryIndex,
  partnerCallLabel,
} from "@/lib/social/mood-catalog";
import { socialService } from "@/services/social/social-service";
import { canUsePeriodMode } from "@/types/profile";

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

  it("allows period mode only for female profiles", () => {
    expect(canUsePeriodMode("female")).toBe(true);
    expect(canUsePeriodMode("male")).toBe(false);
    expect(canUsePeriodMode("undisclosed")).toBe(false);
    expect(moodsForGender("female").some((mood) => mood.key === "period")).toBe(
      true,
    );
    expect(moodsForGender("male").some((mood) => mood.key === "period")).toBe(
      false,
    );
    expect(
      moodsForGender("undisclosed").some((mood) => mood.key === "period"),
    ).toBe(false);
  });

  it("protects period state in RLS, database triggers, and gender cleanup", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260717170000_add_profile_gender_period_authorization.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("profile_can_use_period_mode(auth.uid())");
    expect(migration).toContain("enforce_period_gender");
    expect(migration).toContain("clear_period_state_after_gender_change");
    expect(migration).toContain(
      "delete from public.quick_statuses\n    where created_by = new.id and status_type = 'period'",
    );
    const triggerFix = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260717171000_fix_social_activity_record_dispatch.sql",
      ),
      "utf8",
    );
    expect(triggerFix).toContain("elsif tg_table_name = 'quick_statuses' then");
    expect(triggerFix).toContain("elsif tg_table_name = 'plan_requests' then");
  });

  it("shows partner period cards only from active partner statuses", () => {
    const component = readFileSync(
      resolve(process.cwd(), "components/social/mood-status-card.tsx"),
      "utf8",
    );
    expect(component).toContain(
      "status.created_by === partnerId && status.active",
    );
    expect(component).toContain("🌸 Regl Modu Aktif");
    expect(component).toContain("status.details");
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
