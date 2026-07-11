export interface HomeSnapshot {
  partnerNames: string;
  daysTogether: number;
  latestPhoto: {
    title: string;
    date: string;
    imageUrl: string;
  };
  latestNote: {
    content: string;
    date: string;
  };
}
