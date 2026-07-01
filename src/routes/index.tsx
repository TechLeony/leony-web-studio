import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/leony/Header";
import { Footer } from "@/components/leony/Footer";
import { Hero } from "@/components/leony/Hero";
import { FloatingAssistant } from "@/components/leony/FloatingAssistant";
import { ScrollToTop } from "@/components/leony/ScrollToTop";
import {
  WhatIsSection,
  WhyWebsiteSection,
  CategoriesSection,
  DemoProjectsSection,
  PackagesSection,
  ProcessSection,
  FAQSection,
} from "@/components/leony/sections";
import { ContactSection } from "@/components/leony/ContactSection";

const SITE_URL = "https://leony.tech";
const OG_IMAGE_URL = `${SITE_URL}/leony-icon.png`;
const LOGO_URL = `${SITE_URL}/leony-icon.png`;

const TITLE = "Leony | İşletmeler İçin Modern Web Sitesi Tasarımı";
const DESCRIPTION =
  "Leony, farklı sektörlerdeki işletmeler için marka kimliğini güçlendiren, modern ve kullanıcı odaklı dijital deneyimler tasarlar.";
const OG_TITLE = "Leony | Modern Web Sitesi Tasarımı";
const OG_DESCRIPTION = DESCRIPTION;
const TW_DESCRIPTION = DESCRIPTION;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: OG_TITLE },
      { property: "og:description", content: OG_DESCRIPTION },
      { property: "og:site_name", content: "Leony" },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: OG_TITLE },
      { name: "twitter:description", content: TW_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Leony",
          alternateName: "Leony Tech",
          url: SITE_URL,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Leony",
          url: SITE_URL,
          logo: LOGO_URL,
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <WhatIsSection />
        <WhyWebsiteSection />
        <CategoriesSection />
        <DemoProjectsSection />
        <PackagesSection />
        <ProcessSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
      <FloatingAssistant />
      <ScrollToTop />
    </div>
  );
}
