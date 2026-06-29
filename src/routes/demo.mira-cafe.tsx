import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Menu as MenuIcon,
  X,
  Phone,
  Instagram,
  MapPin,
  Clock,
  Coffee,
  Sparkles,
  Leaf,
  Flame,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/demo/mira-cafe")({
  head: () => ({
    meta: [
      { title: "Mira Bistro — QR Menü & Güncel Fiyatlar" },
      {
        name: "description",
        content:
          "Mira Bistro'nun QR menüsü: kahveler, burgerler, kahvaltı, tatlılar ve daha fazlası. Mobil uyumlu, güncel fiyatlar.",
      },
      { property: "og:title", content: "Mira Bistro — QR Menü" },
      {
        property: "og:description",
        content: "Kahveden burgerlere, tatlılardan ana yemeklere kadar Mira Bistro menüsü.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap",
      },
    ],
  }),
  component: MiraCafeDemo,
});

const HERO_IMG = "/demo/mira-cafe/hero.jpg";
const BURGER_IMG = "/demo/mira-cafe/burger.jpg";
const LATTE_IMG = "/demo/mira-cafe/latte.jpg";
const CHEESECAKE_IMG = "/demo/mira-cafe/cheesecake.jpg";
const GALLERY = [
  "/demo/mira-cafe/gallery1.jpg",
  "/demo/mira-cafe/gallery2.jpg",
  "/demo/mira-cafe/gallery3.jpg",
  "/demo/mira-cafe/gallery4.jpg",
];
const LION_LOGO = "/leony-mark.png";

