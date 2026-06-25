import { HeroVisual } from "./HeroVisual";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function Hero() {
  const t = useT();
  return (
    <section className="relative pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid-soft opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute -top-40 right-[-10%] -z-10 h-[520px] w-[520px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-purple) 35%, transparent), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-7xl px-4 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange via-pink to-purple" />
            {t.hero.badge}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.05]">
            {t.hero.h1Pre}
            <span className="text-gradient-brand">{t.hero.h1Highlight}</span>
            {t.hero.h1Post}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            {t.hero.sub}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="#sektorler"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-navy-foreground hover:bg-orange transition-colors shadow-sm"
            >
              {t.hero.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-xs md:text-sm text-muted-foreground">
            {t.hero.chips.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-2">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-border" />}
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
