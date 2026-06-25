// Structural site config (ids/icons/slugs only). Text lives in i18n translations.

export const SITE = {
  brand: "Leony",
  whatsappNumber:
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "905016800041",
  email:
    (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? "info@leony.app",
  url:
    (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://leony.app",
};

export function waLink(message: string) {
  const num = SITE.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

// Nav uses translation keys; href stays as hash anchor / route.
export type NavKey = "home" | "whatIs" | "whyWebsite" | "sectors" | "demos" | "packages" | "faq" | "contact";

export const NAV_LINKS: { key: NavKey; href: string }[] = [
  { key: "whatIs", href: "#leony-nedir" },
  { key: "whyWebsite", href: "#neden-website" },
  { key: "sectors", href: "#sektorler" },
  { key: "demos", href: "#demolar" },
  { key: "packages", href: "#paketler" },
  { key: "faq", href: "#sss" },
  { key: "contact", href: "#iletisim" },
];

export const SECTOR_NAV_LINKS: { key: NavKey; href: string }[] = [
  { key: "home", href: "/" },
  { key: "demos", href: "#demolar" },
  { key: "packages", href: "#paketler" },
  { key: "faq", href: "#sss" },
  { key: "contact", href: "#iletisim" },
];

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
];

// Categories — slug + icon only; titles/descs come from translations.
export const CATEGORIES = [
  { slug: "cafe-restoran", icon: "UtensilsCrossed" },
  { slug: "klinik-dis-klinigi", icon: "Stethoscope" },
  { slug: "guzellik-salonu-nail-studio", icon: "Sparkles" },
  { slug: "barber-kuafor", icon: "Scissors" },
  { slug: "vet-klinik", icon: "PawPrint" },
  { slug: "terapist-psikolog", icon: "HeartHandshake" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// Demo project ids (text in translations).
export const DEMO_IDS = ["cafe", "clinic", "beauty", "barber", "vet", "therapist"] as const;
export type DemoId = (typeof DEMO_IDS)[number];

// Demo links (optional external URLs) — none yet.
export const DEMO_LINKS: Partial<Record<DemoId, string>> = {};

// Package ids; copy/features/CTA come from translations.
export const PACKAGE_IDS = ["baslangic", "isletme", "profesyonel"] as const;
export type PackageId = (typeof PACKAGE_IDS)[number];

export const PACKAGE_META: Record<PackageId, { highlighted?: boolean }> = {
  baslangic: {},
  isletme: { highlighted: true },
  profesyonel: {},
};

// Sector preview kinds map (slug -> preview kind).
export const SECTOR_PREVIEW_KIND: Record<CategorySlug, "cafe" | "clinic" | "beauty" | "barber" | "vet" | "therapist"> = {
  "cafe-restoran": "cafe",
  "klinik-dis-klinigi": "clinic",
  "guzellik-salonu-nail-studio": "beauty",
  "barber-kuafor": "barber",
  "vet-klinik": "vet",
  "terapist-psikolog": "therapist",
};

export const SECTOR_ADVANCED: Record<CategorySlug, boolean> = {
  "cafe-restoran": false,
  "klinik-dis-klinigi": true,
  "guzellik-salonu-nail-studio": false,
  "barber-kuafor": false,
  "vet-klinik": true,
  "terapist-psikolog": true,
};

export type SectorPreviewKind = (typeof SECTOR_PREVIEW_KIND)[CategorySlug];
