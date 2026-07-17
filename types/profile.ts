export const genderOptions = ["female", "male", "undisclosed"] as const;

export type Gender = (typeof genderOptions)[number];

export const genderLabels: Record<Gender, string> = {
  female: "Kadın",
  male: "Erkek",
  undisclosed: "Belirtmek istemiyorum",
};

export function canUsePeriodMode(gender: Gender): boolean {
  return gender === "female";
}
