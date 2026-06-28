import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/leony/Header";
import { Footer } from "@/components/leony/Footer";
import { ScrollToTop } from "@/components/leony/ScrollToTop";
import { useLanguage } from "@/lib/i18n/context";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/kvkk")({
  head: () => ({
    meta: [
      { title: "KVKK Aydınlatma Metni | Leony" },
      { name: "description", content: "Leony tarafından işlenen kişisel verilere ilişkin KVKK aydınlatma metni." },
      { property: "og:title", content: "KVKK Aydınlatma Metni | Leony" },
      { property: "og:url", content: "https://leony-web-studio.lovable.app/kvkk" },
    ],
    links: [{ rel: "canonical", href: "https://leony-web-studio.lovable.app/kvkk" }],
  }),
  component: KvkkPage,
});

function KvkkPage() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 md:px-8 py-16 md:py-24">
        <Link to="/" className="text-sm text-muted-foreground hover:text-orange cursor-pointer">← {c.back}</Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">{c.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{c.updated}</p>
        <div className="mt-8">
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
    title: "KVKK Aydınlatma Metni",
    updated: "Son güncelleme: Haziran 2026",
    contact: "KVKK kapsamındaki başvurularınız için:",
    sections: [
      { h: "Veri sorumlusu", p: "Bu metin kapsamındaki veri sorumlusu Leony'dir. İletişim: contact@leony.tech" },
      { h: "İşlenen kişisel veriler", p: "İletişim formu üzerinden ad-soyad, işletme kategorisi, WhatsApp numarası, isteğe bağlı e-posta adresi ve form mesajı işlenir." },
      { h: "İşleme amaçları", p: "Verileriniz; talebinize geri dönüş yapmak, hizmetlerimiz hakkında bilgi vermek, teklif/paket sunmak ve müşteri iletişimini yönetmek amacıyla işlenir." },
      { h: "Hukuki sebepler", p: "Veriler; açık rızanız, sözleşmenin kurulması veya ifası için zorunlu olması ve meşru menfaatlerimiz hukuki sebeplerine dayalı olarak işlenir." },
      { h: "Aktarım", p: "Verileriniz; yalnızca hizmetin sunulması için kullandığımız altyapı sağlayıcıları (veritabanı, mesajlaşma araçları) ile sınırlı şekilde paylaşılabilir. Yurt dışı aktarım yalnızca bu sağlayıcılar üzerinden ve gerekli güvenlik tedbirleri alınarak yapılır." },
      { h: "Saklama süresi", p: "Verileriniz, talebinizin gereği için gerekli süre boyunca veya en fazla 24 ay saklanır. Süre sonunda silinir veya anonim hale getirilir." },
      { h: "Haklarınız", p: "KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, erişim, düzeltme, silme, işlemeye itiraz etme ve sınırlama haklarına sahipsiniz." },
      { h: "Başvuru kanalı", p: "Haklarınızı kullanmak için contact@leony.tech adresine yazılı talep iletebilirsiniz." },
      { h: "Önemli not", p: "Lütfen iletişim formuna gereksiz hassas veriler (kimlik numarası, sağlık, finansal bilgi vb.) eklemeyin." },
    ],
  },
  az: {
    back: "Ana səhifə",
    title: "KVKK Məlumatlandırma Mətni",
    updated: "Son yenilənmə: İyun 2026",
    contact: "Sorğularınız üçün:",
    sections: [
      { h: "Məlumat məsulu", p: "Bu mətn üzrə məlumat məsulu Leony'dir. Əlaqə: contact@leony.tech" },
      { h: "İşlənən şəxsi məlumatlar", p: "Əlaqə formu vasitəsilə ad-soyad, biznes kateqoriyası, WhatsApp nömrəsi, istəyə bağlı e-poçt ünvanı və mesaj emal edilir." },
      { h: "İşləmə məqsədləri", p: "Məlumatlarınız sorğunuza cavab vermək, xidmətlər haqqında məlumat vermək, təklif/paket təqdim etmək və müştəri əlaqəsini idarə etmək məqsədilə işlənir." },
      { h: "Hüquqi əsas", p: "Açıq razılığınız, müqavilənin yerinə yetirilməsi və qanuni maraqlarımız əsasında." },
      { h: "Köçürmə", p: "Yalnız xidmət üçün istifadə etdiyimiz infrastruktur təminatçıları ilə məhdud şəkildə paylaşıla bilər." },
      { h: "Saxlama müddəti", p: "Sorğu üçün gərəkən müddət və ya maksimum 24 ay." },
      { h: "Hüquqlarınız", p: "Giriş, düzəliş, silmə və emalın məhdudlaşdırılması hüquqlarına sahibsiniz." },
      { h: "Müraciət kanalı", p: "Hüquqlarınızdan istifadə üçün contact@leony.tech ünvanına yazın." },
      { h: "Vacib qeyd", p: "Formada lazımsız həssas məlumatlar (şəxsiyyət vəsiqəsi, sağlamlıq, maliyyə) paylaşmayın." },
    ],
  },
  en: {
    back: "Home",
    title: "KVKK Notice (Personal Data Information)",
    updated: "Last updated: June 2026",
    contact: "For requests under this notice, contact us at:",
    sections: [
      { h: "Data controller", p: "The data controller for this notice is Leony. Contact: contact@leony.tech" },
      { h: "Personal data processed", p: "Through the contact form we process your name, business category, WhatsApp number, optional email, and the message you submit." },
      { h: "Purposes of processing", p: "To respond to your request, share information about our services, send proposals/packages, and manage customer communication." },
      { h: "Legal basis", p: "Your explicit consent, performance of a contract, and our legitimate business interests." },
      { h: "Transfer / sharing", p: "Data may be processed only via the infrastructure providers we use to operate the service (database, messaging tools), with appropriate safeguards." },
      { h: "Retention", p: "We retain data for as long as needed to handle your request, and for at most 24 months." },
      { h: "Your rights", p: "You may request access, correction, deletion, or restriction of processing of your personal data." },
      { h: "How to apply", p: "To exercise your rights, contact contact@leony.tech." },
      { h: "Important note", p: "Please do not submit unnecessary sensitive personal data (ID numbers, health, financial details) through the form." },
    ],
  },
} as const;
