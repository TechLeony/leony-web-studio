import {
  CalendarHeart,
  Heart,
  Image as ImageIcon,
  LetterText,
  Music2,
  Sparkles,
} from "lucide-react";

import type {
  StoryOfUsFinalSiteData,
  StoryOfUsFinalSiteMedia,
} from "@/lib/storyofus/finalSite.server";

export function StoryOfUsFinalSiteRenderer({
  site,
  previewNotice,
}: {
  site: StoryOfUsFinalSiteData;
  previewNotice?: string;
}) {
  const loveLetter = site.letters.find((letter) => letter.type === "love_letter");
  const openWhenLetters = site.letters.filter((letter) => letter.type === "open_when");

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_42%,#fffaf7_100%)] text-rose-950">
      {previewNotice && (
        <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50/95 px-4 py-3 text-center text-xs font-semibold text-amber-900 shadow-sm backdrop-blur">
          {previewNotice}
        </div>
      )}

      <section className="relative px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute left-[8%] top-20 h-28 w-28 rounded-full bg-rose-200/50 blur-3xl" />
          <div className="absolute right-[10%] top-44 h-32 w-32 rounded-full bg-pink-200/45 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="order-2 grid grid-cols-2 gap-4 lg:order-1">
            <HeroPhoto media={site.heroPhotos.left} className="-rotate-3" />
            <HeroPhoto media={site.heroPhotos.right} className="rotate-3 translate-y-8" />
          </div>

          <div className="order-1 text-center lg:order-2 lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-500">
              StoryOfUs
            </p>
            <h1 className="mt-4 font-serif text-5xl font-bold tracking-tight text-rose-950 sm:text-7xl">
              {site.coupleDisplayName}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-rose-950/65 lg:mx-0">
              {site.relationshipStory ||
                "Birlikte biriktirilen anılar, fotoğraflar ve küçük kalp notları tek romantik sayfada buluştu."}
            </p>
            {(site.relationshipStartDate || site.specialDateLabel) && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/70 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm">
                <CalendarHeart className="h-4 w-4" />
                {site.specialDateLabel || "Başlangıcımız"}
                {site.relationshipStartDate ? ` · ${formatDate(site.relationshipStartDate)}` : ""}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 sm:px-6">
        {site.memoryPrompts.length > 0 && (
          <FinalSection
            eyebrow="Fotoğraflar"
            title="Benim gözümde sen"
            icon={<ImageIcon className="h-5 w-5" />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {site.memoryPrompts.map((photo) => (
                <PhotoCard key={photo.id} media={photo} />
              ))}
            </div>
          </FinalSection>
        )}

        {site.music && (site.music.songTitle || site.music.artistName || site.music.spotifyUrl) && (
          <FinalSection eyebrow="Şarkımız" title="Bize özel" icon={<Music2 className="h-5 w-5" />}>
            <div className="rounded-[2rem] border border-rose-100 bg-white/80 p-5 shadow-xl shadow-rose-100/60">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-400">
                Bizim şarkımız
              </p>
              <h3 className="mt-3 text-2xl font-bold text-rose-950">
                {site.music.songTitle || "Şarkımız"}
              </h3>
              <p className="mt-1 text-sm font-semibold text-rose-700">
                {site.music.artistName || "Bize özel"}
              </p>
              {site.music.spotifyUrl && (
                <a
                  href={site.music.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200"
                >
                  Spotify'da aç
                </a>
              )}
            </div>
          </FinalSection>
        )}

        {site.timeline.length > 0 && (
          <FinalSection
            eyebrow="Zaman çizelgesi"
            title="Bizim hikayemiz"
            icon={<CalendarHeart className="h-5 w-5" />}
          >
            <div className="grid gap-4">
              {site.timeline.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-[2rem] border border-rose-100 bg-white/80 p-4 shadow-sm shadow-rose-100/60 sm:grid-cols-[1fr_180px] sm:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">
                      {formatDate(item.eventDate)}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-rose-950">
                      {item.title || "Anımız"}
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-sm leading-7 text-rose-950/65">{item.description}</p>
                    )}
                  </div>
                  {item.photo && <PhotoThumb media={item.photo} />}
                </article>
              ))}
            </div>
          </FinalSection>
        )}

        {loveLetter && (
          <FinalSection
            eyebrow="Mektup"
            title={loveLetter.title || "Kalbimden sana"}
            icon={<LetterText className="h-5 w-5" />}
          >
            <div className="grid gap-5 rounded-[2rem] border border-rose-100 bg-white/85 p-5 shadow-xl shadow-rose-100/60 md:grid-cols-[1fr_220px] md:items-center">
              <p className="whitespace-pre-wrap text-base leading-8 text-rose-950/75">
                {loveLetter.body}
              </p>
              {site.loveLetterPhoto && <PhotoThumb media={site.loveLetterPhoto} />}
            </div>
          </FinalSection>
        )}

        {openWhenLetters.length > 0 && (
          <FinalSection
            eyebrow="Küçük notlar"
            title="Bunları ihtiyacın olduğunda aç"
            icon={<Sparkles className="h-5 w-5" />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {openWhenLetters.map((letter) => (
                <article
                  key={letter.id}
                  className="rounded-[1.5rem] border border-pink-100 bg-white/80 p-5 shadow-sm"
                >
                  <p className="text-sm font-bold text-rose-950">{letter.title || "Küçük not"}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-rose-950/65">
                    {letter.body}
                  </p>
                </article>
              ))}
            </div>
          </FinalSection>
        )}

        {site.voiceNote && (
          <FinalSection
            eyebrow="Ses notu"
            title="Sana bir sesim var"
            icon={<Heart className="h-5 w-5" />}
          >
            <div className="rounded-[2rem] border border-rose-100 bg-white/85 p-5 shadow-xl shadow-rose-100/60">
              <audio controls src={site.voiceNote.previewUrl} className="w-full" />
            </div>
          </FinalSection>
        )}
      </div>
    </main>
  );
}

