export interface CapsuleAttachment {
  path: string;
  name: string;
  type: string;
  size: number;
}

/** RLS'nin gizlediği alanlar hariç, her zaman görünen kapsül metadata'sı. */
export interface TimeCapsuleRow {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  unlock_date: string;
  opened: boolean;
  opened_at: string | null;
  created_at: string;
}

export interface TimeCapsuleMeta {
  id: string;
  coupleId: string;
  authorId: string;
  authorName: string;
  title: string;
  unlockDate: string;
  opened: boolean;
  openedAt: string | null;
  createdAt: string;
  isUnlocked: boolean;
}

export interface TimeCapsuleContent {
  message: string;
  attachments: CapsuleAttachment[];
}
