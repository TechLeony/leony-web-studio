import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Heart, Volume2, VolumeX, Gift, Sparkles, Star, X } from "lucide-react";

import { storyOfUsDemoCtaConfig } from "@/lib/storyofus/demoCtaConfig";
import { demoStoryData, type StoryOfUsExperienceData } from "./storyOfUsExperienceData";

function getElapsed(startIso: string) {
  const diff = Math.max(0, Date.now() - new Date(startIso).getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const totalDays = Math.floor(totalSeconds / 86400);
  const years = Math.floor(totalDays / 365);
  const days = totalDays % 365;
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { years, days, hours, minutes, seconds };
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

function formatVoiceTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function StoryOfUsExperience({
  story = demoStoryData,
  showDemoDisclaimer = false,
  startEntered = false,
  accessPinHint,
  verifyAccessPin,
}: {
  story?: StoryOfUsExperienceData;
  showDemoDisclaimer?: boolean;
  startEntered?: boolean;
  accessPinHint?: string;
  verifyAccessPin?: (pin: string) => Promise<boolean | { ok: boolean; message?: string }>;
}) {
  const [entered, setEntered] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [openLetterIndex, setOpenLetterIndex] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(() =>
    getElapsed(story.relationship.relationshipStartDate),
  );
  const [loveRevealed, setLoveRevealed] = useState(false);
  const [lovePct, setLovePct] = useState(0);
  const [loveComplete, setLoveComplete] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceTouched, setVoiceTouched] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const [couponIndex, setCouponIndex] = useState(0);
  const [selectedCouponAnswer, setSelectedCouponAnswer] = useState("");
  const [couponRewards, setCouponRewards] = useState<string[]>([]);
  const [typedLetterMessage, setTypedLetterMessage] = useState("");
  const [typedFinalNote, setTypedFinalNote] = useState("");
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const loveMeterTimers = useRef<number[]>([]);

  useEffect(() => {
    if (startEntered) {
      setEntered(true);
    }
  }, [startEntered]);

  const themeStyle = useMemo(
    () =>
      ({
        "--sou-primary": story.theme.primaryColor,
        "--sou-secondary": story.theme.secondaryColor,
        "--sou-accent": story.theme.accentColor,
        "--sou-bg": story.theme.backgroundColor,
        "--sou-bg-end": story.theme.backgroundEndColor,
        "--sou-text": story.theme.textColor,
        "--sou-muted": story.theme.mutedTextColor,
        "--sou-card": story.theme.cardColor,
        "--sou-font-heading": story.theme.fontHeading,
        "--sou-font-body": story.theme.fontBody,
        "--sou-font-accent": story.theme.fontAccent,
      }) as CSSProperties,
    [story],
  );
  const customerSpotify = story.spotify;
  const spotify = {
    sectionTitle: customerSpotify?.sectionTitle || story.spotify.sectionTitle,
    subtitle: customerSpotify?.subtitle || story.spotify.subtitle,
    label: customerSpotify?.label || story.spotify.label,
    songTitle: customerSpotify.songTitle || neutralSpotifyFallback.songTitle,
    artist: customerSpotify.artist || neutralSpotifyFallback.artist,
    note: customerSpotify.note || neutralSpotifyFallback.note,
    spotifyUrl: customerSpotify.spotifyUrl || "",
  };
  const voiceNote = {
    sectionTitle: story.voiceNote.sectionTitle,
    title: story.voiceNote.title,
    audioUrl: story.voiceNote.audioUrl || story.voiceNote.src,
    playText: story.voiceNote.playText,
    replayText: story.voiceNote.replayText,
    stopText: story.voiceNote.stopText,
  };
  const spotifyEmbedUrl = useMemo(
    () => getSpotifyEmbedUrl(spotify.spotifyUrl),
    [spotify.spotifyUrl],
  );
  const voiceAudioUrl = voiceNote.audioUrl;
  const voiceProgressPct = voiceDuration > 0 ? Math.min(1, voiceProgress / voiceDuration) : 0;
  const hasMemories = story.memories.items.length > 0;
  const hasTimeline = story.timeline.items.length > 0;
  const hasSpotify = Boolean(spotify.songTitle || spotify.artist || spotify.spotifyUrl);
  const hasPuzzle = Boolean(story.photoPuzzle.imageUrl);
  const hasOpenWhenLetters = story.openWhenLetters.items.length > 0;
  const hasVoiceNote = Boolean(voiceAudioUrl);
  const hasReasons = story.reasons.items.length > 0;
  const hasCouponQuiz = story.couponQuiz.questions.length > 0;
  const hasCoupleWrapped = story.coupleWrapped.stats.length > 0;
  const hasLoveLetter = Boolean(story.letter.letterBody);
  const hasFinalSurprise = Boolean(story.finalSurprise.finalSecretNote);

  useEffect(() => {
    if (!entered) return;

    setElapsed(getElapsed(story.relationship.relationshipStartDate));
    const interval = window.setInterval(() => {
      setElapsed(getElapsed(story.relationship.relationshipStartDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [entered, story.relationship.relationshipStartDate]);

  useEffect(() => {
    return () => {
      loveMeterTimers.current.forEach((timer) => window.clearTimeout(timer));
      loveMeterTimers.current = [];
      voiceRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (openLetterIndex === null) {
      setTypedLetterMessage("");
      return;
    }

    const message = story.openWhenLetters.items[openLetterIndex]?.message ?? "";
    setTypedLetterMessage("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedLetterMessage(message.slice(0, index));

      if (index >= message.length) {
        window.clearInterval(timer);
      }
    }, 48);

    return () => window.clearInterval(timer);
  }, [openLetterIndex, story.openWhenLetters.items]);

  useEffect(() => {
    if (!showFinal) {
      setTypedFinalNote("");
      return;
    }

    const message = story.finalSurprise.finalSecretNote;
    if (!message) return;
    setTypedFinalNote("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedFinalNote(message.slice(0, index));

      if (index >= message.length) {
        window.clearInterval(timer);
      }
    }, 62);

    return () => window.clearInterval(timer);
  }, [showFinal, story.finalSurprise.finalSecretNote]);

  function stopVoiceNote() {
    if (voiceRef.current) {
      voiceRef.current.pause();
    }
    setVoicePlaying(false);
  }

  function playVoiceNote() {
    setVoiceTouched(true);
    setVoiceUnavailable(false);

    if (!voiceAudioUrl) {
      setVoiceUnavailable(true);
      return;
    }

    if (voicePlaying) {
      stopVoiceNote();
      return;
    }

    if (!voiceRef.current) {
      voiceRef.current = new Audio(voiceAudioUrl);
      voiceRef.current.onloadedmetadata = () => {
        setVoiceDuration(voiceRef.current?.duration ?? 0);
      };
      voiceRef.current.ontimeupdate = () => {
        setVoiceProgress(voiceRef.current?.currentTime ?? 0);
      };
      voiceRef.current.onended = () => {
        setVoicePlaying(false);
        setVoiceProgress(0);
        if (voiceRef.current) voiceRef.current.currentTime = 0;
      };
      voiceRef.current.onerror = () => {
        setVoicePlaying(false);
        setVoiceUnavailable(true);
      };
    }

    voiceRef.current
      .play()
      .then(() => setVoicePlaying(true))
      .catch(() => {
        setVoicePlaying(false);
        setVoiceUnavailable(true);
      });
  }

  function selectCouponAnswer(answer: string) {
    const question = story.couponQuiz.questions[couponIndex];
    if (!question) return;
    setSelectedCouponAnswer(answer);

    if (answer === question.correctAnswer && !couponRewards.includes(question.reward)) {
      setCouponRewards((rewards) => [...rewards, question.reward]);
    }
  }

  function goToNextCouponQuestion() {
    setCouponIndex((index) => Math.min(index + 1, story.couponQuiz.questions.length - 1));
    setSelectedCouponAnswer("");
  }

  function revealLoveMeter() {
    loveMeterTimers.current.forEach((timer) => window.clearTimeout(timer));
    loveMeterTimers.current = [];
    setLoveRevealed(true);
    setLoveComplete(false);
    setLovePct(0);

    const steps = [15, 30, 45, 60, 75, 80, 90, story.stats.loveMeterTarget];
    steps.forEach((step, index) => {
      const timer = window.setTimeout(
        () => {
          setLovePct(step);
          if (step === story.stats.loveMeterTarget) {
            window.setTimeout(() => setLoveComplete(true), 450);
          }
        },
        550 + index * 520,
      );
      loveMeterTimers.current.push(timer);
    });
  }

  if (!entered) {
    return (
      <IntroGate
        intro={story.intro}
        accessPin={story.accessPin}
        accessPinHint={accessPinHint ?? story.accessPinHint}
        verifyAccessPin={verifyAccessPin}
        criticalImageUrls={[
          story.relationship.heroLeftPhoto.src,
          story.relationship.heroRightPhoto.src,
        ]}
        themeStyle={themeStyle}
        decor={story.decor}
        onEnter={() => setEntered(true)}
      />
    );
  }

  return (
    <div
      style={themeStyle}
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.92),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(244,114,182,0.24),transparent_34%),linear-gradient(180deg,var(--sou-bg)_0%,#ffe4ec_50%,var(--sou-bg-end)_100%)] text-[color:var(--sou-text)]"
    >
      <FloatingDecor decor={story.decor} />

      {showDemoDisclaimer && <DemoDisclaimerBanner />}

      <section className="relative z-10 px-4 pb-12 pt-16 text-center sm:px-6 sm:pb-16 sm:pt-20">
        {story.decor.showHeroSparkles && (
          <>
            <Sparkles className="absolute left-[16%] top-16 h-5 w-5 text-[color:var(--sou-primary)]/35" />
            <Sparkles className="absolute right-[18%] top-28 h-4 w-4 text-[color:var(--sou-secondary)]/35" />
          </>
        )}
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--sou-primary)] sm:tracking-[0.4em]">
          {story.relationship.heroEyebrow}
        </p>
        <div className="relative mx-auto mt-5 grid max-w-sm grid-cols-2 items-center gap-x-5 gap-y-4 sm:max-w-5xl sm:grid-cols-[120px_minmax(0,1fr)_120px] sm:gap-6 md:grid-cols-[150px_minmax(0,1fr)_150px]">
          <HeroPhotoCard
            photo={story.relationship.heroLeftPhoto}
            rotation="-rotate-[10deg] sm:-rotate-[14deg]"
            className="order-2 justify-self-end sm:order-none sm:justify-self-auto"
          />
          <h1
            className="relative z-10 col-span-2 text-[2.55rem] leading-[1.02] text-[color:var(--sou-primary)] drop-shadow-sm sm:col-span-1 sm:text-7xl sm:leading-tight md:text-8xl"
            style={{ fontFamily: "var(--sou-font-heading)" }}
          >
            {story.relationship.coupleNames.first}{" "}
            <span className="text-[color:var(--sou-accent)]">
              {story.relationship.coupleNames.separator}
            </span>{" "}
            {story.relationship.coupleNames.second}
          </h1>
          <HeroPhotoCard
            photo={story.relationship.heroRightPhoto}
            rotation="rotate-[10deg] sm:rotate-[14deg]"
            className="order-3 justify-self-start sm:order-none sm:justify-self-auto"
          />
        </div>
        <p className="mt-3 text-sm text-[color:var(--sou-muted)]">
          {new Date(story.relationship.relationshipStartDate).toLocaleDateString("tr-TR")}
        </p>
        <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-white/70 bg-white/45 px-4 py-3 text-sm italic text-[color:var(--sou-text)]/80 shadow-lg shadow-rose-100/40 backdrop-blur sm:mt-6 sm:rounded-3xl sm:px-5 sm:py-4 sm:text-base">
          "{story.relationship.heroMessage}"
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-[color:var(--sou-card)] p-4 text-center shadow-2xl shadow-rose-200/40 backdrop-blur sm:rounded-[2rem] sm:p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--sou-primary)] sm:tracking-[0.35em]">
            {story.stats.statsTitle}
          </p>
          <h2
            className="mt-4 text-3xl leading-tight text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--sou-font-heading)" }}
          >
            {story.stats.statsSinceText}
          </h2>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: story.stats.counterLabels.years, value: elapsed.years },
              { label: story.stats.counterLabels.days, value: elapsed.days },
              { label: story.stats.counterLabels.hours, value: elapsed.hours },
              { label: story.stats.counterLabels.minutes, value: elapsed.minutes },
              { label: story.stats.counterLabels.seconds, value: elapsed.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-rose-100 bg-white/60 px-3 py-3 shadow-sm shadow-rose-100/50 sm:py-4"
              >
                <p className="text-2xl font-black leading-none text-[color:var(--sou-primary)] sm:text-3xl">
                  {item.value.toString().padStart(2, "0")}
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-[color:var(--sou-muted)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-rose-100 bg-[linear-gradient(135deg,#fff7fa,#ffe4ec)] p-4 shadow-inner sm:rounded-3xl sm:p-5">
            <p className="text-base font-semibold text-[color:var(--sou-text)] sm:text-lg">
              {story.stats.loveMeterQuestion}
            </p>
            {!loveRevealed ? (
              <button
                type="button"
                onClick={revealLoveMeter}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-300/45 transition hover:scale-[1.02]"
              >
                <Heart className="h-4 w-4 fill-white" /> {story.stats.loveMeterButtonText}
              </button>
            ) : (
              <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-left text-sm font-semibold text-[color:var(--sou-text)]">
                    {story.stats.loveMeterResultTitle}
                  </p>
                  <p className="text-2xl font-black text-[color:var(--sou-primary)]">%{lovePct}</p>
                </div>
                <div className="mt-4 h-6 overflow-hidden rounded-full bg-white shadow-inner">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-500 transition-[width] duration-[2200ms] ease-out"
                    style={{ width: `${lovePct}%` }}
                  >
                    <Heart className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 fill-white text-white" />
                  </div>
                </div>
                {loveComplete && lovePct === story.stats.loveMeterTarget && (
                  <p className="mt-4 text-sm font-medium text-[color:var(--sou-primary)]">
                    {story.stats.loveMeterResultMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {hasMemories && (
        <section
          className="relative z-10 mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-16"
          data-gallery-mode={story.memories.galleryMode}
          data-animation-style={story.memories.animationStyle}
        >
          <h2
            className="mb-4 text-center text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--sou-font-heading)" }}
          >
            {story.memories.memoriesTitle}
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed text-[color:var(--sou-muted)]">
            {story.memories.helperText}
          </p>
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {story.memories.items.map((memory, i) => (
              <figure
                key={`${memory.title}-${i}`}
                className="group mx-auto w-full max-w-[17.5rem] rounded-[1.5rem] border border-white/80 bg-[color:var(--sou-card)] p-3 shadow-2xl shadow-rose-200/45 backdrop-blur transition hover:-translate-y-1 hover:shadow-rose-300/60 sm:max-w-none sm:rounded-[1.75rem] sm:p-4"
                style={{
                  transform: `rotate(${i === 0 ? "-1.2deg" : i === 2 ? "1.2deg" : "0deg"})`,
                }}
              >
                <PhotoFrame photo={memory} aspect="aspect-[4/5]" large />
                <figcaption className="px-2 pb-1 pt-4 text-center">
                  <p
                    className="text-2xl leading-none text-[color:var(--sou-primary)] sm:text-3xl"
                    style={{ fontFamily: "var(--sou-font-heading)" }}
                  >
                    {memory.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--sou-muted)]">
                    {memory.caption}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {hasTimeline && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <h2
            className="mb-8 text-center text-3xl text-[color:var(--sou-primary)] sm:mb-10 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--sou-font-heading)" }}
          >
            {story.timeline.timelineTitle}
          </h2>
          <ol className="space-y-4 sm:space-y-5">
            {story.timeline.items.map((item, i) => (
              <li
                key={`${item.date}-${item.title}`}
                className="relative mx-auto max-w-[18rem] overflow-hidden rounded-[1.5rem] border border-rose-100 bg-[color:var(--sou-card)] p-3 shadow-lg shadow-rose-200/25 backdrop-blur sm:max-w-none sm:rounded-3xl sm:p-5"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_150px] sm:items-center sm:gap-4 md:grid-cols-[1fr_180px]">
                  <div className="flex gap-3 sm:gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] text-sm font-bold text-white shadow-lg shadow-rose-300/40 sm:h-11 sm:w-11">
                      <Star
                        className="h-4 w-4 fill-white/25 text-white sm:h-5 sm:w-5"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)]">
                        {item.date}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-[color:var(--sou-text)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--sou-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <PhotoFrame photo={item} aspect="aspect-[4/3] sm:aspect-square" compact />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasSpotify && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/55 p-4 shadow-2xl shadow-rose-200/40 backdrop-blur sm:rounded-[2rem] sm:p-6">
            <Sparkles className="absolute right-6 top-6 h-5 w-5 text-[color:var(--sou-primary)]/45" />
            <Heart className="absolute -left-5 bottom-8 h-16 w-16 fill-rose-200/30 text-rose-300/40 blur-[0.2px]" />
            <div className="relative mb-5 text-center">
              <h2
                className="text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--sou-font-heading)" }}
              >
                {spotify.sectionTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--sou-muted)]">
                {spotify.subtitle}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-rose-100 bg-[linear-gradient(135deg,#fff7fa,#ffe4ec)] p-4 shadow-inner sm:p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/45 blur-2xl" />
              <div className="relative grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] text-white shadow-2xl shadow-rose-300/45 sm:mx-0">
                  <Heart className="h-10 w-10 fill-white/80" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sou-primary)] sm:tracking-[0.3em]">
                    {spotify.label}
                  </p>
                  <p className="mt-2 break-words text-xl font-semibold text-[color:var(--sou-text)] sm:text-2xl">
                    {spotify.songTitle}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--sou-primary)]/75">
                    {spotify.artist}
                  </p>
                  <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[color:var(--sou-muted)] sm:mx-0">
                    {spotify.note}
                  </p>
                </div>
              </div>
              <div className="relative mt-5 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/72 p-3 shadow-lg shadow-rose-100/50">
                {spotifyEmbedUrl ? (
                  <iframe
                    src={spotifyEmbedUrl}
                    title={`${spotify.songTitle} - ${spotify.artist}`}
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

      {hasPuzzle && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(255,228,235,0.78))] p-5 text-center shadow-2xl shadow-rose-200/40 backdrop-blur sm:rounded-[2rem] sm:p-7">
            <Sparkles className="absolute right-6 top-6 h-5 w-5 text-[color:var(--sou-primary)]/45" />
            <Heart className="absolute -left-5 bottom-6 h-16 w-16 fill-rose-200/30 text-rose-300/40" />
            <div className="relative mx-auto max-w-2xl">
              <h2
                className="text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--sou-font-heading)" }}
              >
                {story.photoPuzzle.title}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--sou-muted)]">
                {story.photoPuzzle.subtitle}
              </p>
              <button
                type="button"
                onClick={() => setShowPuzzle(true)}
                className="mt-6 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-300/45 transition hover:scale-[1.02] sm:w-auto"
              >
                {story.photoPuzzle.buttonText}
              </button>
            </div>
          </div>
        </section>
      )}

      {hasOpenWhenLetters && (
        <section className="relative z-10 mx-auto max-w-5xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mb-9 text-center">
            <h2
              className="text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--sou-font-heading)" }}
            >
              {story.openWhenLetters.sectionTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--sou-muted)]">
              {story.openWhenLetters.sectionSubtitle}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {story.openWhenLetters.items.map((letter, i) => {
              const MotifIcon = letter.iconOrMotif === "sparkle" ? Sparkles : Heart;

              return (
                <button
                  key={letter.title}
                  type="button"
                  onClick={() => setOpenLetterIndex(i)}
                  className="group relative min-h-[12.5rem] overflow-hidden rounded-[1.5rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,228,235,0.72))] p-4 text-left shadow-xl shadow-rose-200/30 backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-rose-300/45 sm:min-h-[14rem] sm:rounded-[1.75rem]"
                >
                  <span className="pointer-events-none absolute inset-x-4 top-4 h-16 rounded-b-[2rem] rounded-t-xl border border-rose-100/80 bg-gradient-to-br from-rose-100/80 via-pink-50/80 to-white/70 shadow-inner transition duration-500 group-hover:translate-y-1" />
                  <span className="relative z-10 flex h-full min-h-[10.5rem] flex-col justify-between rounded-[1.35rem] border border-white/75 bg-white/65 px-4 py-5 sm:min-h-[12rem]">
                    <span>
                      <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-[color:var(--sou-primary)] shadow-sm shadow-rose-200/50">
                        <MotifIcon
                          className={`h-5 w-5 ${letter.iconOrMotif === "heart" ? "fill-rose-300/60" : ""}`}
                        />
                      </span>
                      <span className="block text-base font-semibold leading-snug text-[color:var(--sou-text)]">
                        {letter.title}
                      </span>
                    </span>
                    <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)]">
                      Aç
                      <Heart className="h-3.5 w-3.5 fill-rose-300/60" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {hasVoiceNote && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-rose-100 bg-[color:var(--sou-card)] p-4 shadow-xl shadow-rose-200/35 backdrop-blur sm:rounded-[2rem] sm:p-6">
            <Sparkles className="absolute right-6 top-6 h-5 w-5 text-[color:var(--sou-primary)]/35" />
            <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sou-primary)]/70">
                  {voiceNote.sectionTitle}
                </p>
                <p
                  className="mt-2 text-2xl leading-none text-[color:var(--sou-primary)] sm:text-3xl"
                  style={{ fontFamily: "var(--sou-font-heading)" }}
                >
                  {voiceNote.title}
                </p>
              </div>
              <button
                type="button"
                onClick={playVoiceNote}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-300/45 transition hover:scale-[1.02] sm:w-auto sm:py-4"
              >
                {voicePlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                {voicePlaying
                  ? voiceNote.stopText
                  : voiceTouched
                    ? voiceNote.replayText
                    : voiceNote.playText}
              </button>
            </div>
            <div className="relative mt-5 rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-inner">
              <div className="flex items-end justify-center gap-1.5">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full bg-gradient-to-t from-[color:var(--sou-primary)] to-[color:var(--sou-accent)] transition ${
                      voicePlaying ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: `${14 + ((i * 7) % 34)}px`,
                      opacity: i / 28 <= voiceProgressPct ? 0.9 : 0.28 + (i % 5) * 0.08,
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-[color:var(--sou-primary)]/55">
                <span>{formatVoiceTime(voiceProgress)}</span>
                <span>{formatVoiceTime(voiceDuration)}</span>
              </div>
              {voiceUnavailable && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-[color:var(--sou-muted)] animate-in fade-in slide-in-from-top-1 duration-300">
                  Ses notu henüz eklenmedi.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {hasReasons && (
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          <h2
            className="mb-8 text-center text-3xl text-[color:var(--sou-primary)] sm:mb-10 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--sou-font-heading)" }}
          >
            {story.reasons.reasonsTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {story.reasons.items.map((reason, i) => (
              <div
                key={reason}
                className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-[color:var(--sou-card)] px-4 py-4 shadow-sm shadow-rose-100/40 backdrop-blur"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-semibold text-[color:var(--sou-primary)]">
                  <Sparkles
                    className="h-4 w-4 text-[color:var(--sou-primary)]"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm leading-relaxed text-[color:var(--sou-text)]">
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasCouponQuiz && (
        <section className="relative z-10 mx-auto max-w-5xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="rounded-[1.5rem] border border-white/75 bg-white/55 p-4 shadow-2xl shadow-rose-200/35 backdrop-blur sm:rounded-[2rem] sm:p-5 md:p-8">
            <div className="mb-6 text-center">
              <h2
                className="text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--sou-font-heading)" }}
              >
                {story.couponQuiz.title}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--sou-muted)]">
                {story.couponQuiz.subtitle}
              </p>
            </div>
            <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-rose-100 bg-white/75 p-4 shadow-xl shadow-rose-100/50 sm:rounded-[1.75rem] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--sou-primary)] sm:tracking-[0.35em]">
                {couponIndex + 1} / {story.couponQuiz.questions.length}
              </p>
              <h3 className="mt-3 text-lg font-semibold leading-relaxed text-[color:var(--sou-text)]">
                {story.couponQuiz.questions[couponIndex].question}
              </h3>
              <div className="mt-5 grid gap-3">
                {story.couponQuiz.questions[couponIndex].options.map((option) => {
                  const currentQuestion = story.couponQuiz.questions[couponIndex];
                  const isSelected = selectedCouponAnswer === option;
                  const isCorrect = option === currentQuestion.correctAnswer;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectCouponAnswer(option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        isSelected && isCorrect
                          ? "border-rose-300 bg-rose-100 text-[color:var(--sou-primary)] shadow-md shadow-rose-100"
                          : isSelected
                            ? "border-rose-200 bg-white text-[color:var(--sou-muted)]"
                            : "border-rose-100 bg-white/70 text-[color:var(--sou-text)] hover:border-rose-200 hover:bg-rose-50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {selectedCouponAnswer === story.couponQuiz.questions[couponIndex].correctAnswer && (
                <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] p-[1px] animate-in fade-in zoom-in-95 duration-500">
                  <div className="rounded-2xl bg-white/90 px-5 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--sou-primary)] sm:tracking-[0.35em]">
                      Kupon açıldı
                    </p>
                    <p
                      className="mt-2 text-2xl leading-none text-[color:var(--sou-primary)] sm:text-3xl"
                      style={{ fontFamily: "var(--sou-font-heading)" }}
                    >
                      {story.couponQuiz.questions[couponIndex].reward}
                    </p>
                    {couponIndex < story.couponQuiz.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={goToNextCouponQuestion}
                        className="mt-4 rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)] transition hover:bg-rose-200"
                      >
                        {story.couponQuiz.nextButtonText}
                      </button>
                    ) : (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-[color:var(--sou-primary)]">
                          {story.couponQuiz.completionText}
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          {couponRewards.map((reward) => (
                            <span
                              key={reward}
                              className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-[color:var(--sou-primary)]"
                            >
                              {reward}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {hasCoupleWrapped && (
        <section className="relative z-10 mx-auto max-w-5xl px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,228,235,0.72))] p-4 shadow-2xl shadow-rose-200/40 backdrop-blur sm:rounded-[2rem] sm:p-5 md:p-8">
            <Sparkles className="absolute right-7 top-7 h-6 w-6 text-[color:var(--sou-primary)]/45" />
            <div className="mb-7 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--sou-primary)] sm:tracking-[0.35em]">
                Couple Wrapped
              </p>
              <h2
                className="mt-3 text-3xl leading-tight text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--sou-font-heading)" }}
              >
                {story.coupleWrapped.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--sou-muted)]">
                {story.coupleWrapped.subtitle}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {story.coupleWrapped.stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/75 p-5 shadow-lg shadow-rose-100/50 transition duration-300 hover:-translate-y-1 hover:shadow-rose-200/70"
                >
                  <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-100/70 blur-sm transition group-hover:scale-125" />
                  <span className="relative mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)]">
                    <Heart className="h-3.5 w-3.5 fill-rose-300/70" />
                  </span>
                  <p className="relative text-2xl font-black tracking-normal text-[color:var(--sou-primary)] sm:text-3xl md:text-4xl">
                    {stat.label}
                  </p>
                  <p className="relative mt-3 text-sm leading-relaxed text-[color:var(--sou-muted)]">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasLoveLetter && (
        <section className="relative z-10 mx-auto max-w-5xl px-4 pb-14 sm:px-6 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="grid gap-7 rounded-[1.5rem] border border-rose-200/75 bg-[linear-gradient(180deg,#fffafc,#fff1f6_58%,#fff7fb)] p-4 shadow-xl shadow-rose-200/35 transition duration-700 ease-out hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-rose-200/45 sm:rounded-[2rem] sm:p-6 md:grid-cols-[0.8fr_1.2fr] md:items-center md:p-10">
            <div className="mx-auto w-full max-w-[17rem] sm:max-w-xs">
              <div className="rotate-[-10deg] rounded-[1.5rem] border border-white/80 bg-white/80 p-2.5 shadow-2xl shadow-rose-200/50 sm:p-3">
                <PhotoFrame photo={story.letter.letterSidePhoto} aspect="aspect-[4/5]" large />
                <p
                  className="px-2 pt-3 text-center text-xl leading-none text-[color:var(--sou-primary)] sm:text-2xl"
                  style={{ fontFamily: "var(--sou-font-heading)" }}
                >
                  {story.letter.letterSidePhoto.caption}
                </p>
              </div>
            </div>
            <div className="relative rounded-[1.4rem] border border-white/75 bg-white/55 px-4 py-5 shadow-inner shadow-rose-100/50 sm:rounded-[1.8rem] sm:px-6 sm:py-7">
              <Heart className="absolute -left-8 -top-10 h-10 w-10 fill-rose-300/30 text-rose-400/50 sm:-left-10 sm:-top-12" />
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--sou-primary)] sm:tracking-[0.4em]">
                {story.letter.letterTitle}
              </p>
              <p
                className="mt-5 text-[1rem] leading-8 text-[color:var(--sou-text)]/90 sm:text-lg sm:leading-9 md:text-xl md:leading-10"
                style={{ fontFamily: "var(--sou-font-accent)", fontStyle: "italic" }}
              >
                {story.letter.letterBody}
              </p>
              <p
                className="mt-6 text-right text-2xl text-[color:var(--sou-primary)]"
                style={{ fontFamily: "var(--sou-font-heading)" }}
              >
                — {story.relationship.coupleNames.second}
              </p>
            </div>
          </div>
        </section>
      )}

      {hasFinalSurprise && (
        <section className="relative z-10 mx-auto max-w-xl px-4 pb-20 text-center sm:px-6 sm:pb-24">
          <button
            onClick={() => setShowFinal(true)}
            className="group relative inline-flex flex-col items-center gap-4 rounded-[1.75rem] px-6 py-6 transition hover:bg-white/35 sm:rounded-[2rem] sm:px-8 sm:py-7"
          >
            <span className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-rose-100/40 via-white/20 to-pink-200/35 opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />
            <span className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] text-white shadow-2xl shadow-rose-400/60 transition-transform group-hover:scale-110">
              <Gift className="h-10 w-10 transition-transform duration-500 group-hover:-rotate-6" />
            </span>
            <span className="relative font-medium text-[color:var(--sou-primary)]">
              {story.finalSurprise.finalGiftButtonText}
            </span>
          </button>
        </section>
      )}

      {openLetterIndex !== null && hasOpenWhenLetters && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-rose-950/35 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-300 sm:px-5">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,#fffafc,#fff1f5)] p-4 shadow-2xl shadow-rose-950/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 sm:rounded-[2rem] sm:p-8">
            <button
              type="button"
              onClick={() => setOpenLetterIndex(null)}
              aria-label="Mektubu kapat"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[color:var(--sou-primary)] shadow-sm transition hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="pointer-events-none absolute inset-x-8 top-6 h-24 rounded-b-[2rem] rounded-t-xl border border-rose-100 bg-gradient-to-br from-rose-100 via-pink-50 to-white shadow-inner" />
            <div className="relative mt-10 rounded-[1.35rem] border border-white/80 bg-white/80 px-4 py-5 shadow-xl shadow-rose-100/50 sm:rounded-[1.5rem] sm:px-5 sm:py-6">
              <Heart className="mb-4 h-8 w-8 fill-rose-300/60 text-[color:var(--sou-primary)]" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--sou-primary)] sm:tracking-[0.25em]">
                {story.openWhenLetters.items[openLetterIndex].title}
              </p>
              <p
                className="mt-5 min-h-[7rem] text-xl leading-relaxed text-[color:var(--sou-text)] animate-in fade-in slide-in-from-top-2 duration-500 sm:text-2xl"
                style={{ fontFamily: "var(--sou-font-accent)", fontStyle: "italic" }}
              >
                {typedLetterMessage}
                {typedLetterMessage.length <
                  story.openWhenLetters.items[openLetterIndex].message.length && (
                  <span className="ml-1 inline-block h-6 w-px translate-y-1 bg-[color:var(--sou-primary)] animate-pulse" />
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {showPuzzle && hasPuzzle && (
        <PhotoPuzzleGame
          imageUrl={story.photoPuzzle.imageUrl}
          title={story.photoPuzzle.title}
          subtitle={story.photoPuzzle.subtitle}
          completionTitle={story.photoPuzzle.completionTitle}
          completionMessage={story.photoPuzzle.completionMessage}
          onClose={() => setShowPuzzle(false)}
        />
      )}

      {showFinal && hasFinalSurprise && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-rose-950/45 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-500 sm:px-5">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--sou-primary)] via-[color:var(--sou-secondary)] to-rose-500 p-6 text-center text-white shadow-2xl shadow-rose-950/40 ring-1 ring-white/40 animate-in fade-in zoom-in-95 duration-700 sm:p-10">
            <style>{`
              @keyframes sou-final-float {
                from { opacity: 0; transform: translate3d(0, 34px, 0) rotate(var(--final-rotate)) scale(0.82); }
                18% { opacity: var(--final-opacity); }
                to { opacity: 0; transform: translate3d(var(--final-drift), -126px, 0) rotate(calc(var(--final-rotate) + 28deg)) scale(1.18); }
              }
            `}</style>
            <button
              type="button"
              onClick={() => setShowFinal(false)}
              aria-label="Sürprizi kapat"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white shadow-sm transition hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.32),transparent_34%),radial-gradient(circle_at_12%_90%,rgba(255,255,255,0.18),transparent_30%)]" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-black/10" />
            <div className="pointer-events-none absolute inset-0">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((spark) => (
                <Heart
                  key={spark}
                  className="absolute fill-white/50 text-white/60 drop-shadow"
                  style={
                    {
                      left: `${8 + spark * 10}%`,
                      bottom: `${spark % 2 === 0 ? 7 : 17}%`,
                      width: `${14 + (spark % 3) * 4}px`,
                      height: `${14 + (spark % 3) * 4}px`,
                      animation: `sou-final-float ${4.6 + spark * 0.28}s ease-in-out ${spark * 0.18}s infinite`,
                      "--final-drift": `${spark % 2 === 0 ? 34 : -30}px`,
                      "--final-rotate": `${spark % 2 === 0 ? -14 : 18}deg`,
                      "--final-opacity": `${0.42 + (spark % 3) * 0.12}`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <Heart className="relative mx-auto mb-5 h-8 w-8 text-white/80 animate-in fade-in zoom-in duration-700" />
            <p className="relative text-xs uppercase tracking-[0.28em] text-white/80 sm:tracking-[0.4em]">
              {story.finalSurprise.finalLabel}
            </p>
            <p
              className="relative mt-6 text-2xl leading-relaxed drop-shadow-sm animate-in fade-in zoom-in-95 duration-1000 sm:text-3xl md:text-4xl"
              style={{ fontFamily: "var(--sou-font-heading)" }}
            >
              {typedFinalNote}
              {typedFinalNote.length < story.finalSurprise.finalSecretNote.length && (
                <span className="ml-1 inline-block h-7 w-px translate-y-1 bg-white/85 animate-pulse" />
              )}
            </p>
            <p className="relative mt-6 text-sm text-white/80 animate-in fade-in slide-in-from-bottom-2 duration-1000">
              {story.letter.signaturePrefix}, {story.relationship.coupleNames.second}
            </p>
          </div>
        </div>
      )}

      <FooterSignature footer={story.footer} />
    </div>
  );
}

function PhotoPuzzleGame({
  imageUrl,
  title,
  subtitle,
  completionTitle,
  completionMessage,
  onClose,
}: {
  imageUrl: string;
  title: string;
  subtitle: string;
  completionTitle: string;
  completionMessage: string;
  onClose: () => void;
}) {
  const pieceIndexes = [0, 1, 2, 3, 4, 5];
  const emptyBoard = () => Array.from({ length: 6 }, () => null) as Array<number | null>;
  const getPuzzleCoords = (index: number) => ({
    row: Math.floor(index / 3),
    col: index % 3,
  });
  const correctNeighborPairs = pieceIndexes.flatMap((piece) => {
    const { row, col } = getPuzzleCoords(piece);
    return pieceIndexes
      .filter((otherPiece) => {
        if (otherPiece <= piece) return false;
        const otherCoords = getPuzzleCoords(otherPiece);
        return Math.abs(row - otherCoords.row) + Math.abs(col - otherCoords.col) === 1;
      })
      .map((otherPiece) => [piece, otherPiece] as const);
  });

  function createShuffleAttempt() {
    const shuffled = [...pieceIndexes];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }

  function scoreShuffleLayout(layout: number[]) {
    const shuffledPositions = new Map<number, { row: number; col: number }>();

    layout.forEach((piece, shuffledIndex) => {
      shuffledPositions.set(piece, getPuzzleCoords(shuffledIndex));
    });

    return (
      correctNeighborPairs.reduce((score, [firstPiece, secondPiece]) => {
        const firstPosition = shuffledPositions.get(firstPiece);
        const secondPosition = shuffledPositions.get(secondPiece);

        if (!firstPosition || !secondPosition) return score;

        const distance =
          Math.abs(firstPosition.row - secondPosition.row) +
          Math.abs(firstPosition.col - secondPosition.col);
        const sameOriginalOrder =
          layout.indexOf(firstPiece) < layout.indexOf(secondPiece) &&
          secondPiece - firstPiece === 1;

        if (distance === 1) return score + (sameOriginalOrder ? 14 : 10);
        if (distance === 2) return score + 3;
        return score;
      }, 0) +
      layout.reduce((score, piece, shuffledIndex) => score + (piece === shuffledIndex ? 2 : 0), 0)
    );
  }

  function shufflePieces() {
    let bestLayout = createShuffleAttempt();
    let bestScore = scoreShuffleLayout(bestLayout);

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const nextLayout = createShuffleAttempt();
      const nextScore = scoreShuffleLayout(nextLayout);

      if (nextScore < bestScore) {
        bestLayout = nextLayout;
        bestScore = nextScore;
      }

      if (bestScore === 0) break;
    }

    return bestLayout;
  }
  const [trayPieces, setTrayPieces] = useState(() => shufflePieces());
  const [boardSlots, setBoardSlots] = useState<Array<number | null>>(() => emptyBoard());
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [snappedSlots, setSnappedSlots] = useState<number[]>([]);
  const snapTimers = useRef<number[]>([]);

  useEffect(() => {
    setCompleted(boardSlots.every((piece, index) => piece === index));
  }, [boardSlots]);

  useEffect(() => {
    const timers = snapTimers.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!showHint) return;

    const timer = window.setTimeout(() => setShowHint(false), 1600);
    return () => window.clearTimeout(timer);
  }, [showHint]);

  function celebrateSlot(slotIndex: number) {
    setSnappedSlots((slots) => (slots.includes(slotIndex) ? slots : [...slots, slotIndex]));
    const timer = window.setTimeout(() => {
      setSnappedSlots((slots) => slots.filter((slot) => slot !== slotIndex));
    }, 720);
    snapTimers.current.push(timer);
  }

  function resetPuzzle() {
    setTrayPieces(shufflePieces());
    setBoardSlots(emptyBoard());
    setSelectedPiece(null);
    setCompleted(false);
    setShowHint(false);
    setSnappedSlots([]);
  }

  function placePiece(slotIndex: number) {
    const slotPiece = boardSlots[slotIndex];

    if (selectedPiece === null) {
      if (slotPiece !== null) {
        setBoardSlots((slots) => slots.map((piece, index) => (index === slotIndex ? null : piece)));
        setSelectedPiece(slotPiece);
      }
      return;
    }

    setBoardSlots((slots) => {
      const nextSlots = [...slots];
      const previousSlot = nextSlots.indexOf(selectedPiece);

      if (previousSlot !== -1) {
        nextSlots[previousSlot] = slotPiece;
      }

      nextSlots[slotIndex] = selectedPiece;
      return nextSlots;
    });
    if (selectedPiece === slotIndex) {
      celebrateSlot(slotIndex);
    }
    setSelectedPiece(null);
  }

  function getPiecePosition(piece: number) {
    const col = piece % 3;
    const row = Math.floor(piece / 3);
    return `${col * 50}% ${row * 100}%`;
  }

  const availablePieces = trayPieces.filter((piece) => !boardSlots.includes(piece));

  return (
    <div className="fixed inset-0 z-40 overflow-x-hidden overflow-y-auto bg-rose-950/45 px-4 py-6 backdrop-blur-sm animate-in fade-in duration-300 sm:px-5">
      <style>{`
        @keyframes sou-puzzle-glint {
          0% { transform: translateX(-150%) skewX(-18deg); opacity: 0; }
          18% { opacity: 0.75; }
          100% { transform: translateX(160%) skewX(-18deg); opacity: 0; }
        }

        @keyframes sou-puzzle-snap {
          0% { transform: scale(0.96); filter: saturate(0.9); }
          48% { transform: scale(1.035); filter: saturate(1.12); }
          100% { transform: scale(1); filter: saturate(1); }
        }

        @keyframes sou-puzzle-check {
          0% { opacity: 0; transform: translateY(-4px) scale(0.74); box-shadow: 0 0 0 rgba(251, 113, 133, 0); }
          64% { opacity: 1; transform: translateY(0) scale(1.08); box-shadow: 0 10px 24px rgba(251, 113, 133, 0.34); }
          100% { opacity: 1; transform: translateY(0) scale(1); box-shadow: 0 8px 18px rgba(251, 113, 133, 0.24); }
        }

        @keyframes sou-puzzle-photo-reveal {
          0% { opacity: 0; transform: scale(0.985); filter: blur(5px) saturate(0.95); }
          60% { opacity: 1; transform: scale(1.012); filter: blur(0) saturate(1.08); }
          100% { opacity: 1; transform: scale(1); filter: blur(0) saturate(1.03); }
        }

        @keyframes sou-puzzle-shine {
          0% { transform: translateX(-140%) skewX(-20deg); opacity: 0; }
          24% { opacity: 0.55; }
          100% { transform: translateX(145%) skewX(-20deg); opacity: 0; }
        }

        @keyframes sou-puzzle-reward {
          0% { opacity: 0; transform: translateY(14px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div className="mx-auto min-h-full max-w-4xl py-4">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,#fffafc,#fff1f5)] p-4 shadow-2xl shadow-rose-950/25 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 sm:rounded-[2.25rem] sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)] shadow-sm transition hover:bg-white"
          >
            Geri dön
          </button>

          <Heart className="absolute -left-6 top-12 h-20 w-20 fill-rose-200/30 text-rose-300/40" />
          <Sparkles className="absolute bottom-8 right-8 h-5 w-5 text-[color:var(--sou-primary)]/40" />

          <div className="relative pr-20 text-center sm:pr-28">
            <h2
              className="text-3xl text-[color:var(--sou-primary)] sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--sou-font-heading)" }}
            >
              {title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--sou-muted)]">
              {subtitle}
            </p>
          </div>

          <div className="relative mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <div className="relative overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white/65 p-3 shadow-xl shadow-rose-100/50">
                {showHint && (
                  <div
                    className="pointer-events-none absolute inset-3 z-0 rounded-[1.15rem] bg-cover bg-center opacity-25 blur-[0.2px] animate-in fade-in duration-300"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                )}
                <div className="relative">
                  <div
                    className={`relative z-10 grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1.5 transition-all duration-700 sm:gap-2 ${
                      completed ? "scale-[0.985] opacity-0" : "opacity-100"
                    }`}
                  >
                    {boardSlots.map((piece, slotIndex) => {
                      const isCorrect = piece === slotIndex;
                      const isSnapped = snappedSlots.includes(slotIndex);

                      return (
                        <button
                          key={slotIndex}
                          type="button"
                          onClick={() => placePiece(slotIndex)}
                          className={`relative overflow-hidden rounded-xl border text-left transition-all duration-300 active:scale-[0.98] ${
                            piece === null
                              ? "border-dashed border-rose-300/80 bg-white/45 shadow-inner hover:bg-white/65"
                              : isCorrect
                                ? "border-rose-200/80 bg-white shadow-lg shadow-rose-200/70"
                                : "border-white/90 bg-white shadow-md shadow-rose-100/60 hover:border-rose-200"
                          } ${isSnapped ? "ring-4 ring-rose-300/45 animate-[sou-puzzle-snap_420ms_ease-out]" : ""}`}
                          aria-label={`Puzzle slot ${slotIndex + 1}`}
                        >
                          {piece === null ? (
                            <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-rose-300/80">
                              {slotIndex + 1}
                            </span>
                          ) : (
                            <>
                              <PuzzlePiece imageUrl={imageUrl} position={getPiecePosition(piece)} />
                              {isCorrect && (
                                <>
                                  <span className="pointer-events-none absolute inset-1 rounded-lg ring-1 ring-white/65" />
                                  <span className="pointer-events-none absolute right-1.5 top-1.5 z-20 grid h-6 w-6 place-items-center rounded-full border border-rose-200/90 bg-rose-50/95 text-rose-600 shadow-rose-200/50 backdrop-blur-sm animate-[sou-puzzle-check_360ms_ease-out_forwards] sm:right-2 sm:top-2 sm:h-7 sm:w-7">
                                    <Check className="h-3.5 w-3.5 stroke-[3] sm:h-4 sm:w-4" />
                                  </span>
                                </>
                              )}
                              {isSnapped && (
                                <>
                                  <span className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.76)_46%,transparent_68%)] animate-[sou-puzzle-glint_680ms_ease-out_forwards]" />
                                  <Sparkles className="pointer-events-none absolute right-2 top-2 z-20 h-4 w-4 text-rose-400 drop-shadow-sm animate-ping" />
                                </>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {completed && (
                    <div
                      className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[1.15rem] border border-white/85 bg-cover bg-center shadow-2xl shadow-rose-200/60 animate-[sou-puzzle-photo-reveal_950ms_ease-out_forwards]"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/5 via-transparent to-white/18" />
                      <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.72)_48%,transparent_72%)] animate-[sou-puzzle-shine_1400ms_ease-out_350ms_forwards]" />
                      <Sparkles className="absolute right-4 top-4 h-5 w-5 text-white/85 drop-shadow" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={resetPuzzle}
                  className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)] transition hover:bg-rose-200"
                >
                  Yeniden karıştır
                </button>
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sou-primary)] shadow-sm transition hover:bg-white"
                >
                  İpucu göster
                </button>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-rose-100 bg-white/65 p-4 shadow-xl shadow-rose-100/45">
              {/* <p className="text-xs font-semibold tracking-[0.25em] text-[color:var(--sou-primary)]">
                anılarımızı birleştir bakalımm
              </p> */}

              {/* <p className="mt-2 text-sm leading-relaxed text-[color:var(--sou-muted)]">
                Bir parçaya dokun, sonra üstteki boş alana yerleştir.
              </p>  */}

              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {availablePieces.map((piece) => (
                  <button
                    key={piece}
                    type="button"
                    onClick={() =>
                      setSelectedPiece((current) => (current === piece ? null : piece))
                    }
                    className={`aspect-square overflow-hidden rounded-xl border bg-white p-1 shadow-md shadow-rose-100/50 transition-all duration-300 active:scale-95 ${
                      selectedPiece === piece
                        ? "border-[color:var(--sou-primary)] -translate-y-0.5 ring-4 ring-rose-300/45 shadow-lg shadow-rose-200/60"
                        : "border-white/90 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/70"
                    }`}
                    aria-label={`Puzzle parçası ${piece + 1}`}
                  >
                    <PuzzlePiece imageUrl={imageUrl} position={getPiecePosition(piece)} />
                  </button>
                ))}
              </div>
              {completed && (
                <div className="relative mt-5 overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[color:var(--sou-primary)] via-rose-400 to-[color:var(--sou-secondary)] p-[1px] shadow-2xl shadow-rose-200/70 animate-[sou-puzzle-reward_520ms_ease-out_forwards]">
                  <div className="relative overflow-hidden rounded-[1.55rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,241,246,0.93))] px-4 py-6 text-center sm:px-5">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,182,193,0.32),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.72),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(244,114,182,0.16),transparent_42%)]" />
                    <div className="pointer-events-none absolute inset-0">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((heart) => (
                        <Heart
                          key={heart}
                          className="absolute h-3 w-3 fill-rose-300/60 text-rose-400/70"
                          style={{
                            left: `${10 + heart * 11}%`,
                            top: `${heart % 2 === 0 ? 12 : 78}%`,
                            transform: `rotate(${heart % 2 === 0 ? -14 : 16}deg)`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/85 text-[color:var(--sou-primary)] shadow-lg shadow-rose-200/70">
                      <Heart className="h-6 w-6 fill-rose-300 text-rose-400" />
                      <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-rose-400" />
                    </div>
                    <p
                      className="relative mt-4 text-3xl leading-none text-[color:var(--sou-primary)] drop-shadow-sm"
                      style={{ fontFamily: "var(--sou-font-heading)" }}
                    >
                      {completionTitle}
                    </p>
                    <p className="relative mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[color:var(--sou-muted)]">
                      {completionMessage}
                    </p>
                    <button
                      type="button"
                      onClick={resetPuzzle}
                      className="relative mt-5 rounded-full bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-rose-300/45 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-300/55 active:scale-95"
                    >
                      Tekrar Oyna
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PuzzlePiece({ imageUrl, position }: { imageUrl: string; position: string }) {
  return (
    <span
      className="block h-full w-full rounded-lg bg-cover shadow-inner"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: position,
        backgroundSize: "300% 200%",
      }}
    />
  );
}

function DemoDisclaimerBanner() {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pt-5 sm:px-6 sm:pt-6">
      <div className="rounded-[1.25rem] border border-white/70 bg-white/65 px-4 py-3 text-center text-xs leading-5 text-[color:var(--sou-text)]/70 shadow-lg shadow-rose-100/35 backdrop-blur sm:rounded-[1.5rem] sm:px-5 sm:py-4 sm:text-sm sm:leading-6">
        <p>
          <span className="font-semibold text-[color:var(--sou-primary)]">Demo notu: </span>
          {storyOfUsDemoCtaConfig.disclaimerText}
        </p>
        <a
          href={storyOfUsDemoCtaConfig.checkoutPath}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-[color:var(--sou-primary)] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-200/50 transition hover:scale-[1.02] sm:text-sm"
        >
          {storyOfUsDemoCtaConfig.demoPaymentCtaLabel}
        </a>
      </div>
    </section>
  );
}

function clearRevealTimers(timers: Array<ReturnType<typeof window.setTimeout>>) {
  timers.forEach((timer) => window.clearTimeout(timer));
}

function preloadCriticalImages(urls: string[]) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const uniqueUrls = Array.from(
    new Set(urls.map((url) => url.trim()).filter((url) => url.length > 0)),
  );

  if (uniqueUrls.length === 0) {
    return Promise.resolve();
  }

  return Promise.allSettled(uniqueUrls.map((url) => preloadCriticalImage(url))).then(() => {});
}

function preloadCriticalImage(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;

    function settle() {
      if (settled) return;
      settled = true;
      resolve();
    }

    function settleAfterDecode() {
      if (typeof image.decode !== "function") {
        settle();
        return;
      }

      void image.decode().then(settle).catch(settle);
    }

    image.onload = settleAfterDecode;
    image.onerror = settle;
    image.decoding = "async";
    image.src = url;

    if (image.complete) {
      settleAfterDecode();
    }
  });
}

function IntroGate({
  intro,
  accessPin,
  accessPinHint,
  verifyAccessPin,
  criticalImageUrls,
  themeStyle,
  decor,
  onEnter,
}: {
  intro: typeof demoStoryData.intro;
  accessPin?: string;
  accessPinHint?: string;
  verifyAccessPin?: (pin: string) => Promise<boolean | { ok: boolean; message?: string }>;
  criticalImageUrls: string[];
  themeStyle: CSSProperties;
  decor: typeof demoStoryData.decor;
  onEnter: () => void;
}) {
  const [opening, setOpening] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const pinInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const heartRevealDurationMs = 2400;
  const maximumRevealWaitMs = 5000;
  const revealStartedRef = useRef(false);
  const revealCompletedRef = useRef(false);
  const mountedRef = useRef(false);
  const revealTimersRef = useRef<Array<ReturnType<typeof window.setTimeout>>>([]);
  const normalizedAccessPin = accessPin?.replace(/\D/g, "").slice(0, 4) ?? "";
  const hasAccessPin = normalizedAccessPin.length === 4 || Boolean(verifyAccessPin);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearRevealTimers(revealTimersRef.current);
      revealTimersRef.current = [];
    };
  }, []);

  function waitForRevealTimer(delayMs: number) {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        revealTimersRef.current = revealTimersRef.current.filter(
          (activeTimer) => activeTimer !== timer,
        );
        resolve();
      }, delayMs);

      revealTimersRef.current.push(timer);
    });
  }

  function finishHeartReveal() {
    if (revealCompletedRef.current || !mountedRef.current) return;

    revealCompletedRef.current = true;
    clearRevealTimers(revealTimersRef.current);
    revealTimersRef.current = [];
    onEnter();
  }

  function startHeartReveal() {
    if (revealStartedRef.current) return;

    revealStartedRef.current = true;
    setPinModalOpen(false);
    setOpening(true);

    const minimumRevealWait = waitForRevealTimer(
      Math.max(intro.openingDoneDelayMs, heartRevealDurationMs),
    );
    const maximumRevealWait = waitForRevealTimer(maximumRevealWaitMs);
    const criticalImagePreload = preloadCriticalImages(criticalImageUrls);

    void Promise.all([
      minimumRevealWait,
      Promise.race([criticalImagePreload, maximumRevealWait]),
    ]).then(finishHeartReveal);
  }

  function openGift() {
    if (opening) return;
    if (!hasAccessPin) {
      startHeartReveal();
      return;
    }
    setPinModalOpen(true);
    setPinError(false);
    window.setTimeout(() => pinInputRefs.current[0]?.focus(), 80);
  }

  function updatePinDigit(index: number, value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4 - index);
    if (!digits) {
      setPinValue((current) => current.slice(0, index));
      setPinError(false);
      return;
    }

    setPinValue((current) => {
      const nextDigits = current.padEnd(4, " ").split("");
      digits.split("").forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
      return nextDigits.join("").replace(/\s/g, "").slice(0, 4);
    });
    setPinError(false);

    const nextIndex = Math.min(index + digits.length, 3);
    window.setTimeout(() => pinInputRefs.current[nextIndex]?.focus(), 20);
  }

  function handlePinKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && index > 0) {
      if (pinValue[index]) {
        setPinValue((current) => current.slice(0, index));
        setPinError(false);
      }
      event.preventDefault();
      pinInputRefs.current[index - 1]?.focus();
    }
  }

  async function submitPin(e?: React.FormEvent) {
    e?.preventDefault();
    if (pinSubmitting) return;

    if (verifyAccessPin) {
      setPinSubmitting(true);

      try {
        const result = await verifyAccessPin(pinValue);
        const isUnlocked = typeof result === "boolean" ? result : result.ok;

        if (isUnlocked) {
          startHeartReveal();
          return;
        }
      } catch {
        // Keep the visible unlock error generic.
      } finally {
        setPinSubmitting(false);
      }

      setPinError(true);
      setPinValue("");
      window.setTimeout(() => pinInputRefs.current[0]?.focus(), 80);
      return;
    }

    if (pinValue === normalizedAccessPin) {
      startHeartReveal();
      return;
    }
    setPinError(true);
    setPinValue("");
    window.setTimeout(() => pinInputRefs.current[0]?.focus(), 80);
  }

  return (
    <div
      style={themeStyle}
      className="relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,var(--sou-bg)_0%,var(--sou-bg-end)_100%)] px-4 sm:px-6"
    >
      <FloatingDecor decor={decor} />
      {opening && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.88),rgba(255,209,222,0.72)_48%,rgba(255,245,247,0.9)_100%)] animate-in fade-in duration-500">
          <div className="relative h-56 w-56 rounded-full bg-white/35 blur-2xl animate-pulse" />
          <div className="absolute inset-x-6 top-1/2 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent animate-[sou-reveal_1500ms_ease-out_forwards]" />
        </div>
      )}

      <div
        className={`relative z-20 text-center transition-all duration-700 ${opening ? "scale-105 opacity-0" : "opacity-100"}`}
      >
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--sou-primary)] sm:mb-6 sm:tracking-[0.35em]">
          StoryOfUs
        </p>
        <h1
          className="text-4xl text-[color:var(--sou-primary)] sm:text-5xl md:text-7xl"
          style={{ fontFamily: "var(--sou-font-heading)" }}
        >
          {intro.introTitle}
        </h1>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--sou-primary)] sm:text-sm sm:tracking-[0.35em]">
          {intro.introSubtitle}
        </p>
        <button
          onClick={openGift}
          disabled={opening}
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] px-6 py-3.5 text-sm font-medium text-white shadow-xl shadow-rose-400/50 transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-90 sm:mt-10 sm:px-8 sm:py-4 sm:text-base"
        >
          <Heart className="h-5 w-5 fill-white" /> {intro.introButtonText}
        </button>
      </div>

      {pinModalOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-rose-950/30 px-4 backdrop-blur-md animate-in fade-in duration-300">
          <form
            onSubmit={submitPin}
            className={`relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,241,246,0.92))] p-5 text-center shadow-2xl shadow-rose-950/20 animate-in fade-in zoom-in-95 duration-300 sm:p-6 ${
              pinError ? "animate-[sou-pin-shake_420ms_ease-in-out]" : ""
            }`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(244,114,182,0.22),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.82),transparent_26%)]" />
            <Heart className="pointer-events-none absolute -left-5 top-8 h-16 w-16 fill-rose-200/45 text-rose-300/50" />
            <Sparkles className="pointer-events-none absolute right-6 top-6 h-5 w-5 text-[color:var(--sou-primary)]/45" />

            <div className="relative">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-[color:var(--sou-primary)] shadow-lg shadow-rose-200/60">
                <Heart className="h-6 w-6 fill-rose-300 text-rose-500" />
              </div>
              <h2
                className="mx-auto mt-4 max-w-xs text-3xl leading-tight text-[color:var(--sou-primary)]"
                style={{ fontFamily: "var(--sou-font-heading)" }}
              >
                {intro.passwordModalTitle}
              </h2>

              <div className="relative mx-auto mt-6 grid max-w-[17rem] grid-cols-4 gap-2.5 sm:gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      pinInputRefs.current[index] = node;
                    }}
                    value={pinValue[index] ?? ""}
                    onChange={(e) => updatePinDigit(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Şifre rakamı ${index + 1}`}
                    className={`h-14 w-full rounded-2xl border bg-white/85 text-center text-2xl font-semibold text-[color:var(--sou-primary)] shadow-inner outline-none transition-all duration-200 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-200/60 sm:h-16 ${
                      pinValue[index] ? "border-rose-300 shadow-rose-100/80" : "border-rose-200/80"
                    } ${pinError ? "border-rose-400 bg-rose-50" : ""}`}
                  />
                ))}
              </div>

              {accessPinHint?.trim() && (
                <p className="mx-auto mt-4 max-w-xs rounded-2xl border border-rose-100 bg-white/70 px-4 py-3 text-sm leading-relaxed text-[color:var(--sou-muted)] shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                  <span className="font-semibold text-[color:var(--sou-primary)]">İpucu:</span>{" "}
                  {accessPinHint}
                </p>
              )}

              {pinError && (
                <p className="mt-3 rounded-full bg-rose-50 px-4 py-2 text-xs font-medium text-[color:var(--sou-primary)] animate-in fade-in slide-in-from-top-1 duration-200">
                  {intro.wrongPasswordMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={pinValue.length !== 4 || pinSubmitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[color:var(--sou-primary)] to-[color:var(--sou-secondary)] px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-300/45 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Heart className="h-4 w-4 fill-white" /> Sürprizi aç
              </button>
            </div>
          </form>
        </div>
      )}

      {opening && (
        <div className="absolute bottom-14 z-20 flex flex-col items-center gap-[30px] text-center animate-in fade-in slide-in-from-bottom-2 duration-500 sm:bottom-16">
          <div className="relative grid h-32 w-32 place-items-center sm:h-36 sm:w-36">
            <svg
              viewBox="0 0 120 120"
              role="img"
              aria-label=""
              className="h-full w-full overflow-visible drop-shadow-[0_16px_30px_rgba(225,29,72,0.22)]"
            >
              <defs>
                <linearGradient
                  id="souIntroHeartFill"
                  x1="20"
                  y1="18"
                  x2="98"
                  y2="104"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="var(--sou-accent)" stopOpacity="0.52" />
                  <stop offset="58%" stopColor="var(--sou-secondary)" stopOpacity="0.62" />
                  <stop offset="100%" stopColor="var(--sou-primary)" stopOpacity="0.72" />
                </linearGradient>
                <linearGradient
                  id="souIntroHeartShine"
                  x1="24"
                  y1="96"
                  x2="98"
                  y2="18"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="45%" stopColor="white" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                className="sou-intro-heart-fill"
                d="M60 101C33 78 18 62 18 42c0-14 10-24 23-24 8 0 15 4 19 11 4-7 11-11 19-11 13 0 23 10 23 24 0 20-15 36-42 59Z"
                fill="url(#souIntroHeartFill)"
              />
              <path
                className="sou-intro-heart-outline"
                d="M60 101C33 78 18 62 18 42c0-14 10-24 23-24 8 0 15 4 19 11 4-7 11-11 19-11 13 0 23 10 23 24 0 20-15 36-42 59Z"
                fill="none"
                stroke="var(--sou-primary)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4.5"
              />
              <path
                className="sou-intro-heart-shine"
                d="M36 82C48 67 63 52 84 34"
                fill="none"
                stroke="url(#souIntroHeartShine)"
                strokeLinecap="round"
                strokeWidth="9"
              />
            </svg>
            <span className="pointer-events-none absolute inset-5 rounded-full bg-white/35 blur-xl animate-[sou-heart-glow_2300ms_ease-out_forwards]" />
          </div>
          <div className="max-w-[calc(100vw-2rem)] rounded-full border border-white/70 bg-white/65 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--sou-primary)] shadow-lg shadow-rose-200/40 backdrop-blur sm:px-5 sm:tracking-[0.25em]">
            {intro.openingText}
          </div>
        </div>
      )}

      <style>{`
        @keyframes sou-reveal {
          0% { transform: scaleX(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        @keyframes sou-heart-draw {
          from { stroke-dashoffset: 310; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes sou-heart-fill {
          from { opacity: 0; transform: scale(0.84); }
          45% { opacity: 0.42; }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes sou-heart-shine {
          0%, 66% { opacity: 0; stroke-dashoffset: 96; }
          76% { opacity: 0.95; }
          100% { opacity: 0; stroke-dashoffset: -96; }
        }
        @keyframes sou-heart-glow {
          0% { opacity: 0; transform: scale(0.85); }
          62% { opacity: 0.28; transform: scale(1); }
          82% { opacity: 0.62; transform: scale(1.18); }
          100% { opacity: 0.18; transform: scale(1.05); }
        }
        @keyframes sou-pin-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(3px); }
        }
        .sou-intro-heart-outline {
          stroke-dasharray: 310;
          stroke-dashoffset: 310;
          animation: sou-heart-draw 1600ms ease-in-out forwards;
          filter: drop-shadow(0 0 10px rgba(225, 29, 72, 0.2));
        }
        .sou-intro-heart-fill {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: sou-heart-fill 1600ms ease-in-out forwards;
        }
        .sou-intro-heart-shine {
          opacity: 0;
          stroke-dasharray: 42 96;
          stroke-dashoffset: 96;
          animation: sou-heart-shine 2300ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function HeroPhotoCard({
  photo,
  rotation,
  className = "",
}: {
  photo: { src: string; alt: string; caption: string; placeholder: string };
  rotation: string;
  className?: string;
}) {
  return (
    <div
      className={`relative z-0 w-24 shrink-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-700 ${rotation} ${className} sm:w-[120px] md:w-[150px]`}
    >
      <div className="rounded-2xl border border-white/80 bg-white/85 p-2 shadow-2xl shadow-rose-200/60 backdrop-blur">
        <PhotoFrame
          photo={{ photoSrc: photo.src, photoAlt: photo.alt, placeholder: photo.placeholder }}
          aspect="aspect-[4/5]"
          compact
          loading="eager"
        />
      </div>
    </div>
  );
}

function PhotoFrame({
  photo,
  aspect,
  large = false,
  compact = false,
  loading = "lazy",
}: {
  photo: { photoSrc?: string; src?: string; photoAlt?: string; alt?: string; placeholder: string };
  aspect: string;
  large?: boolean;
  compact?: boolean;
  loading?: "eager" | "lazy";
}) {
  const src = photo.photoSrc ?? photo.src;
  const alt = photo.photoAlt ?? photo.alt ?? "";

  return (
    <div
      className={`relative overflow-hidden rounded-[1.1rem] ${aspect} ${src ? "bg-rose-100" : `bg-gradient-to-br ${photo.placeholder}`}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          width={1000}
          height={1250}
          loading={loading}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.78),transparent_35%),radial-gradient(circle_at_75%_80%,rgba(255,255,255,0.45),transparent_32%)]" />
          <div
            className={`${large ? "h-20 w-20" : compact ? "h-10 w-10" : "h-14 w-14"} absolute -right-5 -top-5 rounded-full bg-white/35 blur-sm`}
          />
          <Heart className="absolute right-3 top-3 h-4 w-4 fill-white/60 text-white/80" />
        </>
      )}
    </div>
  );
}

