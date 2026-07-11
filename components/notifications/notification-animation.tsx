"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { AnimationKey } from "@/types/notifications";

type ParticleMode = "float-up" | "fall" | "burst" | "pulse" | "twinkle";

interface AnimationPreset {
  mode: ParticleMode;
  particles: string[];
  count: number;
  /** pulse ve twinkle modlarında ortada duran büyük ikon. */
  centerIcon?: string;
  /** pulse modunda merkez ikonun yavaşça dönmesi (güneş ışınları etkisi). */
  rotateCenter?: boolean;
}

/**
 * Animasyon preset'leri: her bildirim tipi bir moda + parçacık setine eşlenir.
 * Yeni bir animasyon eklemek için `types/notifications.ts` içindeki
 * `animationKeys` dizisine anahtar, buraya preset eklemek yeterlidir.
 */
const presets: Record<AnimationKey, AnimationPreset> = {
  "floating-hearts": {
    mode: "float-up",
    particles: ["❤️", "💕", "💗", "💞"],
    count: 14,
  },
  hug: {
    mode: "pulse",
    particles: ["💛", "🧡"],
    count: 6,
    centerIcon: "🤗",
  },
  kiss: {
    mode: "burst",
    particles: ["💋", "😘", "💖"],
    count: 12,
  },
  petals: {
    mode: "fall",
    particles: ["🌹", "🌸", "🥀", "🌺"],
    count: 14,
  },
  coffee: {
    mode: "float-up",
    particles: ["☕", "🤎", "♨️"],
    count: 10,
  },
  "sun-rays": {
    mode: "pulse",
    particles: ["✨", "🌤️", "☀️"],
    count: 8,
    centerIcon: "🌞",
    rotateCenter: true,
  },
  "moon-stars": {
    mode: "twinkle",
    particles: ["⭐", "✨", "🌟"],
    count: 12,
    centerIcon: "🌙",
  },
  "love-letter": {
    mode: "pulse",
    particles: ["💌", "❣️", "✉️"],
    count: 6,
    centerIcon: "💌",
  },
  camera: {
    mode: "burst",
    particles: ["✨", "📸", "🤍"],
    count: 10,
  },
  confetti: {
    mode: "burst",
    particles: ["🎉", "🎊", "✨", "🎈"],
    count: 16,
  },
  music: {
    mode: "float-up",
    particles: ["🎵", "🎶", "💚"],
    count: 12,
  },
  wish: {
    mode: "twinkle",
    particles: ["✨", "🍀", "🌠"],
    count: 12,
    centerIcon: "🙏",
  },
  celebrate: {
    mode: "burst",
    particles: ["🥳", "🎊", "🎉", "⭐"],
    count: 14,
  },
  birthday: {
    mode: "fall",
    particles: ["🎈", "🎂", "🎁", "🎊"],
    count: 14,
  },
  fireworks: {
    mode: "burst",
    particles: ["🎆", "✨", "🎇", "💥"],
    count: 18,
  },
};

/** Render'lar arasında kararlı, hydration dostu sözde rastgele değer. */
function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  return value - Math.floor(value);
}

interface ParticleProps {
  emoji: string;
  index: number;
  mode: ParticleMode;
  count: number;
}

function Particle({ emoji, index, mode, count }: ParticleProps) {
  const r1 = pseudoRandom(index + 1);
  const r2 = pseudoRandom((index + 1) * 7);
  const r3 = pseudoRandom((index + 1) * 13);
  const duration = 2.6 + r1 * 2;
  const delay = r2 * 1.8;
  const size = 14 + r3 * 14;

  if (mode === "float-up") {
    return (
      <motion.span
        animate={{ y: "-140%", opacity: [0, 1, 1, 0] }}
        className="absolute select-none"
        initial={{ y: "40%", opacity: 0 }}
        style={{ left: `${6 + r1 * 88}%`, bottom: 0, fontSize: size }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          repeatDelay: r3,
          ease: "easeOut",
        }}
      >
        {emoji}
      </motion.span>
    );
  }

  if (mode === "fall") {
    return (
      <motion.span
        animate={{
          y: "480%",
          x: [0, 14, -14, 8, 0],
          rotate: r2 > 0.5 ? 240 : -240,
          opacity: [0, 1, 1, 0.4],
        }}
        className="absolute select-none"
        initial={{ y: "-60%", opacity: 0 }}
        style={{ left: `${6 + r1 * 88}%`, top: 0, fontSize: size }}
        transition={{
          duration: duration + 1,
          delay,
          repeat: Infinity,
          repeatDelay: r3 * 0.8,
          ease: "easeIn",
        }}
      >
        {emoji}
      </motion.span>
    );
  }

  if (mode === "burst") {
    const angle = (index / count) * Math.PI * 2 + r2 * 0.6;
    const radius = 70 + r3 * 70;
    return (
      <motion.span
        animate={{
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          scale: [0.4, 1.15, 0.8],
          opacity: [0, 1, 0],
        }}
        className="absolute left-1/2 top-1/2 select-none"
        initial={{ x: 0, y: 0, opacity: 0 }}
        style={{ fontSize: size }}
        transition={{
          duration: 1.6 + r1,
          delay: r2 * 0.7,
          repeat: Infinity,
          repeatDelay: 0.5 + r3 * 0.6,
          ease: "easeOut",
        }}
      >
        {emoji}
      </motion.span>
    );
  }

  // pulse ve twinkle: sabit konumda parlayıp sönen parçacıklar
  return (
    <motion.span
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 0.5] }}
      className="absolute select-none"
      initial={{ opacity: 0 }}
      style={{
        left: `${8 + r1 * 84}%`,
        top: `${8 + r2 * 74}%`,
        fontSize: size,
      }}
      transition={{
        duration: 1.4 + r3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {emoji}
    </motion.span>
  );
}

interface NotificationAnimationProps {
  animation: AnimationKey;
  className?: string;
}

/**
 * Bildirim tipine özel, döngüde çalışan dekoratif animasyon sahnesi.
 * Konumlandırılmış (relative) ve overflow-hidden bir kap içinde kullanılmalıdır.
 */
export function NotificationAnimation({
  animation,
  className,
}: NotificationAnimationProps) {
  const preset = presets[animation] ?? presets["floating-hearts"];

  const particles = useMemo(
    () =>
      Array.from({ length: preset.count }, (_, index) => ({
        emoji: preset.particles[index % preset.particles.length],
        index,
      })),
    [preset],
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {particles.map(({ emoji, index }) => (
        <Particle
          count={preset.count}
          emoji={emoji}
          index={index}
          key={index}
          mode={preset.mode}
        />
      ))}
      {preset.centerIcon ? (
        <motion.span
          animate={
            preset.rotateCenter
              ? { scale: [1, 1.12, 1], rotate: 360 }
              : { scale: [1, 1.12, 1] }
          }
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-6xl"
          transition={{
            scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 16, repeat: Infinity, ease: "linear" },
          }}
        >
          {preset.centerIcon}
        </motion.span>
      ) : null}
    </div>
  );
}
