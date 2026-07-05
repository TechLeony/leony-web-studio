import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Heart, ChevronRight } from "lucide-react";
import { STYLES } from "@/lib/storyofus/config";

export const Route = createFileRoute("/storyofus-old/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Story of Us — İkinize özel romantik bir web sitesi | Leony" },
      {
        name: "description",
        content:
          "Story of Us, çiftler için özel olarak tasarlanan romantik web siteleri. Hikayenizi, fotoğraflarınızı ve özel günlerinizi tek bir yerde toplayın.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Story of Us — İkinize özel romantik bir web sitesi" },
      {
        property: "og:description",
        content: "Çiftler için romantik, kişiye özel web sitesi tasarımı.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StoryOfUsLanding,
});

const HOW_STEPS = [
  "Stilini seç",
  "Renk, font ve paketini belirle",
  "Bilgilerini ve hikayeni gönder",
  "Shopier üzerinden ödeme yap",
  "Web siten hazırlanıp sana özel link olarak gönderilsin",
];

const FAQS = [
  { q: "Web sitesi ne kadar sürede hazırlanır?", a: "Ödeme onayından sonra 2–4 iş günü içinde. Express paket ile 24 saat." },
  { q: "Fotoğraf gönderebilir miyim?", a: "Evet. Siparişten sonra size özel bir yükleme linki paylaşıyoruz." },
  { q: "Link gizli olabilir mi?", a: "Evet. Gizli link seçeneği ile siteniz Google’da çıkmaz ve Leony’de listelenmez." },
  { q: "Şifreli site seçebilir miyim?", a: "Evet. Şifreli link ile giriş için parola gereklidir (+100 TL)." },
  { q: "Ödeme nasıl yapılır?", a: "Shopier üzerinden güvenle. Sipariş kodunuzu ödeme notuna yazmanız gerekir." },
  { q: "Sipariş kodu ne işe yarar?", a: "Formunuzu Shopier ödemenizle eşleştirmek için kullanılır." },
];

function StoryOfUsLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50/40">
      <header className="border-b border-border/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Leony
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-rose-500" /> Story of Us
          </div>
          <span className="w-14" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-14 pb-16 text-center md:pt-24 md:pb-24">
        <Heart className="pointer-events-none absolute left-8 top-16 h-6 w-6 text-rose-200" />
        <Heart className="pointer-events-none absolute right-12 top-28 h-4 w-4 text-rose-300" />
        <Heart className="pointer-events-none absolute left-1/3 bottom-8 h-5 w-5 text-rose-200" />

        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-1.5 text-xs font-semibold text-rose-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Kişiye Özel Dijital Hediye
          </span>
          <h1
            className="mx-auto mt-5 max-w-2xl text-4xl font-bold leading-tight text-foreground md:text-6xl"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            İkinize özel <span className="text-rose-500">romantik</span> bir web sitesi
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Hikayenizi, fotoğraflarınızı, notlarınızı ve özel günlerinizi size özel tasarlanan romantik bir web sitesinde bir araya getirin.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#styles"
              className="rounded-full bg-rose-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
            >
              Stilini Seç
            </a>
            <a
              href="#styles"
              className="rounded-full border border-border bg-white px-7 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Demoları Gör
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Nasıl çalışıyor?</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {HOW_STEPS.map((step, i) => (
            <div key={step} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-500 text-sm font-bold text-white">
                {i + 1}
              </div>
              <p className="mt-3 text-sm text-foreground">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Style selection */}
      <section id="styles" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Stilini Seç</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            3 farklı romantik stil. Her biri kendine özgü his ve tasarımla.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STYLES.map((s) => (
            <Link
              key={s.id}
              to={"/storyofus/styles/$style"}
              params={{ style: s.id }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl"
            >
              <StylePreviewMock style={s.id} />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-bold">{s.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-rose-600">{s.startingPrice} TL</span>’den başlayan fiyatlarla
                </p>
                <span className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-500 py-2.5 text-sm font-semibold text-white group-hover:bg-rose-600">
                  Stili Seç <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Sıkça Sorulan Sorular</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-white p-5 open:shadow-md">
              <summary className="cursor-pointer list-none font-semibold text-foreground">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 p-10 text-center text-white shadow-xl md:p-14">
          <h2 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Kendi hikayenizi web sitesine dönüştürün.
          </h2>
          <a
            href="#styles"
            className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-rose-600 shadow-lg hover:bg-rose-50"
          >
            Stilini Seç
          </a>
        </div>
      </section>
    </div>
  );
}

function StylePreviewMock({ style }: { style: "soft" | "cinematic" | "cute" }) {
  const map = {
    soft: { from: "#FADADD", to: "#FFF5E4", accent: "#D96C82" },
    cinematic: { from: "#6B0F1A", to: "#111111", accent: "#C9A75C" },
    cute: { from: "#D9C7F1", to: "#F7F5FB", accent: "#8266B5" },
  } as const;
  const c = map[style];
  const isDark = style === "cinematic";
  return (
    <div
      className="relative h-52 w-full overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p
            className={`text-[10px] uppercase tracking-[0.3em] ${isDark ? "text-amber-200/80" : "text-rose-700/70"}`}
          >
            Story of Us
          </p>
          <p
            className="mt-2 text-2xl"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: isDark ? "#F3E7D2" : "#3D1E29",
            }}
          >
            Ahmet <span style={{ color: c.accent }}>&</span> Ceren
          </p>
        </div>
      </div>
      <Heart className="absolute right-6 top-6 h-4 w-4" style={{ color: c.accent }} />
    </div>
  );
}
