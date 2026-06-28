import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/leony/Header";
import { Footer } from "@/components/leony/Footer";
import { ScrollToTop } from "@/components/leony/ScrollToTop";
import { useLanguage } from "@/lib/i18n/context";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Gizlilik Politikası | Leony" },
      { name: "description", content: "Leony web sitesinde toplanan kişisel verilerin nasıl kullanıldığına dair gizlilik politikası." },
      { property: "og:title", content: "Gizlilik Politikası | Leony" },
      { property: "og:url", content: "https://leony-web-studio.lovable.app/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "https://leony-web-studio.lovable.app/privacy-policy" }],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 md:px-8 py-16 md:py-24">
        <Link to="/" className="text-sm text-muted-foreground hover:text-orange cursor-pointer">← {c.back}</Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">{c.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{c.updated}</p>
        <div className="prose prose-neutral mt-8 max-w-none text-foreground">
          {c.sections.map((s) => (
            <section key={s.h} className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{s.p}</p>
            </section>
          ))}
          <section className="mt-10 rounded-2xl border border-border bg-muted/40 p-5">
            <p className="text-sm text-foreground">
              {c.contact}{" "}
              <a className="font-semibold text-orange hover:underline cursor-pointer" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

const COPY = {
  tr: {
    back: "Ana sayfa",
    title: "Gizlilik Politikası",
    updated: "Son güncelleme: Haziran 2026",
    contact: "Veri/gizlilik talepleriniz için bize ulaşın:",
    sections: [
      { h: "Hangi verileri topluyoruz?", p: "Web sitemizdeki iletişim formu aracılığıyla ad-soyad, işletme kategorisi, WhatsApp numarası, isteğe bağlı e-posta ve mesajınızı topluyoruz. Sadece bizimle paylaştığınız bilgileri saklıyoruz." },
      { h: "Verileri neden topluyoruz?", p: "Verileri yalnızca talebinize geri dönüş yapmak ve Leony hizmetleri hakkında bilgi vermek için kullanıyoruz. Reklam veya üçüncü taraf pazarlama amacıyla satılmaz veya paylaşılmaz." },
      { h: "Verileriniz nasıl kullanılıyor?", p: "Talebinize cevap vermek, fiyat/paket bilgisi paylaşmak ve sonraki adımları planlamak için ilgili Leony ekip üyeleri tarafından görülür." },
      { h: "Kimlerle paylaşılabilir?", p: "Verileriniz, yalnızca hizmet sunumumuz için kullandığımız altyapı sağlayıcıları (örn. veritabanı ve mesajlaşma araçları) üzerinden işlenebilir. Bunlar dışında üçüncü taraflarla paylaşılmaz." },
      { h: "Veriler ne kadar saklanır?", p: "Talebinizin gereğini yerine getirmek için gereken süre boyunca veya en fazla 24 ay saklanır. Talep etmeniz halinde verileriniz silinir." },
      { h: "Haklarınız", p: "Verilerinize erişme, düzeltme, silme ve işlemenin sınırlandırılmasını talep etme hakkına sahipsiniz. Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz." },
      { h: "Önemli not", p: "Lütfen iletişim formuna kimlik numarası, finansal bilgi, sağlık verisi gibi hassas/gereksiz kişisel veriler eklemeyin." },
    ],
  },
  az: {
    back: "Ana səhifə",
    title: "Məxfilik Siyasəti",
    updated: "Son yenilənmə: İyun 2026",
    contact: "Məlumat/məxfilik sorğuları üçün bizimlə əlaqə saxlayın:",
    sections: [
      { h: "Hansı məlumatları toplayırıq?", p: "Saytdakı əlaqə formu vasitəsilə ad-soyad, biznes kateqoriyası, WhatsApp nömrəsi, istəyə bağlı e-poçt və mesajınızı toplayırıq. Yalnız bizimlə bölüşdüyünüz məlumatları saxlayırıq." },
      { h: "Niyə toplayırıq?", p: "Məlumatları yalnız sorğunuza cavab vermək və Leony xidmətləri haqqında məlumat vermək üçün istifadə edirik. Reklam və ya üçüncü tərəf marketinqi üçün satılmır." },
      { h: "Necə istifadə olunur?", p: "Sorğunuza cavab vermək, qiymət/paket məlumatı paylaşmaq və sonrakı addımları planlamaq üçün Leony komandası tərəfindən baxılır." },
      { h: "Kimlərlə paylaşıla bilər?", p: "Yalnız xidmət üçün istifadə etdiyimiz infrastruktur təminatçıları (verilənlər bazası, mesajlaşma alətləri) üzərində emal edilə bilər. Bunun xaricində üçüncü tərəflərlə paylaşılmır." },
      { h: "Nə qədər saxlanılır?", p: "Sorğunuzun yerinə yetirilməsi üçün lazım olan müddət ərzində və ya maksimum 24 ay saxlanılır. Tələbiniz əsasında silinə bilər." },
      { h: "Hüquqlarınız", p: "Məlumatlarınıza giriş, düzəliş, silmə və emalın məhdudlaşdırılması hüquqlarına sahibsiniz. Bu hüquqlardan istifadə üçün bizimlə əlaqə saxlayın." },
      { h: "Vacib qeyd", p: "Zəhmət olmasa formada şəxsiyyət vəsiqəsi, maliyyə və ya sağlamlıq kimi həssas/lazımsız şəxsi məlumatları paylaşmayın." },
    ],
  },
  en: {
    back: "Home",
    title: "Privacy Policy",
    updated: "Last updated: June 2026",
    contact: "For privacy / data requests, contact us at:",
    sections: [
      { h: "What data we collect", p: "Through the contact form we collect your name, business category, WhatsApp number, optional email, and message. We only store what you share with us." },
      { h: "Why we collect it", p: "We use the data only to respond to your request and share information about Leony services. We do not sell or share it for advertising or third-party marketing." },
      { h: "How it is used", p: "Relevant Leony team members review the submissions to reply to your request, share pricing/package information, and plan next steps." },
      { h: "Who it may be shared with", p: "Data may be processed by the infrastructure providers we use to operate the service (e.g. database and messaging tools). It is not shared with other third parties." },
      { h: "How long it is stored", p: "We retain submissions for as long as needed to handle your request, and up to 24 months at most. We delete data on request." },
      { h: "Your rights", p: "You may request access, correction, deletion, or restriction of processing of your personal data. Contact us to exercise these rights." },
      { h: "Important note", p: "Please do not submit unnecessary sensitive personal data (such as ID numbers, financial details, or health information) through the contact form." },
    ],
  },
} as const;
