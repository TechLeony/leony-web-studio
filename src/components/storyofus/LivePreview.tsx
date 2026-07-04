import { Heart, Music } from "lucide-react";
import {
  COLOR_THEMES,
  FONTS,
  type AnimationId,
  type ColorThemeId,
  type FontId,
  type PhotoLayoutId,
} from "@/lib/storyofus/config";

interface Props {
  partnerOne: string;
  partnerTwo: string;
  date: string;
  loveNote: string;
  song: string;
  colorTheme: ColorThemeId;
  font: FontId;
  photoLayout: PhotoLayoutId;
  animation: AnimationId;
}

export function LivePreview({
  partnerOne,
  partnerTwo,
  date,
  loveNote,
  song,
  colorTheme,
  font,
  photoLayout,
  animation,
}: Props) {
  const theme = COLOR_THEMES.find((c) => c.id === colorTheme)!;
  const fontDef = FONTS.find((f) => f.id === font)!;

  const isHandwritten = font === "handwritten";
  const displayFont = isHandwritten
    ? '"Great Vibes", cursive'
    : font === "elegant-serif"
      ? '"Playfair Display", Georgia, serif'
      : fontDef.family;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border shadow-lg"
      style={{ background: theme.bg, color: theme.text, borderColor: theme.surface }}
    >
      {animation === "floating-hearts" && (
        <>
          <Heart
            className="absolute left-6 top-10 h-4 w-4 opacity-40"
            style={{ color: theme.accent, animation: "sou-float 3.4s ease-in-out infinite" }}
          />
          <Heart
            className="absolute right-8 top-24 h-3 w-3 opacity-30"
            style={{ color: theme.accent, animation: "sou-float 4.2s ease-in-out infinite" }}
          />
          <Heart
            className="absolute right-16 bottom-20 h-5 w-5 opacity-35"
            style={{ color: theme.accent, animation: "sou-float 3s ease-in-out infinite" }}
          />
        </>
      )}

      <style>{`
        @keyframes sou-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes sou-fade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      `}</style>

      <div
        className="px-6 pt-12 pb-8 text-center"
        style={{ animation: "sou-fade 700ms ease both" }}
      >
        <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: theme.muted }}>
          Story of Us
        </p>
        <h1
          className="mt-3 leading-tight"
          style={{
            fontFamily: displayFont,
            fontSize: isHandwritten ? "3.2rem" : "2.4rem",
            color: theme.text,
          }}
        >
          {partnerOne} <span style={{ color: theme.accent }}>&</span> {partnerTwo}
        </h1>
        <p className="mt-2 text-sm" style={{ color: theme.muted }}>
          {date}
        </p>
      </div>

      <div className="px-6 pb-6">
        <div
          className="rounded-2xl p-5 text-center text-sm italic"
          style={{ background: theme.surface, color: theme.text }}
        >
          “{loveNote}”
        </div>
      </div>

      <div className="px-6 pb-6">
        {photoLayout === "polaroid" && (
          <div className="flex justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rotate-[-3deg] rounded-md bg-white p-2 shadow"
                style={{ transform: `rotate(${(i - 1) * 4}deg)` }}
              >
                <div
                  className="h-16 w-14 rounded-sm"
                  style={{ background: `linear-gradient(135deg, ${theme.accent}44, ${theme.surface})` }}
                />
                <div className="mt-1 h-2 w-14" />
              </div>
            ))}
          </div>
        )}

        {photoLayout === "gallery" && (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg"
                style={{ background: `linear-gradient(135deg, ${theme.accent}55, ${theme.surface})` }}
              />
            ))}
          </div>
        )}

        {photoLayout === "fullscreen" && (
          <div
            className="h-40 w-full rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.surface})`,
            }}
          />
        )}
      </div>

      <div className="px-6 pb-6">
        <p
          className="text-[11px] uppercase tracking-[0.3em] mb-2"
          style={{ color: theme.muted }}
        >
          Bizim şarkımız
        </p>
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: theme.surface }}
        >
          <div
            className="grid h-8 w-8 place-items-center rounded-full"
            style={{ background: theme.accent, color: "#fff" }}
          >
            <Music className="h-4 w-4" />
          </div>
          <div className="text-sm font-medium">{song}</div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <p
          className="text-[11px] uppercase tracking-[0.3em] mb-3"
          style={{ color: theme.muted }}
        >
          Timeline
        </p>
        <div className="space-y-2">
          {["İlk tanışma", "İlk buluşma", "Bugüne kadar"].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: theme.accent }}
              />
              <span className="text-sm" style={{ color: theme.text }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="border-t px-6 py-3 text-center text-[10px]"
        style={{ borderColor: theme.surface, color: theme.muted }}
      >
        leony.tech · Story of Us
      </div>
    </div>
  );
}
