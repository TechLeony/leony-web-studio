// Centralized site config & data. Edit values here to update the whole site.

export const SITE = {
  brand: "Leony",
  tagline: "İşletmeler için modern ve iletişim odaklı web çözümleri.",
  whatsappNumber:
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "905000000000",
  email:
    (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? "info@leony.app",
  url:
    (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://leony.app",
};

export function waLink(message: string) {
  const num = SITE.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { label: "Leony Nedir?", href: "#leony-nedir" },
  { label: "Neden Website?", href: "#neden-website" },
  { label: "Sektörler", href: "#sektorler" },
  { label: "Demo Projeler", href: "#demolar" },
  { label: "Paketler", href: "#paketler" },
  { label: "SSS", href: "#sss" },
  { label: "İletişim", href: "#iletisim" },
];

// Limited nav for sector subpages — only links to sections present there.
export const SECTOR_NAV_LINKS = [
  { label: "Anasayfa", href: "/" },
  { label: "Demo Projeler", href: "#demolar" },
  { label: "Paketler", href: "#paketler" },
  { label: "SSS", href: "#sss" },
  { label: "İletişim", href: "#iletisim" },
];

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
];

export const CATEGORIES = [
  {
    slug: "cafe-restoran",
    title: "Cafe / Restoran",
    icon: "UtensilsCrossed",
    desc: "Menü, konum, rezervasyon yönlendirmesi ve iletişim akışı için modern web çözümü.",
  },
  {
    slug: "klinik-dis-klinigi",
    title: "Klinik / Diş Kliniği",
    icon: "Stethoscope",
    desc: "Hizmetler, randevu talepleri ve güven veren dijital görünüm için profesyonel web yapısı.",
  },
  {
    slug: "guzellik-salonu-nail-studio",
    title: "Güzellik Salonu / Nail Studio",
    icon: "Sparkles",
    desc: "Hizmet listesi, örnek işler, galeri ve iletişim akışı için şık dijital vitrin.",
  },
  {
    slug: "barber-kuafor",
    title: "Barber / Kuaför",
    icon: "Scissors",
    desc: "Tanıtım, hizmetler, galeri ve WhatsApp yönlendirmesi için modern website yapısı.",
  },
  {
    slug: "vet-klinik",
    title: "Vet Klinik",
    icon: "PawPrint",
    desc: "Hizmetler, randevu talepleri ve iletişim akışı için güven veren dijital yapı.",
  },
  {
    slug: "terapist-psikolog",
    title: "Terapist / Psikolog",
    icon: "HeartHandshake",
    desc: "Randevu, hizmet bilgisi ve sade danışan deneyimi için profesyonel web çözümü.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CONTACT_CATEGORY_OPTIONS = [
  ...CATEGORIES.map((c) => c.title),
  "Diğer",
];

export const BENEFITS = [
  { title: "Marka algısını güçlendirir",
    text: "Profesyonel bir web sitesi, işletmenin daha güvenilir ve kurumsal görünmesini destekler." },
  { title: "Müşteri akışını sadeleştirir",
    text: "Hizmetler, iletişim bilgileri, konum ve önemli içerikler tek bir yapıda düzenli şekilde sunulur." },
  { title: "Talep toplamayı hızlandırır",
    text: "WhatsApp, formlar ve yönlendirme alanları sayesinde potansiyel müşteriler daha hızlı aksiyon alabilir." },
  { title: "Sosyal medya trafiğini yönlendirir",
    text: "Instagram bio’sundaki tek link, ziyaretçileri daha profesyonel ve açıklayıcı bir sayfaya taşır." },
  { title: "Hizmetleri netleştirir",
    text: "Ziyaretçiler, sunulan hizmetleri daha hızlı ve daha anlaşılır biçimde inceleyebilir." },
  { title: "Dijital görünürlüğe temel oluşturur",
    text: "Web sitesi, markanın internette daha sağlam bir görünürlük kazanmasına yardımcı olur." },
];

export const LEONY_HIGHLIGHTS = [
  "Modern arayüz tasarımı",
  "Mobil uyumlu yapı",
  "Dönüşüm odaklı iletişim akışı",
  "İhtiyaca uygun özel çözümler",
];

export const PACKAGES = [
  {
    id: "baslangic",
    name: "Başlangıç Paketi",
    short: "Temel dijital görünürlük isteyen işletmeler için sade ve modern başlangıç çözümü.",
    ideal: "Tek sayfalık, temiz ve güven veren bir web sitesiyle dijitalde yer almak isteyen işletmeler.",
    inheritFrom: null as string | null,
    features: [
      "Tek sayfalık modern website",
      "Mobil uyumlu tasarım",
      "Hizmet / işletme bilgileri",
      "İletişim alanı",
      "WhatsApp yönlendirmesi",
      "Sosyal medya linkleri",
      "Temel SEO yapısı",
      "Domain / hosting süreci için yönlendirme desteği",
      "Yayına alma desteği",
    ],
    delivery: "Teslimat: 3–5 iş günü",
    cta: "Başlangıç Paketi İçin Bilgi Al",
    waMessage: "Merhaba, Leony üzerinden Başlangıç Paketi hakkında bilgi almak istiyorum.",
  },
  {
    id: "isletme",
    name: "İşletme Paketi",
    short: "Daha kapsamlı içerik yapısı ve daha güçlü sunum isteyen işletmeler için.",
    ideal: "Hizmetlerini, görsellerini ve iletişim akışını daha detaylı sunmak isteyen işletmeler.",
    inheritFrom: "Başlangıç Paketindeki her şey +",
    features: [
      "Çok bölümlü website",
      "Hakkımızda bölümü",
      "Galeri alanı",
      "Google Maps alanı",
      "WhatsApp ve mail yönlendirmeleri",
      "Daha gelişmiş içerik yerleşimi",
      "Daha güçlü SEO yapısı",
    ],
    delivery: "Teslimat: 5–7 iş günü",
    cta: "İşletme Paketi İçin Bilgi Al",
    waMessage: "Merhaba, Leony üzerinden İşletme Paketi hakkında bilgi almak istiyorum.",
    highlighted: true,
  },
  {
    id: "profesyonel",
    name: "Profesyonel Paket",
    short: "Gelişmiş özelleştirme, yönetim seçenekleri ve özel akışlar isteyen işletmeler için en kapsamlı çözüm.",
    ideal: "Standart tanıtım sitesinden daha fazlasına ihtiyaç duyan; özel sayfalar, formlar, yönetim veya randevu akışı isteyen markalar.",
    inheritFrom: "İşletme Paketindeki her şey +",
    features: [
      "Gelişmiş özel sayfa yapısı",
      "Admin dashboard seçeneği",
      "Randevu / booking sistemi seçeneği",
      "Talep / form yönetimi",
      "Gelişmiş yönetim odaklı yapı",
      "Daha modüler ve geliştirilebilir sistem",
    ],
    badge: "Gelişmiş Özelleştirme Seçenekleri",
    delivery: "Teslimat: 7–10 iş günü",
    cta: "Profesyonel Paket İçin Bilgi Al",
    waMessage: "Merhaba, Leony üzerinden Profesyonel Paket hakkında bilgi almak istiyorum.",
  },
];

export const DEMO_PROJECTS: Array<{
  title: string;
  sector: string;
  desc: string;
  badges: string[];
  link?: string;
}> = [
  { title: "Cafe / Restoran Demo", sector: "Cafe / Restoran",
    desc: "Menü, konum, rezervasyon yönlendirmesi ve iletişim akışı için modern vitrin.",
    badges: ["Menü / Hizmet Listesi", "Mobile Responsive", "WhatsApp Integration"] },
  { title: "Klinik / Diş Kliniği Demo", sector: "Klinik / Diş Kliniği",
    desc: "Hizmetler, randevu akışı ve hasta talep yönetimi için profesyonel yapı.",
    badges: ["Randevu Akışı", "Form Yönetimi", "Admin Dashboard Seçeneği"] },
  { title: "Güzellik Salonu / Nail Studio Demo", sector: "Güzellik Salonu / Nail Studio",
    desc: "Hizmet listesi, galeri ve randevu/iletişim akışı için şık vitrin.",
    badges: ["Galeri", "Menü / Hizmet Listesi", "WhatsApp Integration"] },
  { title: "Barber / Kuaför Demo", sector: "Barber / Kuaför",
    desc: "Hizmetler, galeri ve WhatsApp odaklı modern tek sayfa yapısı.",
    badges: ["Mobile Responsive", "Galeri", "WhatsApp Integration"] },
  { title: "Vet Klinik Demo", sector: "Vet Klinik",
    desc: "Randevu talepleri, hizmet bilgileri ve yönetim odaklı yapı.",
    badges: ["Randevu Akışı", "Admin Dashboard Seçeneği", "WhatsApp Integration"] },
  { title: "Terapist / Psikolog Demo", sector: "Terapist / Psikolog",
    desc: "Danışan iletişimi, randevu akışı ve güven veren sade deneyim.",
    badges: ["Randevu Akışı", "Form Yönetimi", "WhatsApp Integration"] },
];

export const FAQS = [
  { q: "Web sitesi kaç günde teslim edilir?",
    a: "Seçilen pakete göre değişir. Başlangıç Paketi 3–5 iş günü, İşletme Paketi 5–7 iş günü, Profesyonel Paket ise 7–10 iş günü içinde hazırlanır." },
  { q: "Fiyatlar neden yazmıyor?",
    a: "Her işletmenin ihtiyacı farklı olduğu için fiyat bilgisi WhatsApp üzerinden netleştirilir. Böylece işletmeye en uygun teklif hazırlanır." },
  { q: "Domain ve hosting dahil mi?",
    a: "Domain ve hosting ihtiyaca göre ayrıca konuşulur. Gerekirse domain, hosting ve yayına alma sürecinde yönlendirme sağlanır." },
  { q: "Website mobil uyumlu olur mu?",
    a: "Evet. Tüm Leony web siteleri mobil, tablet ve masaüstü cihazlara uyumlu hazırlanır." },
  { q: "WhatsApp butonu eklenebilir mi?",
    a: "Evet. Ziyaretçilerin tek tıkla WhatsApp üzerinden iletişime geçebilmesi için yönlendirme butonları eklenebilir." },
  { q: "Sonradan değişiklik yapılabilir mi?",
    a: "Evet. Teslim sonrası ihtiyaçlara göre düzenleme ve geliştirme seçenekleri ayrıca konuşulabilir." },
  { q: "Teslim sonrası destek sağlıyor musunuz?",
    a: "Evet. Website teslim edildikten sonra teknik bir sorun veya yönlendirme ihtiyacı olursa destek sağlanır. Ek geliştirme ve kapsam dışı değişiklikler ayrıca değerlendirilir." },
  { q: "Demo projeleri inceleyebilir miyim?",
    a: "Evet. Aktif demo projeler ilgili sektör sayfalarında ve demo projeler bölümünde görüntülenebilir." },
  { q: "Randevu sistemi eklenebilir mi?",
    a: "Evet. İhtiyaca göre randevu/booking akışları ve yönetim odaklı çözümler planlanabilir." },
  { q: "Admin panel yapılabilir mi?",
    a: "Evet. İhtiyaca göre yönetim paneli, içerik yönetimi veya talep takip yapıları geliştirilebilir." },
  { q: "Paket seçmeden bilgi alabilir miyim?",
    a: "Evet. Paket seçmeden de WhatsApp veya mail üzerinden bilgi talebi gönderebilirsin." },
  { q: "Kategorim listede yoksa ne yapmalıyım?",
    a: "Listede olmayan işletme türleri için de özel web çözümleri planlanabilir. WhatsApp veya mail üzerinden iletişime geçebilirsin." },
];

export const PROCESS_STEPS = [
  { title: "İhtiyacı Belirleme", text: "İşletmenin hedefleri ve ihtiyaçları netleştirilir." },
  { title: "Doğru Yapıyı Planlama", text: "Sektör, içerik yapısı ve uygun paket birlikte belirlenir." },
  { title: "Tasarım ve Geliştirme", text: "Modern, mobil uyumlu ve hedefe uygun web çözümü hazırlanır." },
  { title: "Yayın ve Teslim", text: "Proje yayına alınır ve kullanıma hazır hale getirilir." },
];

export type SectorPreviewKind = "cafe" | "clinic" | "beauty" | "barber" | "vet" | "therapist";

export const SECTOR_CONTENT: Record<
  string,
  {
    title: string;
    subtitle: string;
    label: string;
    benefits: string[];
    advanced?: boolean;
    preview: SectorPreviewKind;
  }
> = {
  "cafe-restoran": {
    title: "Cafe ve restoranlar için modern, iletişim odaklı web çözümü",
    subtitle:
      "Menü, konum, çalışma saatleri, rezervasyon yönlendirmesi ve sosyal medya bağlantılarını tek bir profesyonel sayfada düzenli şekilde sun.",
    label: "Cafe / Restoran",
    benefits: ["Menüyü net sunar", "Konum ve çalışma saatleri öne çıkar", "Rezervasyon ve iletişim akışı", "Sosyal medya trafiğini yönlendirir"],
    preview: "cafe",
  },
  "klinik-dis-klinigi": {
    title: "Klinik ve diş klinikleri için profesyonel web sitesi ve yönetim odaklı çözüm",
    subtitle:
      "Hizmetleri, randevu sürecini ve iletişim akışını daha güçlü sunan modern dijital yapı.",
    label: "Klinik / Diş Kliniği",
    benefits: ["Randevu akışını destekler", "Yönetim paneli seçeneği", "Hasta iletişimini sadeleştirir", "Güven veren profesyonel görünüm"],
    advanced: true,
    preview: "clinic",
  },
  "guzellik-salonu-nail-studio": {
    title: "Güzellik salonları ve nail studio’lar için şık dijital vitrin",
    subtitle:
      "Hizmet listesi, galeri ve randevu/iletişim akışını düzenli sunan modern web çözümü.",
    label: "Güzellik Salonu / Nail Studio",
    benefits: ["Hizmetleri düzenli sunar", "Galeri ile örnek işleri öne çıkarır", "Randevu talep akışını destekler", "Marka algısını güçlendirir"],
    preview: "beauty",
  },
  "barber-kuafor": {
    title: "Barber ve kuaförler için modern web sitesi",
    subtitle:
      "Hizmetleri, çalışma saatlerini, galeri alanını ve iletişim akışını tek bir profesyonel yapıda sunan modern web çözümü.",
    label: "Barber / Kuaför",
    benefits: ["Hizmetleri düzenli sunar", "Galeri ve örnek işleri öne çıkarır", "WhatsApp taleplerini hızlandırır", "Güven veren marka algısı"],
    preview: "barber",
  },
  "vet-klinik": {
    title: "Vet klinikler için randevu ve iletişim odaklı web çözümü",
    subtitle:
      "Hizmet bilgileri, randevu talepleri ve iletişim akışını düzenli sunan güven veren dijital yapı.",
    label: "Vet Klinik",
    benefits: ["Randevu ve talep akışını destekler", "Hizmetleri düzenli sunar", "İletişimi sadeleştirir", "Güven veren marka algısı oluşturur"],
    advanced: true,
    preview: "vet",
  },
  "terapist-psikolog": {
    title: "Terapist ve psikologlar için randevu odaklı modern web çözümü",
    subtitle:
      "Danışan iletişimini sadeleştiren, randevu akışını destekleyen ve güven veren bir dijital yapı.",
    label: "Terapist / Psikolog",
    benefits: ["Danışan iletişimini sadeleştirir", "Randevu akışını destekler", "Güven veren sade yapı", "Yönetim odaklı seçenekler"],
    advanced: true,
    preview: "therapist",
  },
};
