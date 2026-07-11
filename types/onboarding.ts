export type OnboardingMode = "create" | "join";

export interface CreateCoupleResult {
  coupleId: string;
  inviteCode: string;
}

export interface JoinCoupleResult {
  coupleId: string;
}
