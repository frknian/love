import { canUsePeriodMode, type Gender } from "@/types/profile";
import type { MoodKey } from "@/types/social";

export const moodCatalog: ReadonlyArray<{
  key: MoodKey;
  label: string;
  emoji: string;
}> = [
  { key: "good", label: "İyi", emoji: "🙂" },
  { key: "happy", label: "Mutlu", emoji: "😊" },
  { key: "great", label: "Harika", emoji: "🤩" },
  { key: "in_love", label: "Aşık", emoji: "🥰" },
  { key: "excited", label: "Heyecanlı", emoji: "🎉" },
  { key: "calm", label: "Sakin", emoji: "😌" },
  { key: "tired", label: "Yorgun", emoji: "😮‍💨" },
  { key: "sleepy", label: "Uykulu", emoji: "😴" },
  { key: "bad", label: "Kötü", emoji: "😕" },
  { key: "sad", label: "Üzgün", emoji: "😢" },
  { key: "low", label: "Moralsiz", emoji: "🙁" },
  { key: "stressed", label: "Stresli", emoji: "😣" },
  { key: "angry", label: "Sinirli", emoji: "😠" },
  { key: "missing", label: "Özlemiş", emoji: "🥺" },
  { key: "sick", label: "Hastayım", emoji: "🤒" },
  { key: "period", label: "Regl", emoji: "🌸" },
] as const;

const nonPeriodMoodCatalog = moodCatalog.filter(
  (mood) => mood.key !== "period",
);

export function moodsForGender(gender: Gender) {
  return canUsePeriodMode(gender) ? moodCatalog : nonPeriodMoodCatalog;
}

export function getMoodDefinition(mood: MoodKey | undefined) {
  return moodCatalog.find((item) => item.key === mood);
}

/** Özel isim için Türkçe belirtme ekini üretir: Furkan'ı, Nejla'yı. */
export function partnerCallLabel(displayName: string): string {
  const name = displayName.trim().split(/\s+/)[0] || "Partner";
  const vowels = [...name.toLocaleLowerCase("tr-TR")].filter((letter) =>
    "aeıioöuü".includes(letter),
  );
  const lastVowel = vowels.at(-1) ?? "i";
  const suffix = "aı".includes(lastVowel)
    ? "ı"
    : "ei".includes(lastVowel)
      ? "i"
      : "ou".includes(lastVowel)
        ? "u"
        : "ü";
  const buffer = "aeıioöuü".includes(
    name.at(-1)?.toLocaleLowerCase("tr-TR") ?? "",
  )
    ? "y"
    : "";
  return `${name}'${buffer}${suffix} Çağır`;
}

export function nextStoryIndex(
  current: number,
  direction: -1 | 1,
  length: number,
): number {
  if (length <= 0) return 0;
  return (current + direction + length) % length;
}