function FinalSection({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-rose-950 sm:text-4xl">{title}</h2>
        </div>
        <div className="hidden h-11 w-11 place-items-center rounded-full bg-white text-rose-500 shadow-md shadow-rose-100 sm:grid">
          {icon}
        </div>
      </div>
      {children}
    </section>
  );
}

function HeroPhoto({
  media,
  className,
}: {
  media: StoryOfUsFinalSiteMedia | null;
  className?: string;
}) {
  return (
    <div
      className={`aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-white bg-rose-100 shadow-2xl shadow-rose-200/60 ${className ?? ""}`}
    >
      {media?.previewUrl ? (
        <img
          src={media.previewUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      ) : (
        <div className="grid h-full place-items-center bg-gradient-to-br from-rose-100 via-pink-100 to-orange-100 text-rose-300">
          <Heart className="h-10 w-10" />
        </div>
      )}
    </div>
  );
}

function PhotoCard({ media }: { media: StoryOfUsFinalSiteMedia }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-white bg-white/85 shadow-lg shadow-rose-100/60">
      <PhotoThumb media={media} className="rounded-none border-0 shadow-none" />
      {media.caption && (
        <p className="p-4 text-sm font-semibold text-rose-950/70">{media.caption}</p>
      )}
    </article>
  );
}

function PhotoThumb({ media, className }: { media: StoryOfUsFinalSiteMedia; className?: string }) {
  return media.previewUrl ? (
    <img
      src={media.previewUrl}
      alt={media.caption || media.originalFilename || "StoryOfUs fotoğrafı"}
      className={`aspect-[4/3] w-full rounded-[1.25rem] border border-white object-cover shadow-md shadow-rose-100/70 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div
      className={`grid aspect-[4/3] w-full place-items-center rounded-[1.25rem] border border-dashed border-rose-200 bg-rose-50 text-rose-300 ${className ?? ""}`}
    >
      <ImageIcon className="h-7 w-7" />
    </div>
  );
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
