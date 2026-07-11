export const journalMoods = [
  "happy",
  "in_love",
  "sad",
  "sleepy",
  "angry",
  "cool",
  "loved",
] as const;

export type JournalMood = (typeof journalMoods)[number];

export const journalWeathers = ["sunny", "rainy", "snowy", "cloudy"] as const;

export type JournalWeather = (typeof journalWeathers)[number];

export interface JournalImage {
  path: string;
  url: string;
}

export interface JournalRow {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  content: string;
  mood: JournalMood;
  weather: JournalWeather | null;
  images: { path: string }[];
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  coupleId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  mood: JournalMood;
  weather: JournalWeather | null;
  images: JournalImage[];
  createdAt: string;
  updatedAt: string;
}

export type JournalSearchField = "title" | "content" | "author" | "date";
