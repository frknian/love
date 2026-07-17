export interface Album {
  id: string;
  coupleId: string;
  title: string;
  coverImage: string | null;
  coverImageUrl?: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  albumId: string;
  coupleId: string;
  uploadedBy: string;
  imagePath: string | null;
  imageUrl: string | null;
  mediaType: "photo" | "video" | "audio" | "note";
  noteContent: string | null;
  isFavorite: boolean;
  title: string;
  description: string | null;
  location: string | null;
  memoryDate: string | null;
  createdAt: string;
}

export interface MemoriesContext {
  userId: string;
  coupleId: string;
  displayName: string;
  partnerId: string | null;
  partnerName: string | null;
}
