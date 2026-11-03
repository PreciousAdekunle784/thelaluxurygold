import type { SVGProps } from "react";

/* Brand glyphs (Lucide no longer ships brand icons). 1.25 stroke to match the UI. */
type P = SVGProps<SVGSVGElement>;
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const InstagramIcon = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
  </svg>
);
export const TikTokIcon = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
  </svg>
);
export const SnapchatIcon = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M12 3.2c3 0 5 2.2 5 5.1v2.3l1.7-.5c.6-.2 1 .6.4 1l-2 1.2c.6 1.7 2 3 3.6 3.4-.4.9-1.7 1-2.6 1.2l-.4 1.3c-1.2-.2-2.3 0-3.2.7-.9.7-1.7 1.1-2.5 1.1s-1.6-.4-2.5-1.1c-.9-.7-2-.9-3.2-.7l-.4-1.3c-.9-.2-2.2-.3-2.6-1.2 1.6-.4 3-1.7 3.6-3.4l-2-1.2c-.6-.4-.2-1.2.4-1l1.7.5V8.3c0-2.9 2-5.1 5-5.1Z" />
  </svg>
);
export const XIcon = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
);
export const ThreadsIcon = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M16.6 11.2c-.3-2.6-2-3.9-4.4-3.9-2.2 0-3.6 1.1-4 2.6" />
    <path d="M17 12.2c0 4.5-2.4 7.8-5.6 7.8C7.4 20 4.5 16.9 4.5 12S7.4 4 11.5 4c3.2 0 5.6 1.8 6.6 4.8" />
    <path d="M16.9 12.4c-2.8-1-7-.8-7 1.7 0 1.4 1.3 2.2 2.8 2.1 2.4-.1 3.8-1.9 4-4.6" />
  </svg>
);
export const WhatsAppIcon = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M4.5 19.5l1.1-3.6A8 8 0 1 1 8.4 18.6Z" />
    <path d="M9.2 8.6c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .5-.1.6l-.5.6c.6 1.1 1.4 1.9 2.5 2.5l.6-.5c.2-.2.4-.2.6-.1l1.5.6c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.6.3-1.7.5-3.5-.6-1.3-.8-2.5-2-3.3-3.3-1.1-1.8-.9-2.9-.6-3.5Z" />
  </svg>
);

export const socialIcon: Record<string, (p: P) => React.ReactElement> = {
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  Snapchat: SnapchatIcon,
  X: XIcon,
  Threads: ThreadsIcon,
};
