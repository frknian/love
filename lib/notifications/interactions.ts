import type { InteractionDefinition } from "@/types/notifications";

/**
 * Duygusal etkileşim kataloğu.
 * Yeni bir etkileşim eklemek için bu listeye yeni bir kayıt eklemek yeterlidir;
 * arayüz, animasyon ve titreşim desenleri bu tanımlardan beslenir.
 */
export const interactionCatalog: InteractionDefinition[] = [
  {
    type: "miss_you",
    icon: "❤️",
    title: "Seni Özledim",
    description: "Şu an aklımdasın, seni çok özledim.",
    animation: "floating-hearts",
    color: {
      bubble: "bg-rose-100 text-rose-600",
      surface: "bg-rose-50/80 hover:bg-rose-100",
      accent: "text-rose-600",
    },
    hapticPattern: [35, 60, 35],
  },
  {
    type: "hug",
    icon: "🤗",
    title: "Sana Sarıldım",
    description: "Uzaktan da olsa sımsıkı sarıldım sana.",
    animation: "hug",
    color: {
      bubble: "bg-amber-100 text-amber-600",
      surface: "bg-amber-50/80 hover:bg-amber-100",
      accent: "text-amber-600",
    },
    hapticPattern: [120],
  },
  {
    type: "kiss",
    icon: "😘",
    title: "Sana Öpücük Gönderdim",
    description: "Yanağına kocaman bir öpücük kondurdum.",
    animation: "kiss",
    color: {
      bubble: "bg-pink-100 text-pink-600",
      surface: "bg-pink-50/80 hover:bg-pink-100",
      accent: "text-pink-600",
    },
    hapticPattern: [20, 40, 20],
  },
  {
    type: "flower",
    icon: "🌹",
    title: "Sana Çiçek Gönderdim",
    description: "En güzel çiçekler senin için açıyor.",
    animation: "petals",
    color: {
      bubble: "bg-red-100 text-red-600",
      surface: "bg-red-50/80 hover:bg-red-100",
      accent: "text-red-600",
    },
    hapticPattern: [25, 50, 25, 50, 25],
  },
  {
    type: "coffee",
    icon: "☕",
    title: "Birlikte Kahve İçelim",
    description: "Bir kahve molası verelim mi? Sen ve ben.",
    animation: "coffee",
    color: {
      bubble: "bg-orange-100 text-orange-700",
      surface: "bg-orange-50/80 hover:bg-orange-100",
      accent: "text-orange-700",
    },
    hapticPattern: [30, 30, 30],
  },
  {
    type: "good_morning",
    icon: "🌞",
    title: "Günaydın",
    description: "Günaydın güzelliğim, güne benimle uyan.",
    animation: "sun-rays",
    color: {
      bubble: "bg-yellow-100 text-yellow-600",
      surface: "bg-yellow-50/80 hover:bg-yellow-100",
      accent: "text-yellow-600",
    },
    hapticPattern: [40, 80, 40],
  },
  {
    type: "good_night",
    icon: "🌙",
    title: "İyi Geceler",
    description: "Tatlı rüyalar, rüyanda beni gör.",
    animation: "moon-stars",
    color: {
      bubble: "bg-indigo-100 text-indigo-600",
      surface: "bg-indigo-50/80 hover:bg-indigo-100",
      accent: "text-indigo-600",
    },
    hapticPattern: [60, 120, 30],
  },
  {
    type: "note",
    icon: "💌",
    title: "Sana Bir Not Bıraktım",
    description: "Notlar sayfasında seni bir sürpriz bekliyor.",
    animation: "love-letter",
    color: {
      bubble: "bg-rose-100 text-rose-500",
      surface: "bg-rose-50/80 hover:bg-rose-100",
      accent: "text-rose-500",
    },
    hapticPattern: [25, 45, 25],
  },
  {
    type: "memory",
    icon: "📸",
    title: "Yeni Bir Anı Ekledim",
    description: "Anılarımıza yeni bir kare ekledim, göz at.",
    animation: "camera",
    color: {
      bubble: "bg-sky-100 text-sky-600",
      surface: "bg-sky-50/80 hover:bg-sky-100",
      accent: "text-sky-600",
    },
    hapticPattern: [15, 30, 15],
  },
  {
    type: "surprise",
    icon: "🎉",
    title: "Sana Bir Sürpriz Hazırladım",
    description: "Hazır ol, senin için bir sürprizim var!",
    animation: "confetti",
    color: {
      bubble: "bg-violet-100 text-violet-600",
      surface: "bg-violet-50/80 hover:bg-violet-100",
      accent: "text-violet-600",
    },
    hapticPattern: [20, 40, 20, 40, 60],
  },
  {
    type: "song",
    icon: "🎵",
    title: "Bizim Şarkımızı Dinle",
    description: "Şu an bizim şarkımız çalıyor, sen de dinle.",
    animation: "music",
    color: {
      bubble: "bg-emerald-100 text-emerald-600",
      surface: "bg-emerald-50/80 hover:bg-emerald-100",
      accent: "text-emerald-600",
    },
    hapticPattern: [30, 60, 30, 60, 30],
  },
  {
    type: "good_luck",
    icon: "🙏",
    title: "Başarılar Diliyorum",
    description: "Bugün harika geçecek, yanındayım!",
    animation: "wish",
    color: {
      bubble: "bg-teal-100 text-teal-600",
      surface: "bg-teal-50/80 hover:bg-teal-100",
      accent: "text-teal-600",
    },
    hapticPattern: [50, 100, 50],
  },
  {
    type: "congrats",
    icon: "🥳",
    title: "Seni Kutluyorum",
    description: "Seninle gurur duyuyorum, tebrikler!",
    animation: "celebrate",
    color: {
      bubble: "bg-orange-100 text-orange-600",
      surface: "bg-orange-50/80 hover:bg-orange-100",
      accent: "text-orange-600",
    },
    hapticPattern: [30, 50, 30, 50, 80],
  },
  {
    type: "birthday",
    icon: "🎂",
    title: "Doğum Günün Kutlu Olsun",
    description: "İyi ki doğdun, iyi ki varsın! 🎈",
    animation: "birthday",
    color: {
      bubble: "bg-fuchsia-100 text-fuchsia-600",
      surface: "bg-fuchsia-50/80 hover:bg-fuchsia-100",
      accent: "text-fuchsia-600",
    },
    hapticPattern: [40, 60, 40, 60, 40, 60, 100],
  },
  {
    type: "anniversary",
    icon: "🎆",
    title: "Yıldönümümüz Kutlu Olsun",
    description: "Nice yıllar boyunca el ele... Yıldönümümüz kutlu olsun.",
    animation: "fireworks",
    color: {
      bubble: "bg-purple-100 text-purple-600",
      surface: "bg-purple-50/80 hover:bg-purple-100",
      accent: "text-purple-600",
    },
    hapticPattern: [60, 40, 60, 40, 120],
  },
];

const interactionsByType = new Map(
  interactionCatalog.map((interaction) => [interaction.type, interaction]),
);

const fallbackInteraction: InteractionDefinition = {
  type: "custom",
  icon: "💫",
  title: "Yeni Bildirim",
  description: "",
  animation: "floating-hearts",
  color: {
    bubble: "bg-slate-100 text-slate-600",
    surface: "bg-slate-50/80 hover:bg-slate-100",
    accent: "text-slate-600",
  },
  hapticPattern: [30],
};

/** Bilinmeyen tiplerde güvenli bir varsayılan döner. */
export function getInteraction(type: string): InteractionDefinition {
  return interactionsByType.get(type) ?? fallbackInteraction;
}
