export const LOGO_HORIZONTAL = "/leony-horizontal.png";
export const LOGO_MARK = "/leony-mark.png";
export const LOGO_FOOTER = "/leony-footer.png";
export const LOGO_FAVICON = "/leony-favicon.png";
export const LOGO_BOT = "/leony-bot-icon.png";
export const OG_IMAGE = "/og-image.png";

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
