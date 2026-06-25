import { WhatsAppButton } from "./WhatsAppButton";
import { HeroVisual } from "./HeroVisual";
import { ArrowRight } from "lucide-react";

export function Hero() {
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
            İşletmen için modern dijital vitrin
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.05]">
            İşletmen için{" "}
            <span className="text-gradient-brand">modern, hızlı ve güven veren</span>{" "}
            web çözümleri.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Leony, markaların dijital görünümünü güçlendiren; modern web siteleri, demo projeler
            ve işletme ihtiyaçlarına uygun özel çözümler sunar.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="#sektorler"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-navy-foreground hover:bg-navy/90 transition-colors shadow-sm"
            >
              İşletme Kategorini Seç <ArrowRight className="h-4 w-4" />
            </a>
            <WhatsAppButton message="Merhaba, Leony üzerinden web sitesi hizmetleri hakkında bilgi almak istiyorum.">
              WhatsApp’tan Bilgi Al
            </WhatsAppButton>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-xs md:text-sm text-muted-foreground">
            {["Mobil uyumlu", "Modern arayüz", "Dönüşüm odaklı", "Hızlı teslim"].map((t, i) => (
              <span key={t} className="inline-flex items-center gap-2">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-border" />}
                {t}
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
