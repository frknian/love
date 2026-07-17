export const memoryMediaTypes = ["photo", "video", "audio", "note"] as const;
export type MemoryMediaType = (typeof memoryMediaTypes)[number];

export const watchContentTypes = [
  "movie",
  "series",
  "anime",
  "documentary",
] as const;
export type WatchContentType = (typeof watchContentTypes)[number];

export interface CoupleStory {
  id: string | null;
  content: string;
  version: number;
  updatedAt: string | null;
  updatedByName: string | null;
}

export interface StoryVersion {
  id: string;
  content: string;
  version: number;
  createdAt: string;
  editedByName: string | null;
}

export interface CoupleMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ActivityItem {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorName: string | null;
}

export interface WatchItem {
  id: string;
  contentType: WatchContentType;
  title: string;
  posterPath: string | null;
  posterUrl: string | null;
  status: "planned" | "watched";
  watchedOn: string | null;
  rating: number | null;
  note: string | null;
  isFavorite: boolean;
  createdAt: string;
}
