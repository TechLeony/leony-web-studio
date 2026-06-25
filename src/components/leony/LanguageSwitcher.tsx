import { useLanguage } from "@/lib/i18n/context";
import { LANG_LABELS, LANGS, type Lang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const { lang, setLang, t } = useLanguage();
  const others = LANGS.filter((l) => l !== lang) as Lang[];
  const base =
    size === "md"
      ? "h-10 px-3 text-sm"
      : "h-8 px-2.5 text-xs";

  return (
    <div
      role="group"
      aria-label={t.switcher.aria}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card/80 backdrop-blur p-1",
        className,
      )}
    >
      {others.map((l, i) => (
        <span key={l} className="inline-flex items-center">
          {i > 0 && <span aria-hidden className="px-0.5 text-muted-foreground/60">/</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-semibold tracking-wide text-muted-foreground hover:text-orange transition-colors",
              base,
            )}
            aria-label={`Switch language to ${LANG_LABELS[l]}`}
          >
            {LANG_LABELS[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
