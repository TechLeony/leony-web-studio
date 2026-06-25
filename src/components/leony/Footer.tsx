import { HorizontalLogo, LOGO_MARK } from "./Logo";
import { NAV_LINKS, SITE, SOCIAL_LINKS, waLink } from "@/lib/site";
import { Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-muted/40 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-16 h-72 w-72 rounded-full opacity-[0.07] bg-cover"
        style={{ backgroundImage: `url(${LOGO_MARK})` }}
      />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-14 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <div className="h-12"><HorizontalLogo className="h-12" /></div>
          <p className="max-w-md text-sm text-muted-foreground">{SITE.tagline}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-purple"
            >
              <Mail className="h-4 w-4" /> {SITE.email}
            </a>
            <a
              href={waLink("Merhaba, Leony hakkında bilgi almak istiyorum.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-whatsapp"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Hızlı Bağlantılar</h4>
          <ul className="space-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={`/${l.href}`} className="text-sm text-muted-foreground hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Sosyal & Yasal</h4>
          <ul className="space-y-2">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="text-sm text-muted-foreground hover:text-foreground">{s.label}</a>
              </li>
            ))}
            <li>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                KVKK / Gizlilik Politikası
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-5 text-xs text-muted-foreground">
          © 2026 Leony. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
