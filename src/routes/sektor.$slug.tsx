import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Header } from "@/components/leony/Header";
import { Footer } from "@/components/leony/Footer";
import { FloatingAssistant } from "@/components/leony/FloatingAssistant";
import { Section, SectionTitle } from "@/components/leony/Section";
import {
  DemoProjectsSection,
  FAQSection,
  PackagesSection,
} from "@/components/leony/sections";
import { ContactSection } from "@/components/leony/ContactSection";
import { WhatsAppButton } from "@/components/leony/WhatsAppButton";
import { SECTOR_CONTENT, SITE } from "@/lib/site";
import { ArrowLeft, Check, LayoutDashboard, Calendar, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/sektor/$slug")({
  loader: ({ params }) => {
    const data = SECTOR_CONTENT[params.slug as keyof typeof SECTOR_CONTENT];
    if (!data) throw notFound();
    return { slug: params.slug, ...data };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.label} | Leony` : "Sektör | Leony";
    const d = loaderData?.subtitle ?? "";
    const url = loaderData ? `/sektor/${loaderData.slug}` : "/";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:site_name", content: SITE.brand },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: SectorPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Sektör bulunamadı</h1>
        <Link to="/" className="mt-4 inline-block text-purple font-medium">
          ← Anasayfaya dön
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <p className="text-muted-foreground">Bir hata oluştu.</p>
    </div>
  ),
});

function SectorPage() {
  const data = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="relative pt-28 md:pt-32 pb-12 md:pb-16 overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-grid-soft opacity-[0.3] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          />
          <div
            aria-hidden
            className="absolute -top-32 right-[-10%] -z-10 h-[480px] w-[480px] rounded-full opacity-50"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--color-pink) 28%, transparent), transparent 60%)",
            }}
          />
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Tüm sektörler
            </Link>
            <div className="mt-6 grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange via-pink to-purple" />
                  {data.label}
                </div>
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.08]">
                  {data.title}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  {data.subtitle}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="#paketler"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
                  >
                    Paketleri Karşılaştır
                  </a>
                  <WhatsAppButton
                    message={`Merhaba, Leony üzerinden ${data.label} kategorisi için web sitesi hizmetleri hakkında bilgi almak istiyorum.`}
                  >
                    WhatsApp’tan Bilgi Al
                  </WhatsAppButton>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {data.benefits.map((b: string) => (
                  <div key={b} className="rounded-2xl border border-border bg-card p-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple to-pink text-white grid place-items-center">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="mt-3 text-sm font-semibold text-foreground leading-snug">{b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {data.advanced && (
          <Section className="bg-muted/40 !py-16">
            <SectionTitle
              eyebrow="Yönetim odaklı"
              title="Randevu, yönetim ve danışan akışı"
              subtitle="İhtiyaca göre randevu sistemi, admin dashboard ve talep yönetimi entegre edilebilir."
            />
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {[
                { icon: Calendar, t: "Randevu Sistemi", d: "Online randevu oluşturma, takvim ve onay akışı." },
                { icon: LayoutDashboard, t: "Admin Dashboard", d: "Talepleri ve randevuları tek arayüzden yönet." },
                { icon: ShieldCheck, t: "Güven Veren Akış", d: "Profesyonel iletişim ve düzenli danışan deneyimi." },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-border bg-card p-6">
                  <div className="h-10 w-10 rounded-lg bg-navy text-navy-foreground grid place-items-center">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{c.t}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <DemoProjectsSection />
        <PackagesSection sectorLabel={data.label} />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
      <FloatingAssistant />
    </div>
  );
}
