import { useState } from "react";
import {
  CATEGORIES,
  DEMO_IDS,
  DEMO_LINKS,
  PACKAGE_IDS,
  PACKAGE_META,
  waLink,
  type DemoId,
  type PackageId,
} from "@/lib/site";
import { useT } from "@/lib/i18n/context";
import { Section, SectionTitle } from "./Section";
import { CustomCategoryModal } from "./CustomCategoryModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Check, X as XIcon, Plus, Sparkles } from "lucide-react";
import * as Icons from "lucide-react";

export function WhatIsSection() {
  const t = useT();
  return (
    <Section id="leony-nedir" className="bg-background">
      <div className="grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5">
          <SectionTitle
            align="left"
            eyebrow={t.whatIs.eyebrow}
            title={<>{t.whatIs.titlePre}<span className="text-gradient-brand">{t.whatIs.titleHighlight}</span>{t.whatIs.titlePost}</>}
          />
        </div>
        <div className="lg:col-span-7 space-y-6">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {t.whatIs.body}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {t.whatIs.highlights.map((h) => (
              <div
                key={h}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground"
              >
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-purple to-pink text-white">
                  <Check className="h-4 w-4" />
                </span>
                {h}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function WhyWebsiteSection() {
  const t = useT();
  return (
    <Section id="neden-website" className="bg-muted/40">
      <SectionTitle
        eyebrow={t.whyWebsite.eyebrow}
        title={<>{t.whyWebsite.titlePre}<span className="text-gradient-brand">{t.whyWebsite.titleHighlight}</span></>}
        subtitle={t.whyWebsite.subtitle}
      />

      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {t.whyWebsite.benefits.map((b, i) => (
          <div
            key={b.title}
            className="group relative rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="text-xs font-semibold text-purple">0{i + 1}</div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{b.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 grid md:grid-cols-2 gap-4 rounded-3xl border border-border bg-card p-4 md:p-6">
        <ComparisonCol title={t.whyWebsite.compareSocialTitle} tone="muted" items={t.whyWebsite.compareSocialItems} />
        <ComparisonCol title={t.whyWebsite.compareLeonyTitle} tone="brand" items={t.whyWebsite.compareLeonyItems} />
      </div>

      <div className="mt-12 flex justify-center">
        <a
          href="#sektorler"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-navy-foreground hover:bg-orange transition-colors"
        >
          {t.whyWebsite.cta} <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Section>
  );
}

function ComparisonCol({ title, items, tone }: { title: string; items: string[]; tone: "muted" | "brand" }) {
  const isBrand = tone === "brand";
  return (
    <div className={"rounded-2xl p-6 " + (isBrand ? "bg-gradient-to-br from-navy via-navy to-purple text-navy-foreground" : "bg-muted/60 text-foreground")}>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{title}</div>
      <ul className="mt-4 space-y-3">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-3 text-sm">
            <span className={"mt-0.5 grid place-items-center h-5 w-5 rounded-full " + (isBrand ? "bg-white/15" : "bg-card border border-border")}>
              {isBrand ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3 text-muted-foreground" />}
            </span>
            <span className={isBrand ? "" : "text-muted-foreground"}>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoriesSection() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <Section id="sektorler" className="bg-background">
      <SectionTitle eyebrow={t.categories.eyebrow} title={t.categories.title} subtitle={t.categories.subtitle} />
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => {
          const Icon =
            ((Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon]) ??
            Icons.Briefcase;
          const item = t.categories.items[c.slug];
          return (
            <a
              key={c.slug}
              href={`/sektor/${c.slug}`}
              className="group relative rounded-2xl border border-border bg-card p-5 hover:border-orange/60 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-orange/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-navy to-purple text-navy-foreground grid place-items-center group-hover:from-orange group-hover:to-pink transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-orange transition-colors">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed flex-1">{item.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple group-hover:text-orange transition-colors">
                {t.categories.incele} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.categories.customAria}
          className="group relative rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/60 to-card p-5 flex flex-col text-left hover:border-orange/60 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange to-pink text-white grid place-items-center group-hover:scale-110 transition-transform">
            <Plus className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-orange transition-colors">{t.categories.customTitle}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed flex-1">{t.categories.customDesc}</p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange">
            {t.categories.customCta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>

      <CustomCategoryModal open={open} onClose={() => setOpen(false)} />
    </Section>
  );
}

export function DemoProjectsSection() {
  const t = useT();
  return (
    <Section id="demolar" className="bg-muted/40">
      <SectionTitle eyebrow={t.demos.eyebrow} title={t.demos.title} subtitle={t.demos.subtitle} />
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEMO_IDS.map((id) => {
          const p = t.demos.items[id];
          const link = DEMO_LINKS[id as DemoId];
          return (
            <article key={id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col">
              <DemoPreview title={p.title} />
              <div className="p-5 flex flex-col flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-purple">
                  {t.demos.sectorBySlug[p.sectorSlug]}
                </div>
                <h3 className="mt-1 text-base font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed flex-1">{p.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.badges.map((b) => (
                    <span key={b} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {t.demos.badges[b] ?? b}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-sm font-semibold text-navy-foreground hover:bg-orange transition-colors">
                      {t.demos.viewDemo} <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground">
                      {t.demos.comingSoon}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

function DemoPreview({ title }: { title: string }) {
  return (
    <div className="relative h-40 bg-gradient-to-br from-navy via-purple to-pink overflow-hidden">
      <div className="absolute inset-0 bg-grid-soft opacity-20 mix-blend-overlay" />
      <div className="absolute left-4 right-4 top-4 rounded-md bg-white/95 shadow-lg overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.16_25)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.85_0.15_85)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.16_150)]" />
          <div className="ml-2 h-3 flex-1 rounded bg-muted" />
        </div>
        <div className="p-3 space-y-1.5">
          <div className="h-2 w-3/5 rounded bg-foreground/80" />
          <div className="h-1.5 w-full rounded bg-muted-foreground/30" />
          <div className="h-1.5 w-4/5 rounded bg-muted-foreground/30" />
          <div className="mt-2 flex gap-1.5">
            <span className="h-4 w-12 rounded bg-navy" />
            <span className="h-4 w-12 rounded bg-whatsapp" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 right-3 text-[10px] font-medium text-white/80 truncate">{title}</div>
    </div>
  );
}

export function PackagesSection({ sectorLabel }: { sectorLabel?: string }) {
  const t = useT();
  return (
    <Section id="paketler" className="bg-background">
      <SectionTitle eyebrow={t.packages.eyebrow} title={t.packages.title} subtitle={t.packages.subtitle} />

      <div className="mt-8 flex justify-center">
        <div className="relative inline-flex items-center gap-3 rounded-full border border-orange/30 bg-gradient-to-r from-orange/10 via-pink/10 to-purple/10 px-4 py-2.5 md:px-5 md:py-3 shadow-sm backdrop-blur">
          <span aria-hidden className="absolute -inset-px -z-10 rounded-full bg-gradient-to-r from-orange/20 via-pink/20 to-purple/20 blur-md opacity-70" />
          <span className="grid place-items-center h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-orange to-pink text-white shadow">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs md:text-sm font-semibold text-foreground leading-snug">
            <span className="rounded-md bg-gradient-to-r from-orange to-pink bg-clip-text text-transparent font-extrabold uppercase tracking-wide mr-1">
              {t.packages.bonusTag}
            </span>
            {t.packages.bonusText}
          </span>
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-5 items-stretch">
        {PACKAGE_IDS.map((id) => {
          const p = t.packages.items[id as PackageId];
          const meta = PACKAGE_META[id as PackageId];
          const wa = sectorLabel
            ? t.waMessages.packageWithSector(sectorLabel, p.name)
            : t.waMessages.packageGeneric(p.name);
          const featured = meta.highlighted;
          const pro = id === "profesyonel";
          return (
            <div
              key={id}
              className={
                "relative rounded-3xl border bg-card p-6 flex flex-col " +
                (featured
                  ? "border-purple/40 shadow-xl ring-1 ring-purple/15"
                  : pro
                    ? "border-navy/15 bg-gradient-to-b from-navy to-[oklch(0.16_0.07_270)] text-navy-foreground"
                    : "border-border")
              }
            >
              {featured && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple to-pink px-3 py-1 text-[11px] font-semibold text-white shadow">
                  {t.packages.featuredTag}
                </span>
              )}
              {pro && p.badge && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange to-pink px-3 py-1 text-[11px] font-semibold text-white shadow">
                  <Sparkles className="h-3 w-3" /> {p.badge}
                </span>
              )}
              <div className={"text-xs font-semibold uppercase tracking-wider " + (pro ? "text-orange" : "text-purple")}>
                {t.packages.paketLabel}
              </div>
              <h3 className={"mt-1 text-xl font-semibold " + (pro ? "" : "text-foreground")}>{p.name}</h3>
              <p className={"mt-2 text-sm leading-relaxed " + (pro ? "text-white/80" : "text-muted-foreground")}>{p.short}</p>
              <p className={"mt-3 text-xs italic " + (pro ? "text-white/70" : "text-muted-foreground")}>{p.ideal}</p>

              <div className={"mt-5 h-px " + (pro ? "bg-white/15" : "bg-border")} />

              {p.inheritFrom && (
                <div className={"mt-4 text-xs font-semibold " + (pro ? "text-orange" : "text-purple")}>
                  {p.inheritFrom}
                </div>
              )}

              <ul className={(pro ? "mt-4 space-y-2 " : "mt-4 space-y-2.5 ") + "flex-1"}>
                {p.features.map((f) => (
                  <li key={f} className={"flex items-start gap-2.5 " + (pro ? "text-[13px] leading-snug" : "text-sm")}>
                    <span
                      className={
                        "mt-0.5 grid place-items-center h-5 w-5 rounded-full shrink-0 " +
                        (pro
                          ? "bg-white/15 text-white"
                          : featured
                            ? "bg-gradient-to-br from-purple to-pink text-white"
                            : "bg-muted text-purple")
                      }
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className={pro ? "text-white/90" : "text-foreground/90"}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className={"mt-6 text-xs font-medium " + (pro ? "text-white/80" : "text-muted-foreground")}>{p.delivery}</div>
              <div className={"mt-1 text-xs " + (pro ? "text-white/70" : "text-muted-foreground")}>{t.packages.priceNote}</div>

              <div className="mt-5">
                <a
                  href={waLink(wa)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all " +
                    (pro
                      ? "bg-white text-navy hover:bg-orange hover:text-white"
                      : featured
                        ? "bg-gradient-to-r from-purple to-pink text-white hover:from-orange hover:to-pink"
                        : "bg-navy text-navy-foreground hover:bg-orange")
                  }
                >
                  {p.cta}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 mx-auto max-w-3xl text-center text-xs text-muted-foreground leading-relaxed">
        {t.packages.extras.footnote}
      </p>

      <div className="mt-8 mx-auto max-w-3xl rounded-2xl border border-border bg-gradient-to-br from-muted/50 to-card p-5 md:p-6 flex items-start gap-4 shadow-sm">
        <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-purple to-pink text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-semibold text-foreground">{t.packages.extras.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t.packages.extras.text}</p>
          <p className="mt-2 text-xs text-muted-foreground/90 leading-relaxed">{t.packages.extras.support}</p>
        </div>
      </div>
    </Section>
  );
}

export function ProcessSection() {
  const t = useT();
  return (
    <Section id="surec" className="bg-muted/40">
      <SectionTitle eyebrow={t.process.eyebrow} title={t.process.title} subtitle={t.process.subtitle} />
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {t.process.steps.map((s, i) => (
          <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold text-purple">{t.process.stepLabel} {String(i + 1).padStart(2, "0")}</div>
            <h3 className="mt-2 text-base font-semibold text-foreground">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function FAQSection() {
  const t = useT();
  return (
    <Section id="sss" className="bg-background">
      <SectionTitle eyebrow={t.faq.eyebrow} title={t.faq.title} />
      <div className="mt-12 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-2 md:p-4">
        <Accordion type="single" collapsible className="w-full">
          {t.faq.items.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-b-0">
              <AccordionTrigger className="px-3 text-left text-base font-semibold text-foreground">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="px-3 text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
