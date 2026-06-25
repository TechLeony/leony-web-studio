import horizontal from "@/assets/leony-horizontal-v2.png.asset.json";
import mark from "@/assets/leony-mark-v2.png.asset.json";
import footer from "@/assets/leony-footer-cropped.png.asset.json";

export const LOGO_HORIZONTAL = horizontal.url;
export const LOGO_MARK = mark.url;
export const LOGO_FOOTER = footer.url;

export function HorizontalLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={LOGO_HORIZONTAL}
      alt="Leony"
      className={`block h-full w-auto select-none ${className}`}
      draggable={false}
    />
  );
}

export function FooterLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={LOGO_FOOTER}
      alt="Made by Leony"
      className={`block h-auto w-auto max-w-[100px] sm:max-w-[120px] md:max-w-[160px] lg:max-w-[200px] select-none ${className}`}
      draggable={false}
    />
  );
}
