export interface CountdownRow {
  id: string;
  couple_id: string;
  title: string;
  icon: string;
  target_date: string;
  cover_image: string | null;
  created_by: string;
  created_at: string;
}

export interface Countdown {
  id: string;
  coupleId: string;
  title: string;
  icon: string;
  targetDate: string;
  coverImage: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CountdownRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}
