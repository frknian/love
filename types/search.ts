export const searchCategories = [
  "memories",
  "notes",
  "journals",
  "bucket",
  "events",
] as const;

export type SearchCategory = (typeof searchCategories)[number];

export interface SearchResultItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  href: string;
  icon: string;
}

export interface SearchResultGroup {
  category: SearchCategory;
  label: string;
  items: SearchResultItem[];
}
