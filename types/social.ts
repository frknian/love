export const moodKeys = [
  "good",
  "happy",
  "great",
  "in_love",
  "excited",
  "calm",
  "tired",
  "sleepy",
  "bad",
  "sad",
  "low",
  "stressed",
  "angry",
  "missing",
  "sick",
  "period",
] as const;
export type MoodKey = (typeof moodKeys)[number];

export interface MoodEntryRow {
  id: string;
  couple_id: string;
  created_by: string;
  mood: MoodKey;
  created_at: string;
}

export type QuickStatusType = "period" | "hunger" | "bored";
export interface QuickStatusRow {
  id: string;
  couple_id: string;
  created_by: string;
  status_type: QuickStatusType;
  details: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanRequestRow {
  id: string;
  couple_id: string;
  created_by: string;
  recipient_id: string;
  title: string;
  description: string | null;
  plan_date: string;
  plan_time: string | null;
  meeting_type: "online" | "in_person";
  status: "pending" | "accepted" | "rejected";
  event_id: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface MemoryHighlightRow {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  cover_memory_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryHighlightItemRow {
  id: string;
  highlight_id: string;
  couple_id: string;
  memory_id: string;
  position: number;
  created_by: string;
  created_at: string;
}
