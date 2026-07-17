"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import {
  moodKeys,
  type MoodEntryRow,
  type PlanRequestRow,
} from "@/types/social";

const hungerSchema = z
  .string()
  .trim()
  .min(1, "Canının ne çektiğini yaz.")
  .max(80, "İstek en fazla 80 karakter olabilir.")
  .refine((value) => !/[<>]/.test(value), "Geçersiz karakter içeriyor.")
  .transform((value) => value.replace(/\s+/g, " "));

const planSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal("")),
  meetingType: z.enum(["online", "in_person"]),
});

export type PlanInput = z.infer<typeof planSchema>;

export const socialService = {
  validateHunger(value: string) {
    return hungerSchema.parse(value);
  },

  validatePlan(input: PlanInput) {
    return planSchema.parse(input);
  },

  async setMood(coupleId: string, userId: string, mood: string) {
    const parsedMood = z.enum(moodKeys).parse(mood);
    const { data, error } = await createClient()
      .from("mood_entries")
      .insert({ couple_id: coupleId, created_by: userId, mood: parsedMood })
      .select("*")
      .single();
    if (error) throw new Error("Modun kaydedilemedi.");
    return data as MoodEntryRow;
  },

  async setQuickStatus(
    coupleId: string,
    userId: string,
    statusType: "period" | "hunger" | "bored",
    details: string | null,
    active = true,
  ) {
    const cleanDetails =
      statusType === "hunger" && active
        ? hungerSchema.parse(details ?? "")
        : details?.trim().slice(0, 160) || null;
    const { error } = await createClient().from("quick_statuses").upsert(
      {
        couple_id: coupleId,
        created_by: userId,
        status_type: statusType,
        details: cleanDetails,
        active,
      },
      { onConflict: "created_by,status_type" },
    );
    if (error) throw new Error("Hızlı durum kaydedilemedi.");
    return cleanDetails;
  },

  async proposePlan(
    coupleId: string,
    userId: string,
    partnerId: string,
    input: PlanInput,
  ) {
    const plan = planSchema.parse(input);
    const { data, error } = await createClient()
      .from("plan_requests")
      .insert({
        couple_id: coupleId,
        created_by: userId,
        recipient_id: partnerId,
        title: plan.title,
        description: plan.description || null,
        plan_date: plan.date,
        plan_time: plan.time || null,
        meeting_type: plan.meetingType,
      })
      .select("*")
      .single();
    if (error) throw new Error("Plan önerisi gönderilemedi.");
    return data as PlanRequestRow;
  },

  async respondToPlan(planId: string, response: "accepted" | "rejected") {
    const { error } = await createClient().rpc("respond_to_plan", {
      p_plan_id: planId,
      p_response: response,
    });
    if (error) throw new Error("Plan yanıtlanamadı.");
  },
};
