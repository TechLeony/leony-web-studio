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

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
];

export const CATEGORIES = [
  { slug: "barber", title: "Barber / Kuaför", icon: "Scissors",
    desc: "Tanıtım, hizmetler, galeri ve iletişim akışı için modern website yapısı." },
  { slug: "cafe", title: "Cafe", icon: "Coffee",
    desc: "Menü, konum, çalışma saatleri ve sosyal medya yönlendirmesi için web çözümü." },
  { slug: "restoran", title: "Restoran", icon: "UtensilsCrossed",
    desc: "Menü, rezervasyon yönlendirmesi ve işletme bilgileri için profesyonel sayfa." },
  { slug: "guzellik-salonu", title: "Güzellik Salonu", icon: "Sparkles",
    desc: "Hizmetlerini düzenli sunan ve marka algısını güçlendiren modern yapı." },
  { slug: "nail-studio", title: "Nail Studio", icon: "Brush",
    desc: "Örnek işler, hizmet listesi ve iletişim odaklı şık dijital vitrin." },
  { slug: "vet-klinik", title: "Vet Klinik", icon: "PawPrint",
    desc: "Hizmetler, randevu talepleri ve iletişim akışı için güven veren dijital yapı." },
  { slug: "dis-klinigi", title: "Diş Kliniği / Dentist", icon: "Stethoscope",
    desc: "Randevu akışı, hizmet alanları ve yönetim odaklı profesyonel web çözümü." },
  { slug: "terapist-psikolog", title: "Terapist / Psikolog", icon: "HeartHandshake",
    desc: "Randevu, hizmet bilgisi ve güven veren sade danışan deneyimi." },
  { slug: "klinik", title: "Klinik", icon: "HeartPulse",
    desc: "Hizmetler, iletişim ve güven odaklı sade dijital görünüm." },
  { slug: "spor-salonu", title: "Spor Salonu", icon: "Dumbbell",
    desc: "Program, üyelik bilgileri ve iletişim akışı için güçlü dijital yapı." },
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
  { title: "Barber Demo Website", sector: "Barber / Kuaför",
    desc: "Hizmetler, galeri ve WhatsApp odaklı modern tek sayfa yapısı.",
    badges: ["Mobile Responsive", "WhatsApp Integration", "Contact Form"] },
  { title: "Cafe Demo Website", sector: "Cafe",
    desc: "Menü, konum ve sosyal medya yönlendirmesi için sade vitrin.",
    badges: ["Menü", "Mobile Responsive", "Contact Form"] },
  { title: "Restaurant Demo Website", sector: "Restoran",
    desc: "Menü, rezervasyon yönlendirmesi ve iletişim akışı.",
    badges: ["Rezervasyon", "Mobile Responsive", "WhatsApp Integration"] },
  { title: "Beauty Salon Demo Website", sector: "Güzellik Salonu",
    desc: "Hizmetler, galeri ve randevu talebine yönlendiren akış.",
    badges: ["Galeri", "Booking Flow", "Contact Form"] },
  { title: "Nail Studio Demo Website", sector: "Nail Studio",
    desc: "Şık galeri ve hizmet listesiyle iletişime taşıyan sayfa.",
    badges: ["Galeri", "WhatsApp Integration"] },
  { title: "Vet Clinic Demo Website", sector: "Vet Klinik",
    desc: "Randevu talebi, hizmet bilgileri ve yönetim panel yapısı.",
    badges: ["Appointment System", "Admin Dashboard", "Booking Flow"] },
  { title: "Dentist / Dental Clinic Demo", sector: "Diş Kliniği",
    desc: "Randevu akışı ve hasta talep yönetimi için modüler yapı.",
    badges: ["Appointment System", "Admin Dashboard", "Contact Form"] },
  { title: "Therapist / Psychologist Demo", sector: "Terapist / Psikolog",
    desc: "Danışan iletişimi, randevu ve güven veren sade akış.",
    badges: ["Appointment System", "Booking Flow", "Contact Form"] },
  { title: "Clinic Demo Website", sector: "Klinik",
    desc: "Hizmet sunumu, iletişim ve randevu talep yapısı.",
    badges: ["Appointment System", "Admin Dashboard"] },
  { title: "Gym Demo Website", sector: "Spor Salonu",
    desc: "Program, üyelik bilgileri ve iletişim odaklı yapı.",
    badges: ["Mobile Responsive", "Contact Form"] },
  { title: "Appointment System Demo", sector: "Modül",
    desc: "Randevu oluşturma, takvim ve talep yönetimi modülü.",
    badges: ["Appointment System", "Admin Dashboard", "Booking Flow"] },
  { title: "Admin Dashboard Demo", sector: "Modül",
    desc: "İşletme verilerini tek yerden yöneten arayüz örneği.",
    badges: ["Admin Dashboard", "Contact Form"] },
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

export const SECTOR_CONTENT: Record<
  string,
  {
    title: string;
    subtitle: string;
    label: string;
    benefits: string[];
    advanced?: boolean;
  }
> = {
  barber: {
    title: "Barber ve kuaförler için modern web sitesi",
    subtitle:
      "Hizmetleri, çalışma saatlerini, galeri alanını ve iletişim akışını tek bir profesyonel yapıda sunan modern web çözümü.",
    label: "Barber / Kuaför",
    benefits: ["Hizmetleri düzenli sunar", "Galeri ve örnek işleri öne çıkarır", "WhatsApp taleplerini hızlandırır", "Daha güven veren marka algısı oluşturur"],
  },
  cafe: {
    title: "Cafe’ler için modern menü ve iletişim odaklı web çözümü",
    subtitle:
      "Menü, konum, çalışma saatleri ve sosyal medya yönlendirmelerini tek bir profesyonel sayfada düzenli şekilde sun.",
    label: "Cafe",
    benefits: ["Menüyü net sunar", "Konum ve çalışma saatlerini öne çıkarır", "Sosyal medya trafiğini yönlendirir", "Marka algısını güçlendirir"],
  },
  restoran: {
    title: "Restoranlar için profesyonel web sitesi",
    subtitle:
      "Menü, rezervasyon yönlendirmesi, konum ve iletişim bilgilerini güçlü bir dijital vitrinde bir araya getir.",
    label: "Restoran",
    benefits: ["Menü ve rezervasyon akışı", "Konum ve iletişim odaklı yapı", "Sosyal medya yönlendirmesi", "Güven veren dijital görünüm"],
  },
  "guzellik-salonu": {
    title: "Güzellik salonları için iletişim odaklı modern web sitesi",
    subtitle:
      "Hizmetleri, galeri alanını ve randevu yönlendirmelerini düzenli sunan modern dijital vitrin.",
    label: "Güzellik Salonu",
    benefits: ["Hizmetleri düzenli sunar", "Galeri ile örnek işleri öne çıkarır", "Randevu talep akışını destekler", "Marka algısını güçlendirir"],
  },
  "nail-studio": {
    title: "Nail studio’lar için şık ve iletişim odaklı web sitesi",
    subtitle:
      "Örnek işleri, hizmet listesini ve iletişim kanallarını düzenli bir dijital vitrinde sunan modern yapı.",
    label: "Nail Studio",
    benefits: ["Galeri öne çıkar", "Hizmet listesi düzenli sunulur", "WhatsApp taleplerini hızlandırır", "Şık ve profesyonel görünüm"],
  },
  "vet-klinik": {
    title: "Vet klinikler için randevu ve iletişim odaklı web çözümü",
    subtitle:
      "Hizmet bilgileri, randevu talepleri ve iletişim akışını düzenli sunan güven veren dijital yapı.",
    label: "Vet Klinik",
    benefits: ["Randevu ve talep akışını destekler", "Hizmetleri düzenli sunar", "İletişimi sadeleştirir", "Güven veren marka algısı oluşturur"],
    advanced: true,
  },
  "dis-klinigi": {
    title: "Diş klinikleri için profesyonel web sitesi ve yönetim odaklı çözüm",
    subtitle:
      "Hizmetleri, randevu sürecini ve iletişim akışını daha güçlü sunan modern dijital yapı.",
    label: "Diş Kliniği",
    benefits: ["Randevu akışını destekler", "Yönetim paneli seçeneği", "Hasta iletişimini sadeleştirir", "Güven veren profesyonel görünüm"],
    advanced: true,
  },
  "terapist-psikolog": {
    title: "Terapist ve psikologlar için randevu odaklı modern web çözümü",
    subtitle:
      "Danışan iletişimini sadeleştiren, randevu akışını destekleyen ve güven veren bir dijital yapı.",
    label: "Terapist / Psikolog",
    benefits: ["Danışan iletişimini sadeleştirir", "Randevu akışını destekler", "Güven veren sade yapı", "Yönetim odaklı seçenekler"],
    advanced: true,
  },
  klinik: {
    title: "Klinikler için güven veren dijital görünüm",
    subtitle:
      "Hizmet bilgileri, iletişim akışı ve randevu taleplerini daha düzenli sunan modern web çözümü.",
    label: "Klinik",
    benefits: ["Hizmetleri düzenli sunar", "Randevu talebi akışı", "Yönetim paneli seçeneği", "Güven veren marka algısı"],
    advanced: true,
  },
  "spor-salonu": {
    title: "Spor salonları için güçlü dijital yapı",
    subtitle:
      "Program, üyelik bilgileri ve iletişim akışı için modern ve mobil uyumlu web çözümü.",
    label: "Spor Salonu",
    benefits: ["Programı net sunar", "Üyelik bilgileri düzenli", "İletişimi sadeleştirir", "Marka algısını güçlendirir"],
  },
};
