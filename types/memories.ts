export interface Album {
  id: string;
  coupleId: string;
  title: string;
  coverImage: string | null;
  createdAt: string;
}

export interface Memory {
  id: string;
  albumId: string;
  coupleId: string;
  uploadedBy: string;
  imagePath: string;
  imageUrl: string;
  title: string;
  description: string | null;
  location: string | null;
  memoryDate: string | null;
  createdAt: string;
}

export interface MemoriesContext {
  userId: string;
  coupleId: string;
}
