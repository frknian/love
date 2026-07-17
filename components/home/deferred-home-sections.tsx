"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type RefObject } from "react";

import type { Gender } from "@/types/profile";

const InteractionPicker = dynamic(
  () =>
    import("@/components/notifications/interaction-picker").then(
      (module) => module.InteractionPicker,
    ),
  {
    ssr: false,
    loading: () => <CardPlaceholder className="h-28" />,
  },
);

const LocationDistanceCard = dynamic(
  () =>
    import("@/components/location/location-distance-card").then(
      (module) => module.LocationDistanceCard,
    ),
  {
    ssr: false,
    loading: () => <CardPlaceholder className="h-36" />,
  },
);

const MoodStatusCard = dynamic(
  () =>
    import("@/components/social/mood-status-card").then(
      (module) => module.MoodStatusCard,
    ),
  {
    ssr: false,
    loading: () => <CardPlaceholder className="h-44" />,
  },
);

function CardPlaceholder({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-3xl border border-white/70 bg-white/55 ${className}`}
    />
  );
}

function useNearViewport(): [RefObject<HTMLDivElement | null>, boolean] {
  const reference = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = reference.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "320px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [reference, visible];
}

interface InteractionProps {
  coupleId: string;
  currentUserId: string;
  partnerId: string;
  partnerName: string;
}

export function DeferredInteractionPicker(props: InteractionProps) {
  return <InteractionPicker {...props} />;
}

interface SocialCardsProps {
  coupleId: string;
  currentUserGender: Gender;
  currentUserId: string;
  currentUserName: string;
  partnerId: string | null;
  partnerName: string;
}

export function DeferredHomeSocialCards({
  coupleId,
  currentUserGender,
  currentUserId,
  currentUserName,
  partnerId,
  partnerName,
}: SocialCardsProps) {
  const [reference, visible] = useNearViewport();
  return (
    <div className="space-y-4" ref={reference}>
      {visible ? (
        <>
          <LocationDistanceCard
            coupleId={coupleId}
            currentUserId={currentUserId}
            partnerId={partnerId}
          />
          {partnerId ? (
            <MoodStatusCard
              coupleId={coupleId}
              currentUserGender={currentUserGender}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              partnerId={partnerId}
              partnerName={partnerName}
            />
          ) : null}
        </>
      ) : (
        <>
          <CardPlaceholder className="h-36" />
          {partnerId ? <CardPlaceholder className="h-44" /> : null}
        </>
      )}
    </div>
  );
}
