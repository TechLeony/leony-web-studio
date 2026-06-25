import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/leony/Header";
import { Footer } from "@/components/leony/Footer";
import { Hero } from "@/components/leony/Hero";
import { FloatingAssistant } from "@/components/leony/FloatingAssistant";
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
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leony | Modern Web Tasarım ve Geliştirme" },
      {
        name: "description",
        content:
          "Leony, işletmeler için modern, mobil uyumlu ve iletişim odaklı web çözümleri sunar.",
      },
      { property: "og:title", content: "Leony | Modern Web Tasarım ve Geliştirme" },
      {
        property: "og:description",
        content:
          "Leony, işletmeler için modern, mobil uyumlu ve iletişim odaklı web çözümleri sunar.",
      },
      { property: "og:site_name", content: SITE.brand },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
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
    </div>
  );
}
