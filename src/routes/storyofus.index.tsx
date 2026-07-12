import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Camera, Music, PenLine, Palette, Sparkles, Mail, Lock, Clock } from "lucide-react";
import { GlobalPending } from "@/components/leony/GlobalPending";
import { storyOfUsDemoCtaConfig } from "../lib/storyofus/demoCtaConfig";

export const Route = createFileRoute("/storyofus/")({
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

const PINK_BG = "bg-[linear-gradient(180deg,#fff5f7_0%,#ffe4ec_45%,#ffd1de_100%)]";
const STORYOFUS_LOADING_DURATION_MS = 2000;

function StoryOfUsLanding() {
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  async function navigateDemo() {
    if (demoLoading) return;
    setDemoLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, STORYOFUS_LOADING_DURATION_MS));
    navigate({ to: storyOfUsDemoCtaConfig.demoPath });
  }

  return (
    <div className={`min-h-screen ${PINK_BG} text-rose-950`}>
      {demoLoading && <GlobalPending />}
      <FloatingHearts />
      <PromoMarqueeBar />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <Link to="/" className="inline-flex items-center">
          <img
            src="/logos/leony-logo-ask-sitesi.png"
            alt="Leony"
            className="h-10 w-auto object-contain sm:h-18"
          />
        </Link>
        <a
          href={storyOfUsDemoCtaConfig.checkoutPath}
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-rose-300/50 hover:bg-rose-700 transition"
        >
          <Heart className="h-4 w-4 fill-white" /> {storyOfUsDemoCtaConfig.primaryCtaLabel}
        </a>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 pt-8 text-center sm:px-6 sm:pb-20 sm:pt-10">
        <p className="mb-5 text-xs uppercase tracking-[0.28em] text-rose-500 sm:mb-6 sm:tracking-[0.4em]">
          Aşkınıza özel unutulmaz bir dijital sürpriz
        </p>
        <h1
          className="text-[2.65rem] leading-[1.02] text-rose-700 sm:text-5xl sm:leading-tight md:text-7xl"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Aşkınızı sıradan bir hediyeye değil, <br /> size özel bir ömür kalacak dijital hediyeye
          dönüştürün
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-rose-950/70 sm:mt-6 sm:text-base md:text-lg">
          Fotoğraflarınızı, anılarınızı ve daha fazlasını tek bir romantik linkte birleştirmek şu an
          çok daha kolay 💖
        </p>
        <div className="mt-8 inline-flex w-full flex-col items-center gap-3 sm:mt-10 sm:w-auto">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="inline-flex flex-col items-center rounded-full bg-rose-100 px-4 py-2 text-center shadow-sm shadow-rose-200/50">
              <span className="text-xs font-semibold tracking-wide text-rose-700">
                Lansmana özel %50 indirimli fiyat
              </span>
              {/* <span className="text-[16px] font-bold uppercase tracking-[0.18em] text-rose-600">
                Kaçırmayın!!!
              </span> */}
            </div>

            <div className="flex items-end justify-center gap-3">
              <span className="-rotate-6 pb-2 text-xl font-semibold text-rose-400 line-through decoration-rose-500 decoration-2 sm:text-2xl">
                399 TL
              </span>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold leading-none text-rose-700 sm:text-6xl">
                  199
                </span>
                <span className="text-lg font-medium text-rose-700">TL</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-rose-950/60">Tek seferlik ödeme · Süresiz link</p>

          <a
            href={storyOfUsDemoCtaConfig.checkoutPath}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-400/40 transition-all hover:scale-[1.02] hover:shadow-rose-500/60 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
          >
            <Heart className="h-5 w-5 fill-white" /> {storyOfUsDemoCtaConfig.primaryCtaLabel} 💌
          </a>

          <button
            type="button"
            onClick={navigateDemo}
            disabled={demoLoading}
            className="mt-2 text-sm text-rose-700 underline underline-offset-4 decoration-rose-300 hover:text-rose-900 disabled:pointer-events-none disabled:opacity-60"
          >
            Örnek hediyeyi görmek için tıklayın →
          </button>
          <a
            href={storyOfUsDemoCtaConfig.trackOrderPath}
            className="text-xs font-semibold text-rose-600 underline underline-offset-4 decoration-rose-300 hover:text-rose-800"
          >
            Sipariş takip
          </a>
        </div>
      </section>

      {/* Flow */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2
          className="mb-9 text-center text-3xl text-rose-700 sm:mb-12 sm:text-4xl md:text-5xl"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Nasıl çalışıyoruz?
        </h2>
        <ol className="grid md:grid-cols-5 gap-4">
          {[
            { n: "1", t: "Ödemeni yap", d: "Shopier üzerinden güvenle ödemeni tamamla." },
            {
              n: "2",
              t: "Hediyeni kişiselleştir",
              d: "Ödemeni tamamladıktan sonra mailine gelen özel linkten hediyeni kişiselleştirmeye başla.",
            },
            { n: "3", t: "Bilgilerini gir", d: "Fotoğraflar, notlar, şarkı, renkleri vb. seç." },
            {
              n: "4",
              t: "Sana özel linki al",
              d: "Web siten hazır olduğunda özel linkin mailine gelsin.",
            },
            { n: "5", t: "Sevgiline gönder", d: "Linki paylaş, o unutulmaz an başlasın 💌" },
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
              className="text-3xl text-rose-700 sm:text-4xl md:text-5xl"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Örnek hediye sitesi önizlemesi
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-rose-950/70 sm:text-base">
              Sevgilin linke tıkladığında hiç bir zaman unutamayacağı bir sürpriz şokuna kapılsın :)
            </p>
          </div>

          <div className="relative mt-8 overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/65 p-4 shadow-2xl shadow-rose-300/25 backdrop-blur sm:mt-10 sm:rounded-[2rem] sm:p-5 md:rounded-[2.5rem] md:p-8">
            <Heart className="absolute -left-4 top-8 h-20 w-20 fill-rose-200/25 text-rose-300/30" />
            <Sparkles className="absolute right-8 top-8 h-5 w-5 text-rose-400/40" />
            <Heart className="absolute -bottom-5 right-10 h-24 w-24 fill-pink-200/25 text-pink-300/30" />

            <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div>
                {/* <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-500">
                  Link açıldığı an
                </p> */}
                <h3
                  className="mt-4 text-3xl leading-tight text-rose-700 sm:text-5xl"
                  style={{ fontFamily: '"Great Vibes", cursive' }}
                >
                  Sadece ikinize ait romantik bir dünya
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-rose-950/70 sm:text-base">
                  {/* İlk bakışta isimleriniz, özel tarihiniz ve anılarınız görünür. Devamında
                  fotoğraflar, zaman çizelgesi, aşk mektubu ve şarkınız aynı duygusal akışta
                  birleşir. */}
                  Anılarınızla başlayıp, gittikce daha eğlenceli bir oyuna dönüşen unutulmaz bir
                  hediye
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    "Fotoğraflar",
                    "Zaman çizelgesi",
                    "Aşk mektubu",
                    "Tanışma hikayeniz",
                    "Open when letters",
                    "Minik bir ses notunuz",
                    "Ödülle dolu eğlenceli oyunlar",
                    "Özel şarkınız",
                    "Puzzle tamamlama",
                  ].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-xs font-medium text-rose-700 shadow-sm shadow-rose-200/30"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={navigateDemo}
                  disabled={demoLoading}
                  className="mt-7 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-rose-700 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-rose-300/40 transition hover:bg-rose-800 hover:shadow-rose-400/50 disabled:pointer-events-none disabled:opacity-70 sm:w-auto sm:text-base"
                >
                  Örnek Hediyeyi İncele 💌 <Heart className="h-4 w-4 fill-white" />
                </button>
              </div>

              <div className="mx-auto w-full max-w-[20rem] sm:max-w-sm">
                <div className="relative rounded-[2rem] border border-rose-100 bg-rose-950/90 p-2 shadow-2xl shadow-rose-400/30 sm:rounded-[2.25rem]">
                  <div className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(180deg,#fff7fa_0%,#ffe4ed_54%,#ffd6e5_100%)]">
                    <div className="relative px-5 pb-5 pt-8 text-center">
                      <Heart className="absolute left-5 top-7 h-4 w-4 fill-rose-300/60 text-rose-400/70" />
                      <Sparkles className="absolute right-6 top-10 h-4 w-4 text-rose-400/60" />
                      <Heart className="absolute right-11 top-24 h-3 w-3 fill-pink-300/60 text-pink-400/70" />

                      <p
                        className="text-3xl leading-none text-rose-700 sm:text-4xl"
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
                            title: "Bizim Hİkayemiz",
                            caption: "Özel tarihleriniz",
                            bg: "from-fuchsia-200 via-rose-100 to-pink-200",
                          },
                          {
                            title: "Kalbimden Sana",
                            caption: "Aşk mektubunuz",
                            bg: "from-pink-200 via-white to-rose-200",
                          },
                          {
                            title: "Sana özel ses notum",
                            caption: "Aşk notunuz",
                            bg: "from-pink-200 via-white to-rose-200",
                          },
                          {
                            title: "Hadi biraz eğlenelim",
                            caption: "Eğlenceli oyun kısmı",
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
                            <p className="relative mt-1 text-xs text-rose-950/65">{item.caption}</p>
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
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2
          className="mb-4 text-center text-3xl text-rose-700 sm:text-4xl md:text-5xl"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Size özel aşk sitesi 💌
        </h2>
        <p className="text-center text-rose-950/70 mb-12 max-w-xl mx-auto">
          Her detay sizin hikayenize göre şekillenir.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              i: Sparkles,
              t: "Size özel seçeceğiniz website açılış şifresi",
              d: "Sevgiliniz şifreyi girdiğinde hediyesi açılacak...",
            },
            {
              i: Heart,
              t: "İsimler & tarih",
              d: "İsimleriniz ve ilişkinizin başladığı özel tarih.",
            },
            {
              i: PenLine,
              t: "Kişisel notlar",
              d: "Aşk mektubu, romantik giriş yazısı, open when letters ve mini notlar.",
            },
            { i: Music, t: "Ses notunuz", d: "Sevgilinize özel kaydetdiğiniz minik ses notunuz" },
            {
              i: Camera,
              t: "Fotoğraflarınız",
              d: "Seçeceğiniz tarzda, özel açıklamalarla",
            },
            { i: Music, t: "Spotify şarkısı", d: "Sizin şarkınız, sitede bir buton ile çalsın." },
            { i: Sparkles, t: "Eğlence oyunları", d: "Birlikte eğlenip minik ödüller kazanın" },
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
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2
          className="mb-8 text-center text-3xl text-rose-700 sm:mb-10 sm:text-4xl md:text-5xl"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Sık sorulanlar
        </h2>
        <div className="space-y-3">
          {[
            {
              q: "Site ne zaman hazır oluyor?",
              a: "Kişiselleştirme formunu doldurduktan sonra gün içerisinde, en geç 24 saat içinde web siten hazır olur ve mailine gönderilir.",
            },
            {
              q: "Kişiselleştirme linki için önce ödemeyi mi yapmam gerekiyor?",
              a: "Evet. Shopier üzerinden ödeme onaylandıktan sonra sana özel setup linki e-posta ile gönderilir.",
            },
            {
              q: "Mobilde iyi görünüyor mu?",
              a: "Site tamamen mobil öncelikli tasarlandı. Telefonda açıldığında sinemasal bir deneyim sunar.",
            },
            {
              q: "Link herkese açık mı olacak?",
              a: "Hayır. Kişiye özel link üretilir ve siteye giriş kodu eklenir. (Giriş kodu müşteri tarafından seçilir)",
            },
            {
              q: "Kişisel verilerimiz korunuyor, mu sayfa korunaklı mı?",
              a: "Evet, tüm verileriniz tam korunmaktadır, sayfaya sizden başka dışarıdan kimse erişemez.",
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
      <section id="pay" className="relative z-10 bg-[#ffdce7]/60 px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-fuchsia-500 via-pink-600 to-rose-600 px-4 py-9 text-center text-white shadow-2xl shadow-pink-500/35 sm:rounded-[3rem] sm:px-10 sm:py-14 md:px-16 md:py-16">
          <Heart
            className="absolute -left-8 -top-8 h-36 w-36 text-white/15 drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:h-44 sm:w-44"
            strokeWidth={1.2}
          />
          <Heart
            className="absolute -bottom-10 -right-8 h-40 w-40 text-white/15 drop-shadow-[0_0_32px_rgba(255,255,255,0.45)] sm:h-52 sm:w-52"
            strokeWidth={1.2}
          />
          <Sparkles className="absolute left-[16%] top-12 h-4 w-4 text-white/40" />
          <Heart className="absolute right-[18%] top-16 h-3.5 w-3.5 fill-white/20 text-white/40" />
          <Sparkles className="absolute bottom-20 left-[22%] h-3.5 w-3.5 text-white/35" />
          <Heart className="absolute bottom-24 right-[24%] h-3 w-3 fill-white/20 text-white/35" />

          <div className="relative z-10">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-sm backdrop-blur sm:px-4 sm:text-[11px] sm:tracking-[0.32em]">
              <Heart className="h-3.5 w-3.5 fill-white/60 text-white" />
              HAZIR MISIN?
              <Heart className="h-3.5 w-3.5 fill-white/60 text-white" />
            </div>

            <h2
              className="mx-auto mt-6 max-w-3xl text-[2.7rem] leading-[0.95] text-white drop-shadow-sm sm:text-6xl md:text-7xl"
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

            <div className="relative mx-auto mt-4 flex w-fit items-end justify-center gap-2 px-5 sm:mt-3 sm:gap-3 sm:px-8">
              <div className="absolute -left-1 -top-4 -rotate-12 text-sm font-semibold text-white/75 sm:-left-10 sm:top-3 sm:text-2xl">
                <span className="relative inline-block">
                  399 TL
                  <span className="absolute left-[-8%] top-1/2 h-0.5 w-[116%] -translate-y-1/2 rotate-[-8deg] rounded-full bg-white/90" />
                </span>
              </div>
              <Sparkles className="absolute -right-2 top-5 h-5 w-5 text-white/55" />
              <span className="text-6xl font-black leading-none tracking-normal text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.35)] sm:text-8xl md:text-9xl">
                199
              </span>
              <span className="mb-1 text-2xl font-extrabold text-white sm:mb-3 sm:text-4xl">
                TL
              </span>
            </div>

            <a
              href={storyOfUsDemoCtaConfig.checkoutPath}
              className="mt-8 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-fuchsia-600 shadow-xl shadow-rose-900/15 transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-rose-900/25 sm:w-auto sm:px-10 sm:py-4 sm:text-base"
            >
              <Heart className="h-5 w-5 fill-fuchsia-600 text-fuchsia-600" />{" "}
              {storyOfUsDemoCtaConfig.primaryCtaLabel}
            </a>
            <a
              href={storyOfUsDemoCtaConfig.trackOrderPath}
              className="mt-4 inline-flex text-sm font-semibold text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white"
            >
              Sipariş takip
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
                <Clock className="h-4 w-4" strokeWidth={1.8} /> Aynı gün teslim
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

function PromoMarqueeBar() {
  const messages = [
    "💌 Lansmana özel: İlk 50 siparişe %50 indirim",
    "399 TL yerine sadece 199 TL",
    "Tek seferlik ödeme · Süresiz link",
    "Fotoğraflarınız, anılarınız ve şarkınız tek bir romantik linkte",
    "Kaçmaz İNDİRİM yalnızca lansman dönemi için geçerlidir ✨",
  ];

  return (
    <div className="relative z-20 h-10 w-full overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 text-white shadow-sm shadow-rose-300/30">
      <style>{`
        @keyframes sou-promo-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-rose-600 to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-rose-600 to-transparent sm:w-20" />
      <div className="flex h-full w-max items-center whitespace-nowrap will-change-transform [animation:sou-promo-marquee_26s_linear_infinite]">
        {[0, 1].map((setIndex) => (
          <div key={setIndex} className="flex h-full shrink-0 items-center">
            {messages.map((message) => (
              <span
                key={`${setIndex}-${message}`}
                className="inline-flex items-center px-5 text-xs font-semibold tracking-[0.015em] text-white/95 sm:px-7 sm:text-sm"
              >
                {message}
              </span>
            ))}
          </div>
        ))}
      </div>
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
