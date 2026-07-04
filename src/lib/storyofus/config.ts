// Story of Us — product configuration (styles, options, packages, marketing, shopier)

export type StyleId = "soft" | "cinematic" | "cute";
export type ColorThemeId = "soft-pink" | "cream-beige" | "wine-red" | "lavender-dream";
export type FontId = "elegant-serif" | "handwritten" | "modern-clean";
export type PhotoLayoutId = "polaroid" | "gallery" | "fullscreen";
export type AnimationId = "soft-fade" | "floating-hearts" | "cinematic-scroll";
export type VisibilityId = "public" | "hidden" | "password_protected";
export type PackageId = "basic" | "premium" | "express";
export type MarketingPermissionId = "none" | "site" | "site_social";
export type MarketingPrivacyId = "full" | "blur_names" | "blur_photos" | "design_only";

export type PaymentStatus =
  | "Ödeme Bekleniyor"
  | "Ödeme Onaylandı"
  | "Ödeme Alınamadı"
  | "İade Edildi";

export type OrderStatus =
  | "Form Alındı"
  | "Ödeme Bekleniyor"
  | "Ödeme Onaylandı"
  | "Hazırlanıyor"
  | "Revizyon Bekleniyor"
  | "Hazır"
  | "Teslim Edildi"
  | "İptal / Ödeme Yapılmadı";

export const STYLES: {
  id: StyleId;
  name: string;
  description: string;
  startingPrice: number;
  defaults: {
    colorTheme: ColorThemeId;
    font: FontId;
    photoLayout: PhotoLayoutId;
    animation: AnimationId;
  };
}[] = [
  {
    id: "soft",
    name: "Soft Romance",
    description: "Pastel, zarif ve romantik.",
    startingPrice: 499,
    defaults: {
      colorTheme: "soft-pink",
      font: "elegant-serif",
      photoLayout: "polaroid",
      animation: "soft-fade",
    },
  },
  {
    id: "cinematic",
    name: "Cinematic Love",
    description: "Film gibi, dramatik ve premium.",
    startingPrice: 499,
    defaults: {
      colorTheme: "wine-red",
      font: "elegant-serif",
      photoLayout: "fullscreen",
      animation: "cinematic-scroll",
    },
  },
  {
    id: "cute",
    name: "Cute Digital Diary",
    description: "Tatlı, genç, Polaroid ve günlük hissi.",
    startingPrice: 499,
    defaults: {
      colorTheme: "lavender-dream",
      font: "handwritten",
      photoLayout: "polaroid",
      animation: "floating-hearts",
    },
  },
];

export const COLOR_THEMES: {
  id: ColorThemeId;
  label: string;
  description: string;
  swatches: [string, string, string];
  bg: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
}[] = [
  {
    id: "soft-pink",
    label: "Soft Pembe",
    description: "Pastel, romantik ve zarif.",
    swatches: ["#FADADD", "#FFF5E4", "#E8B4BC"],
    bg: "#FFF5F5",
    surface: "#FFE8EC",
    accent: "#D96C82",
    text: "#4A2530",
    muted: "#8A5A66",
  },
  {
    id: "cream-beige",
    label: "Krem Bej",
    description: "Sade, sıcak ve minimal.",
    swatches: ["#F5EBDD", "#E8D5B7", "#7A5230"],
    bg: "#FBF6EE",
    surface: "#F1E4CF",
    accent: "#8B5E3C",
    text: "#3D2A19",
    muted: "#6F5A44",
  },
  {
    id: "wine-red",
    label: "Bordo Sinematik",
    description: "Daha dramatik ve premium.",
    swatches: ["#6B0F1A", "#111111", "#C9A75C"],
    bg: "#160A0D",
    surface: "#25121A",
    accent: "#C9A75C",
    text: "#F3E7D2",
    muted: "#B99A80",
  },
  {
    id: "lavender-dream",
    label: "Lavanta Rüyası",
    description: "Yumuşak, romantik ve modern.",
    swatches: ["#D9C7F1", "#F7F5FB", "#8266B5"],
    bg: "#F7F4FB",
    surface: "#EBE1F5",
    accent: "#8266B5",
    text: "#2E1F49",
    muted: "#6A5A87",
  },
];

export const FONTS: { id: FontId; label: string; description: string; family: string }[] = [
  {
    id: "elegant-serif",
    label: "Zarif Serif",
    description: "Klasik, romantik ve premium.",
    family: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
  },
  {
    id: "handwritten",
    label: "El Yazısı Romantik",
    description: "Daha kişisel ve tatlı bir his.",
    family: '"Great Vibes", "Dancing Script", cursive',
  },
  {
    id: "modern-clean",
    label: "Modern Sade",
    description: "Minimal, temiz ve çağdaş.",
    family: '"Plus Jakarta Sans", "Inter", ui-sans-serif, sans-serif',
  },
];

export const PHOTO_LAYOUTS: { id: PhotoLayoutId; label: string; description: string }[] = [
  { id: "polaroid", label: "Polaroid", description: "Tatlı, anı defteri hissi." },
  { id: "gallery", label: "Galeri", description: "Düzenli ve modern fotoğraf alanı." },
  { id: "fullscreen", label: "Büyük Anı", description: "Daha sinematik ve etkileyici." },
];

