import type { users } from "@/db/schema";

export type UserRow = typeof users.$inferSelect;

export type PublicUser = {
  id: string;
  nickname: string;
  country: string;
  language: string;
  ageGroup: string;
  bio: string;
  hue: number;
  interests: string[];
  verified: boolean;
  plus: boolean;
  plusRenewsAt: Date | null;
  matchOptIn: boolean;
  adultRoomOk: boolean;
  showVideo: boolean;
  publicProfile: boolean;
  isBot: boolean;
  points: number;
  walletCents: number;
  trialEndsAt: Date | null;
  createdAt: Date;
};
