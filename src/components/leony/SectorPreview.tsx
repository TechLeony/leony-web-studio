import type { SectorPreviewKind } from "@/lib/site";
import {
  Calendar,
  Coffee,
  Scissors,
  Sparkles,
  Stethoscope,
  PawPrint,
  HeartHandshake,
  MapPin,
  Star,
  MessageCircle,
} from "lucide-react";

// Browser-style preview mockup tailored per sector. Used on sector pages.
export function SectorPreview({ kind, label }: { kind: SectorPreviewKind; label: string }) {
  const cfg = CONFIG[kind];
  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[32px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, color-mix(in oklab, var(--color-orange) 18%, transparent), transparent 70%), radial-gradient(60% 60% at 20% 80%, color-mix(in oklab, var(--color-purple) 26%, transparent), transparent 70%)",
        }}
      />
      <div className="rounded-2xl bg-card border border-border shadow-2xl shadow-navy/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/60">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.16_25)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0.15_85)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.16_150)]" />
          <div className="ml-3 flex-1 h-6 rounded-md bg-card border border-border text-[10px] text-muted-foreground flex items-center px-3">
            leony.app/demo/{kind}
          </div>
        </div>

        {/* Hero strip */}
        <div className="relative p-5 md:p-6 bg-gradient-to-br from-navy via-purple to-pink text-navy-foreground overflow-hidden">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange/40 blur-2xl" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider opacity-85">
            <cfg.Icon className="h-3.5 w-3.5" /> {label}
          </div>
          <div className="mt-1 text-lg md:text-xl font-semibold leading-snug max-w-[24ch]">
            {cfg.headline}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {cfg.ctas.map((c) => (
              <span
                key={c.label}
                className={
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold " +
                  (c.tone === "wa"
                    ? "bg-whatsapp text-whatsapp-foreground"
                    : "bg-white/15 backdrop-blur")
                }
              >
                <c.icon className="h-3 w-3" /> {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 grid grid-cols-5 gap-4">
          <div className="col-span-3 space-y-2.5">
            <div className="text-[11px] font-semibold text-purple uppercase tracking-wider">
              {cfg.sectionTitle}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cfg.items.map((it) => (
                <div
                  key={it}
                  className="rounded-lg border border-border bg-background px-2.5 py-2 text-[11px] font-medium text-foreground"
                >
                  {it}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {cfg.location}
            </div>
          </div>
          <div className="col-span-2 rounded-xl bg-muted/60 border border-border p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cfg.sideTitle}
            </div>
            <div className="mt-2 space-y-1.5">
              {cfg.side.map((s) => (
                <div
                  key={s.t}
                  className="flex items-center justify-between rounded-md bg-card border border-border px-2 py-1.5 text-[10px]"
                >
                  <span className="font-semibold text-foreground">{s.t}</span>
                  <span className="text-muted-foreground">{s.n}</span>
                  <span className="text-teal font-medium">{s.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile preview */}
      <div className="absolute -bottom-6 right-3 sm:right-6 w-[110px] sm:w-[130px] rounded-[18px] bg-card border border-border shadow-xl overflow-hidden">
        <div className="h-3 bg-muted/70 grid place-items-center">
          <div className="h-1 w-8 rounded-full bg-border" />
        </div>
        <div className="p-2 space-y-1.5">
          <div className="rounded-md bg-gradient-to-br from-navy to-purple h-8" />
          <div className="h-1.5 w-3/4 rounded bg-foreground/70" />
          <div className="h-1 w-full rounded bg-muted-foreground/30" />
          <div className="h-1 w-5/6 rounded bg-muted-foreground/30" />
          <div className="grid grid-cols-2 gap-1 pt-1">
            <span className="h-3.5 rounded bg-navy" />
            <span className="h-3.5 rounded bg-whatsapp" />
          </div>
        </div>
      </div>
    </div>
  );
}

const CONFIG: Record<
  SectorPreviewKind,
  {
    Icon: typeof Coffee;
    headline: string;
    ctas: Array<{ label: string; tone: "wa" | "muted"; icon: typeof Coffee }>;
    sectionTitle: string;
    items: string[];
    location: string;
    sideTitle: string;
    side: Array<{ t: string; n: string; s: string }>;
  }
> = {
  cafe: {
    Icon: Coffee,
    headline: "Lezzeti ve atmosferi dijitalde keşfet.",
    ctas: [
      { label: "Rezervasyon", tone: "muted", icon: Calendar },
      { label: "WhatsApp", tone: "wa", icon: MessageCircle },
    ],
    sectionTitle: "Menü",
    items: ["Espresso Bar", "Brunch", "Tatlılar", "Soğuk İçecekler"],
    location: "Konum · Çalışma saatleri · Rezervasyon",
    sideTitle: "Bugün",
    side: [
      { t: "12:30", n: "Masa · 2", s: "Onaylı" },
      { t: "14:00", n: "Masa · 4", s: "Onaylı" },
      { t: "19:15", n: "Masa · 6", s: "Beklemede" },
    ],
  },
  clinic: {
    Icon: Stethoscope,
    headline: "Hasta deneyiminde güven veren dijital görünüm.",
    ctas: [
      { label: "Randevu Al", tone: "muted", icon: Calendar },
      { label: "WhatsApp", tone: "wa", icon: MessageCircle },
    ],
    sectionTitle: "Hizmetler",
    items: ["Genel Muayene", "İmplant", "Estetik Diş", "Çocuk Diş"],
    location: "Hekim kadrosu · Adres · Çalışma saatleri",
    sideTitle: "Bugünkü randevular",
    side: [
      { t: "10:30", n: "A. Yılmaz", s: "Onaylı" },
      { t: "12:00", n: "M. Demir", s: "Onaylı" },
      { t: "15:15", n: "E. Kaya", s: "Yeni" },
    ],
  },
  beauty: {
    Icon: Sparkles,
    headline: "Hizmetlerini şık bir dijital vitrinde sun.",
    ctas: [
      { label: "Randevu", tone: "muted", icon: Calendar },
      { label: "WhatsApp", tone: "wa", icon: MessageCircle },
    ],
    sectionTitle: "Hizmet Listesi",
    items: ["Manikür", "Pedikür", "Cilt Bakımı", "Kaş Tasarımı"],
    location: "Galeri · Konum · Çalışma saatleri",
    sideTitle: "Galeri",
    side: [
      { t: "Set", n: "Nail Art", s: "★ 4.9" },
      { t: "Bakım", n: "Cilt", s: "★ 4.8" },
      { t: "Tasarım", n: "Kaş", s: "★ 5.0" },
    ],
  },
  barber: {
    Icon: Scissors,
    headline: "Tarzını öne çıkaran modern barber web sitesi.",
    ctas: [
      { label: "Hizmetler", tone: "muted", icon: Scissors },
      { label: "WhatsApp", tone: "wa", icon: MessageCircle },
    ],
    sectionTitle: "Hizmetler",
    items: ["Saç Kesimi", "Sakal", "Cilt Bakımı", "Çocuk Kesimi"],
    location: "Galeri · Konum · WhatsApp",
    sideTitle: "Yorumlar",
    side: [
      { t: "★ 5.0", n: "Kemal A.", s: "Yeni" },
      { t: "★ 4.9", n: "Burak T.", s: "Yeni" },
      { t: "★ 4.8", n: "Onur Y.", s: "" },
    ],
  },
  vet: {
    Icon: PawPrint,
    headline: "Dostlar için güven veren randevu deneyimi.",
    ctas: [
      { label: "Randevu", tone: "muted", icon: Calendar },
      { label: "WhatsApp", tone: "wa", icon: MessageCircle },
    ],
    sectionTitle: "Hizmetler",
    items: ["Muayene", "Aşı", "Operasyon", "Bakım"],
    location: "Klinik adresi · Acil iletişim · Çalışma saatleri",
    sideTitle: "Bugün",
    side: [
      { t: "09:30", n: "Boncuk", s: "Aşı" },
      { t: "11:00", n: "Pamuk", s: "Kontrol" },
      { t: "14:00", n: "Maya", s: "Yeni" },
    ],
  },
  therapist: {
    Icon: HeartHandshake,
    headline: "Danışan deneyimini sade ve güvenle taşı.",
    ctas: [
      { label: "Randevu", tone: "muted", icon: Calendar },
      { label: "İletişim", tone: "muted", icon: MessageCircle },
    ],
    sectionTitle: "Çalışma Alanları",
    items: ["Bireysel", "Çift", "Aile", "Online Seans"],
    location: "Yaklaşım · Seans bilgisi · İletişim",
    sideTitle: "Müsaitlik",
    side: [
      { t: "Pzt", n: "10:00", s: "Açık" },
      { t: "Çar", n: "14:00", s: "Açık" },
      { t: "Cum", n: "18:00", s: "Açık" },
    ],
  },
};

// re-export only to keep tree-shaking happy with unused imports if any
export const _starIcon = Star;
