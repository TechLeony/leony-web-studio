import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Camera, Music, PenLine, Palette, Sparkles, Mail, CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/storyofus-new/")({
  head: () => ({
    meta: [
      { title: "StoryOfUs — Sevgiline özel romantik web sitesi | Leony" },
      {
        name: "description",
        content:
          "Sevgiline sadece ona özel, tek link ile açılan romantik bir web sitesi hazırla. Fotoğraflar, notlar, şarkı ve sürprizlerle dolu dijital bir aşk hediyesi. 199 TL.",
      },
      { property: "og:title", content: "StoryOfUs — Kişiye özel romantik web sitesi" },
      {
        property: "og:description",
        content: "Sevgiline unutamayacağı bir dijital hediye. Sadece 199 TL.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StoryOfUsLanding,
});

const PINK_BG =
  "bg-[linear-gradient(180deg,#fff5f7_0%,#ffe4ec_45%,#ffd1de_100%)]";

function StoryOfUsLanding() {
  return (
    <div className={`min-h-screen ${PINK_BG} text-rose-950`}>
      <FloatingHearts />

      {/* Nav */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/" className="font-serif text-lg tracking-tight text-rose-700">
          Leony
        </Link>
        <a
          href="#pay"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-rose-300/50 hover:bg-rose-700 transition"
        >
          <Heart className="h-4 w-4 fill-white" /> 199 TL — Şimdi Al
        </a>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-10 pb-20 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-rose-500 mb-6">
          Kişiye özel dijital hediye
        </p>
        <h1
          className="text-5xl md:text-7xl leading-tight text-rose-700"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Sevgiline kişiye özel <br /> romantik bir web sitesi hazırla
        </h1>
        <p className="mt-6 text-base md:text-lg text-rose-950/70 max-w-2xl mx-auto leading-relaxed">
          Fotoğraflarınız, notlarınız, şarkınız ve birlikte biriktirdiğiniz anılar…
          Hepsi tek bir linkte, sadece ikinize özel bir dijital anı kutusunda.
        </p>

        <div className="mt-10 inline-flex flex-col items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-rose-700">199</span>
            <span className="text-lg font-medium text-rose-700">TL</span>
          </div>
          <p className="text-xs text-rose-950/60">Tek seferlik ödeme · Süresiz link</p>
          <a
            href="#pay"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rose-400/40 hover:shadow-rose-500/60 hover:scale-[1.02] transition-all"
          >
            <Heart className="h-5 w-5 fill-white" /> Pay Now
          </a>
          <Link
            to="/storyofus-new/demo"
            className="mt-2 text-sm text-rose-700 underline underline-offset-4 decoration-rose-300 hover:text-rose-900"
          >
            Önce demoyu gör →
          </Link>
        </div>
      </section>

      {/* Flow */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <h2
          className="text-4xl md:text-5xl text-center text-rose-700 mb-12"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Nasıl çalışıyor?
        </h2>
        <ol className="grid md:grid-cols-5 gap-4">
          {[
            { n: "1", t: "Ödemeni yap", d: "Shopier üzerinden güvenle 199 TL öde." },
            { n: "2", t: "Setup mailin gelsin", d: "Ödeme sonrası mailine özel kurulum linki gelir." },
            { n: "3", t: "Bilgilerini gir", d: "Fotoğraflar, notlar, şarkı ve renkleri seç." },
            { n: "4", t: "Sana özel link", d: "Web sitesi hazır olduğunda mailine düşer." },
            { n: "5", t: "Sevgiline gönder", d: "Linki paylaş, o an başlasın 💌" },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-2xl bg-white/70 backdrop-blur border border-rose-100 p-5 shadow-sm shadow-rose-200/30"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-600 text-white font-serif text-lg">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-rose-900">{s.t}</h3>
              <p className="mt-1 text-sm text-rose-950/70 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Preview */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-rose-500 mb-3">Nasıl görünecek?</p>
            <h2
              className="text-4xl md:text-5xl text-rose-700"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Küçük bir dijital anı kutusu
            </h2>
            <p className="mt-5 text-rose-950/70 leading-relaxed">
              Yumuşak pembe zemin, kalpçikler, polaroid fotoğraflar, kendi şarkınız ve
              en sonda ekrana yansıyan gizli mesajın… Sevdiğin kişinin telefonunda
              açıldığı an, ona özel olduğunu hissedeceği bir deneyim.
            </p>
            <Link
              to="/storyofus-new/demo"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-700 text-white px-6 py-3 font-medium hover:bg-rose-800 transition"
            >
              Canlı demoyu aç <Heart className="h-4 w-4 fill-white" />
            </Link>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] bg-white/80 backdrop-blur border border-rose-200 shadow-2xl shadow-rose-300/40 p-6 rotate-[-1.5deg]">
              <p
                className="text-3xl text-rose-700 text-center"
                style={{ fontFamily: '"Great Vibes", cursive' }}
              >
                Ada & Mert
              </p>
              <p className="text-center text-xs text-rose-950/60 mt-1">14.02.2024</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-md bg-gradient-to-br from-rose-200 to-pink-300 shadow-inner"
                    style={{ transform: `rotate(${(i - 1) * 3}deg)` }}
                  />
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-100 p-3 text-sm italic text-rose-900 text-center">
                "Bu, bizim küçük dijital anı kutumuz..."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <h2
          className="text-4xl md:text-5xl text-center text-rose-700 mb-4"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Ne özelleştirebilirsin?
        </h2>
        <p className="text-center text-rose-950/70 mb-12 max-w-xl mx-auto">
          Her detay sizin hikayenize göre şekillenir.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { i: Heart, t: "İsimler & tarih", d: "İki isim ve ilişkinizin başladığı özel tarih." },
            { i: PenLine, t: "Kişisel notlar", d: "Aşk mektubu, romantik giriş yazısı ve mini notlar." },
            { i: Camera, t: "3–5 fotoğraf", d: "Polaroid tarzında, altına açıklamalarla birlikte." },
            { i: Music, t: "Spotify şarkısı", d: "Sizin şarkınız, sitede bir buton ile çalsın." },
            { i: Palette, t: "Renk & font", d: "Kendi paletinizi ve yazı tipini seç." },
            { i: Sparkles, t: "Gizli sürpriz", d: "En sonda tıklanınca açılan özel bir mesaj." },
          ].map(({ i: Icon, t, d }) => (
            <div
              key={t}
              className="rounded-2xl bg-white/70 backdrop-blur border border-rose-100 p-5 hover:shadow-lg hover:shadow-rose-200/50 transition"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-rose-900">{t}</h3>
              <p className="mt-1 text-sm text-rose-950/70 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-20">
        <h2
          className="text-4xl md:text-5xl text-center text-rose-700 mb-10"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Sık sorulanlar
        </h2>
        <div className="space-y-3">
          {[
            {
              q: "Site ne zaman hazır oluyor?",
              a: "Setup formunu doldurduktan sonra genellikle 24 saat içinde web siten hazır ve link mailine düşer.",
            },
            {
              q: "Setup linki için önce ödeme yapmam mı gerekiyor?",
              a: "Evet. Shopier üzerinden ödeme onaylandıktan sonra sana özel setup linki e-posta ile gönderilir.",
            },
            {
              q: "Kaç fotoğraf yükleyebilirim?",
              a: "Minimum 3, maksimum 5 fotoğraf yükleyebilirsin. Yatay veya dikey fark etmez, polaroid stiliyle gösterilir.",
            },
            {
              q: "Mobilde iyi görünüyor mu?",
              a: "Site tamamen mobil öncelikli tasarlandı. Telefonda açıldığında sinemasal bir deneyim sunar.",
            },
            {
              q: "Link herkese açık mı olacak?",
              a: "Hayır. Her siteye tahmin edilemez, özel bir link üretilir. Sadece linki bilen görebilir; Google'da çıkmaz.",
            },
          ].map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl bg-white/80 backdrop-blur border border-rose-100 p-5"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-rose-900">
                {f.q}
                <span className="ml-4 text-rose-500 group-open:rotate-45 transition-transform text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-rose-950/70 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        id="pay"
        className="relative z-10 max-w-4xl mx-auto px-6 pb-24"
      >
        <div className="rounded-[2rem] bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 p-10 md:p-14 text-center text-white shadow-2xl shadow-rose-400/50 relative overflow-hidden">
          <Heart className="absolute -top-6 -left-6 h-32 w-32 text-white/10 fill-white/10" />
          <Heart className="absolute -bottom-8 -right-4 h-40 w-40 text-white/10 fill-white/10" />
          <p className="text-xs uppercase tracking-[0.4em] text-white/80">Hazır mısın?</p>
          <h2
            className="mt-4 text-4xl md:text-6xl leading-tight"
            style={{ fontFamily: '"Great Vibes", cursive' }}
          >
            Ona hayatının hediyesini ver
          </h2>
          <div className="mt-6 flex items-baseline justify-center gap-2">
            <span className="text-6xl font-bold">199</span>
            <span className="text-2xl">TL</span>
          </div>
          <a
            href="#"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-rose-700 px-8 py-4 text-base font-semibold shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Heart className="h-5 w-5 fill-rose-600 text-rose-600" /> Pay Now
          </a>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Güvenli ödeme</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Setup mail ile gelir</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 24 saatte teslim</span>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-8 text-center text-xs text-rose-950/60">
        leony.tech · StoryOfUs · ile ❤️ yapıldı
      </footer>
    </div>
  );
}

function FloatingHearts() {
  const hearts = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <style>{`
        @keyframes sou-rise {
          0% { transform: translateY(100vh) scale(0.6); opacity: 0; }
          10% { opacity: 0.6; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
      `}</style>
      {hearts.map((_, i) => {
        const left = (i * 7 + 5) % 100;
        const delay = (i * 1.3) % 12;
        const dur = 12 + ((i * 3) % 10);
        const size = 10 + ((i * 5) % 18);
        return (
          <Heart
            key={i}
            className="absolute text-rose-400/50 fill-rose-400/40"
            style={{
              left: `${left}%`,
              bottom: `-40px`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `sou-rise ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
