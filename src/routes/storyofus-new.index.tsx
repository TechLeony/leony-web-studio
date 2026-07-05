import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Camera, Music, PenLine, Palette, Sparkles, Mail, Lock, Clock } from "lucide-react";

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
        <Link to="/" className="inline-flex items-center">
          <img
            src="/logos/leony-logo-ask-sitesi.png"
            alt="Leony"
            className="h-8 w-auto object-contain sm:h-10"
          />
        </Link>
        <a
          href="#pay"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-rose-300/50 hover:bg-rose-700 transition"
        >
          <Heart className="h-4 w-4 fill-white" /> 199 TL — Sürprize Başla
        </a>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-10 pb-20 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-rose-500 mb-6">
          Sevgiline özel unutulmaz bir dijital sürpriz
        </p>
        <h1
          className="text-5xl md:text-7xl leading-tight text-rose-700"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Aşkınızı sıradan bir hediyeye değil, <br /> size özel bir web sitesine dönüştürün.
        </h1>
        <p className="mt-6 text-base md:text-lg text-rose-950/70 max-w-2xl mx-auto leading-relaxed">
          Fotoğraflarınız, anılarınız ve hikayeniz tek bir romantik linkte birleşsin. 💖
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
            <Heart className="h-5 w-5 fill-white" /> Sürprize Başla 💌
          </a>
          <Link
            to="/storyofus-new/demo"
            className="mt-2 text-sm text-rose-700 underline underline-offset-4 decoration-rose-300 hover:text-rose-900"
          >
            Demoyu Gör →
          </Link>
        </div>
      </section>

      {/* Flow */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <h2
          className="text-4xl md:text-5xl text-center text-rose-700 mb-12"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Nasıl çalışıyoruz?
        </h2>
        <ol className="grid md:grid-cols-5 gap-4">
          {[
            { n: "1", t: "Ödemeni yap", d: "Shopier üzerinden güvenle ödemeni tamamla." },
            { n: "2", t: "Hediyeni kişiselleştir", d: "Ödemeni tamamladıktan sonra mailine gelen özel linkten hediyeni kişiselleştirmeye başla." },
            { n: "3", t: "Bilgilerini gir", d: "Fotoğraflar, notlar, şarkı ve renkleri seç." },
            { n: "4", t: "Sana özel link", d: "Web siten hazır olduğunda özel linkin mailine gelsin." },
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
      <section className="relative z-10 bg-[#fff0f4]/70 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-4xl text-rose-700 md:text-5xl"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Örnek hediye sitesi önizlemesi
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-rose-950/70 sm:text-base">
              Sevgilin linke tıkladığında fotoğraflarınız, anılarınız ve hikayeniz romantik bir deneyime dönüşür.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-2xl shadow-rose-300/25 backdrop-blur md:rounded-[2.5rem] md:p-8">
            <Heart className="absolute -left-4 top-8 h-20 w-20 fill-rose-200/25 text-rose-300/30" />
            <Sparkles className="absolute right-8 top-8 h-5 w-5 text-rose-400/40" />
            <Heart className="absolute -bottom-5 right-10 h-24 w-24 fill-pink-200/25 text-pink-300/30" />

            <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-500">
                  Link açıldığı an
                </p>
                <h3
                  className="mt-4 text-4xl leading-tight text-rose-700 sm:text-5xl"
                  style={{ fontFamily: '"Great Vibes", cursive' }}
                >
                  Sadece ikinize ait romantik bir dünya
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-rose-950/70 sm:text-base">
                  İlk bakışta isimleriniz, özel tarihiniz ve anılarınız görünür. Devamında fotoğraflar, zaman çizelgesi, aşk mektubu ve şarkınız aynı duygusal akışta birleşir.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Fotoğraflar", "Zaman çizelgesi", "Aşk mektubu", "Özel şarkı"].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-xs font-medium text-rose-700 shadow-sm shadow-rose-200/30"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <Link
                  to="/storyofus-new/demo"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-rose-700 px-6 py-3 font-medium text-white shadow-lg shadow-rose-300/40 transition hover:bg-rose-800 hover:shadow-rose-400/50"
                >
                  Örnek Hediyeyi İncele 💌 <Heart className="h-4 w-4 fill-white" />
                </Link>
              </div>

              <div className="mx-auto w-full max-w-sm">
                <div className="relative rounded-[2.25rem] border border-rose-100 bg-rose-950/90 p-2 shadow-2xl shadow-rose-400/30">
                  <div className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(180deg,#fff7fa_0%,#ffe4ed_54%,#ffd6e5_100%)]">
                    <div className="relative px-5 pb-5 pt-8 text-center">
                      <Heart className="absolute left-5 top-7 h-4 w-4 fill-rose-300/60 text-rose-400/70" />
                      <Sparkles className="absolute right-6 top-10 h-4 w-4 text-rose-400/60" />
                      <Heart className="absolute right-11 top-24 h-3 w-3 fill-pink-300/60 text-pink-400/70" />

                      <p
                        className="text-4xl leading-none text-rose-700"
                        style={{ fontFamily: '"Great Vibes", cursive' }}
                      >
                        Ada & Mert
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-rose-950/55">
                        14.02.2024’den beri
                      </p>

                      <div className="mt-7 grid gap-3">
                        {[
                          {
                            title: "Anılarımız",
                            caption: "Fotoğraflarınız",
                            bg: "from-rose-200 via-pink-100 to-amber-100",
                          },
                          {
                            title: "Bizim Yolculuğumuz",
                            caption: "Özel tarihleriniz",
                            bg: "from-fuchsia-200 via-rose-100 to-pink-200",
                          },
                          {
                            title: "Kalbimden Sana",
                            caption: "Aşk mektubunuz",
                            bg: "from-pink-200 via-white to-rose-200",
                          },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.bg} p-4 text-left shadow-sm shadow-rose-200/50`}
                          >
                            <div className="absolute -right-4 -top-5 h-16 w-16 rounded-full bg-white/30 blur-sm" />
                            <div className="absolute bottom-3 right-4 h-10 w-10 rounded-xl bg-white/25" />
                            <p className="relative text-sm font-semibold text-rose-950">
                              {item.title}
                            </p>
                            <p className="relative mt-1 text-xs text-rose-950/65">
                              {item.caption}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/70 bg-white/55 p-4 text-center shadow-sm">
                        <p className="text-xs uppercase tracking-[0.24em] text-rose-500">
                          Bizim şarkımız
                        </p>
                        <p className="mt-2 text-sm font-semibold text-rose-900">
                          Seninle her şey güzel
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
          Size özel aşk sitesi 💌
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
        className="relative z-10 bg-[#ffdce7]/60 px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-fuchsia-500 via-pink-600 to-rose-600 px-5 py-10 text-center text-white shadow-2xl shadow-pink-500/35 sm:rounded-[3rem] sm:px-10 sm:py-14 md:px-16 md:py-16">
          <Heart className="absolute -left-8 -top-8 h-36 w-36 text-white/15 drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:h-44 sm:w-44" strokeWidth={1.2} />
          <Heart className="absolute -bottom-10 -right-8 h-40 w-40 text-white/15 drop-shadow-[0_0_32px_rgba(255,255,255,0.45)] sm:h-52 sm:w-52" strokeWidth={1.2} />
          <Sparkles className="absolute left-[16%] top-12 h-4 w-4 text-white/40" />
          <Heart className="absolute right-[18%] top-16 h-3.5 w-3.5 fill-white/20 text-white/40" />
          <Sparkles className="absolute bottom-20 left-[22%] h-3.5 w-3.5 text-white/35" />
          <Heart className="absolute bottom-24 right-[24%] h-3 w-3 fill-white/20 text-white/35" />

          <div className="relative z-10">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white shadow-sm backdrop-blur">
              <Heart className="h-3.5 w-3.5 fill-white/60 text-white" />
              HAZIR MISIN?
              <Heart className="h-3.5 w-3.5 fill-white/60 text-white" />
            </div>

            <h2
              className="mx-auto mt-6 max-w-3xl text-5xl leading-[0.95] text-white drop-shadow-sm sm:text-6xl md:text-7xl"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Ona hiç unutamayacağı <br /> bir hediye vermek
            </h2>

            <div className="mx-auto mt-5 flex w-28 items-center justify-center gap-2 text-white/80">
              <span className="h-px flex-1 bg-white/45" />
              <Heart className="h-4 w-4 fill-white/60 text-white/80" />
              <span className="h-px flex-1 bg-white/45" />
            </div>

            <p className="mt-6 text-sm font-medium text-pink-50 sm:text-base">
              şu an sadece ve sadece
            </p>

            <div className="relative mx-auto mt-3 flex w-fit items-end justify-center gap-3 px-8">
              <div className="absolute -left-5 top-3 -rotate-12 text-xl font-semibold text-white/75 sm:-left-10 sm:text-2xl">
                <span className="relative inline-block">
                  399 TL
                  <span className="absolute left-[-8%] top-1/2 h-0.5 w-[116%] -translate-y-1/2 rotate-[-8deg] rounded-full bg-white/90" />
                </span>
              </div>
              <Sparkles className="absolute -right-2 top-5 h-5 w-5 text-white/55" />
              <span className="text-7xl font-black leading-none tracking-normal text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.35)] sm:text-8xl md:text-9xl">
                199
              </span>
              <span className="mb-2 text-3xl font-extrabold text-white sm:mb-3 sm:text-4xl">
                TL
              </span>
            </div>

            <a
              href="#"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-fuchsia-600 shadow-xl shadow-rose-900/15 transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-rose-900/25 sm:px-10"
            >
              <Heart className="h-5 w-5 fill-fuchsia-600 text-fuchsia-600" /> Sürprizi Başlat
            </a>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:gap-0">
              <span className="inline-flex items-center gap-2 px-4">
                <Lock className="h-4 w-4" strokeWidth={1.8} /> Güvenli ödeme
              </span>
              <span className="hidden h-5 w-px bg-white/30 sm:block" />
              <span className="inline-flex items-center gap-2 px-4">
                <Mail className="h-4 w-4" strokeWidth={1.8} /> Kişiselleştirme linki mailine gelir
              </span>
              <span className="hidden h-5 w-px bg-white/30 sm:block" />
              <span className="inline-flex items-center gap-2 px-4">
                <Clock className="h-4 w-4" strokeWidth={1.8} /> 24 saatte teslim
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex items-center justify-center gap-1.5 py-8 text-center text-xs text-rose-950/60">
        <img
          src="/logos/favicon-ask-site.png"
          alt=""
          aria-hidden="true"
          className="h-4 w-4 object-contain opacity-75"
        />
        <span>
          made by{" "}
          <a
            href="https://leony.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-rose-700 hover:underline"
          >
            leony.tech
          </a>
        </span>
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
