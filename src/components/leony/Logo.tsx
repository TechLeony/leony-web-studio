import horizontal from "@/assets/leony-horizontal.png.asset.json";
import mark from "@/assets/leony-mark.png.asset.json";

export const LOGO_HORIZONTAL = horizontal.url;
export const LOGO_MARK = mark.url;

export function HorizontalLogo({ className = "" }: { className?: string }) {
  // Use mix-blend-multiply to make the near-white background blend with light navbar.
  return (
    <img
      src={LOGO_HORIZONTAL}
      alt="Leony"
      className={`block h-full w-auto select-none [mix-blend-mode:multiply] ${className}`}
      draggable={false}
    />
  );
}