export const ANIMATIONS: { id: AnimationId; label: string; description: string }[] = [
  { id: "soft-fade", label: "Yumuşak Geçiş", description: "Minimal ve zarif animasyonlar." },
  { id: "floating-hearts", label: "Uçuşan Kalpler", description: "Tatlı ve romantik küçük detaylar." },
  { id: "cinematic-scroll", label: "Sinematik Akış", description: "Daha premium ve film gibi geçişler." },
];

export const VISIBILITY: {
  id: VisibilityId;
  label: string;
  description: string;
  extraPrice: number;
  badge?: string;
}[] = [
  {
    id: "public",
    label: "Açık Link",
    description:
      "Linke sahip olan herkes web sitenizi görebilir. Bu seçenek daha görünür bir link isteyenler için uygundur.",
    extraPrice: 0,
  },
  {
    id: "hidden",
    label: "Gizli Link",
    description:
      "Web siteniz Google’da çıkmaz, Leony’de listelenmez ve herkese açık şekilde paylaşılmaz. Sadece linki bilen kişiler web sitenizi görebilir.",
    extraPrice: 0,
    badge: "Önerilen",
  },
  {
    id: "password_protected",
    label: "Şifreli Link",
    description:
      "Web sitenize girildiğinde önce şifre istenir. Şifreyi bilmeyen kişiler siteyi görüntüleyemez.",
    extraPrice: 100,
    badge: "Premium",
  },
];

export const PACKAGES: {
  id: PackageId;
  label: string;
  originalPrice: number;
  activePrice: number;
  features: string[];
  delivery: string;
}[] = [
  {
    id: "basic",
    label: "Başlangıç",
    originalPrice: 599,
    activePrice: 499,
    features: [
      "1 sayfa kişisel web sitesi",
      "İsimler ve özel tarih",
      "Kısa aşk notu",
      "3 fotoğraf alanı",
      "Gizli link",
    ],
    delivery: "2–4 iş günü teslim",
  },
  {
    id: "premium",
    label: "Premium",
    originalPrice: 899,
    activePrice: 699,
    features: [
      "Başlangıç paketteki her şey",
      "Hikaye bölümü",
      "Timeline / ilişkinizin dönüm noktaları",
      "Şarkı alanı",
      "8 fotoğraf alanı",
      "Daha detaylı tasarım",
    ],
    delivery: "2–4 iş günü teslim",
  },
  {
    id: "express",
    label: "Express",
    originalPrice: 1399,
    activePrice: 1099,
    features: [
      "Premium paketteki her şey",
      "Öncelikli hazırlık",
      "24 saat içinde teslim",
      "1 küçük revizyon hakkı",
    ],
    delivery: "24 saat içinde teslim",
  },
];

export const MARKETING_PERMISSIONS: {
  id: MarketingPermissionId;
  label: string;
  description: string;
  discount: number;
}[] = [
  {
    id: "none",
    label: "Kullanılmasın",
    description: "Sitem ve bilgilerim yalnızca bana özel kalsın.",
    discount: 0,
  },
  {
    id: "site",
    label: "Sadece Leony web sitesinde yayınlansın",
    description: "Web sitem Leony’nin örnek çalışmaları arasında gösterilebilir.",
    discount: 75,
  },
  {
    id: "site_social",
    label: "Leony web sitesi + sosyal medya içeriklerinde kullanılsın",
    description:
      "Web sitem Instagram/TikTok post, story, reels ve tanıtım içeriklerinde kullanılabilir.",
    discount: 100,
  },
];

export const MARKETING_PRIVACY: { id: MarketingPrivacyId; label: string }[] = [
  { id: "full", label: "Tam haliyle kullanılabilir" },
  { id: "blur_names", label: "İsimler bulanıklaştırılsın" },
  { id: "blur_photos", label: "Fotoğraflar bulanıklaştırılsın" },
  { id: "design_only", label: "Sadece tasarım ekran görüntüsü kullanılsın" },
];

// Shopier placeholder link mapping — replace with real links later.
export const SHOPIER_LINKS: Record<number, string> = {
  399: "SHOPIER_LINK_FOR_399TL_HERE",
  424: "SHOPIER_LINK_FOR_424TL_HERE",
  499: "SHOPIER_LINK_FOR_499TL_HERE",
  524: "SHOPIER_LINK_FOR_524TL_HERE",
  599: "SHOPIER_LINK_FOR_599TL_HERE",
  599.99: "SHOPIER_LINK_FOR_599TL_HERE",
  624: "SHOPIER_LINK_FOR_624TL_HERE",
  699: "SHOPIER_LINK_FOR_699TL_HERE",
  724: "SHOPIER_LINK_FOR_724TL_HERE",
  799: "SHOPIER_LINK_FOR_799TL_HERE",
  999: "SHOPIER_LINK_FOR_999TL_HERE",
  1024: "SHOPIER_LINK_FOR_1024TL_HERE",
  1099: "SHOPIER_LINK_FOR_1099TL_HERE",
  1199: "SHOPIER_LINK_FOR_1199TL_HERE",
};

export const SHOPIER_PAYMENT_LINK_PLACEHOLDER = "SHOPIER_PAYMENT_LINK_PLACEHOLDER";

export function getShopierPaymentLink(
  totalPrice: number,
  _selectedPackage: PackageId,
  _visibility: VisibilityId,
  _marketingPermissionType: MarketingPermissionId,
): string {
  return SHOPIER_LINKS[totalPrice] ?? SHOPIER_PAYMENT_LINK_PLACEHOLDER;
}

export const LEONY_ADMIN_EMAIL_HERE = "LEONY_ADMIN_EMAIL_HERE";
