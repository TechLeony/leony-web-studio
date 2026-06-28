import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, type NavKey } from "@/lib/site";
import { HorizontalLogo } from "./Logo";
import { WhatsAppButton } from "./WhatsAppButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HashNavLink } from "./HashNavLink";
import { useT } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type NavLink = { key: NavKey; href: string };

export function Header({ navLinks = NAV_LINKS }: { navLinks?: ReadonlyArray<NavLink> }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40 transition-all",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-background/60 backdrop-blur",
      )}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <a href="/" className="flex h-16 md:h-20 items-center" aria-label="Leony">
          <HorizontalLogo className="h-16 md:h-20" />
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((l) => (
            <HashNavLink
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-orange transition-colors cursor-pointer"
            >
              {t.nav[l.key]}
            </HashNavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher />
          <WhatsAppButton variant="whatsapp" message={t.waMessages.headerGeneric}>
            {t.nav.waCta}
          </WhatsAppButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t.nav.menuOpen}
          aria-expanded={open}
          className="lg:hidden grid place-items-center h-11 w-11 rounded-full border border-border bg-card text-foreground hover:text-orange hover:border-orange/40 transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-lg text-base font-medium text-foreground hover:text-orange hover:bg-muted transition-colors"
              >
                {t.nav[l.key]}
              </a>
            ))}
            <div className="pt-2 flex items-center justify-between gap-3">
              <LanguageSwitcher size="md" />
            </div>
            <div className="pt-2">
              <WhatsAppButton
                variant="whatsapp"
                className="w-full"
                message={t.waMessages.headerGeneric}
              >
                {t.nav.waCta}
              </WhatsAppButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
