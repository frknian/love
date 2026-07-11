import type { JournalMood, JournalWeather } from "@/types/journal";

interface MoodDefinition {
  value: JournalMood;
  emoji: string;
  label: string;
  badge: string;
}

/** Yeni bir ruh hali eklemek için `types/journal.ts`teki `journalMoods` dizisine ve buraya bir kayıt eklemek yeterlidir. */
export const moodCatalog: MoodDefinition[] = [
  {
    value: "happy",
    emoji: "😊",
    label: "Mutlu",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  {
    value: "in_love",
    emoji: "😍",
    label: "Aşık",
    badge: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  },
  {
    value: "sad",
    emoji: "😢",
    label: "Üzgün",
    badge: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
  },
  {
    value: "sleepy",
    emoji: "😴",
    label: "Uykulu",
    badge:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  {
    value: "angry",
    emoji: "😡",
    label: "Kızgın",
    badge: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  },
  {
    value: "cool",
    emoji: "😎",
    label: "Havalı",
    badge: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300",
  },
  {
    value: "loved",
    emoji: "❤️",
    label: "Sevgi Dolu",
    badge: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300",
  },
];

const moodsByValue = new Map(
  moodCatalog.map((definition) => [definition.value, definition]),
);

export function getMoodDefinition(mood: JournalMood) {
  return moodsByValue.get(mood) ?? moodCatalog[0];
}

interface WeatherDefinition {
  value: JournalWeather;
  emoji: string;
  label: string;
}

export const weatherCatalog: WeatherDefinition[] = [
  { value: "sunny", emoji: "☀️", label: "Güneşli" },
  { value: "rainy", emoji: "🌧️", label: "Yağmurlu" },
  { value: "snowy", emoji: "🌨️", label: "Karlı" },
  { value: "cloudy", emoji: "🌤️", label: "Parçalı Bulutlu" },
];

const weathersByValue = new Map(
  weatherCatalog.map((definition) => [definition.value, definition]),
);

export function getWeatherDefinition(weather: JournalWeather | null) {
  return weather ? (weathersByValue.get(weather) ?? null) : null;
}
