import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const S = ({ children, ...p }: P) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...p}
  >
    {children}
  </svg>
);

export const IcWave = (p: P) => (
  <S {...p}>
    <path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 4-3 5-2" />
    <path d="M2 17c2.5-4 5-4 7.5 0s5 4 7.5 0 4-3 5-2" opacity={0.5} />
    <path d="M13 4.5c1.5 0 3 .8 3 3" opacity={0.5} />
  </S>
);
export const IcChat = (p: P) => (
  <S {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H4l2.2-2.6A8 8 0 1 1 21 12Z" />
    <path d="M8.5 11h7M8.5 14.5h4" />
  </S>
);
export const IcUsers = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
    <path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.7M18 14.9c1.5.7 2.4 2 2.7 4.1" />
  </S>
);
export const IcGamepad = (p: P) => (
  <S {...p}>
    <path d="M7 8h10a5 5 0 0 1 5 5.5c-.2 1.8-1.8 3-3.5 2.5-1.2-.3-2-1.3-2.5-2.5H8c-.5 1.2-1.3 2.2-2.5 2.5C3.8 16.5 2.2 15.3 2 13.5A5 5 0 0 1 7 8Z" />
    <path d="M8 11v3M6.5 12.5h3" />
    <circle cx="16" cy="11.5" r="0.6" fill="currentColor" />
    <circle cx="18" cy="13.5" r="0.6" fill="currentColor" />
  </S>
);
export const IcHeart = (p: P) => (
  <S {...p}>
    <path d="M12 20s-7.5-4.6-9-9.3C1.9 7.2 4 4.5 7 4.5c2 0 3.6 1 5 3 1.4-2 3-3 5-3 3 0 5.1 2.7 4 6.2-1.5 4.7-9 9.3-9 9.3Z" />
  </S>
);
export const IcShield = (p: P) => (
  <S {...p}>
    <path d="M12 3 5 5.8v5.4c0 4.5 3 7.9 7 9.8 4-1.9 7-5.3 7-9.8V5.8L12 3Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9" />
  </S>
);
export const IcGlobe = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.7 2.3 4 5.2 4 8.5s-1.3 6.2-4 8.5c-2.7-2.3-4-5.2-4-8.5s1.3-6.2 4-8.5Z" />
  </S>
);
export const IcCrown = (p: P) => (
  <S {...p}>
    <path d="M4 8.5 7.5 12 12 5.5 16.5 12 20 8.5 18.5 17h-13L4 8.5Z" />
    <path d="M8 20h8" opacity={0.6} />
  </S>
);
export const IcSend = (p: P) => (
  <S {...p}>
    <path d="M20.5 3.5 3.5 10l6.5 2.5L12.5 19l8-15.5Z" />
    <path d="M20.5 3.5 10 12.5" />
  </S>
);
export const IcMic = (p: P) => (
  <S {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </S>
);
export const IcMicOff = (p: P) => (
  <S {...p}>
    <path d="M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-.5 1.7" />
    <path d="M9 9v2a3 3 0 0 0 3 3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 10 5.4M18.5 11.5c0 1-.3 2-.7 2.8M12 18v3" />
    <path d="m4 4 16 16" />
  </S>
);
export const IcVideo = (p: P) => (
  <S {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="m16 10.5 5-3v9l-5-3" />
  </S>
);
export const IcVideoOff = (p: P) => (
  <S {...p}>
    <path d="M16 10.5 21 7.5v9M15.5 15.5c-.5.4-1.1.5-2.5.5H6A3 3 0 0 1 3 13V9a3 3 0 0 1 3-3h1" />
    <path d="m3 4 18 16" />
  </S>
);
export const IcFlag = (p: P) => (
  <S {...p}>
    <path d="M5 21V4.5M5 4.5C8 3 10 3 12.5 4.5S17 6 19 4.8V13c-2 1.2-4 1.2-6.5-.3S8 11.2 5 12.7" />
  </S>
);
export const IcSearch = (p: P) => (
  <S {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15.5 15.5 4.5 4.5" />
  </S>
);
export const IcPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const IcX = (p: P) => (
  <S {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </S>
);
export const IcCheck = (p: P) => (
  <S {...p}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </S>
);
export const IcStar = (p: P) => (
  <S {...p}>
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8L12 3.5Z" />
  </S>
);
export const IcBolt = (p: P) => (
  <S {...p}>
    <path d="M13 2.5 4.5 13.5H11L10 21.5l8.5-11H12l1-8Z" />
  </S>
);
export const IcLock = (p: P) => (
  <S {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
  </S>
);
export const IcTrash = (p: P) => (
  <S {...p}>
    <path d="M4.5 6.5h15M9.5 6V4.5h5V6M6.5 6.5l.8 13h9.4l.8-13M10 10.5v5.5M14 10.5v5.5" />
  </S>
);
export const IcLogout = (p: P) => (
  <S {...p}>
    <path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7M10.5 12h10M17 8.5l3.5 3.5L17 15.5" />
  </S>
);
export const IcGift = (p: P) => (
  <S {...p}>
    <rect x="4" y="9" width="16" height="4" rx="1" />
    <path d="M5.5 13v6.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V13M12 9v11.5M12 9C10 9 7.5 8.5 7.5 6.2 7.5 4.7 8.7 4 10 4c1.8 0 2 2.5 2 5Zm0 0c2 0 4.5-.5 4.5-2.8C16.5 4.7 15.3 4 14 4c-1.8 0-2 2.5-2 5Z" />
  </S>
);
export const IcTag = (p: P) => (
  <S {...p}>
    <path d="M12.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v7.5l8 8 9-9-8-8Z" />
    <circle cx="8.5" cy="8.5" r="1.4" />
  </S>
);
export const IcClock = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.5l3.5 2" />
  </S>
);
export const IcEye = (p: P) => (
  <S {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </S>
);
export const IcEyeOff = (p: P) => (
  <S {...p}>
    <path d="M4 4.5 20 19.5M9.9 6.1A8.7 8.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.5 17.5 0 0 1-3 3.6m-2.3 1.6a8.8 8.8 0 0 1-4.2 1.3C6 18.5 2.5 12 2.5 12a17.6 17.6 0 0 1 3.6-4" />
    <path d="M10 10.3a3 3 0 0 0 4 4.2" />
  </S>
);
export const IcChevronD = (p: P) => (
  <S {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </S>
);
export const IcRefresh = (p: P) => (
  <S {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" />
  </S>
);
export const IcPhone = (p: P) => (
  <S {...p}>
    <path d="M6.8 3.5H9l1.5 4.2-2 1.5a12.5 12.5 0 0 0 4.8 4.8l1.5-2 4.2 1.5v2.2a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.8 5.7a2 2 0 0 1 2-2.2Z" />
  </S>
);
export const IcArrowR = (p: P) => (
  <S {...p}>
    <path d="M4 12h15M13.5 6 19.5 12l-6 6" />
  </S>
);
export const IcInfo = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 7.8v.2" />
  </S>
);
export const IcStop = (p: P) => (
  <S {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </S>
);
export const IcSparkle = (p: P) => (
  <S {...p}>
    <path d="M12 3.5c.7 3.8 2.7 5.8 6.5 6.5-3.8.7-5.8 2.7-6.5 6.5-.7-3.8-2.7-5.8-6.5-6.5 3.8-.7 5.8-2.7 6.5-6.5Z" />
    <path d="M18.5 15.5c.35 1.9 1.35 2.9 3 3.2-1.65.35-2.65 1.35-3 3.2-.35-1.85-1.35-2.85-3-3.2 1.65-.3 2.65-1.3 3-3.2Z" opacity={0.7} />
  </S>
);
export const IcVent = (p: P) => (
  <S {...p}>
    <path d="M12 20.5a8.5 8.5 0 1 1 8.5-8.5c0 4-3 7-6.5 7-2 0-3.5-1.3-3.5-3 0-1.4 1-2.5 2.5-2.5" />
    <path d="M12 7.5v4l2.5 1.5" />
  </S>
);
export const IcStore = (p: P) => (
  <S {...p}>
    <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5a2.3 2.3 0 0 0 4 1.4 2.3 2.3 0 0 0 4 0 2.3 2.3 0 0 0 4 0 2.3 2.3 0 0 0 4-1.4M5.5 12v8h13v-8M9.5 20v-5h5v5" />
  </S>
);
export const IcCard = (p: P) => (
  <S {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 10h18M6.5 14.5h4" />
  </S>
);
export const IcTrophy = (p: P) => (
  <S {...p}>
    <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5.5H4.5a3.5 3.5 0 0 0 3.6 3.5M16 5.5h3.5a3.5 3.5 0 0 1-3.6 3.5M12 14v3.5M8.5 20.5h7M9.5 17.5h5" />
  </S>
);
export const IcStar2 = (p: P) => (
  <S {...p}>
    <path d="m12 4 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.3l5-.7L12 4Z" />
  </S>
);
export const IcSound = (p: P) => (
  <S {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.5 7.5 0 0 1 0 10.4" />
  </S>
);
export const IcMute = (p: P) => (
  <S {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </S>
);
export const IcStats = (p: P) => (
  <S {...p}>
    <path d="M4 20V10M9.5 20V4M15 20v-8M20.5 20V7" />
  </S>
);
