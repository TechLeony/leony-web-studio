import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Gift,
  Heart,
  Image as ImageIcon,
  Music2,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import type {
  StoryOfUsFinalSiteData,
  StoryOfUsFinalSiteMedia,
} from "@/lib/storyofus/finalSite.server";

const themeStyle = {
  "--sou-primary": "#e11d48",
  "--sou-secondary": "#db2777",
  "--sou-accent": "#f472b6",
  "--sou-bg": "#fff5f7",
  "--sou-bg-end": "#ffd1de",
  "--sou-text": "#4c0519",
  "--sou-muted": "rgba(76, 5, 25, 0.65)",
  "--sou-card": "rgba(255, 255, 255, 0.78)",
  "--sou-font-heading": '"Great Vibes", cursive',
  "--sou-font-body": "Inter, ui-sans-serif, system-ui, sans-serif",
  "--sou-font-accent": '"Playfair Display", Georgia, serif',
} as CSSProperties;

export function StoryOfUsFinalSiteRenderer({
  site,
  previewNotice,
}: {
  site: StoryOfUsFinalSiteData;
  previewNotice?: string;
}) {
  const [openLetterIndex, setOpenLetterIndex] = useState<number | null>(null);
  const [showFinalNote, setShowFinalNote] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const loveLetter = site.letters.find((letter) => letter.type === "love_letter");
  const openWhenLetters = site.letters.filter((letter) => letter.type === "open_when");
  const relationshipDate = formatDate(site.relationshipStartDate);
  const coupleNames = splitCoupleDisplayName(site.coupleDisplayName);
  const heroMessage =
    site.relationshipStory ||
    "Birlikte biriktirdiğiniz fotoğraflar, anılar ve küçük kalp notları tek romantik sayfada buluştu.";
  const memoryPhotos = [...site.memoryPrompts, ...site.gallery].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const spotifyEmbedUrl = getSpotifyEmbedUrl(site.music?.spotifyUrl ?? "");
  const finalNote =
    loveLetter?.body || "Bu sayfanın her küçük detayı, sizin hikayenizden bir iz taşıyor.";

  useEffect(() => {
    const audio = voiceRef.current;
    if (!audio) {
      return;
    }

    const handleEnded = () => setVoicePlaying(false);
    const handlePause = () => setVoicePlaying(false);
    const handlePlay = () => setVoicePlaying(true);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [site.voiceNote?.previewUrl]);

  async function toggleVoiceNote() {
    const audio = voiceRef.current;
    if (!audio) {
      return;
    }

    if (voicePlaying) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setVoicePlaying(false);
    }
  }

  return (
    <div
      style={themeStyle}
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.92),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(244,114,182,0.24),transparent_34%),linear-gradient(180deg,var(--sou-bg)_0%,#ffe4ec_50%,var(--sou-bg-end)_100%)] text-[color:var(--sou-text)]"
    >
      <FloatingDecor />

      {previewNotice && (
        <div className="relative z-20 border-b border-amber-200 bg-amber-50/95 px-4 py-3 text-center text-xs font-semibold text-amber-900 shadow-sm backdrop-blur">
          {previewNotice}
        </div>
      )}

      <section className="relative z-10 px-4 pb-12 pt-16 text-center sm:px-6 sm:pb-16 sm:pt-20">
        <Sparkles className="absolute left-[16%] top-16 h-5 w-5 text-[color:var(--sou-primary)]/35" />
        <Sparkles className="absolute right-[18%] top-28 h-4 w-4 text-[color:var(--sou-secondary)]/35" />
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--sou-primary)] sm:tracking-[0.4em]">
          Bizim romantik hikayemiz
        </p>
        <div className="relative mx-auto mt-5 grid max-w-sm grid-cols-2 items-center gap-x-5 gap-y-4 sm:max-w-5xl sm:grid-cols-[120px_minmax(0,1fr)_120px] sm:gap-6 md:grid-cols-[150px_minmax(0,1fr)_150px]">
          <HeroPhotoCard
            media={site.heroPhotos.left}
            rotation="-rotate-[10deg] sm:-rotate-[14deg]"
            className="order-2 justify-self-end sm:order-none sm:justify-self-auto"
          />
          <h1
            className="relative z-10 col-span-2 text-[2.55rem] leading-[1.02] text-[color:var(--sou-primary)] drop-shadow-sm sm:col-span-1 sm:text-7xl sm:leading-tight md:text-8xl"
            style={{ fontFamily: "var(--sou-font-heading)" }}
          >
            {coupleNames.first}{" "}
            {coupleNames.second && (
              <>
                <span className="text-[color:var(--sou-accent)]">{coupleNames.separator}</span>{" "}
                {coupleNames.second}
              </>
            )}
          </h1>
          <HeroPhotoCard
            media={site.heroPhotos.right}
            rotation="rotate-[10deg] sm:rotate-[14deg]"
            className="order-3 justify-self-start sm:order-none sm:justify-self-auto"
          />
        </div>
        {(relationshipDate || site.specialDateLabel) && (
          <p className="mt-3 text-sm text-[color:var(--sou-muted)]">
            {site.specialDateLabel || "Başlangıcımız"}
            {relationshipDate ? ` · ${relationshipDate}` : ""}
          </p>
        )}
        <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-white/70 bg-white/45 px-4 py-3 text-sm italic text-[color:var(--sou-text)]/80 shadow-lg shadow-rose-100/40 backdrop-blur sm:mt-6 sm:rounded-3xl sm:px-5 sm:py-4 sm:text-base">
          "{heroMessage}"
        </p>
      </section>

      {relationshipDate && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-[color:var(--sou-card)] p-4 text-center shadow-2xl shadow-rose-200/40 backdrop-blur sm:rounded-[2rem] sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--sou-primary)] sm:tracking-[0.35em]">
              Birlikte başlayan hikaye
            </p>
            <h2
              className="mt-4 text-3xl leading-tight text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--sou-font-heading)" }}
            >
              {relationshipDate}
            </h2>
          </div>
        </section>
      )}

      {memoryPhotos.length > 0 && (
        <section className="relative z-10 mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-16">
          <SectionHeading
            title="Benim gözümde SEN"
            subtitle="Sizi anlatan küçük kareler burada bir araya geldi."
          />
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {memoryPhotos.map((photo, index) => (
              <figure
                key={photo.id}
                className="group mx-auto w-full max-w-[17.5rem] rounded-[1.5rem] border border-white/80 bg-[color:var(--sou-card)] p-3 shadow-2xl shadow-rose-200/45 backdrop-blur transition hover:-translate-y-1 hover:shadow-rose-300/60 sm:max-w-none sm:rounded-[1.75rem] sm:p-4"
                style={{
                  transform: `rotate(${index % 3 === 0 ? "-1.2deg" : index % 3 === 2 ? "1.2deg" : "0deg"})`,
                }}
              >
                <PhotoFrame media={photo} aspect="aspect-[4/5]" large />
                {(photo.caption || photo.originalFilename) && (
                  <figcaption className="px-2 pb-1 pt-4 text-center">
                    <p
                      className="text-2xl leading-none text-[color:var(--sou-primary)] sm:text-3xl"
                      style={{ fontFamily: "var(--sou-font-heading)" }}
                    >
                      {photo.caption || "Anımız"}
                    </p>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {site.timeline.length > 0 && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <SectionHeading title="Bizim hikayemiz" />
          <ol className="space-y-4 sm:space-y-5">
            {site.timeline.map((item) => (
              <li
                key={item.id}
                className="relative mx-auto max-w-[18rem] overflow-hidden rounded-[1.5rem] border border-rose-100 bg-[color:var(--sou-card)] p-3 shadow-lg shadow-rose-200/25 backdrop-blur sm:max-w-none sm:rounded-3xl sm:p-5"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_150px] sm:items-center sm:gap-4 md:grid-cols-[1fr_180px]">
                  <div className="flex gap-3 sm:gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] text-sm font-bold text-white shadow-lg shadow-rose-300/40 sm:h-11 sm:w-11">
                      <Star className="h-4 w-4 fill-white/25 text-white sm:h-5 sm:w-5" />
                    </span>
                    <div>
                      {item.eventDate && (
                        <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)]">
                          {formatDate(item.eventDate)}
                        </p>
                      )}
                      <h3 className="mt-1 text-lg font-semibold text-[color:var(--sou-text)]">
                        {item.title || "Anımız"}
                      </h3>
                      {item.description && (
                        <p className="mt-2 text-sm leading-relaxed text-[color:var(--sou-muted)]">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.photo && (
                    <PhotoFrame media={item.photo} aspect="aspect-[4/3] sm:aspect-square" compact />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {site.music && (site.music.songTitle || site.music.artistName || site.music.spotifyUrl) && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/55 p-4 shadow-2xl shadow-rose-200/40 backdrop-blur sm:rounded-[2rem] sm:p-6">
            <Sparkles className="absolute right-6 top-6 h-5 w-5 text-[color:var(--sou-primary)]/45" />
            <Heart className="absolute -left-5 bottom-8 h-16 w-16 fill-rose-200/30 text-rose-300/40 blur-[0.2px]" />
            <SectionHeading
              title="Bize Özel"
              subtitle="Bu şarkı hikayenizin fon müziği gibi."
              compact
            />
            <div className="relative overflow-hidden rounded-[1.5rem] border border-rose-100 bg-[linear-gradient(135deg,#fff7fa,#ffe4ec)] p-4 shadow-inner sm:p-5">
              <div className="relative grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] text-white shadow-2xl shadow-rose-300/45 sm:mx-0">
                  <Music2 className="h-10 w-10" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sou-primary)] sm:tracking-[0.3em]">
                    Bizim şarkımız
                  </p>
                  <p className="mt-2 break-words text-xl font-semibold text-[color:var(--sou-text)] sm:text-2xl">
                    {site.music.songTitle || "Şarkımız"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--sou-primary)]/75">
                    {site.music.artistName || "Bize özel"}
                  </p>
                </div>
              </div>
              <div className="relative mt-5 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/72 p-3 shadow-lg shadow-rose-100/50">
                {spotifyEmbedUrl ? (
                  <iframe
                    src={spotifyEmbedUrl}
                    title={`${site.music.songTitle || "Şarkımız"} - ${site.music.artistName || "Bize özel"}`}
                    className="block h-[152px] w-full rounded-[1rem] border-0"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                ) : (
                  <div className="grid min-h-[152px] place-items-center rounded-[1rem] bg-rose-50/70 px-5 py-8 text-center">
                    <Heart className="mx-auto h-8 w-8 fill-rose-300/60 text-[color:var(--sou-primary)]" />
                    <p className="mt-3 text-sm font-medium text-[color:var(--sou-muted)]">
                      Şarkı bilgisi henüz eklenmedi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {site.puzzlePhoto && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(255,228,235,0.78))] p-5 text-center shadow-2xl shadow-rose-200/40 backdrop-blur sm:rounded-[2rem] sm:p-7">
            <Sparkles className="absolute right-6 top-6 h-5 w-5 text-[color:var(--sou-primary)]/45" />
            <h2
              className="text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--sou-font-heading)" }}
            >
              Aşkımızın Parçaları
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--sou-muted)]">
              Bu fotoğraf, hikayenizin en güzel parçalarından biri olarak saklandı.
            </p>
            <div className="mx-auto mt-6 max-w-sm rotate-[-2deg] rounded-[1.5rem] border border-white/80 bg-white/80 p-2.5 shadow-2xl shadow-rose-200/50">
              <PhotoFrame media={site.puzzlePhoto} aspect="aspect-[4/3]" large />
            </div>
          </div>
        </section>
      )}

      {openWhenLetters.length > 0 && (
        <section className="relative z-10 mx-auto max-w-5xl px-4 pb-14 sm:px-6 sm:pb-16">
          <SectionHeading
            title="Bunları ihtiyacın olduğunda aç"
            subtitle="Küçük notlar, tam ihtiyacın olduğunda aç diye."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {openWhenLetters.map((letter, index) => (
              <button
                key={letter.id}
                type="button"
                onClick={() => setOpenLetterIndex(index)}
                className="group relative min-h-[12.5rem] overflow-hidden rounded-[1.5rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,228,235,0.72))] p-4 text-left shadow-xl shadow-rose-200/30 backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-rose-300/45 sm:min-h-[14rem] sm:rounded-[1.75rem]"
              >
                <span className="pointer-events-none absolute inset-x-4 top-4 h-16 rounded-b-[2rem] rounded-t-xl border border-rose-100/80 bg-gradient-to-br from-rose-100/80 via-pink-50/80 to-white/70 shadow-inner transition duration-500 group-hover:translate-y-1" />
                <span className="relative z-10 flex h-full min-h-[10.5rem] flex-col justify-between rounded-[1.35rem] border border-white/75 bg-white/65 px-4 py-5 sm:min-h-[12rem]">
                  <span>
                    <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-[color:var(--sou-primary)] shadow-sm shadow-rose-200/50">
                      <Heart className="h-5 w-5 fill-rose-300/60" />
                    </span>
                    <span className="block text-base font-semibold leading-snug text-[color:var(--sou-text)]">
                      {letter.title || "Küçük not"}
                    </span>
                  </span>
                  <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)]">
                    Aç
                    <Heart className="h-3.5 w-3.5 fill-rose-300/60" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {site.voiceNote && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-rose-100 bg-[color:var(--sou-card)] p-4 shadow-xl shadow-rose-200/35 backdrop-blur sm:rounded-[2rem] sm:p-6">
            <Sparkles className="absolute right-6 top-6 h-5 w-5 text-[color:var(--sou-primary)]/35" />
            <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sou-primary)]/70">
                  Sana bir sesim var
                </p>
                <p
                  className="mt-2 text-2xl leading-none text-[color:var(--sou-primary)] sm:text-3xl"
                  style={{ fontFamily: "var(--sou-font-heading)" }}
                >
                  Sadece senin için
                </p>
              </div>
              <button
                type="button"
                onClick={toggleVoiceNote}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-300/45 transition hover:scale-[1.02] sm:w-auto sm:py-4"
              >
                {voicePlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                {voicePlaying ? "Durdur" : "Ses notunu aç"}
              </button>
            </div>
            <div className="relative mt-5 rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-inner">
              <audio
                ref={voiceRef}
                src={site.voiceNote.previewUrl}
                preload="metadata"
                className="hidden"
              />
              <div className="flex items-end justify-center gap-1.5">
                {Array.from({ length: 28 }).map((_, index) => (
                  <span
                    key={index}
                    className={`w-1.5 rounded-full bg-gradient-to-t from-[color:var(--sou-primary)] to-[color:var(--sou-accent)] transition ${
                      voicePlaying ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: `${14 + ((index * 7) % 34)}px`,
                      opacity: voicePlaying ? 0.82 : 0.28 + (index % 5) * 0.08,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {loveLetter && (
        <section className="relative z-10 mx-auto max-w-5xl px-4 pb-14 sm:px-6 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="grid gap-7 rounded-[1.5rem] border border-rose-200/75 bg-[linear-gradient(180deg,#fffafc,#fff1f6_58%,#fff7fb)] p-4 shadow-xl shadow-rose-200/35 transition duration-700 ease-out hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-rose-200/45 sm:rounded-[2rem] sm:p-6 md:grid-cols-[0.8fr_1.2fr] md:items-center md:p-10">
            {site.loveLetterPhoto && (
              <div className="mx-auto w-full max-w-[17rem] sm:max-w-xs">
                <div className="rotate-[-10deg] rounded-[1.5rem] border border-white/80 bg-white/80 p-2.5 shadow-2xl shadow-rose-200/50 sm:p-3">
                  <PhotoFrame media={site.loveLetterPhoto} aspect="aspect-[4/5]" large />
                </div>
              </div>
            )}
            <div className="relative min-w-0 rounded-[1.4rem] border border-white/75 bg-white/55 px-4 py-5 shadow-inner shadow-rose-100/50 sm:rounded-[1.8rem] sm:px-6 sm:py-7">
              <Heart className="absolute -left-8 -top-10 h-10 w-10 fill-rose-300/30 text-rose-400/50 sm:-left-10 sm:-top-12" />
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--sou-primary)] sm:tracking-[0.4em]">
                {loveLetter.title || "Kalbimden sana birkaç satır"}
              </p>
              <p
                className="mt-5 whitespace-pre-wrap break-words text-[1rem] leading-8 text-[color:var(--sou-text)]/90 sm:text-lg sm:leading-9 md:text-xl md:leading-10"
                style={{ fontFamily: "var(--sou-font-accent)", fontStyle: "italic" }}
              >
                {loveLetter.body}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="relative z-10 mx-auto max-w-xl px-4 pb-20 text-center sm:px-6 sm:pb-24">
        <button
          type="button"
          onClick={() => setShowFinalNote(true)}
          className="group relative inline-flex flex-col items-center gap-4 rounded-[1.75rem] px-6 py-6 transition hover:bg-white/35 sm:rounded-[2rem] sm:px-8 sm:py-7"
        >
          <span className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-rose-100/40 via-white/20 to-pink-200/35 opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />
          <span className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] text-white shadow-2xl shadow-rose-400/60 transition-transform group-hover:scale-110">
            <Gift className="h-10 w-10 transition-transform duration-500 group-hover:-rotate-6" />
          </span>
          <span className="relative font-medium text-[color:var(--sou-primary)]">
            Sana bir sürprizim daha var
          </span>
        </button>
      </section>

      {openLetterIndex !== null && (
        <Modal onClose={() => setOpenLetterIndex(null)} closeLabel="Mektubu kapat">
          <span className="pointer-events-none absolute inset-x-8 top-6 h-24 rounded-b-[2rem] rounded-t-xl border border-rose-100 bg-gradient-to-br from-rose-100 via-pink-50 to-white shadow-inner" />
          <div className="relative mt-10 rounded-[1.35rem] border border-white/80 bg-white/80 px-4 py-5 shadow-xl shadow-rose-100/50 sm:rounded-[1.5rem] sm:px-5 sm:py-6">
            <Heart className="mb-4 h-8 w-8 fill-rose-300/60 text-[color:var(--sou-primary)]" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--sou-primary)] sm:tracking-[0.25em]">
              {openWhenLetters[openLetterIndex]?.title || "Küçük not"}
            </p>
            <p
              className="mt-5 min-h-[7rem] whitespace-pre-wrap break-words text-xl leading-relaxed text-[color:var(--sou-text)] animate-in fade-in slide-in-from-top-2 duration-500 sm:text-2xl"
              style={{ fontFamily: "var(--sou-font-accent)", fontStyle: "italic" }}
            >
              {openWhenLetters[openLetterIndex]?.body}
            </p>
          </div>
        </Modal>
      )}

      {showFinalNote && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-rose-950/45 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-500 sm:px-5">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--sou-primary)] via-[color:var(--sou-secondary)] to-rose-500 p-6 text-center text-white shadow-2xl shadow-rose-950/40 ring-1 ring-white/40 animate-in fade-in zoom-in-95 duration-700 sm:p-10">
            <button
              type="button"
              onClick={() => setShowFinalNote(false)}
              aria-label="Sürprizi kapat"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white shadow-sm transition hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.32),transparent_34%),radial-gradient(circle_at_12%_90%,rgba(255,255,255,0.18),transparent_30%)]" />
            <Heart className="relative mx-auto mb-5 h-8 w-8 text-white/80" />
            <p className="relative text-xs uppercase tracking-[0.28em] text-white/80 sm:tracking-[0.4em]">
              Gizli mesaj
            </p>
            <p
              className="relative mt-6 whitespace-pre-wrap break-words text-2xl leading-relaxed drop-shadow-sm sm:text-3xl md:text-4xl"
              style={{ fontFamily: "var(--sou-font-heading)" }}
            >
              {finalNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "relative mb-5 text-center" : "mb-8 text-center sm:mb-10"}>
      <h2
        className="text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
        style={{ fontFamily: "var(--sou-font-heading)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--sou-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function HeroPhotoCard({
  media,
  rotation,
  className,
}: {
  media: StoryOfUsFinalSiteMedia | null;
  rotation: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-32 ${rotation} ${className ?? ""} sm:w-full transition duration-500`}
    >
      <div className="rounded-[1.25rem] border border-white/80 bg-white/75 p-2 shadow-2xl shadow-rose-200/50 backdrop-blur sm:rounded-[1.5rem] sm:p-2.5">
        <PhotoFrame media={media} aspect="aspect-[4/5]" />
      </div>
    </div>
  );
}

function PhotoFrame({
  media,
  aspect,
  large = false,
  compact = false,
}: {
  media: StoryOfUsFinalSiteMedia | null;
  aspect: string;
  large?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1rem] border border-white/70 bg-gradient-to-br from-rose-200 via-pink-200 to-fuchsia-300 shadow-inner ${aspect} ${
        large ? "min-h-[13rem]" : compact ? "min-h-[8rem]" : "min-h-[10rem]"
      }`}
    >
      {media?.previewUrl ? (
        <img
          src={media.previewUrl}
          alt={media.caption || media.originalFilename || "StoryOfUs fotoğrafı"}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="grid h-full place-items-center bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100 text-rose-300">
          <ImageIcon className="h-7 w-7" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.2),transparent_45%,rgba(190,24,93,0.1))]" />
    </div>
  );
}

function Modal({
  children,
  onClose,
  closeLabel,
}: {
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-rose-950/35 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-300 sm:px-5">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,#fffafc,#fff1f5)] p-4 shadow-2xl shadow-rose-950/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 sm:rounded-[2rem] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[color:var(--sou-primary)] shadow-sm transition hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function FloatingDecor() {
  const hearts = Array.from({ length: 28 }, (_, index) => ({
    id: index,
    left: `${(index * 13) % 100}%`,
    top: `${(index * 23) % 100}%`,
    size: 16 + (index % 5) * 5,
    opacity: 0.1 + (index % 5) * 0.035,
    duration: 17 + (index % 7) * 2,
    delay: -(index % 9) * 1.4,
    rotation: index % 2 === 0 ? -18 : 18,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes sou-final-float-heart {
          from { transform: translate3d(0, 44px, 0) rotate(var(--sou-rotation)) scale(0.88); }
          50% { opacity: calc(var(--sou-opacity) * 1.35); }
          to { transform: translate3d(44px, -126px, 0) rotate(calc(var(--sou-rotation) + 28deg)) scale(1.12); }
        }
      `}</style>
      {hearts.map((heart) => (
        <Heart
          key={heart.id}
          className="absolute fill-rose-300/60 text-rose-400 drop-shadow-sm blur-[0.1px]"
          style={
            {
              left: heart.left,
              top: heart.top,
              width: `${heart.size}px`,
              height: `${heart.size}px`,
              opacity: heart.opacity,
              animation: `sou-final-float-heart ${heart.duration}s linear ${heart.delay}s infinite`,
              "--sou-rotation": `${heart.rotation}deg`,
              "--sou-opacity": heart.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function splitCoupleDisplayName(value: string) {
  const normalized = value.trim() || "StoryOfUs";
  const separators = [" & ", " ve ", " Ve ", " + "];
  const separator = separators.find((item) => normalized.includes(item));

  if (!separator) {
    return {
      first: normalized,
      separator: "",
      second: "",
    };
  }

  const [first, ...rest] = normalized.split(separator);

  return {
    first: first.trim() || normalized,
    separator: separator.trim() === "ve" ? "ve" : "&",
    second: rest.join(separator).trim(),
  };
}

function getSpotifyEmbedUrl(spotifyUrl: string) {
  const trimmedUrl = spotifyUrl.trim();
  if (!trimmedUrl) return "";

  const uriMatch = trimmedUrl.match(/^spotify:track:([A-Za-z0-9]+)$/);
  if (uriMatch?.[1]) {
    return `https://open.spotify.com/embed/track/${uriMatch[1]}`;
  }

  try {
    const url = new URL(trimmedUrl);
    const trackId = url.pathname.match(/^\/track\/([A-Za-z0-9]+)/)?.[1];
    if (url.hostname === "open.spotify.com" && trackId) {
      return `https://open.spotify.com/embed/track/${trackId}`;
    }
  } catch {
    return "";
  }

  return "";
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
