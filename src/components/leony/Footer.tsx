import { FooterLogo, LOGO_MARK } from "./Logo";
import { NAV_LINKS, SITE, SOCIAL_LINKS } from "@/lib/site";
import { useT } from "@/lib/i18n/context";
import { Mail } from "lucide-react";

export function Footer() {
  const t = useT();
  return (
    <footer className="relative border-t border-border bg-muted/40 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-16 h-72 w-72 rounded-full opacity-[0.07] bg-cover"
        style={{ backgroundImage: `url(${LOGO_MARK})` }}
      />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-14 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4 max-w-md">
          <FooterLogo className="w-28 sm:w-32 md:w-44" />
          <p className="text-sm text-muted-foreground">{t.footer.tagline}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-orange transition-colors"
            >
              <Mail className="h-4 w-4" /> {SITE.email}
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">{t.footer.quickLinks}</h4>
          <ul className="space-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={`/${l.href}`} className="text-sm text-muted-foreground hover:text-orange transition-colors">
                  {t.nav[l.key]}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">{t.footer.socialLegal}</h4>
          <ul className="space-y-2">
            {SOCIAL_LINKS.filter((s) => !!s.href).map((s) => (
              <li key={s.label}>
                <a
                  href={s.href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-orange transition-colors cursor-pointer"
                >
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#" className="text-sm text-muted-foreground hover:text-orange transition-colors">
                {t.footer.kvkk}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-5 text-xs text-muted-foreground">
          {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
