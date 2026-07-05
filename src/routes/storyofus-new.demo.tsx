import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Music, Play, Pause, Gift, Sparkles } from "lucide-react";

export const Route = createFileRoute("/storyofus-new/demo")({
  head: () => ({
    meta: [
      { title: "Ada & Mert — Bizim Hikayemiz | StoryOfUs" },
      { name: "description", content: "Ada & Mert için hazırlanmış özel bir StoryOfUs demo sayfası." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StoryDemo,
});

// Demo data — placeholder for a reusable product
const DATA = {
  name1: "Ada",
  name2: "Mert",
  startDate: "2024-02-14",
  intro: "Bu, bizim küçük dijital anı kutumuz...",
  loveLetter:
    "Seninle tanıştığım günden beri hayatım daha renkli, kalbim daha hafif.\nBazı geceler seni düşünürken gülüyorum, bazı sabahlar sesini duymadan başlayamıyorum.\nSen benim en güzel tesadüfüm, en özenli seçimim, en sevdiğim insansın. Sonsuza dek seninle.",
  finalMessage: "Seni her sabah yeniden seviyorum. 💌",
  song: "Bizim Şarkımız",
  photos: [
    { c: "İlk fotoğrafımız", grad: "from-rose-300 to-pink-400" },
    { c: "O tatilde…", grad: "from-pink-300 to-fuchsia-400" },
    { c: "Kahvenin yanında", grad: "from-amber-200 to-rose-300" },
    { c: "Gülüşün", grad: "from-rose-200 to-red-300" },
    { c: "Bir akşam", grad: "from-purple-300 to-pink-400" },
  ],
  timeline: [
    { d: "14.02.2024", t: "İlk tanışma", desc: "Kalabalık bir kafede, sen bana gülümsedin." },
    { d: "03.05.2024", t: "İlk buluşma", desc: "Sahil kenarında yürüdük, saatler dakika gibi geçti." },
    { d: "21.09.2024", t: "İlk 'seni seviyorum'", desc: "Yağmur başladı, ikimiz de duyduk ama susmadık." },
  ],
  reasons: [
    "Gülüşün",
    "Kahveyi hazırlama şeklin",
    "Sabırlı oluşun",
    "Beni dinlerken bakışların",
    "Küçük şeylere sevinmen",
    "Elini tuttuğumdaki huzur",
    "Bana kendim gibi hissettirmen",
  ],
};

function daysBetween(iso: string) {
  const start = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

function StoryDemo() {
  const [entered, setEntered] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const days = useMemo(() => daysBetween(DATA.startDate), []);
  const lovePct = Math.min(100, 60 + (days % 40));

  useEffect(() => {
    if (!entered) return;
    // create a silent audio tag to allow toggle UI without actual file
    audioRef.current = new Audio();
  }, [entered]);

  const toggleMusic = () => setPlaying((p) => !p);

  if (!entered) {
    return <IntroGate onEnter={() => setEntered(true)} />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff5f7_0%,#ffe4ec_50%,#ffd1de_100%)] text-rose-950 relative overflow-hidden">
      <Confetti />

      {/* Floating music button */}
      <button
        onClick={toggleMusic}
        aria-label={playing ? "Şarkıyı durdur" : "Şarkıyı çal"}
        className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-400/50 hover:scale-105 transition"
      >
        {playing ? <Pause className="h-6 w-6" /> : <Music className="h-6 w-6" />}
      </button>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-rose-500">Bizim Hikayemiz</p>
        <h1
          className="mt-4 text-6xl md:text-8xl leading-tight text-rose-700"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          {DATA.name1} <span className="text-rose-500">&</span> {DATA.name2}
        </h1>
        <p className="mt-3 text-sm text-rose-950/60">
          {new Date(DATA.startDate).toLocaleDateString("tr-TR")}
        </p>
        <p className="mt-6 max-w-xl mx-auto italic text-rose-950/80">"{DATA.intro}"</p>
      </section>

      {/* Counter + love % */}
      <section className="max-w-3xl mx-auto px-6 pb-16 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-rose-100 p-6 text-center shadow">
          <p className="text-xs uppercase tracking-widest text-rose-500">Birlikte</p>
          <p className="mt-2 text-4xl font-bold text-rose-700">{days} gün</p>
          <p className="mt-1 text-xs text-rose-950/60">ve saymaya devam…</p>
        </div>
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-rose-100 p-6 shadow">
          <p className="text-xs uppercase tracking-widest text-rose-500 text-center">Aşk metremiz</p>
          <div className="mt-4 h-3 rounded-full bg-rose-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-full transition-all"
              style={{ width: `${lovePct}%` }}
            />
          </div>
          <p className="mt-3 text-center text-2xl font-bold text-rose-700">%{lovePct}</p>
        </div>
      </section>

      {/* Photos */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2
          className="text-4xl md:text-5xl text-center text-rose-700 mb-10"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Anılarımız
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {DATA.photos.map((p, i) => (
            <figure
              key={i}
              className="bg-white p-3 pb-4 shadow-xl shadow-rose-300/30 rounded-sm"
              style={{ transform: `rotate(${((i % 5) - 2) * 3}deg)` }}
            >
              <div
                className={`h-40 w-32 sm:h-52 sm:w-40 bg-gradient-to-br ${p.grad} rounded-sm`}
              />
              <figcaption
                className="mt-2 text-center text-sm text-rose-900"
                style={{ fontFamily: '"Great Vibes", cursive', fontSize: "1.25rem" }}
              >
                {p.c}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2
          className="text-4xl md:text-5xl text-center text-rose-700 mb-10"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Zaman çizelgemiz
        </h2>
        <ol className="relative border-l-2 border-dashed border-rose-300 pl-6 space-y-8">
          {DATA.timeline.map((e) => (
            <li key={e.d} className="relative">
              <span className="absolute -left-[34px] top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white">
                <Heart className="h-3 w-3 fill-white" />
              </span>
              <p className="text-xs uppercase tracking-widest text-rose-500">{e.d}</p>
              <h3 className="mt-1 text-lg font-semibold text-rose-900">{e.t}</h3>
              <p className="mt-1 text-sm text-rose-950/70">{e.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Reasons */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2
          className="text-4xl md:text-5xl text-center text-rose-700 mb-10"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Seni seviyorum çünkü…
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DATA.reasons.map((r, i) => (
            <div
              key={r}
              className="rounded-2xl bg-white/80 backdrop-blur border border-rose-100 px-4 py-3 shadow-sm flex items-center gap-3"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 text-rose-600 text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-sm text-rose-950">{r}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Love letter */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="relative rounded-3xl bg-[linear-gradient(180deg,#fffafc,#fff1f5)] border border-rose-200 p-8 md:p-10 shadow-xl shadow-rose-200/40">
          <Heart className="absolute -top-4 left-6 h-8 w-8 text-rose-500 fill-rose-500" />
          <p className="text-xs uppercase tracking-[0.4em] text-rose-500">Aşk mektubum</p>
          <p
            className="mt-4 text-lg md:text-xl text-rose-900 leading-relaxed whitespace-pre-line"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: "italic" }}
          >
            {DATA.loveLetter}
          </p>
          <p
            className="mt-6 text-right text-2xl text-rose-700"
            style={{ fontFamily: '"Great Vibes", cursive' }}
          >
            — {DATA.name2}
          </p>
        </div>
      </section>

      {/* Song */}
      <section className="max-w-xl mx-auto px-6 pb-16">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-rose-100 p-5 flex items-center gap-4 shadow">
          <button
            onClick={toggleMusic}
            className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <div className="flex-1">
            <p className="text-xs text-rose-500 uppercase tracking-widest">Bizim şarkımız</p>
            <p className="font-medium text-rose-900">{DATA.song}</p>
          </div>
          <Music className="h-5 w-5 text-rose-400" />
        </div>
      </section>

      {/* Gift / final surprise */}
      <section className="max-w-xl mx-auto px-6 pb-24 text-center">
        {!showFinal ? (
          <button
            onClick={() => setShowFinal(true)}
            className="group inline-flex flex-col items-center gap-4"
          >
            <span className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-400/60 group-hover:scale-110 transition-transform">
              <Gift className="h-10 w-10" />
            </span>
            <span className="text-rose-700 font-medium">Bir sürprizim var, tıkla 💝</span>
          </button>
        ) : (
          <div className="relative rounded-3xl bg-gradient-to-br from-rose-600 to-pink-700 text-white p-10 shadow-2xl shadow-rose-500/50 animate-in fade-in zoom-in duration-700">
            <Sparkles className="absolute top-4 right-4 h-6 w-6 text-white/70" />
            <p className="text-xs uppercase tracking-[0.4em] text-white/80">Gizli mesaj</p>
            <p
              className="mt-6 text-3xl md:text-4xl leading-relaxed"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              {DATA.finalMessage}
            </p>
            <p className="mt-6 text-sm text-white/80">Sonsuza dek, {DATA.name2}</p>
          </div>
        )}
      </section>

      <footer className="pb-10 text-center text-[11px] text-rose-950/50">
        leony.tech · StoryOfUs
      </footer>
    </div>
  );
}

function IntroGate({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center bg-[linear-gradient(180deg,#fff5f7_0%,#ffd1de_100%)] px-6 relative overflow-hidden">
      <Confetti />
      <div className="relative text-center animate-in fade-in duration-1000">
        <h1
          className="text-4xl md:text-6xl text-rose-700"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          {DATA.name1}, sana bir şey hazırladım… <Heart className="inline h-8 w-8 md:h-10 md:w-10 fill-rose-600 text-rose-600" />
        </h1>
        <button
          onClick={onEnter}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-4 text-white font-medium shadow-xl shadow-rose-400/50 hover:scale-105 transition-transform"
        >
          <Heart className="h-5 w-5 fill-white" /> Click to our journey
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const items = Array.from({ length: 20 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes sou-float2 {
          0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          10% { opacity: .7; }
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {items.map((_, i) => {
        const left = (i * 5 + 3) % 100;
        const delay = (i * 0.9) % 15;
        const dur = 14 + ((i * 2) % 12);
        const size = 8 + ((i * 3) % 14);
        return (
          <Heart
            key={i}
            className="absolute text-rose-400/60 fill-rose-400/50"
            style={{
              left: `${left}%`,
              bottom: `-40px`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `sou-float2 ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