function FloatingDecor({ decor }: { decor: typeof demoStoryData.decor }) {
  const items = Array.from({ length: decor.density }).map((_, i) => ({
    left: (i * 17 + 7) % 100,
    top: (i * 23 + 11) % 100,
    size: 14 + ((i * 7) % 30),
    opacity: 0.18 + (i % 5) * 0.08,
    duration: 16 + ((i * 5) % 18),
    delay: -((i * 1.7) % 18),
    rotation: (i * 31) % 360,
    driftX: i % 2 === 0 ? 42 : -34,
    driftY: -(90 + ((i * 9) % 90)),
  }));
  const motif = decorMotifs[decor.decorStyle] ?? decorMotifs.hearts;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style>{`
        @keyframes sou-drift {
          0% {
            transform: translate3d(0, 40px, 0) rotate(var(--sou-rot)) scale(0.82);
            opacity: 0;
          }
          12% {
            opacity: var(--sou-opacity);
          }
          52% {
            transform: translate3d(calc(var(--sou-drift-x) * 0.45), calc(var(--sou-drift-y) * 0.48), 0)
              rotate(calc(var(--sou-rot) + 120deg)) scale(1.08);
            opacity: calc(var(--sou-opacity) * 0.82);
          }
          100% {
            transform: translate3d(var(--sou-drift-x), var(--sou-drift-y), 0)
              rotate(calc(var(--sou-rot) + 270deg)) scale(0.92);
            opacity: 0;
          }
        }
      `}</style>
      {items.map((item, i) => {
        const style = {
          left: `${item.left}%`,
          top: `${item.top}%`,
          width: `${item.size}px`,
          height: `${item.size}px`,
          animation: `sou-drift ${item.duration}s ease-in-out ${item.delay}s infinite`,
          "--sou-opacity": item.opacity,
          "--sou-rot": `${item.rotation}deg`,
          "--sou-drift-x": `${item.driftX}px`,
          "--sou-drift-y": `${item.driftY}px`,
        } as CSSProperties;

        if (motif.kind === "heart") {
          return (
            <Heart
              key={i}
              className="absolute fill-rose-400 text-rose-400 blur-[0.1px] drop-shadow-[0_0_12px_rgba(244,114,182,0.38)]"
              style={style}
            />
          );
        }

        if (motif.kind === "sparkle") {
          return (
            <Sparkles
              key={i}
              className="absolute text-rose-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.32)]"
              style={style}
            />
          );
        }

        return (
          <span
            key={i}
            className="absolute grid place-items-center text-rose-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.28)]"
            style={{ ...style, fontSize: `${item.size}px` }}
            aria-hidden="true"
          >
            {motif.symbol}
          </span>
        );
      })}
    </div>
  );
}

const decorMotifs: Record<DecorStyle, { kind: "heart" | "sparkle" | "symbol"; symbol?: string }> = {
  hearts: { kind: "heart" },
  stars: { kind: "sparkle" },
  capybara: { kind: "symbol", symbol: "♡" },
  cat: { kind: "symbol", symbol: "✦" },
  dog: { kind: "symbol", symbol: "✧" },
  panda: { kind: "symbol", symbol: "❀" },
};

function FooterSignature({ footer }: { footer: typeof demoStoryData.footer }) {
  return (
    <footer className="relative z-10 flex items-center justify-center gap-1.5 pb-10 text-center text-[11px] text-[color:var(--sou-muted)]">
      <img
        src={footer.iconSrc}
        alt=""
        aria-hidden="true"
        className="h-4 w-4 object-contain opacity-70"
      />
      <span>
        {footer.textPrefix}{" "}
        <a
          href={footer.href}
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-[color:var(--sou-primary)] hover:underline"
        >
          {footer.brandLabel}
        </a>
      </span>
    </footer>
  );
}