const WHATSAPP_NUMBER = "905550000000";
const WHATSAPP_MSG = encodeURIComponent(
  "Merhaba, Mira Bistro menüsü hakkında bilgi almak istiyorum.",
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

type Tag = "Popüler" | "Yeni" | "Acılı" | "Vejetaryen";
type Item = { name: string; desc: string; price: number; tags?: Tag[] };

const menu: Record<string, Item[]> = {
  Popüler: [
    { name: "Signature Burger", desc: "Dana köfte, cheddar, karamelize soğan, özel sos", price: 285, tags: ["Popüler"] },
    { name: "Tavuk Schnitzel", desc: "Panelenmiş tavuk, patates kızartması, özel sos", price: 260, tags: ["Popüler"] },
    { name: "Iced Caramel Latte", desc: "Espresso, süt, karamel ve buz", price: 145, tags: ["Popüler"] },
    { name: "Lotus Cheesecake", desc: "Lotus kreması ve bisküvi tabanı", price: 175, tags: ["Yeni"] },
  ],
  "Sıcak İçecekler": [
    { name: "Espresso", desc: "Yoğun aromalı klasik espresso", price: 85 },
    { name: "Americano", desc: "Espresso ve sıcak su", price: 95 },
    { name: "Latte", desc: "Espresso ve buharda ısıtılmış süt", price: 120 },
    { name: "Cappuccino", desc: "Espresso, süt ve süt köpüğü", price: 120 },
    { name: "Türk Kahvesi", desc: "Geleneksel sunumuyla", price: 95 },
    { name: "Çay", desc: "Demleme çay", price: 45 },
  ],
  "Soğuk İçecekler": [
    { name: "Iced Americano", desc: "Espresso, su ve buz", price: 115 },
    { name: "Iced Latte", desc: "Espresso, süt ve buz", price: 130 },
    { name: "Iced Caramel Latte", desc: "Espresso, süt, karamel ve buz", price: 145, tags: ["Popüler"] },
    { name: "Limonata", desc: "Ev yapımı ferah limonata", price: 110, tags: ["Vejetaryen"] },
    { name: "Berry Cooler", desc: "Orman meyveli soğuk içecek", price: 135, tags: ["Yeni"] },
    { name: "Ice Tea", desc: "Şeftali veya limon seçenekleriyle", price: 95 },
  ],
  Kahvaltı: [
    { name: "Serpme Kahvaltı", desc: "Peynir çeşitleri, zeytin, reçel, bal, yumurta, sıcaklar", price: 390, tags: ["Popüler"] },
    { name: "Kruvasan Sandviç", desc: "Hindi füme, kaşar, yeşillik", price: 185 },
    { name: "Avokadolu Tost", desc: "Avokado, yumurta, ekşi maya ekmeği", price: 210, tags: ["Vejetaryen"] },
    { name: "Menemen", desc: "Domates, biber, yumurta", price: 175, tags: ["Vejetaryen"] },
    { name: "Peynirli Omlet", desc: "Üç yumurta, peynir ve yeşillik", price: 165 },
  ],
  Burgerler: [
    { name: "Classic Burger", desc: "Dana köfte, cheddar, marul, domates, özel sos", price: 255 },
    { name: "Signature Burger", desc: "Dana köfte, cheddar, karamelize soğan, özel sos", price: 285, tags: ["Popüler"] },
    { name: "Chicken Burger", desc: "Çıtır tavuk, coleslaw, özel sos", price: 245 },
    { name: "BBQ Burger", desc: "Dana köfte, cheddar, BBQ sos, soğan halkası", price: 295, tags: ["Yeni"] },
    { name: "Veggie Burger", desc: "Sebze köftesi, yeşillik, özel sos", price: 235, tags: ["Vejetaryen"] },
  ],
  "Ana Yemekler": [
    { name: "Tavuk Schnitzel", desc: "Panelenmiş tavuk, patates kızartması, özel sos", price: 260 },
    { name: "Izgara Tavuk", desc: "Izgara tavuk göğsü, sebze ve pilav", price: 275 },
    { name: "Köri Soslu Tavuk", desc: "Tavuk parçaları, köri sos, pilav", price: 265, tags: ["Acılı"] },
    { name: "Izgara Köfte", desc: "Köfte, patates, pilav ve köz biber", price: 310 },
    { name: "Cafe Bowl", desc: "Tavuk, yeşillik, tahıl, özel sos", price: 250, tags: ["Yeni"] },
  ],
  Makarnalar: [
    { name: "Penne Arrabbiata", desc: "Acılı domates sos, parmesan", price: 220, tags: ["Acılı", "Vejetaryen"] },
    { name: "Fettuccine Alfredo", desc: "Krema, mantar, tavuk", price: 255 },
    { name: "Spaghetti Bolognese", desc: "Kıymalı domates sos", price: 245 },
    { name: "Pesto Makarna", desc: "Fesleğen pesto, parmesan", price: 235, tags: ["Vejetaryen"] },
  ],
  Salatalar: [
    { name: "Sezar Salata", desc: "Izgara tavuk, marul, kruton, parmesan", price: 230 },
    { name: "Ton Balıklı Salata", desc: "Ton balığı, yeşillik, mısır, zeytin", price: 240 },
    { name: "Akdeniz Salata", desc: "Beyaz peynir, zeytin, domates, salatalık", price: 210, tags: ["Vejetaryen"] },
    { name: "Avokadolu Salata", desc: "Avokado, yeşillik, tahıl ve limon sos", price: 250, tags: ["Vejetaryen", "Yeni"] },
  ],
  Tatlılar: [
    { name: "San Sebastian Cheesecake", desc: "Akışkan çikolata sos ile", price: 190, tags: ["Popüler"] },
    { name: "Lotus Cheesecake", desc: "Lotus kreması ve bisküvi tabanı", price: 175 },
    { name: "Tiramisu", desc: "Kahveli klasik İtalyan tatlısı", price: 165 },
    { name: "Brownie", desc: "Sıcak çikolatalı brownie", price: 155 },
    { name: "Profiterol", desc: "Çikolata soslu profiterol", price: 150 },
  ],
  Atıştırmalıklar: [
    { name: "Patates Kızartması", desc: "Baharatlı çıtır patates", price: 125, tags: ["Vejetaryen"] },
    { name: "Soğan Halkası", desc: "Dip sos ile", price: 135, tags: ["Vejetaryen"] },
    { name: "Mozzarella Stick", desc: "Eritilmiş mozzarella, çıtır kaplama", price: 160, tags: ["Vejetaryen"] },
    { name: "Tavuk Sepeti", desc: "Çıtır tavuk parçaları ve soslar", price: 210 },
    { name: "Nachos", desc: "Cheddar sos, jalapeno ve salsa", price: 190, tags: ["Acılı"] },
  ],
};

const categories = Object.keys(menu);

const tagStyles: Record<Tag, string> = {
  Popüler: "bg-[oklch(0.72_0.14_55/0.2)] text-[color:var(--mc-espresso)] border-[oklch(0.72_0.14_55/0.4)]",
  Yeni: "bg-[oklch(0.48_0.11_45/0.1)] text-[color:var(--mc-primary)] border-[oklch(0.48_0.11_45/0.3)]",
  Acılı: "bg-[oklch(0.55_0.22_25/0.1)] text-[oklch(0.55_0.22_25)] border-[oklch(0.55_0.22_25/0.3)]",
  Vejetaryen: "bg-[oklch(0.92_0.06_140)] text-[oklch(0.35_0.08_140)] border-[oklch(0.78_0.1_140)]",
};

function formatPrice(p: number) {
  return `₺${p}`;
}

// Scoped theme — overrides Leony tokens only inside this demo container.
const demoTheme: CSSProperties = {
  // Mira warm cafe palette
  ["--background" as any]: "oklch(0.985 0.012 80)",
  ["--foreground" as any]: "oklch(0.22 0.03 40)",
  ["--card" as any]: "oklch(0.995 0.008 85)",
  ["--card-foreground" as any]: "oklch(0.22 0.03 40)",
  ["--primary" as any]: "oklch(0.48 0.11 45)",
  ["--primary-foreground" as any]: "oklch(0.98 0.012 80)",
  ["--secondary" as any]: "oklch(0.94 0.025 75)",
  ["--secondary-foreground" as any]: "oklch(0.28 0.04 45)",
  ["--muted" as any]: "oklch(0.93 0.02 75)",
  ["--muted-foreground" as any]: "oklch(0.48 0.03 50)",
  ["--accent" as any]: "oklch(0.72 0.14 55)",
  ["--accent-foreground" as any]: "oklch(0.22 0.03 40)",
  ["--destructive" as any]: "oklch(0.55 0.22 25)",
  ["--border" as any]: "oklch(0.89 0.02 70)",
  ["--input" as any]: "oklch(0.89 0.02 70)",
  ["--ring" as any]: "oklch(0.72 0.14 55)",
  ["--whatsapp" as any]: "oklch(0.65 0.17 145)",
  ["--whatsapp-hover" as any]: "oklch(0.56 0.16 145)",
  ["--whatsapp-foreground" as any]: "oklch(0.99 0 0)",
  ["--mc-cream" as any]: "oklch(0.97 0.018 80)",
  ["--mc-espresso" as any]: "oklch(0.25 0.035 40)",
  ["--mc-primary" as any]: "oklch(0.48 0.11 45)",
  ["--font-display" as any]: '"Playfair Display", Georgia, serif',
  backgroundColor: "var(--background)",
  color: "var(--foreground)",
  fontFamily: '"Inter", system-ui, sans-serif',
};

function MiraCafeDemo() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>(categories[0]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const check = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 1;
      setCanScrollLeft(hasOverflow && el.scrollLeft > 0);
      setCanScrollRight(hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const items = useMemo(() => menu[active] ?? [], [active]);

  const navLinks = [
    { href: "#mc-anasayfa", label: "Anasayfa" },
    { href: "#mc-featured", label: "Favoriler" },
    { href: "#mc-menu", label: "Menü" },
    { href: "#mc-hakkimizda", label: "Hakkımızda" },
    { href: "#mc-iletisim", label: "İletişim" },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="mc-anasayfa" style={demoTheme} className="min-h-screen">
      {/* HEADER */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[color:var(--background)]/85 backdrop-blur-md shadow-[0_4px_24px_-12px_rgba(60,30,10,0.18)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => scrollTo("mc-anasayfa")}
            className="group flex items-center gap-2"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm">
              <Coffee className="h-4 w-4" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              Mira <span className="text-[color:var(--accent)]">Bistro</span>
            </span>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(l.href.slice(1));
                  }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--foreground)]/80 transition-colors hover:bg-[color:var(--secondary)] hover:text-[color:var(--foreground)]"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <span className="hidden items-center gap-1.5 rounded-full bg-[color:var(--secondary)]/60 px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)]/80 md:inline-flex">
              <Clock className="h-3.5 w-3.5" />
              09:00 - 23:00
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--foreground)]/70 md:hidden">
              <Clock className="h-3 w-3" />
              09:00 - 23:00
            </span>
            <button
              type="button"
              aria-label="Menü"
              onClick={() => setNavOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] md:hidden"
            >
              {navOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="md:hidden">
            <div className="mx-4 mb-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-lg">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setNavOpen(false);
                    scrollTo(l.href.slice(1));
                  }}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-[color:var(--foreground)]/90 hover:bg-[color:var(--secondary)]"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden pt-20">
        <img
          src={HERO_IMG}
          alt="Mira Bistro iç mekan"
          width={1920}
          height={1280}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[oklch(0.16_0.04_40/0.78)] via-[oklch(0.16_0.04_40/0.65)] to-[oklch(0.12_0.03_40/0.85)]" />

        <div className="mx-auto w-full max-w-2xl px-5 py-12 text-center text-[color:var(--mc-cream)] sm:px-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-white/10 text-[color:var(--accent)] backdrop-blur sm:h-20 sm:w-20">
            <Coffee className="h-7 w-7 sm:h-9 sm:w-9" />
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] sm:text-7xl">
            Mira <span className="text-[color:var(--accent)]">Bistro</span>
          </h1>
          <p className="mt-5 text-base text-white/85 sm:text-lg">
            Lezzetli bir mola için menümüze göz atın.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:mx-auto sm:max-w-sm">
            <button
              type="button"
              onClick={() => scrollTo("mc-featured")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-4 text-base font-semibold text-[color:var(--mc-espresso)] shadow-lg shadow-black/25 transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" />
              Mira'nın Favorileri
            </button>
            <button
              type="button"
              onClick={() => scrollTo("mc-menu")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-4 text-base font-semibold text-[color:var(--mc-cream)] backdrop-blur transition-colors hover:bg-white/20"
            >
              Menüyü Gör <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section id="mc-featured" className="bg-[color:var(--secondary)]/40 py-16 sm:py-20 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                Şefin Önerileri
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                Mira'nın Favorileri
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { img: BURGER_IMG, name: "Signature Burger", desc: "Dana köfte, cheddar, karamelize soğan, özel sos", price: 285, badge: "Şefin Önerisi" },
              { img: LATTE_IMG, name: "Iced Caramel Latte", desc: "Espresso, süt, karamel ve buz", price: 145, badge: "Yazın En Tatlı Molası" },
              { img: CHEESECAKE_IMG, name: "Lotus Cheesecake", desc: "Lotus kreması ve bisküvi tabanı", price: 175, badge: "Tatlı Krizi Kurtarıcısı" },
            ].map((p) => (
              <article
                key={p.name}
                className="group overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_10px_40px_-20px_rgba(80,40,10,0.25)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(80,40,10,0.35)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[color:var(--mc-espresso)]/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[color:var(--mc-cream)] shadow-sm backdrop-blur">
                    <Sparkles className="h-3 w-3 text-[color:var(--accent)]" />
                    {p.badge}
                  </span>
                  <img
                    src={p.img}
                    alt={p.name}
                    loading="lazy"
                    width={896}
                    height={896}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                    <span className="shrink-0 rounded-full bg-[color:var(--accent)]/20 px-3 py-1 text-sm font-bold text-[color:var(--mc-espresso)]">
                      {formatPrice(p.price)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-foreground)]">{p.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="mc-menu" className="py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Menümüz
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Tüm Lezzetler Tek Yerde
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[color:var(--muted-foreground)]">
              Kategori seçerek aradığınız ürüne hızlıca ulaşın. Tüm fiyatlar günceldir.
            </p>
          </div>

          {/* Tabs */}
          <div className="sticky top-16 z-30 -mx-5 mt-8 sm:mx-0">
            <div className="relative bg-[color:var(--background)]/85 backdrop-blur-md sm:rounded-2xl sm:shadow-[0_8px_24px_-16px_rgba(80,40,10,0.25)]">
              {canScrollLeft && (
                <button
                  type="button"
                  aria-label="Önceki kategoriler"
                  onClick={() => tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
                  className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--background)]/90 text-[color:var(--muted-foreground)] shadow-sm backdrop-blur-sm transition hover:bg-[color:var(--background)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {canScrollRight && (
                <button
                  type="button"
                  aria-label="Sonraki kategoriler"
                  onClick={() => tabsRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
                  className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--background)]/90 text-[color:var(--muted-foreground)] shadow-sm backdrop-blur-sm transition hover:bg-[color:var(--background)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              <div
                ref={tabsRef}
                className="flex gap-2 overflow-x-auto px-5 py-3 sm:px-3 sm:py-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {categories.map((c) => {
                  const isActive = c === active;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActive(c)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow"
                          : "bg-[color:var(--secondary)] text-[color:var(--foreground)]/80 hover:bg-[color:var(--secondary)]/70"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((it) => (
              <article
                key={it.name + it.price}
                className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_6px_24px_-18px_rgba(80,40,10,0.3)] transition hover:border-[color:var(--accent)]/50 hover:shadow-[0_12px_30px_-18px_rgba(80,40,10,0.4)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-tight">
                      {it.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
                      {it.desc}
                    </p>
                    {it.tags && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {it.tags.map((t) => (
                          <span
                            key={t}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tagStyles[t]}`}
                          >
                            {t === "Acılı" && <Flame className="h-3 w-3" />}
                            {t === "Vejetaryen" && <Leaf className="h-3 w-3" />}
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="rounded-full bg-[color:var(--mc-espresso)] px-3 py-1.5 text-sm font-bold text-[color:var(--mc-cream)]">
                      {formatPrice(it.price)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="mc-hakkimizda" className="bg-[color:var(--secondary)]/40 py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Hikayemiz
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Mira Bistro Hakkında
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[color:var(--muted-foreground)] sm:text-lg">
              Mira Bistro, kahvenin sakinliğini ve iyi yemeğin keyfini aynı masada
              buluşturan samimi bir lezzet noktasıdır. Günlük hazırlanan ürünlerimiz,
              özenle seçilen kahvelerimiz ve rahat atmosferimizle günün her saatinde
              keyifli bir mola sunarız.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { icon: Leaf, title: "Günlük Taze Ürünler", desc: "Mutfağımızda her gün taze hazırlanan menü." },
              { icon: Coffee, title: "Samimi Atmosfer", desc: "Rahatça vakit geçirebileceğiniz sıcak bir alan." },
              { icon: Sparkles, title: "Özenli Sunum", desc: "Lezzeti tamamlayan, detaylara önem veren sunum." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-center shadow-[0_8px_24px_-18px_rgba(80,40,10,0.3)]"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[color:var(--accent)]/20 text-[color:var(--mc-espresso)]">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-foreground)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Atmosfer
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Mira'nın eşsiz atmosferinde büyüleyici bir deneyim ve rahatlatıcı bir mola.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {GALLERY.map((src, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl ${
                  i === 0 ? "lg:col-span-2 lg:row-span-2 aspect-[4/3] lg:aspect-square" : "aspect-[4/3]"
                }`}
              >
                <img
                  src={src}
                  alt="Mira Bistro atmosfer"
                  loading="lazy"
                  width={1200}
                  height={1200}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="mc-iletisim"
        className="py-20 sm:py-24 scroll-mt-20"
        style={{ backgroundColor: "var(--mc-espresso)", color: "var(--mc-cream)" }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                İletişim
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                Bize Ulaşın
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[color:var(--mc-cream)]/75">
                Rezervasyon, sipariş veya merak ettikleriniz için WhatsApp üzerinden
                bize hızlıca ulaşabilirsiniz.
              </p>

              <div className="mt-7 space-y-3">
                <a
                  href="tel:+905550000000"
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  <Phone className="h-4 w-4 text-[color:var(--accent)]" />
                  +90 555 000 00 00
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                  style={{
                    backgroundColor: "var(--whatsapp)",
                    color: "var(--whatsapp-foreground)",
                  }}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp'tan Yaz
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  <Instagram className="h-4 w-4 text-[color:var(--accent)]" />
                  @mirabistro
                </a>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  <MapPin className="h-4 w-4 text-[color:var(--accent)]" />
                  Google Maps'te Aç
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-7 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--accent)]/20 text-[color:var(--accent)]">
                  <Clock className="h-4 w-4" />
                </span>
                <h3 className="font-display text-xl font-semibold">Çalışma Saatleri</h3>
              </div>
              <dl className="mt-5 divide-y divide-white/10 text-sm">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-[color:var(--mc-cream)]/75">Pazartesi – Cuma</dt>
                  <dd className="font-semibold">09:00 – 23:00</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-[color:var(--mc-cream)]/75">Cumartesi – Pazar</dt>
                  <dd className="font-semibold">10:00 – 00:00</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="pb-10"
        style={{ backgroundColor: "var(--mc-espresso)", color: "color-mix(in oklch, var(--mc-cream) 70%, transparent)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 px-5 pt-6 text-xs sm:flex-row sm:px-8">
          <p>© 2026 Mira Bistro. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-2">
            <img
              src={LION_LOGO}
              alt="Leony"
              loading="lazy"
              width={18}
              height={18}
              className="h-4 w-4 opacity-80"
            />
            <span className="font-display italic tracking-wide">
              Designed and developed by{" "}
              <a
                href="https://leony.tech"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-2 transition"
                style={{ color: "var(--accent)" }}
              >
                leony.tech
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.11 4.91A10.05 10.05 0 0 0 12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.77.46 3.5 1.35 5.02L2 22l5.13-1.34A9.95 9.95 0 0 0 12.02 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.91-7.09Zm-7.09 15.42a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.04.8.81-2.96-.2-.31a8.32 8.32 0 1 1 15.46-4.52 8.33 8.33 0 0 1-8.5 8.33Zm4.56-6.23c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13s-.65.81-.79.98c-.15.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.66-1.25-1.48-1.4-1.73-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.74 4.34 3.84.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3Z" />
    </svg>
  );
}
