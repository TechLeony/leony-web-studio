// Centralized translations for Leony — TR / AZ / EN
// Edit copy here to update all surfaces.

export type Lang = "tr" | "az" | "en";

export const LANGS: Lang[] = ["tr", "az", "en"];

export type Dict = {
  nav: {
    home: string;
    whatIs: string;
    whyWebsite: string;
    sectors: string;
    demos: string;
    packages: string;
    faq: string;
    contact: string;
    waCta: string;
    menuOpen: string;
  };
  hero: {
    badge: string;
    h1Pre: string;
    h1Highlight: string;
    h1Post: string;
    sub: string;
    cta: string;
    chips: string[];
  };
  whatIs: {
    eyebrow: string;
    titlePre: string;
    titleHighlight: string;
    titlePost: string;
    body: string;
    highlights: string[];
  };
  heroVisual: {
    urlText: string;
    webBlockEyebrow: string;
    webBlockTitle: string;
    metrics: { v: string; l: string }[];
    quickLinks: string[];
    adminTitle: string;
    adminSub: string;
    apptTitle: string;
    apptSub: string;
    chips: { contactForm: string; whatsappFlow: string; mobile: string; demos: string };
  };
  whyWebsite: {
    eyebrow: string;
    titlePre: string;
    titleHighlight: string;
    subtitle: string;
    benefits: { title: string; text: string }[];
    compareSocialTitle: string;
    compareSocialItems: string[];
    compareLeonyTitle: string;
    compareLeonyItems: string[];
    cta: string;
  };
  categories: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Record<string, { title: string; desc: string }>;
    incele: string;
    customTitle: string;
    customDesc: string;
    customCta: string;
    customAria: string;
  };
  demos: {
    eyebrow: string;
    title: string;
    subtitle: string;
    badges: Record<string, string>;
    viewDemo: string;
    comingSoon: string;
    sectorBySlug: Record<string, string>;
    items: Record<
      string,
      { title: string; desc: string; sectorSlug: string; badges: string[] }
    >;
  };
  packages: {
    eyebrow: string;
    title: string;
    subtitle: string;
    bonusTag: string;
    bonusText: string;
    featuredTag: string;
    priceNote: string;
    paketLabel: string;
    items: Record<
      string,
      {
        name: string;
        short: string;
        ideal: string;
        inheritFrom?: string;
        features: string[];
        delivery: string;
        cta: string;
        waMessage: string;
        badge?: string;
      }
    >;
    extras: {
      title: string;
      text: string;
      support: string;
      footnote: string;
    };
  };
  process: {
    eyebrow: string;
    title: string;
    subtitle: string;
    stepLabel: string;
    steps: { title: string; text: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    successTitle: string;
    successBody: string;
    successAgain: string;
    submit: string;
    submitting: string;
    fields: {
      name: string;
      namePh: string;
      category: string;
      categoryPlaceholder: string;
      customCategory: string;
      customCategoryPh: string;
      email: string;
      emailOptional: string;
      emailPh: string;
      method: string;
      phone: string;
      phonePh: string;
      whatsappLabel: string;
      whatsappHelper: string;
      countrySearchPh: string;
      message: string;
      messagePh: string;
    };
    methods: { whatsapp: string; mail: string };
    categoryOther: string;
    errors: {
      name: string;
      category: string;
      customCategory: string;
      email: string;
      phone: string;
      message: string;
    };
    toastSuccess: string;
    toastError: string;
  };
  footer: {
    tagline: string;
    quickLinks: string;
    socialLegal: string;
    kvkk: string;
    privacyPolicy: string;
    copyright: string;
  };
  sectorPage: {
    allSectors: string;
    comparePackages: string;
    waCta: string;
    demoEyebrow: string;
    demoTitleTpl: (label: string) => string;
    demoSubtitle: string;
    advEyebrow: string;
    advTitle: string;
    advSubtitle: string;
    advCards: { t: string; d: string }[];
    notFoundTitle: string;
    notFoundHome: string;
    errorText: string;
  };
  sectors: Record<
    string,
    {
      title: string;
      subtitle: string;
      label: string;
      benefits: string[];
    }
  >;
  sectorPreview: Record<
    string,
    {
      headline: string;
      ctas: { label: string; tone: "wa" | "muted" }[];
      sectionTitle: string;
      items: string[];
      location: string;
      sideTitle: string;
      side: { t: string; n: string; s: string }[];
    }
  >;
  assistant: {
    name: string;
    status: string;
    greeting: string;
    waCta: string;
    openAria: string;
    closeAria: string;
  };
  scrollTop: { aria: string };
  customCatModal: {
    tag: string;
    title: string;
    subtitle: string;
    fields: { name: string; nameP: string; category: string; categoryP: string; email: string; emailP: string; phone: string; phoneP: string; message: string; messageP: string };
    submit: string;
    submitting: string;
    errors: { name: string; category: string; email: string; phone: string; message: string };
    waPrefix: string;
    waLabels: { name: string; category: string; email: string; phone: string; message: string };
    closeAria: string;
    dialogAria: string;
    successTitle: string;
    toastSuccess: string;
    toastError: string;
  };
  switcher: { aria: string };
  waMessages: {
    headerGeneric: string;
    assistant: string;
    footerGeneric: string;
    sectorBody: (label: string) => string;
    packageGeneric: (pkgName: string) => string;
    packageWithSector: (sectorLabel: string, pkgName: string) => string;
  };
};

const TR: Dict = {
  nav: {
    home: "Anasayfa",
    whatIs: "Leony Nedir?",
    whyWebsite: "Neden Website?",
    sectors: "Sektörler",
    demos: "Demo Projeler",
    packages: "Paketler",
    faq: "SSS",
    contact: "İletişim",
    waCta: "WhatsApp’tan Yaz",
    menuOpen: "Menüyü aç",
  },
  hero: {
    badge: "İşletmen için modern dijital vitrin",
    h1Pre: "Markanızı öne çıkaran, ",
    h1Highlight: "hızlı ve güvenilir web çözümleriyle",
    h1Post: " dijitalde güçlü bir ilk izlenim yaratın.",
    sub: "Leony, işletmelerin dijitalde güven veren bir görünüm kazanması için modern web siteleri, demo projeler ve ihtiyaca özel web çözümleri üretir.",
    cta: "İşletme Kategorini Seç",
    chips: ["Mobil uyumlu", "Modern arayüz", "Dönüşüm odaklı", "Hızlı teslim"],
  },
  whatIs: {
    eyebrow: "Leony Nedir?",
    titlePre: "Markalar için ",
    titleHighlight: "modern dijital stüdyo",
    titlePost: " deneyimi.",
    body: "Leony; markalar ve hizmet odaklı işletmelerin dijitalde daha profesyonel, güvenilir ve ulaşılabilir görünmesini sağlayan bir dijital stüdyodur. İşletmenin kendini net anlatmasına, müşterilerin aradığı bilgilere kolayca ulaşmasına ve ilk izlenimin daha güçlü olmasına odaklanır.",
    highlights: [
      "Modern arayüz tasarımı",
      "Mobil uyumlu yapı",
      "Dönüşüm odaklı iletişim akışı",
      "İhtiyaca uygun özel çözümler",
    ],
  },
  whyWebsite: {
    eyebrow: "Neden Website?",
    titlePre: "Web sitesi artık lüks değil, ",
    titleHighlight: "işletmenizin dijital adresi.",
    subtitle:
      "Müşterilerinize, işletmenizi internet üzerinden tanıma, hizmetlerinizi inceleme ve sizinle kolayca iletişime geçme imkânı sunar. Bu da markanızın sektörde daha profesyonel, güvenilir ve erişilebilir görünmesini sağlar.",
    benefits: [
      { title: "Marka algısını güçlendirir", text: "Profesyonel bir web sitesi, işletmenin daha güvenilir ve kurumsal görünmesini destekler." },
      { title: "Müşteri akışını sadeleştirir", text: "Hizmetler, iletişim bilgileri, konum ve önemli içerikler tek bir yapıda düzenli şekilde sunulur." },
      { title: "Talep toplamayı hızlandırır", text: "WhatsApp, formlar ve yönlendirme alanları sayesinde potansiyel müşteriler daha hızlı aksiyon alabilir." },
      { title: "Sosyal medya trafiğini yönlendirir", text: "Instagram bio’sundaki tek link, ziyaretçileri daha profesyonel ve açıklayıcı bir sayfaya taşır." },
      { title: "Hizmetleri netleştirir", text: "Ziyaretçiler, sunulan hizmetleri daha hızlı ve daha anlaşılır biçimde inceleyebilir." },
      { title: "Dijital görünürlüğe temel oluşturur", text: "Web sitesi, markanın internette daha sağlam bir görünürlük kazanmasına yardımcı olur." },
    ],
    compareSocialTitle: "Sadece Sosyal Medya",
    compareSocialItems: [
      "Bilgiler dağınık kalabilir",
      "Hizmet yapısı sınırlı sunulur",
      "İletişim süreci uzayabilir",
      "Profesyonel algı zayıf kalabilir",
    ],
    compareLeonyTitle: "Leony Website",
    compareLeonyItems: [
      "Bilgiler düzenli şekilde sunulur",
      "Hizmetler daha net görünür",
      "Talep akışı daha hızlı işler",
      "Daha güçlü dijital görünüm oluşur",
    ],
    cta: "İşletme Kategorini Seç",
  },
  categories: {
    eyebrow: "Sektörler",
    title: "İşletme Kategorini Seç",
    subtitle:
      "Sektörüne uygun demo projeleri, örnek yapıları ve paketleri daha net incelemek için kategorini seç.",
    items: {
      "cafe-restoran": { title: "Cafe / Restoran", desc: "Menü, konum, rezervasyon yönlendirmesi ve iletişim akışı için modern web çözümü." },
      "klinik-dis-klinigi": { title: "Klinik / Diş Kliniği", desc: "Hizmetler, randevu talepleri ve güven veren dijital görünüm için profesyonel web yapısı." },
      "guzellik-salonu-nail-studio": { title: "Güzellik Salonu / Nail Studio", desc: "Hizmet listesi, örnek işler, galeri ve iletişim akışı için şık dijital vitrin." },
      "barber-kuafor": { title: "Barber / Kuaför", desc: "Tanıtım, hizmetler, galeri ve WhatsApp yönlendirmesi için modern website yapısı." },
      "vet-klinik": { title: "Vet Klinik", desc: "Hizmetler, randevu talepleri ve iletişim akışı için güven veren dijital yapı." },
      "terapist-psikolog": { title: "Terapist / Psikolog", desc: "Randevu, hizmet bilgisi ve sade danışan deneyimi için profesyonel web çözümü." },
    },
    incele: "Sektörü incele",
    customTitle: "Benim kategorim listede yok",
    customDesc: "Kategoriniz listede yoksa işletmenize özel web çözümünü birlikte planlayabiliriz.",
    customCta: "Formu aç",
    customAria: "Benim kategorim listede yok — bilgi formu aç",
  },
  demos: {
    eyebrow: "Demo Projeler",
    title: "Sektörlere göre demo hub",
    subtitle:
      "Farklı sektörler için hazırlanan demo projeleri inceleyerek işletmene en uygun dijital yapıyı daha kolay belirleyebilirsin.",
    badges: {
      menu: "Menü / Hizmet Listesi",
      mobile: "Mobile Responsive",
      whatsapp: "WhatsApp Integration",
      appointment: "Randevu Akışı",
      formMgmt: "Form Yönetimi",
      adminDash: "Admin Dashboard Seçeneği",
      gallery: "Galeri",
    },
    viewDemo: "Demo’yu Gör",
    comingSoon: "Hazırlanıyor",
    sectorBySlug: {
      "cafe-restoran": "Cafe / Restoran",
      "klinik-dis-klinigi": "Klinik / Diş Kliniği",
      "guzellik-salonu-nail-studio": "Güzellik Salonu / Nail Studio",
      "barber-kuafor": "Barber / Kuaför",
      "vet-klinik": "Vet Klinik",
      "terapist-psikolog": "Terapist / Psikolog",
    },
    items: {
      cafe: { title: "Cafe / Restoran Demo", sectorSlug: "cafe-restoran", desc: "Menü, konum, rezervasyon yönlendirmesi ve iletişim akışı için modern vitrin.", badges: ["menu", "mobile", "whatsapp"] },
      clinic: { title: "Klinik / Diş Kliniği Demo", sectorSlug: "klinik-dis-klinigi", desc: "Hizmetler, randevu akışı ve hasta talep yönetimi için profesyonel yapı.", badges: ["appointment", "formMgmt", "adminDash"] },
      beauty: { title: "Güzellik Salonu / Nail Studio Demo", sectorSlug: "guzellik-salonu-nail-studio", desc: "Hizmet listesi, galeri ve randevu/iletişim akışı için şık vitrin.", badges: ["gallery", "menu", "whatsapp"] },
      barber: { title: "Barber / Kuaför Demo", sectorSlug: "barber-kuafor", desc: "Hizmetler, galeri ve WhatsApp odaklı modern tek sayfa yapısı.", badges: ["mobile", "gallery", "whatsapp"] },
      vet: { title: "Vet Klinik Demo", sectorSlug: "vet-klinik", desc: "Randevu talepleri, hizmet bilgileri ve yönetim odaklı yapı.", badges: ["appointment", "adminDash", "whatsapp"] },
      therapist: { title: "Terapist / Psikolog Demo", sectorSlug: "terapist-psikolog", desc: "Danışan iletişimi, randevu akışı ve güven veren sade deneyim.", badges: ["appointment", "formMgmt", "whatsapp"] },
    },
  },
  packages: {
    eyebrow: "Paketler",
    title: "Markanızın dijital hedeflerine en uygun paket seçimi.",
    subtitle: "İşletmenin ihtiyacına uygun çözümü seçerek web sitesi yapısını daha net planlayabilirsin.",
    bonusTag: "Bonus:",
    bonusText: "Müşteriye özel tasarım taslağı ve revize imkânı",
    featuredTag: "En çok tercih edilen",
    priceNote: "Fiyat bilgisi için WhatsApp’tan teklif al.",
    paketLabel: "Paket",
    items: {
      baslangic: {
        name: "Başlangıç Paketi",
        short: "Temel dijital görünürlük isteyen işletmeler için sade, modern ve güven veren başlangıç çözümü.",
        ideal: "Tek sayfalık, temiz ve mobil uyumlu bir web sitesiyle dijitalde yer almak isteyen işletmeler için.",
        features: [
          "Tek sayfalık modern website",
          "Mobil uyumlu tasarım",
          "Hizmet / işletme bilgileri",
          "İletişim alanı",
          "WhatsApp yönlendirmesi",
          "Sosyal medya linkleri",
          "Temel SEO yapısı",
          "Google’da görünürlük için temel kurulum",
          "Domain / hosting süreci için yönlendirme desteği",
          "Yayına alma desteği",
          "7 gün ücretsiz teknik destek",
        ],
        delivery: "Teslimat: 3–5 iş günü",
        cta: "Başlangıç Paketi İçin Bilgi Al",
        waMessage: "Merhaba, Leony üzerinden Başlangıç Paketi hakkında bilgi almak istiyorum.",
      },
      isletme: {
        name: "İşletme Paketi",
        short: "Daha kapsamlı içerik yapısı, güçlü sunum ve performans takibi isteyen işletmeler için.",
        ideal: "Hizmetlerini, görsellerini, iletişim akışını ve Google görünürlüğünü daha profesyonel sunmak isteyen işletmeler.",
        inheritFrom: "Başlangıç Paketindeki her şey +",
        features: [
          "Çok bölümlü website",
          "Hakkımızda bölümü",
          "Galeri alanı",
          "Google Maps alanı",
          "WhatsApp ve mail yönlendirmeleri",
          "Daha gelişmiş içerik yerleşimi",
          "Daha güçlü SEO yapısı",
          "Google Analytics kurulumu",
          "Search Console kurulumu",
          "Ek dil seçeneği",
          "Ziyaretçi ve iletişim performansı takibi",
          "14 gün ücretsiz teknik destek",
        ],
        delivery: "Teslimat: 5–7 iş günü",
        cta: "İşletme Paketi İçin Bilgi Al",
        waMessage: "Merhaba, Leony üzerinden İşletme Paketi hakkında bilgi almak istiyorum.",
      },
      profesyonel: {
        name: "Profesyonel Paket",
        short: "Standart web sitesinden daha fazlasını isteyen işletmeler için; yönetilebilir, geliştirilebilir ve özel akışlara sahip dijital sistem çözümü.",
        ideal: "Randevu, başvuru, talep toplama, yönetim paneli veya özel müşteri akışlarıyla dijital sürecini büyütmek isteyen markalar için.",
        inheritFrom: "İşletme Paketindeki her şey +",
        features: [
          "Özel ihtiyaçlara göre gelişmiş sayfa yapısı",
          "Admin dashboard seçeneği",
          "Randevu / booking sistemi seçeneği",
          "Talep / başvuru / form yönetimi",
          "Müşteri bilgilerinin güvenli şekilde tutulması",
          "Gelişmiş dönüşüm ve iletişim takibi",
          "Google Business Profile yönlendirme desteği",
          "Çoklu dil yapısına uygun sistem kurgusu",
          "Daha modüler ve geliştirilebilir altyapı",
          "Özel entegrasyonlara uygun yapı",
          "30 gün ücretsiz teknik destek",
        ],
        badge: "Gelişmiş Özelleştirme Seçenekleri",
        delivery: "Teslimat: 7–10 iş günü",
        cta: "Profesyonel Paket İçin Bilgi Al",
        waMessage: "Merhaba, Leony üzerinden Profesyonel Paket hakkında bilgi almak istiyorum.",
      },
    },
    extras: {
      title: "Ek Hizmetler ve Bakım Seçenekleri",
      text: "Paketlere ek olarak, işletmenizin ihtiyacına göre ek hizmetler ve ücretli bakım seçenekleri ayrıca sunulabilir. Detaylar proje görüşmesi sırasında paylaşılır.",
      support: "Ücretsiz teknik destek süreleri paketlere dahildir; devam eden bakım ve güncelleme ihtiyaçları için ayrı planlama yapılır.",
      footnote: "Fiyatlar proje kapsamına göre belirlenir. Domain, hosting, kurumsal e-posta ve üçüncü parti servis ücretleri fiyata dahil değildir; gerekli kurulum süreçlerinde teknik yönlendirme sağlanır.",
    },
  },
  process: {
    eyebrow: "Süreç",
    title: "Nasıl Çalışıyoruz?",
    subtitle: "Süreç, işletmenin ihtiyacına uygun şekilde sade ve planlı ilerler.",
    stepLabel: "Adım",
    steps: [
      { title: "İhtiyacı Belirleme", text: "İşletmenin hedefleri ve ihtiyaçları netleştirilir." },
      { title: "Doğru Yapıyı Planlama", text: "Sektör, içerik yapısı ve uygun paket birlikte belirlenir." },
      { title: "Tasarım ve Geliştirme", text: "Modern, mobil uyumlu ve hedefe uygun web çözümü hazırlanır." },
      { title: "Yayın ve Teslim", text: "Proje yayına alınır ve kullanıma hazır hale getirilir." },
    ],
  },
  faq: {
    eyebrow: "SSS",
    title: "Sık Sorulan Sorular",
    items: [
      { q: "Web sitesi kaç günde teslim edilir?", a: "Seçilen pakete göre değişir. Başlangıç Paketi 3–5 iş günü, İşletme Paketi 5–7 iş günü, Profesyonel Paket ise 7–10 iş günü içinde hazırlanır." },
      { q: "Fiyatlar neden yazmıyor?", a: "Her işletmenin ihtiyacı farklı olduğu için fiyat bilgisi WhatsApp üzerinden netleştirilir. Böylece işletmeye en uygun teklif hazırlanır." },
      { q: "Domain ve hosting dahil mi?", a: "Domain ve hosting ihtiyaca göre ayrıca konuşulur. Gerekirse domain, hosting ve yayına alma sürecinde yönlendirme sağlanır." },
      { q: "Website mobil uyumlu olur mu?", a: "Evet. Tüm Leony web siteleri mobil, tablet ve masaüstü cihazlara uyumlu hazırlanır." },
      { q: "WhatsApp butonu eklenebilir mi?", a: "Evet. Ziyaretçilerin tek tıkla WhatsApp üzerinden iletişime geçebilmesi için yönlendirme butonları eklenebilir." },
      { q: "Sonradan değişiklik yapılabilir mi?", a: "Evet. Teslim sonrası ihtiyaçlara göre düzenleme ve geliştirme seçenekleri ayrıca konuşulabilir." },
      { q: "Teslim sonrası destek sağlıyor musunuz?", a: "Evet. Website teslim edildikten sonra teknik bir sorun veya yönlendirme ihtiyacı olursa destek sağlanır. Ek geliştirme ve kapsam dışı değişiklikler ayrıca değerlendirilir." },
      { q: "Demo projeleri inceleyebilir miyim?", a: "Evet. Aktif demo projeler ilgili sektör sayfalarında ve demo projeler bölümünde görüntülenebilir." },
      { q: "Randevu sistemi eklenebilir mi?", a: "Evet. İhtiyaca göre randevu/booking akışları ve yönetim odaklı çözümler planlanabilir." },
      { q: "Admin panel yapılabilir mi?", a: "Evet. İhtiyaca göre yönetim paneli, içerik yönetimi veya talep takip yapıları geliştirilebilir." },
      { q: "Paket seçmeden bilgi alabilir miyim?", a: "Evet. Paket seçmeden de WhatsApp veya mail üzerinden bilgi talebi gönderebilirsin." },
      { q: "Kategorim listede yoksa ne yapmalıyım?", a: "Listede olmayan işletme türleri için de özel web çözümleri planlanabilir. WhatsApp veya mail üzerinden iletişime geçebilirsin." },
    ],
  },
  contact: {
    eyebrow: "İletişim",
    title: "İletişime Geç",
    subtitle:
      "Hangi paketin size uygun olduğundan emin değil misiniz? Bizimle iletişime geçin, işletmenizin ihtiyaçlarını birlikte değerlendirelim ve sizin için en doğru dijital çözümü belirleyelim.",
    successTitle: "Talebin alındı",
    successBody: "Bilgi talebin alındı. En kısa sürede dönüş yapılacak.",
    successAgain: "Yeni talep gönder",
    submit: "Bilgi Talebi Gönder",
    submitting: "Gönderiliyor...",
    fields: {
      name: "Ad Soyad",
      namePh: "Adın ve soyadın",
      category: "İşletme Kategorisi",
      categoryPlaceholder: "Seç...",
      customCategory: "İşletme kategorini yaz",
      customCategoryPh: "Örn: Çiçekçi, Kişisel Antrenör...",
      email: "Email",
      emailOptional: "Email / E-posta (opsiyonel)",
      emailPh: "ornek@email.com",
      method: "Tercih edilen iletişim yöntemi",
      phone: "Telefon (WhatsApp)",
      phonePh: "5XX XXX XX XX",
      whatsappLabel: "WhatsApp Numaranız",
      whatsappHelper: "Sizinle dönüş yapabilmemiz için WhatsApp numaranızı yazın.",
      countrySearchPh: "Ülke kodu seçin",
      message: "Mesaj",
      messagePh: "İşletmen ve ihtiyacın hakkında kısaca bahset.",
    },
    methods: { whatsapp: "WhatsApp", mail: "Mail" },
    categoryOther: "Diğer",
    errors: {
      name: "Ad soyad gerekli",
      category: "Kategori seç",
      customCategory: "İşletme kategorini yaz",
      email: "Geçerli bir email gir",
      phone: "Lütfen geçerli bir WhatsApp numarası girin.",
      message: "Kısa bir mesaj yaz",
    },
    toastSuccess: "Talebiniz oluşturuldu. En kısa sürede sizinle iletişime geçeceğiz.",
    toastError: "Talebiniz oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin veya WhatsApp üzerinden bizimle iletişime geçin.",
  },
  footer: {
    tagline: "İşletmeler için modern ve iletişim odaklı web çözümleri.",
    quickLinks: "Hızlı Bağlantılar",
    socialLegal: "Sosyal & Yasal",
    kvkk: "KVKK Aydınlatma Metni",
    privacyPolicy: "Gizlilik Politikası",
    copyright: "© 2026 Leony. Tüm hakları saklıdır.",
  },
  sectorPage: {
    allSectors: "Tüm sektörler",
    comparePackages: "Paketleri Karşılaştır",
    waCta: "WhatsApp’tan Bilgi Al",
    demoEyebrow: "Demo Önizleme",
    demoTitleTpl: (label) => `${label} için örnek site yapısı`,
    demoSubtitle: "İşletmenizin web sitesinin nasıl görünebileceğine dair sektöre özel demo önizleme.",
    advEyebrow: "Yönetim odaklı",
    advTitle: "Randevu, yönetim ve danışan akışı",
    advSubtitle: "İhtiyaca göre randevu sistemi, admin dashboard ve talep yönetimi entegre edilebilir.",
    advCards: [
      { t: "Randevu Sistemi", d: "Online randevu oluşturma, takvim ve onay akışı." },
      { t: "Admin Dashboard", d: "Talepleri ve randevuları tek arayüzden yönet." },
      { t: "Güven Veren Akış", d: "Profesyonel iletişim ve düzenli danışan deneyimi." },
    ],
    notFoundTitle: "Sektör bulunamadı",
    notFoundHome: "← Anasayfaya dön",
    errorText: "Bir hata oluştu.",
  },
  sectors: {
    "cafe-restoran": {
      title: "Cafe ve restoranlar için modern, iletişim odaklı web çözümü",
      subtitle: "Menü, konum, çalışma saatleri, rezervasyon yönlendirmesi ve sosyal medya bağlantılarını tek bir profesyonel sayfada düzenli şekilde sun.",
      label: "Cafe / Restoran",
      benefits: ["Menüyü net sunar", "Konum ve çalışma saatleri öne çıkar", "Rezervasyon ve iletişim akışı", "Sosyal medya trafiğini yönlendirir"],
    },
    "klinik-dis-klinigi": {
      title: "Klinik ve diş klinikleri için profesyonel web sitesi ve yönetim odaklı çözüm",
      subtitle: "Hizmetleri, randevu sürecini ve iletişim akışını daha güçlü sunan modern dijital yapı.",
      label: "Klinik / Diş Kliniği",
      benefits: ["Randevu akışını destekler", "Yönetim paneli seçeneği", "Hasta iletişimini sadeleştirir", "Güven veren profesyonel görünüm"],
    },
    "guzellik-salonu-nail-studio": {
      title: "Güzellik salonları ve nail studio’lar için şık dijital vitrin",
      subtitle: "Hizmet listesi, galeri ve randevu/iletişim akışını düzenli sunan modern web çözümü.",
      label: "Güzellik Salonu / Nail Studio",
      benefits: ["Hizmetleri düzenli sunar", "Galeri ile örnek işleri öne çıkarır", "Randevu talep akışını destekler", "Marka algısını güçlendirir"],
    },
    "barber-kuafor": {
      title: "Barber ve kuaförler için modern web sitesi",
      subtitle: "Hizmetleri, çalışma saatlerini, galeri alanını ve iletişim akışını tek bir profesyonel yapıda sunan modern web çözümü.",
      label: "Barber / Kuaför",
      benefits: ["Hizmetleri düzenli sunar", "Galeri ve örnek işleri öne çıkarır", "WhatsApp taleplerini hızlandırır", "Güven veren marka algısı"],
    },
    "vet-klinik": {
      title: "Vet klinikler için randevu ve iletişim odaklı web çözümü",
      subtitle: "Hizmet bilgileri, randevu talepleri ve iletişim akışını düzenli sunan güven veren dijital yapı.",
      label: "Vet Klinik",
      benefits: ["Randevu ve talep akışını destekler", "Hizmetleri düzenli sunar", "İletişimi sadeleştirir", "Güven veren marka algısı oluşturur"],
    },
    "terapist-psikolog": {
      title: "Terapist ve psikologlar için randevu odaklı modern web çözümü",
      subtitle: "Danışan iletişimini sadeleştiren, randevu akışını destekleyen ve güven veren bir dijital yapı.",
      label: "Terapist / Psikolog",
      benefits: ["Danışan iletişimini sadeleştirir", "Randevu akışını destekler", "Güven veren sade yapı", "Yönetim odaklı seçenekler"],
    },
  },
  sectorPreview: {
    cafe: {
      headline: "Lezzeti ve atmosferi dijitalde keşfet.",
      ctas: [{ label: "Rezervasyon", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Menü",
      items: ["Espresso Bar", "Brunch", "Tatlılar", "Soğuk İçecekler"],
      location: "Konum · Çalışma saatleri · Rezervasyon",
      sideTitle: "Bugün",
      side: [
        { t: "12:30", n: "Masa · 2", s: "Onaylı" },
        { t: "14:00", n: "Masa · 4", s: "Onaylı" },
        { t: "19:15", n: "Masa · 6", s: "Beklemede" },
      ],
    },
    clinic: {
      headline: "Hasta deneyiminde güven veren dijital görünüm.",
      ctas: [{ label: "Randevu Al", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Hizmetler",
      items: ["Genel Muayene", "İmplant", "Estetik Diş", "Çocuk Diş"],
      location: "Hekim kadrosu · Adres · Çalışma saatleri",
      sideTitle: "Bugünkü randevular",
      side: [
        { t: "10:30", n: "A. Yılmaz", s: "Onaylı" },
        { t: "12:00", n: "M. Demir", s: "Onaylı" },
        { t: "15:15", n: "E. Kaya", s: "Yeni" },
      ],
    },
    beauty: {
      headline: "Hizmetlerini şık bir dijital vitrinde sun.",
      ctas: [{ label: "Randevu", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Hizmet Listesi",
      items: ["Manikür", "Pedikür", "Cilt Bakımı", "Kaş Tasarımı"],
      location: "Galeri · Konum · Çalışma saatleri",
      sideTitle: "Galeri",
      side: [
        { t: "Set", n: "Nail Art", s: "★ 4.9" },
        { t: "Bakım", n: "Cilt", s: "★ 4.8" },
        { t: "Tasarım", n: "Kaş", s: "★ 5.0" },
      ],
    },
    barber: {
      headline: "Tarzını öne çıkaran modern barber web sitesi.",
      ctas: [{ label: "Hizmetler", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Hizmetler",
      items: ["Saç Kesimi", "Sakal", "Cilt Bakımı", "Çocuk Kesimi"],
      location: "Galeri · Konum · WhatsApp",
      sideTitle: "Yorumlar",
      side: [
        { t: "★ 5.0", n: "Kemal A.", s: "Yeni" },
        { t: "★ 4.9", n: "Burak T.", s: "Yeni" },
        { t: "★ 4.8", n: "Onur Y.", s: "" },
      ],
    },
    vet: {
      headline: "Dostlar için güven veren randevu deneyimi.",
      ctas: [{ label: "Randevu", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Hizmetler",
      items: ["Muayene", "Aşı", "Operasyon", "Bakım"],
      location: "Klinik adresi · Acil iletişim · Çalışma saatleri",
      sideTitle: "Bugün",
      side: [
        { t: "09:30", n: "Boncuk", s: "Aşı" },
        { t: "11:00", n: "Pamuk", s: "Kontrol" },
        { t: "14:00", n: "Maya", s: "Yeni" },
      ],
    },
    therapist: {
      headline: "Danışan deneyimini sade ve güvenle taşı.",
      ctas: [{ label: "Randevu", tone: "muted" }, { label: "İletişim", tone: "muted" }],
      sectionTitle: "Çalışma Alanları",
      items: ["Bireysel", "Çift", "Aile", "Online Seans"],
      location: "Yaklaşım · Seans bilgisi · İletişim",
      sideTitle: "Müsaitlik",
      side: [
        { t: "Pzt", n: "10:00", s: "Açık" },
        { t: "Çar", n: "14:00", s: "Açık" },
        { t: "Cum", n: "18:00", s: "Açık" },
      ],
    },
  },
  assistant: {
    name: "Leony Team",
    status: "Genellikle birkaç dakikada yanıt verir",
    greeting: "Merhaba 👋 İşletmeniz için web sitesi hakkında hızlıca bilgi almak isterseniz WhatsApp üzerinden bize yazabilirsiniz.",
    waCta: "WhatsApp’tan Bilgi Al",
    openAria: "Leony asistanını aç",
    closeAria: "Kapat",
  },
  scrollTop: { aria: "Yukarı çık" },
  customCatModal: {
    tag: "Özel Kategori",
    title: "İşletme kategorinizi yazın",
    subtitle: "Kategoriniz listede yoksa bilgilerinizi bırakın, size uygun web çözümünü birlikte değerlendirelim.",
    fields: {
      name: "Ad Soyad", nameP: "Adın ve soyadın",
      category: "İşletme Kategorisi", categoryP: "Örn: Çiçekçi, Kişisel Antrenör",
      email: "Email", emailP: "ornek@email.com",
      phone: "Telefon", phoneP: "+90 5XX XXX XX XX",
      message: "Kısa Mesaj", messageP: "İhtiyacın hakkında kısaca bahset.",
    },
    submit: "Talebimi Gönder",
    submitting: "Gönderiliyor...",
    errors: { name: "Ad soyad gerekli", category: "Kategori gerekli", email: "Geçerli email gir", phone: "Lütfen geçerli bir WhatsApp numarası girin.", message: "Kısa bir mesaj yaz" },
    waPrefix: "Merhaba, Leony üzerinden listede olmayan bir işletme kategorisi için web sitesi hizmeti hakkında bilgi almak istiyorum.",
    waLabels: { name: "Ad Soyad", category: "İşletme Kategorisi", email: "Email", phone: "Telefon", message: "Mesaj" },
    closeAria: "Kapat",
    dialogAria: "İşletme kategorisi formu",
    successTitle: "Talebiniz alındı",
    toastSuccess: "Talebiniz oluşturuldu. En kısa sürede sizinle iletişime geçeceğiz.",
    toastError: "Talebiniz oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.",
  },
  switcher: { aria: "Dil seç" },
  waMessages: {
    headerGeneric: "Merhaba, Leony üzerinden web sitesi hizmetleri hakkında bilgi almak istiyorum.",
    assistant: "Merhaba, işletmem için website hakkında bilgi almak istiyorum.",
    footerGeneric: "Merhaba, Leony hakkında bilgi almak istiyorum.",
    sectorBody: (label) => `Merhaba, Leony üzerinden ${label} kategorisi için web sitesi hizmetleri hakkında bilgi almak istiyorum.`,
    packageGeneric: (pkg) => `Merhaba, Leony üzerinden ${pkg} hakkında bilgi almak istiyorum.`,
    packageWithSector: (label, pkg) => `Merhaba, Leony üzerinden ${label} kategorisi için ${pkg} hakkında bilgi almak istiyorum.`,
  },
  heroVisual: {
    urlText: "leony.app/demo",
    webBlockEyebrow: "Web Çözümü",
    webBlockTitle: "Modern, hızlı ve dönüşüm odaklı.",
    metrics: [
      { v: "+38%", l: "Talep" },
      { v: "1.2s", l: "Yük" },
      { v: "A+", l: "Mobil" },
    ],
    quickLinks: ["Randevu", "Galeri", "Menü", "İletişim"],
    adminTitle: "Admin Dashboard",
    adminSub: "Talepler · Bugün",
    apptTitle: "Randevu Yönetimi",
    apptSub: "Bugün · 4 yeni",
    chips: {
      contactForm: "İletişim Formu",
      whatsappFlow: "WhatsApp Akışı",
      mobile: "Mobil Uyumlu",
      demos: "Demo Projeler",
    },
  },
};

const AZ: Dict = {
  nav: {
    home: "Ana səhifə",
    whatIs: "Leony Nədir?",
    whyWebsite: "Niyə Vebsayt?",
    sectors: "Sektorlar",
    demos: "Demo Layihələr",
    packages: "Paketlər",
    faq: "FAQ",
    contact: "Əlaqə",
    waCta: "WhatsApp ilə yaz",
    menuOpen: "Menyunu aç",
  },
  hero: {
    badge: "Biznesiniz üçün modern rəqəmsal vitrin",
    h1Pre: "Brendinizi önə çıxaran, ",
    h1Highlight: "sürətli və etibarlı veb həllərlə",
    h1Post: " rəqəmsal mühitdə güclü ilk təəssürat yaradın.",
    sub: "Leony, bizneslərin rəqəmsalda etibarlı görünüş qazanması üçün modern vebsaytlar, demo layihələr və ehtiyaca uyğun veb həllər hazırlayır.",
    cta: "Biznes Kateqoriyasını Seçin",
    chips: ["Mobil uyğun", "Modern interfeys", "Konversiya yönümlü", "Sürətli təslim"],
  },
  whatIs: {
    eyebrow: "Leony Nədir?",
    titlePre: "Brendlər üçün ",
    titleHighlight: "modern rəqəmsal studiya",
    titlePost: " təcrübəsi.",
    body: "Leony; brendlərin və xidmət yönümlü bizneslərin rəqəmsalda daha peşəkar, etibarlı və əlçatan görünməsini təmin edən rəqəmsal studiyadır. Biznesin özünü aydın izah etməsinə, müştərilərin lazımi məlumata asanlıqla çatmasına və ilk təəssüratın daha güclü olmasına diqqət yetirir.",
    highlights: [
      "Modern interfeys dizaynı",
      "Mobil uyğun struktur",
      "Konversiya yönümlü əlaqə axını",
      "Ehtiyaca uyğun xüsusi həllər",
    ],
  },
  whyWebsite: {
    eyebrow: "Niyə Vebsayt?",
    titlePre: "Vebsayt artıq dəbdəbə deyil, ",
    titleHighlight: "biznesinizin rəqəmsal ünvanıdır.",
    subtitle:
      "Müştərilərinizə biznesinizi internet üzərindən tanımaq, xidmətlərinizi incələmək və sizinlə asanlıqla əlaqə qurmaq imkanı verir. Bu, brendinizi sektorda daha peşəkar, etibarlı və əlçatan göstərir.",
    benefits: [
      { title: "Brend qavrayışını gücləndirir", text: "Peşəkar vebsayt biznesi daha etibarlı və korporativ göstərir." },
      { title: "Müştəri axınını sadələşdirir", text: "Xidmətlər, əlaqə, ünvan və vacib məlumatlar bir strukturda nizamla təqdim olunur." },
      { title: "Sorğu toplamağı sürətləndirir", text: "WhatsApp, formlar və yönləndirmə sahələri sayəsində potensial müştərilər daha tez addım atır." },
      { title: "Sosial media trafikini yönləndirir", text: "Instagram bio-sundakı tək link ziyarətçiləri daha peşəkar və izahlı bir səhifəyə daşıyır." },
      { title: "Xidmətləri aydınlaşdırır", text: "Ziyarətçilər xidmətləri daha tez və anlaşıqlı şəkildə incələyə bilir." },
      { title: "Rəqəmsal görünürlüyə təməl qoyur", text: "Vebsayt brendin internetdə daha güclü görünürlük qazanmasına kömək edir." },
    ],
    compareSocialTitle: "Yalnız Sosial Media",
    compareSocialItems: [
      "Məlumatlar dağınıq qala bilər",
      "Xidmət strukturu məhdud təqdim olunur",
      "Əlaqə prosesi uzana bilər",
      "Peşəkar qavrayış zəif qala bilər",
    ],
    compareLeonyTitle: "Leony Vebsayt",
    compareLeonyItems: [
      "Məlumatlar nizamlı şəkildə təqdim olunur",
      "Xidmətlər daha aydın görünür",
      "Sorğu axını daha sürətli işləyir",
      "Daha güclü rəqəmsal görünüş formalaşır",
    ],
    cta: "Biznes Kateqoriyasını Seçin",
  },
  categories: {
    eyebrow: "Sektorlar",
    title: "Biznes Kateqoriyasını Seçin",
    subtitle: "Sektorunuza uyğun demo layihələri, nümunələri və paketləri daha aydın incələmək üçün kateqoriyanızı seçin.",
    items: {
      "cafe-restoran": { title: "Kafe / Restoran", desc: "Menyu, ünvan, rezervasiya yönləndirməsi və əlaqə axını üçün modern veb həll." },
      "klinik-dis-klinigi": { title: "Klinika / Diş Klinikası", desc: "Xidmətlər, qəbul sorğuları və etibar verən rəqəmsal görünüş üçün peşəkar veb struktur." },
      "guzellik-salonu-nail-studio": { title: "Gözəllik Salonu / Nail Studio", desc: "Xidmət siyahısı, nümunələr, qalereya və əlaqə axını üçün şık rəqəmsal vitrin." },
      "barber-kuafor": { title: "Barber / Bərbər", desc: "Tanıtım, xidmətlər, qalereya və WhatsApp yönləndirməsi üçün modern vebsayt strukturu." },
      "vet-klinik": { title: "Veterinar Klinika", desc: "Xidmətlər, qəbul sorğuları və əlaqə axını üçün etibar verən rəqəmsal struktur." },
      "terapist-psikolog": { title: "Terapevt / Psixoloq", desc: "Qəbul, xidmət məlumatı və sadə müştəri təcrübəsi üçün peşəkar veb həll." },
    },
    incele: "Sektoru incələ",
    customTitle: "Kateqoriyam siyahıda yoxdur",
    customDesc: "Kateqoriyanız siyahıda yoxdursa biznesiniz üçün xüsusi veb həlli birlikdə planlaya bilərik.",
    customCta: "Formu aç",
    customAria: "Kateqoriyam siyahıda yoxdur — məlumat formu aç",
  },
  demos: {
    eyebrow: "Demo Layihələr",
    title: "Sektorlara görə demo hub",
    subtitle: "Müxtəlif sektorlar üçün hazırlanan demo layihələri incələyərək biznesinizə uyğun rəqəmsal strukturu daha rahat müəyyən edə bilərsiniz.",
    badges: {
      menu: "Menyu / Xidmət Siyahısı",
      mobile: "Mobile Responsive",
      whatsapp: "WhatsApp Integration",
      appointment: "Qəbul Axını",
      formMgmt: "Form İdarəetməsi",
      adminDash: "Admin Dashboard Seçimi",
      gallery: "Qalereya",
    },
    viewDemo: "Demonu Bax",
    comingSoon: "Hazırlanır",
    sectorBySlug: {
      "cafe-restoran": "Kafe / Restoran",
      "klinik-dis-klinigi": "Klinika / Diş Klinikası",
      "guzellik-salonu-nail-studio": "Gözəllik Salonu / Nail Studio",
      "barber-kuafor": "Barber / Bərbər",
      "vet-klinik": "Veterinar Klinika",
      "terapist-psikolog": "Terapevt / Psixoloq",
    },
    items: {
      cafe: { title: "Kafe / Restoran Demo", sectorSlug: "cafe-restoran", desc: "Menyu, ünvan, rezervasiya və əlaqə axını üçün modern vitrin.", badges: ["menu", "mobile", "whatsapp"] },
      clinic: { title: "Klinika / Diş Klinikası Demo", sectorSlug: "klinik-dis-klinigi", desc: "Xidmətlər, qəbul axını və pasiyent sorğu idarəetməsi üçün peşəkar struktur.", badges: ["appointment", "formMgmt", "adminDash"] },
      beauty: { title: "Gözəllik Salonu / Nail Studio Demo", sectorSlug: "guzellik-salonu-nail-studio", desc: "Xidmət siyahısı, qalereya və qəbul/əlaqə axını üçün şık vitrin.", badges: ["gallery", "menu", "whatsapp"] },
      barber: { title: "Barber / Bərbər Demo", sectorSlug: "barber-kuafor", desc: "Xidmətlər, qalereya və WhatsApp yönümlü modern tək səhifə strukturu.", badges: ["mobile", "gallery", "whatsapp"] },
      vet: { title: "Veterinar Klinika Demo", sectorSlug: "vet-klinik", desc: "Qəbul sorğuları, xidmət məlumatı və idarəetmə yönümlü struktur.", badges: ["appointment", "adminDash", "whatsapp"] },
      therapist: { title: "Terapevt / Psixoloq Demo", sectorSlug: "terapist-psikolog", desc: "Müştəri əlaqəsi, qəbul axını və etibar verən sadə təcrübə.", badges: ["appointment", "formMgmt", "whatsapp"] },
    },
  },
  packages: {
    eyebrow: "Paketlər",
    title: "Brendinizin rəqəmsal hədəflərinə ən uyğun paket seçimi.",
    subtitle: "Biznesinizin ehtiyacına uyğun həlli seçərək vebsayt strukturunu daha aydın planlaya bilərsiniz.",
    bonusTag: "Bonus:",
    bonusText: "Müştəriyə xüsusi dizayn eskizi və düzəliş imkanı",
    featuredTag: "Ən çox seçilən",
    priceNote: "Qiymət üçün WhatsApp ilə təklif alın.",
    paketLabel: "Paket",
    items: {
      baslangic: {
        name: "Başlanğıc Paketi",
        short: "Əsas rəqəmsal görünürlük istəyən bizneslər üçün sadə, modern və etibar verən başlanğıc həlli.",
        ideal: "Tək səhifəlik, təmiz və mobil uyğun bir vebsaytla rəqəmsalda yer almaq istəyən bizneslər üçün.",
        features: [
          "Tək səhifəlik modern vebsayt",
          "Mobil uyğun dizayn",
          "Xidmət / biznes məlumatları",
          "Əlaqə sahəsi",
          "WhatsApp yönləndirməsi",
          "Sosial media linkləri",
          "Əsas SEO strukturu",
          "Google görünürlüyü üçün əsas quraşdırma",
          "Domen / hostinq prosesi üçün yönləndirmə dəstəyi",
          "Yayım dəstəyi",
          "7 gün pulsuz texniki dəstək",
        ],
        delivery: "Təslim: 3–5 iş günü",
        cta: "Başlanğıc Paketi üçün məlumat al",
        waMessage: "Salam, Leony üzərindən Başlanğıc Paketi haqqında məlumat almaq istəyirəm.",
      },
      isletme: {
        name: "Biznes Paketi",
        short: "Daha geniş məzmun strukturu, güclü təqdimat və performans izləməsi istəyən bizneslər üçün.",
        ideal: "Xidmətlərini, görüntülərini, əlaqə axınını və Google görünürlüyünü daha peşəkar təqdim etmək istəyən bizneslər.",
        inheritFrom: "Başlanğıc Paketindəki hər şey +",
        features: [
          "Çox bölməli vebsayt",
          "Haqqımızda bölməsi",
          "Qalereya sahəsi",
          "Google Maps sahəsi",
          "WhatsApp və mail yönləndirmələri",
          "Daha inkişaf etmiş məzmun yerləşməsi",
          "Daha güclü SEO strukturu",
          "Google Analytics quraşdırması",
          "Search Console quraşdırması",
          "Əlavə dil seçimi",
          "Ziyarətçi və əlaqə performans izləməsi",
          "14 gün pulsuz texniki dəstək",
        ],
        delivery: "Təslim: 5–7 iş günü",
        cta: "Biznes Paketi üçün məlumat al",
        waMessage: "Salam, Leony üzərindən Biznes Paketi haqqında məlumat almaq istəyirəm.",
      },
      profesyonel: {
        name: "Peşəkar Paket",
        short: "Standart vebsaytdan daha çoxunu istəyən bizneslər üçün; idarə oluna bilən, inkişaf etdirilə bilən və xüsusi axınlara sahib rəqəmsal sistem həlli.",
        ideal: "Qəbul, müraciət, sorğu toplama, idarəetmə paneli və ya xüsusi müştəri axınları ilə rəqəmsal prosesini böyütmək istəyən brendlər üçün.",
        inheritFrom: "Biznes Paketindəki hər şey +",
        features: [
          "Xüsusi ehtiyaclara uyğun inkişaf etmiş səhifə strukturu",
          "Admin dashboard seçimi",
          "Qəbul / booking sistemi seçimi",
          "Sorğu / müraciət / form idarəetməsi",
          "Müştəri məlumatlarının təhlükəsiz şəkildə saxlanması",
          "İnkişaf etmiş dönüşüm və əlaqə izləməsi",
          "Google Business Profile yönləndirmə dəstəyi",
          "Çoxdilli quruluşa uyğun sistem qurğusu",
          "Daha modul və inkişaf etdirilə bilən infrastruktur",
          "Xüsusi inteqrasiyalara uyğun struktur",
          "30 gün pulsuz texniki dəstək",
        ],
        badge: "İnkişaf etmiş fərdiləşdirmə seçimləri",
        delivery: "Təslim: 7–10 iş günü",
        cta: "Peşəkar Paket üçün məlumat al",
        waMessage: "Salam, Leony üzərindən Peşəkar Paket haqqında məlumat almaq istəyirəm.",
      },
    },
    extras: {
      title: "Əlavə Xidmətlər və Baxım Seçimləri",
      text: "Paketlərə əlavə olaraq, biznesinizin ehtiyacına görə əlavə xidmətlər və ödənişli baxım seçimləri ayrıca təqdim oluna bilər. Təfərrüatlar layihə müzakirəsi zamanı paylaşılır.",
      support: "Pulsuz texniki dəstək müddətləri paketlərə daxildir; davam edən baxım və yeniləmə ehtiyacları üçün ayrı planlama aparılır.",
      footnote: "Qiymətlər layihə əhatəsinə görə müəyyən edilir. Domen, hostinq, korporativ e-poçt və üçüncü tərəf servis haqları qiymətə daxil deyil; lazımi quraşdırma proseslərində texniki yönləndirmə təmin olunur.",
    },
  },
  process: {
    eyebrow: "Proses",
    title: "Necə işləyirik?",
    subtitle: "Proses biznesin ehtiyacına uyğun sadə və planlı şəkildə irəliləyir.",
    stepLabel: "Addım",
    steps: [
      { title: "Ehtiyacın müəyyənləşdirilməsi", text: "Biznesin məqsədləri və ehtiyacları aydınlaşdırılır." },
      { title: "Doğru strukturun planlanması", text: "Sektor, məzmun strukturu və uyğun paket birlikdə müəyyən edilir." },
      { title: "Dizayn və inkişaf", text: "Modern, mobil uyğun və məqsədə uyğun veb həll hazırlanır." },
      { title: "Yayım və təslim", text: "Layihə yayımlanır və istifadəyə hazır vəziyyətə gətirilir." },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Tez-tez verilən suallar",
    items: [
      { q: "Vebsayt neçə günə təslim edilir?", a: "Seçilən paketə görə dəyişir. Başlanğıc Paketi 3–5 iş günü, Biznes Paketi 5–7 iş günü, Peşəkar Paket isə 7–10 iş günü ərzində hazırlanır." },
      { q: "Qiymətlər niyə yazılmır?", a: "Hər biznesin ehtiyacı fərqli olduğundan qiymət WhatsApp üzərindən dəqiqləşdirilir. Beləliklə biznesə ən uyğun təklif hazırlanır." },
      { q: "Domen və hostinq daxildirmi?", a: "Domen və hostinq ehtiyaca görə ayrıca müzakirə olunur. Lazım gələrsə domen, hostinq və yayım prosesində yönləndirmə təmin edilir." },
      { q: "Vebsayt mobil uyğun olacaq?", a: "Bəli. Bütün Leony vebsaytları mobil, planşet və masaüstü cihazlara uyğun hazırlanır." },
      { q: "WhatsApp düyməsi əlavə oluna bilər?", a: "Bəli. Ziyarətçilərin bir kliklə WhatsApp üzərindən əlaqəyə keçməsi üçün yönləndirmə düymələri əlavə olunur." },
      { q: "Sonradan dəyişiklik edilə bilər?", a: "Bəli. Təslimdən sonra ehtiyaclara görə dəyişiklik və inkişaf seçimləri ayrıca müzakirə oluna bilər." },
      { q: "Təslimdən sonra dəstək verirsiniz?", a: "Bəli. Vebsayt təslim edildikdən sonra texniki problem və ya yönləndirmə ehtiyacı olarsa dəstək verilir. Əlavə inkişaf və əhatə xaricindəki dəyişikliklər ayrıca qiymətləndirilir." },
      { q: "Demo layihələri incələyə bilərəmmi?", a: "Bəli. Aktiv demo layihələr müvafiq sektor səhifələrində və demo bölməsində görüntülənə bilər." },
      { q: "Qəbul sistemi əlavə oluna bilər?", a: "Bəli. Ehtiyaca görə qəbul / booking axınları və idarəetmə yönümlü həllər planlaşdırıla bilər." },
      { q: "Admin panel hazırlana bilər?", a: "Bəli. Ehtiyaca görə idarəetmə paneli, məzmun idarəetməsi və sorğu izləmə strukturları hazırlana bilər." },
      { q: "Paket seçmədən məlumat ala bilərəm?", a: "Bəli. Paket seçmədən də WhatsApp və ya mail üzərindən məlumat sorğusu göndərə bilərsiniz." },
      { q: "Kateqoriyam siyahıda yoxdursa nə etməliyəm?", a: "Siyahıda olmayan biznes növləri üçün də xüsusi veb həllər planlaşdırıla bilər. WhatsApp və ya mail ilə əlaqə saxlaya bilərsiniz." },
    ],
  },
  contact: {
    eyebrow: "Əlaqə",
    title: "Əlaqə saxlayın",
    subtitle:
      "Hansı paketin sizə uyğun olduğundan əmin deyilsiniz? Bizimlə əlaqə saxlayın, biznesinizin ehtiyaclarını birlikdə dəyərləndirək və sizin üçün ən doğru rəqəmsal həlli seçək.",
    successTitle: "Sorğunuz qəbul edildi",
    successBody: "Məlumat sorğunuz qəbul edildi. Ən qısa zamanda cavab veriləcək.",
    successAgain: "Yeni sorğu göndər",
    submit: "Məlumat sorğusu göndər",
    submitting: "Göndərilir...",
    fields: {
      name: "Ad Soyad",
      namePh: "Adınız və soyadınız",
      category: "Biznes Kateqoriyası",
      categoryPlaceholder: "Seçin...",
      customCategory: "Biznes kateqoriyanızı yazın",
      customCategoryPh: "Məs: Çiçəkçi, Şəxsi məşqçi...",
      email: "Email",
      emailOptional: "Email / E-poçt (istəyə bağlı)",
      emailPh: "ornek@email.com",
      method: "Üstün tutulan əlaqə üsulu",
      phone: "Telefon (WhatsApp)",
      phonePh: "5X XXX XX XX",
      whatsappLabel: "WhatsApp nömrəniz",
      whatsappHelper: "Sizinlə əlaqə saxlaya bilməyimiz üçün WhatsApp nömrənizi yazın.",
      countrySearchPh: "Ölkə kodunu seçin",
      message: "Mesaj",
      messagePh: "Biznesiniz və ehtiyacınız barədə qısaca yazın.",
    },
    methods: { whatsapp: "WhatsApp", mail: "Mail" },
    categoryOther: "Digər",
    errors: {
      name: "Ad soyad tələb olunur",
      category: "Kateqoriya seçin",
      customCategory: "Biznes kateqoriyanızı yazın",
      email: "Düzgün email daxil edin",
      phone: "Zəhmət olmasa, düzgün WhatsApp nömrəsi daxil edin.",
      message: "Qısa mesaj yazın",
    },
    toastSuccess: "Sorğunuz yaradıldı. Ən qısa zamanda sizinlə əlaqə saxlayacağıq.",
    toastError: "Sorğunuz göndərilərkən problem yarandı. Yenidən cəhd edin və ya WhatsApp üzərindən əlaqə saxlayın.",
  },
  footer: {
    tagline: "Bizneslər üçün modern və əlaqə yönümlü veb həllər.",
    quickLinks: "Sürətli keçidlər",
    socialLegal: "Sosial və hüquqi",
    kvkk: "KVKK məlumatlandırma",
    privacyPolicy: "Məxfilik Siyasəti",
    copyright: "© 2026 Leony. Bütün hüquqlar qorunur.",
  },
  sectorPage: {
    allSectors: "Bütün sektorlar",
    comparePackages: "Paketləri müqayisə et",
    waCta: "WhatsApp ilə məlumat al",
    demoEyebrow: "Demo önizləmə",
    demoTitleTpl: (label) => `${label} üçün nümunə sayt strukturu`,
    demoSubtitle: "Biznesinizin vebsaytının necə görünə biləcəyinə dair sektora xüsusi demo önizləmə.",
    advEyebrow: "İdarəetmə yönümlü",
    advTitle: "Qəbul, idarəetmə və müştəri axını",
    advSubtitle: "Ehtiyaca görə qəbul sistemi, admin dashboard və sorğu idarəetməsi inteqrasiya edilə bilər.",
    advCards: [
      { t: "Qəbul sistemi", d: "Onlayn qəbul yaratma, təqvim və təsdiq axını." },
      { t: "Admin Dashboard", d: "Sorğu və qəbulları tək interfeysdən idarə et." },
      { t: "Etibar verən axın", d: "Peşəkar əlaqə və nizamlı müştəri təcrübəsi." },
    ],
    notFoundTitle: "Sektor tapılmadı",
    notFoundHome: "← Ana səhifəyə qayıt",
    errorText: "Xəta baş verdi.",
  },
  sectors: {
    "cafe-restoran": {
      title: "Kafe və restoranlar üçün modern, əlaqə yönümlü veb həll",
      subtitle: "Menyu, ünvan, iş saatları, rezervasiya və sosial media əlaqələrini tək peşəkar səhifədə nizamla təqdim edin.",
      label: "Kafe / Restoran",
      benefits: ["Menyunu aydın təqdim edir", "Ünvan və iş saatları önə çıxır", "Rezervasiya və əlaqə axını", "Sosial media trafikini yönləndirir"],
    },
    "klinik-dis-klinigi": {
      title: "Klinika və diş klinikaları üçün peşəkar vebsayt və idarəetmə həlli",
      subtitle: "Xidmətləri, qəbul prosesini və əlaqə axınını daha güclü təqdim edən modern rəqəmsal struktur.",
      label: "Klinika / Diş Klinikası",
      benefits: ["Qəbul axınını dəstəkləyir", "İdarəetmə paneli seçimi", "Pasiyent əlaqəsini sadələşdirir", "Etibar verən peşəkar görünüş"],
    },
    "guzellik-salonu-nail-studio": {
      title: "Gözəllik salonları və nail studio-lar üçün şık rəqəmsal vitrin",
      subtitle: "Xidmət siyahısı, qalereya və qəbul/əlaqə axınını nizamla təqdim edən modern veb həll.",
      label: "Gözəllik Salonu / Nail Studio",
      benefits: ["Xidmətləri nizamla təqdim edir", "Qalereya ilə nümunələri önə çıxarır", "Qəbul sorğu axınını dəstəkləyir", "Brend qavrayışını gücləndirir"],
    },
    "barber-kuafor": {
      title: "Barber və bərbərlər üçün modern vebsayt",
      subtitle: "Xidmətləri, iş saatlarını, qalereya və əlaqə axınını tək peşəkar strukturda təqdim edən modern veb həll.",
      label: "Barber / Bərbər",
      benefits: ["Xidmətləri nizamla təqdim edir", "Qalereya və nümunələri önə çıxarır", "WhatsApp sorğularını sürətləndirir", "Etibar verən brend qavrayışı"],
    },
    "vet-klinik": {
      title: "Veterinar klinikalar üçün qəbul və əlaqə yönümlü veb həll",
      subtitle: "Xidmət məlumatları, qəbul sorğuları və əlaqə axınını nizamla təqdim edən etibar verən rəqəmsal struktur.",
      label: "Veterinar Klinika",
      benefits: ["Qəbul və sorğu axınını dəstəkləyir", "Xidmətləri nizamla təqdim edir", "Əlaqəni sadələşdirir", "Etibar verən brend qavrayışı"],
    },
    "terapist-psikolog": {
      title: "Terapevt və psixoloqlar üçün qəbul yönümlü modern veb həll",
      subtitle: "Müştəri əlaqəsini sadələşdirən, qəbul axınını dəstəkləyən və etibar verən rəqəmsal struktur.",
      label: "Terapevt / Psixoloq",
      benefits: ["Müştəri əlaqəsini sadələşdirir", "Qəbul axınını dəstəkləyir", "Etibar verən sadə struktur", "İdarəetmə yönümlü seçimlər"],
    },
  },
  sectorPreview: {
    cafe: {
      headline: "Dadı və atmosferi rəqəmsalda kəşf et.",
      ctas: [{ label: "Rezervasiya", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Menyu",
      items: ["Espresso Bar", "Brunch", "Şirniyyatlar", "Soyuq içkilər"],
      location: "Ünvan · İş saatları · Rezervasiya",
      sideTitle: "Bu gün",
      side: [
        { t: "12:30", n: "Masa · 2", s: "Təsdiqli" },
        { t: "14:00", n: "Masa · 4", s: "Təsdiqli" },
        { t: "19:15", n: "Masa · 6", s: "Gözləmədə" },
      ],
    },
    clinic: {
      headline: "Pasiyent təcrübəsində etibar verən rəqəmsal görünüş.",
      ctas: [{ label: "Qəbul al", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Xidmətlər",
      items: ["Ümumi müayinə", "İmplant", "Estetik diş", "Uşaq diş"],
      location: "Həkim heyəti · Ünvan · İş saatları",
      sideTitle: "Bugünkü qəbullar",
      side: [
        { t: "10:30", n: "A. Əliyev", s: "Təsdiqli" },
        { t: "12:00", n: "M. Hüseynov", s: "Təsdiqli" },
        { t: "15:15", n: "E. Quliyev", s: "Yeni" },
      ],
    },
    beauty: {
      headline: "Xidmətlərini şık rəqəmsal vitrində təqdim et.",
      ctas: [{ label: "Qəbul", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Xidmət siyahısı",
      items: ["Manikür", "Pedikür", "Üz baxımı", "Qaş dizaynı"],
      location: "Qalereya · Ünvan · İş saatları",
      sideTitle: "Qalereya",
      side: [
        { t: "Set", n: "Nail Art", s: "★ 4.9" },
        { t: "Baxım", n: "Üz", s: "★ 4.8" },
        { t: "Dizayn", n: "Qaş", s: "★ 5.0" },
      ],
    },
    barber: {
      headline: "Üslubunu önə çıxaran modern barber vebsayt.",
      ctas: [{ label: "Xidmətlər", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Xidmətlər",
      items: ["Saç kəsimi", "Saqqal", "Üz baxımı", "Uşaq kəsimi"],
      location: "Qalereya · Ünvan · WhatsApp",
      sideTitle: "Rəylər",
      side: [
        { t: "★ 5.0", n: "Kamal A.", s: "Yeni" },
        { t: "★ 4.9", n: "Burak T.", s: "Yeni" },
        { t: "★ 4.8", n: "Onur Y.", s: "" },
      ],
    },
    vet: {
      headline: "Dostlar üçün etibar verən qəbul təcrübəsi.",
      ctas: [{ label: "Qəbul", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Xidmətlər",
      items: ["Müayinə", "Peyvənd", "Əməliyyat", "Baxım"],
      location: "Klinika ünvanı · Təcili əlaqə · İş saatları",
      sideTitle: "Bu gün",
      side: [
        { t: "09:30", n: "Boncuq", s: "Peyvənd" },
        { t: "11:00", n: "Pamuk", s: "Nəzarət" },
        { t: "14:00", n: "Maya", s: "Yeni" },
      ],
    },
    therapist: {
      headline: "Müştəri təcrübəsini sadə və etibarla daşı.",
      ctas: [{ label: "Qəbul", tone: "muted" }, { label: "Əlaqə", tone: "muted" }],
      sectionTitle: "İş sahələri",
      items: ["Fərdi", "Cüt", "Ailə", "Onlayn sessiya"],
      location: "Yanaşma · Sessiya məlumatı · Əlaqə",
      sideTitle: "Müsaitlik",
      side: [
        { t: "B.e.", n: "10:00", s: "Açıq" },
        { t: "Ç.ax.", n: "14:00", s: "Açıq" },
        { t: "C.", n: "18:00", s: "Açıq" },
      ],
    },
  },
  assistant: {
    name: "Leony Team",
    status: "Adətən bir neçə dəqiqədə cavab verir",
    greeting: "Salam 👋 Bizneziniz üçün vebsayt haqqında qısa məlumat almaq istəsəniz, WhatsApp üzərindən bizə yaza bilərsiniz.",
    waCta: "WhatsApp ilə məlumat al",
    openAria: "Leony asistentini aç",
    closeAria: "Bağla",
  },
  scrollTop: { aria: "Yuxarı qalx" },
  customCatModal: {
    tag: "Xüsusi kateqoriya",
    title: "Biznes kateqoriyanızı yazın",
    subtitle: "Kateqoriyanız siyahıda yoxdursa məlumatlarınızı buraxın, sizə uyğun veb həlli birlikdə dəyərləndirək.",
    fields: {
      name: "Ad Soyad", nameP: "Adınız və soyadınız",
      category: "Biznes Kateqoriyası", categoryP: "Məs: Çiçəkçi, Şəxsi məşqçi",
      email: "Email", emailP: "ornek@email.com",
      phone: "Telefon", phoneP: "+994 5X XXX XX XX",
      message: "Qısa mesaj", messageP: "Ehtiyacınız haqqında qısaca yazın.",
    },
    submit: "WhatsApp-a göndər",
    errors: { name: "Ad soyad tələb olunur", category: "Kateqoriya tələb olunur", email: "Düzgün email daxil edin", phone: "Telefon tələb olunur", message: "Qısa mesaj yazın" },
    waPrefix: "Salam, Leony üzərindən siyahıda olmayan biznes kateqoriyası üçün vebsayt xidməti haqqında məlumat almaq istəyirəm.",
    waLabels: { name: "Ad Soyad", category: "Biznes Kateqoriyası", email: "Email", phone: "Telefon", message: "Mesaj" },
    closeAria: "Bağla",
    dialogAria: "Biznes kateqoriyası formu",
  },
  switcher: { aria: "Dil seç" },
  waMessages: {
    headerGeneric: "Salam, Leony üzərindən vebsayt xidmətləri haqqında məlumat almaq istəyirəm.",
    assistant: "Salam, biznesim üçün vebsayt haqqında məlumat almaq istəyirəm.",
    footerGeneric: "Salam, Leony haqqında məlumat almaq istəyirəm.",
    sectorBody: (label) => `Salam, Leony üzərindən ${label} kateqoriyası üçün vebsayt xidmətləri haqqında məlumat almaq istəyirəm.`,
    packageGeneric: (pkg) => `Salam, Leony üzərindən ${pkg} haqqında məlumat almaq istəyirəm.`,
    packageWithSector: (label, pkg) => `Salam, Leony üzərindən ${label} kateqoriyası üçün ${pkg} haqqında məlumat almaq istəyirəm.`,
  },
  heroVisual: {
    urlText: "leony.app/demo",
    webBlockEyebrow: "Veb Həll",
    webBlockTitle: "Modern, sürətli və konversiya yönümlü.",
    metrics: [
      { v: "+38%", l: "Sorğu" },
      { v: "1.2s", l: "Yüklənmə" },
      { v: "A+", l: "Mobil" },
    ],
    quickLinks: ["Qəbul", "Qalereya", "Menyu", "Əlaqə"],
    adminTitle: "Admin Dashboard",
    adminSub: "Sorğular · Bu gün",
    apptTitle: "Qəbul İdarəetməsi",
    apptSub: "Bu gün · 4 yeni",
    chips: {
      contactForm: "Əlaqə Formu",
      whatsappFlow: "WhatsApp Axını",
      mobile: "Mobil Uyğun",
      demos: "Demo Layihələr",
    },
  },
};

const EN: Dict = {
  nav: {
    home: "Home",
    whatIs: "What is Leony?",
    whyWebsite: "Why a Website?",
    sectors: "Sectors",
    demos: "Demo Projects",
    packages: "Packages",
    faq: "FAQ",
    contact: "Contact",
    waCta: "Message on WhatsApp",
    menuOpen: "Open menu",
  },
  hero: {
    badge: "A modern digital storefront for your business",
    h1Pre: "Make a strong first impression online with ",
    h1Highlight: "fast, reliable web solutions",
    h1Post: " that put your brand in the spotlight.",
    sub: "Leony designs modern websites, demo projects, and tailored web solutions that help businesses look trustworthy and professional online.",
    cta: "Choose Your Business Category",
    chips: ["Mobile friendly", "Modern interface", "Conversion-focused", "Fast delivery"],
  },
  whatIs: {
    eyebrow: "What is Leony?",
    titlePre: "A ",
    titleHighlight: "modern digital studio",
    titlePost: " experience for brands.",
    body: "Leony is a digital studio that helps brands and service-led businesses appear more professional, trustworthy, and accessible online. We focus on telling your story clearly, making the right information easy to find, and turning that first impression into a strong one.",
    highlights: [
      "Modern interface design",
      "Mobile-friendly structure",
      "Conversion-focused contact flow",
      "Tailored solutions per need",
    ],
  },
  whyWebsite: {
    eyebrow: "Why a Website?",
    titlePre: "A website is no longer a luxury — it’s ",
    titleHighlight: "your business’s digital address.",
    subtitle:
      "It gives your customers a way to discover your business, explore your services, and reach you easily — and makes your brand look more professional, trustworthy, and accessible in your industry.",
    benefits: [
      { title: "Strengthens brand perception", text: "A professional website helps your business look more trustworthy and established." },
      { title: "Simplifies the customer journey", text: "Services, contact details, location, and key content are presented in one organized structure." },
      { title: "Speeds up lead capture", text: "WhatsApp, forms, and clear CTAs help potential customers take action faster." },
      { title: "Channels social media traffic", text: "The single link in your Instagram bio sends visitors to a more professional, descriptive page." },
      { title: "Clarifies your services", text: "Visitors can review what you offer faster and with more confidence." },
      { title: "Builds a base for digital visibility", text: "Your website forms a stronger foundation for being found online." },
    ],
    compareSocialTitle: "Social media only",
    compareSocialItems: [
      "Information stays scattered",
      "Service structure is limited",
      "Communication can drag on",
      "Professional perception stays weak",
    ],
    compareLeonyTitle: "Leony website",
    compareLeonyItems: [
      "Information is presented clearly",
      "Services are easier to understand",
      "Lead flow moves faster",
      "A stronger digital presence is built",
    ],
    cta: "Choose Your Business Category",
  },
  categories: {
    eyebrow: "Sectors",
    title: "Choose Your Business Category",
    subtitle: "Pick your category to see demo projects, example structures, and packages tailored to your sector.",
    items: {
      "cafe-restoran": { title: "Cafe / Restaurant", desc: "A modern web solution for menu, location, reservations, and contact flow." },
      "klinik-dis-klinigi": { title: "Clinic / Dental Clinic", desc: "A professional web structure for services, appointments, and a trustworthy digital look." },
      "guzellik-salonu-nail-studio": { title: "Beauty Salon / Nail Studio", desc: "A sleek digital storefront for service list, sample work, gallery, and contact." },
      "barber-kuafor": { title: "Barber / Hair Salon", desc: "A modern website structure for intro, services, gallery, and WhatsApp routing." },
      "vet-klinik": { title: "Vet Clinic", desc: "A trustworthy digital structure for services, appointment requests, and contact." },
      "terapist-psikolog": { title: "Therapist / Psychologist", desc: "A professional web solution for appointments, service info, and a calm client experience." },
    },
    incele: "Explore sector",
    customTitle: "My category isn’t listed",
    customDesc: "If your category isn’t listed, we can plan a tailored web solution for your business together.",
    customCta: "Open form",
    customAria: "My category isn’t listed — open info form",
  },
  demos: {
    eyebrow: "Demo Projects",
    title: "Demos by sector",
    subtitle: "Browse demos crafted for different sectors to figure out the digital structure that fits your business best.",
    badges: {
      menu: "Menu / Service list",
      mobile: "Mobile Responsive",
      whatsapp: "WhatsApp Integration",
      appointment: "Appointment Flow",
      formMgmt: "Form Management",
      adminDash: "Admin Dashboard Option",
      gallery: "Gallery",
    },
    viewDemo: "View Demo",
    comingSoon: "Coming soon",
    sectorBySlug: {
      "cafe-restoran": "Cafe / Restaurant",
      "klinik-dis-klinigi": "Clinic / Dental Clinic",
      "guzellik-salonu-nail-studio": "Beauty Salon / Nail Studio",
      "barber-kuafor": "Barber / Hair Salon",
      "vet-klinik": "Vet Clinic",
      "terapist-psikolog": "Therapist / Psychologist",
    },
    items: {
      cafe: { title: "Cafe / Restaurant Demo", sectorSlug: "cafe-restoran", desc: "A modern storefront for menu, location, reservations, and contact.", badges: ["menu", "mobile", "whatsapp"] },
      clinic: { title: "Clinic / Dental Clinic Demo", sectorSlug: "klinik-dis-klinigi", desc: "A professional structure for services, appointments, and patient request management.", badges: ["appointment", "formMgmt", "adminDash"] },
      beauty: { title: "Beauty Salon / Nail Studio Demo", sectorSlug: "guzellik-salonu-nail-studio", desc: "A sleek storefront for service list, gallery, and appointment / contact flow.", badges: ["gallery", "menu", "whatsapp"] },
      barber: { title: "Barber / Hair Salon Demo", sectorSlug: "barber-kuafor", desc: "A modern one-page structure focused on services, gallery, and WhatsApp.", badges: ["mobile", "gallery", "whatsapp"] },
      vet: { title: "Vet Clinic Demo", sectorSlug: "vet-klinik", desc: "A management-focused structure for appointment requests and service info.", badges: ["appointment", "adminDash", "whatsapp"] },
      therapist: { title: "Therapist / Psychologist Demo", sectorSlug: "terapist-psikolog", desc: "A calm, trustworthy client experience built around appointments and contact.", badges: ["appointment", "formMgmt", "whatsapp"] },
    },
  },
  packages: {
    eyebrow: "Packages",
    title: "The best package choice for your brand's digital goals.",
    subtitle: "Pick the option that matches your needs and plan your website structure with clarity.",
    bonusTag: "Bonus:",
    bonusText: "Custom design draft and revision included",
    featuredTag: "Most popular",
    priceNote: "Get a quote on WhatsApp for pricing.",
    paketLabel: "Package",
    items: {
      baslangic: {
        name: "Starter Package",
        short: "A clean, modern, and trustworthy starting point for businesses that want basic digital visibility.",
        ideal: "For businesses that want to show up online with a tidy, mobile-friendly one-page website.",
        features: [
          "One-page modern website",
          "Mobile-friendly design",
          "Service / business info",
          "Contact section",
          "WhatsApp routing",
          "Social media links",
          "Basic SEO structure",
          "Basic setup for Google visibility",
          "Guidance for domain / hosting setup",
          "Launch support",
          "7 days of free technical support",
        ],
        delivery: "Delivery: 3–5 business days",
        cta: "Get info on the Starter Package",
        waMessage: "Hi, I’d like more info about the Leony Starter Package.",
      },
      isletme: {
        name: "Business Package",
        short: "For businesses that want a richer content structure, stronger presentation, and performance tracking.",
        ideal: "Businesses that want a more professional presentation of services, visuals, contact flow, and Google visibility.",
        inheritFrom: "Everything in the Starter Package +",
        features: [
          "Multi-section website",
          "About section",
          "Gallery area",
          "Google Maps area",
          "WhatsApp and email routing",
          "More refined content layout",
          "Stronger SEO structure",
          "Google Analytics setup",
          "Search Console setup",
          "Additional language option",
          "Visitor and contact performance tracking",
          "14 days of free technical support",
        ],
        delivery: "Delivery: 5–7 business days",
        cta: "Get info on the Business Package",
        waMessage: "Hi, I’d like more info about the Leony Business Package.",
      },
      profesyonel: {
        name: "Professional Package",
        short: "For businesses that want more than a standard website — a manageable, extensible digital system with custom flows.",
        ideal: "For brands looking to scale their digital process with booking, applications, request collection, an admin panel, or custom customer flows.",
        inheritFrom: "Everything in the Business Package +",
        features: [
          "Advanced page structure tailored to specific needs",
          "Admin dashboard option",
          "Appointment / booking system option",
          "Request / application / form management",
          "Secure handling of customer data",
          "Advanced conversion and contact tracking",
          "Google Business Profile guidance",
          "System designed for multi-language structure",
          "More modular, extensible foundation",
          "Structure ready for custom integrations",
          "30 days of free technical support",
        ],
        badge: "Advanced Customization Options",
        delivery: "Delivery: 7–10 business days",
        cta: "Get info on the Professional Package",
        waMessage: "Hi, I’d like more info about the Leony Professional Package.",
      },
    },
    extras: {
      title: "Additional Services & Maintenance Options",
      text: "In addition to the packages, extra services and paid maintenance options can be offered based on your business needs. Details are shared during the project discussion.",
      support: "Free technical support periods are included in the packages; ongoing maintenance and update needs are planned separately.",
      footnote: "Prices are set based on project scope. Domain, hosting, business email, and third-party service fees are not included; technical guidance is provided during the required setup steps.",
    },
  },
  process: {
    eyebrow: "Process",
    title: "How we work",
    subtitle: "The process moves forward calmly and on plan, shaped around your business needs.",
    stepLabel: "Step",
    steps: [
      { title: "Defining the need", text: "We clarify your goals and what your business actually needs." },
      { title: "Planning the right structure", text: "Sector, content structure, and the right package are decided together." },
      { title: "Design & build", text: "A modern, mobile-friendly, goal-aligned web solution is built." },
      { title: "Launch & delivery", text: "The project goes live and is ready to use." },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    items: [
      { q: "How long does delivery take?", a: "It depends on the package. Starter takes 3–5 business days, Business 5–7, Professional 7–10." },
      { q: "Why aren’t prices listed?", a: "Every business has different needs, so pricing is clarified over WhatsApp to put together the best offer for you." },
      { q: "Are domain and hosting included?", a: "Domain and hosting are discussed separately based on your needs. Guidance is provided during setup and launch if needed." },
      { q: "Will the site be mobile friendly?", a: "Yes. Every Leony site is built to work on mobile, tablet, and desktop." },
      { q: "Can a WhatsApp button be added?", a: "Yes. We can add buttons that let visitors reach you on WhatsApp with one tap." },
      { q: "Can changes be made later?", a: "Yes. Post-delivery updates and improvements can be planned separately based on your needs." },
      { q: "Do you provide support after delivery?", a: "Yes. Once the site is delivered, we’re available for technical questions and guidance. Out-of-scope additions are quoted separately." },
      { q: "Can I see demo projects?", a: "Yes. Active demos are available on the relevant sector pages and in the demo section." },
      { q: "Can you add an appointment system?", a: "Yes. Booking flows and management-focused solutions can be planned based on your needs." },
      { q: "Can you build an admin panel?", a: "Yes. We can build management panels, content management, or lead-tracking structures based on your needs." },
      { q: "Can I ask without picking a package?", a: "Yes. You can reach out on WhatsApp or email without choosing a package." },
      { q: "What if my category isn’t listed?", a: "Custom web solutions can be planned for categories that aren’t in the list. Just reach out on WhatsApp or email." },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Get in touch",
    subtitle:
      "Not sure which package is right for you? Get in touch — we’ll review your business needs together and recommend the best digital solution for you.",
    successTitle: "Request received",
    successBody: "Your request has been received. We’ll get back to you shortly.",
    successAgain: "Send another request",
    submit: "Send Info Request",
    submitting: "Sending...",
    fields: {
      name: "Full Name",
      namePh: "Your full name",
      category: "Business Category",
      categoryPlaceholder: "Select...",
      customCategory: "Type your business category",
      customCategoryPh: "e.g. Florist, Personal Trainer...",
      email: "Email",
      emailOptional: "Email (optional)",
      emailPh: "example@email.com",
      method: "Preferred contact method",
      phone: "Phone (WhatsApp)",
      phonePh: "555 555 5555",
      whatsappLabel: "Your WhatsApp Number",
      whatsappHelper: "Share your WhatsApp number so we can get back to you.",
      countrySearchPh: "Select country code",
      message: "Message",
      messagePh: "Briefly tell us about your business and what you need.",
    },
    methods: { whatsapp: "WhatsApp", mail: "Email" },
    categoryOther: "Other",
    errors: {
      name: "Full name is required",
      category: "Please pick a category",
      customCategory: "Please type your business category",
      email: "Enter a valid email",
      phone: "Please enter a valid WhatsApp number.",
      message: "Please write a short message",
    },
    toastSuccess: "Your request has been created. We will contact you as soon as possible.",
    toastError: "We couldn't create your request. Please try again or reach us on WhatsApp.",
  },
  footer: {
    tagline: "Modern, contact-focused web solutions for businesses.",
    quickLinks: "Quick Links",
    socialLegal: "Social & Legal",
    kvkk: "KVKK Notice",
    privacyPolicy: "Privacy Policy",
    copyright: "© 2026 Leony. All rights reserved.",
  },
  sectorPage: {
    allSectors: "All sectors",
    comparePackages: "Compare Packages",
    waCta: "Ask on WhatsApp",
    demoEyebrow: "Demo Preview",
    demoTitleTpl: (label) => `Example site structure for ${label}`,
    demoSubtitle: "A sector-specific preview of how your business website could look.",
    advEyebrow: "Management-focused",
    advTitle: "Appointments, management, and client flow",
    advSubtitle: "Booking systems, admin dashboards, and lead management can be added as needed.",
    advCards: [
      { t: "Appointment system", d: "Online booking, calendar, and confirmation flow." },
      { t: "Admin dashboard", d: "Manage leads and appointments from a single interface." },
      { t: "Trustworthy flow", d: "Professional communication and an organized client experience." },
    ],
    notFoundTitle: "Sector not found",
    notFoundHome: "← Back to home",
    errorText: "Something went wrong.",
  },
  sectors: {
    "cafe-restoran": {
      title: "A modern, contact-focused web solution for cafes and restaurants",
      subtitle: "Present your menu, location, hours, reservations, and social links on a single professional page.",
      label: "Cafe / Restaurant",
      benefits: ["Presents the menu clearly", "Highlights location and hours", "Reservation and contact flow", "Channels social media traffic"],
    },
    "klinik-dis-klinigi": {
      title: "A professional, management-ready website for clinics and dental clinics",
      subtitle: "A modern digital structure that presents services, appointments, and contact more powerfully.",
      label: "Clinic / Dental Clinic",
      benefits: ["Supports the appointment flow", "Admin panel option", "Simplifies patient communication", "Trustworthy professional look"],
    },
    "guzellik-salonu-nail-studio": {
      title: "A sleek digital storefront for beauty salons and nail studios",
      subtitle: "A modern web solution that presents services, gallery, and appointment/contact flow with clarity.",
      label: "Beauty Salon / Nail Studio",
      benefits: ["Presents services in order", "Highlights sample work via gallery", "Supports appointment requests", "Strengthens brand perception"],
    },
    "barber-kuafor": {
      title: "A modern website for barbers and hair salons",
      subtitle: "A modern web solution that brings services, hours, gallery, and contact flow into one professional structure.",
      label: "Barber / Hair Salon",
      benefits: ["Presents services in order", "Highlights sample work via gallery", "Speeds up WhatsApp requests", "Trustworthy brand perception"],
    },
    "vet-klinik": {
      title: "An appointment- and contact-focused web solution for vet clinics",
      subtitle: "A trustworthy digital structure that presents services, appointment requests, and contact flow with clarity.",
      label: "Vet Clinic",
      benefits: ["Supports appointment and request flow", "Presents services clearly", "Simplifies communication", "Builds a trustworthy brand perception"],
    },
    "terapist-psikolog": {
      title: "An appointment-focused modern web solution for therapists and psychologists",
      subtitle: "A digital structure that simplifies client communication, supports appointments, and feels trustworthy.",
      label: "Therapist / Psychologist",
      benefits: ["Simplifies client communication", "Supports appointment flow", "Calm, trustworthy structure", "Management-focused options"],
    },
  },
  sectorPreview: {
    cafe: {
      headline: "Discover the taste and atmosphere online.",
      ctas: [{ label: "Reservations", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Menu",
      items: ["Espresso Bar", "Brunch", "Desserts", "Cold Drinks"],
      location: "Location · Hours · Reservations",
      sideTitle: "Today",
      side: [
        { t: "12:30", n: "Table · 2", s: "Confirmed" },
        { t: "14:00", n: "Table · 4", s: "Confirmed" },
        { t: "19:15", n: "Table · 6", s: "Pending" },
      ],
    },
    clinic: {
      headline: "A trustworthy digital look across the patient experience.",
      ctas: [{ label: "Book", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Services",
      items: ["General checkup", "Implants", "Aesthetic dentistry", "Pediatric"],
      location: "Doctors · Address · Hours",
      sideTitle: "Today’s appointments",
      side: [
        { t: "10:30", n: "A. Smith", s: "Confirmed" },
        { t: "12:00", n: "M. Davis", s: "Confirmed" },
        { t: "15:15", n: "E. Lee", s: "New" },
      ],
    },
    beauty: {
      headline: "Showcase your services in a sleek digital storefront.",
      ctas: [{ label: "Book", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Service list",
      items: ["Manicure", "Pedicure", "Skin care", "Brow design"],
      location: "Gallery · Location · Hours",
      sideTitle: "Gallery",
      side: [
        { t: "Set", n: "Nail Art", s: "★ 4.9" },
        { t: "Care", n: "Skin", s: "★ 4.8" },
        { t: "Design", n: "Brows", s: "★ 5.0" },
      ],
    },
    barber: {
      headline: "A modern barber website that highlights your style.",
      ctas: [{ label: "Services", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Services",
      items: ["Haircut", "Beard", "Skin care", "Kids cut"],
      location: "Gallery · Location · WhatsApp",
      sideTitle: "Reviews",
      side: [
        { t: "★ 5.0", n: "K. Adams", s: "New" },
        { t: "★ 4.9", n: "B. Turner", s: "New" },
        { t: "★ 4.8", n: "O. Young", s: "" },
      ],
    },
    vet: {
      headline: "A trustworthy booking experience for your pets.",
      ctas: [{ label: "Book", tone: "muted" }, { label: "WhatsApp", tone: "wa" }],
      sectionTitle: "Services",
      items: ["Checkup", "Vaccines", "Surgery", "Care"],
      location: "Clinic address · Emergency contact · Hours",
      sideTitle: "Today",
      side: [
        { t: "09:30", n: "Bonnie", s: "Vaccine" },
        { t: "11:00", n: "Cotton", s: "Checkup" },
        { t: "14:00", n: "Maya", s: "New" },
      ],
    },
    therapist: {
      headline: "Carry the client experience with calm and trust.",
      ctas: [{ label: "Book", tone: "muted" }, { label: "Contact", tone: "muted" }],
      sectionTitle: "Areas",
      items: ["Individual", "Couples", "Family", "Online sessions"],
      location: "Approach · Session info · Contact",
      sideTitle: "Availability",
      side: [
        { t: "Mon", n: "10:00", s: "Open" },
        { t: "Wed", n: "14:00", s: "Open" },
        { t: "Fri", n: "18:00", s: "Open" },
      ],
    },
  },
  assistant: {
    name: "Leony Team",
    status: "Usually replies in a few minutes",
    greeting: "Hi 👋 If you’d like quick info about a website for your business, message us on WhatsApp.",
    waCta: "Ask on WhatsApp",
    openAria: "Open Leony assistant",
    closeAria: "Close",
  },
  scrollTop: { aria: "Scroll to top" },
  customCatModal: {
    tag: "Custom category",
    title: "Tell us your business category",
    subtitle: "If your category isn’t listed, drop your details and we’ll review the right web solution with you.",
    fields: {
      name: "Full Name", nameP: "Your full name",
      category: "Business Category", categoryP: "e.g. Florist, Personal Trainer",
      email: "Email", emailP: "example@email.com",
      phone: "Phone", phoneP: "+1 555 555 5555",
      message: "Short Message", messageP: "Briefly tell us what you need.",
    },
    submit: "Send to WhatsApp",
    errors: { name: "Full name is required", category: "Category is required", email: "Enter a valid email", phone: "Phone is required", message: "Please write a short message" },
    waPrefix: "Hi, I’d like more info about Leony website services for a business category that isn’t in the list.",
    waLabels: { name: "Full Name", category: "Business Category", email: "Email", phone: "Phone", message: "Message" },
    closeAria: "Close",
    dialogAria: "Business category form",
  },
  switcher: { aria: "Select language" },
  waMessages: {
    headerGeneric: "Hi, I’d like to learn more about Leony website services.",
    assistant: "Hi, I’d like info about a website for my business.",
    footerGeneric: "Hi, I’d like to learn more about Leony.",
    sectorBody: (label) => `Hi, I’d like more info about Leony website services for the ${label} category.`,
    packageGeneric: (pkg) => `Hi, I’d like more info about the Leony ${pkg}.`,
    packageWithSector: (label, pkg) => `Hi, I’d like more info about the Leony ${pkg} for the ${label} category.`,
  },
  heroVisual: {
    urlText: "leony.app/demo",
    webBlockEyebrow: "Web Solution",
    webBlockTitle: "Modern, fast, and conversion-focused.",
    metrics: [
      { v: "+38%", l: "Leads" },
      { v: "1.2s", l: "Load" },
      { v: "A+", l: "Mobile" },
    ],
    quickLinks: ["Booking", "Gallery", "Menu", "Contact"],
    adminTitle: "Admin Dashboard",
    adminSub: "Leads · Today",
    apptTitle: "Appointments",
    apptSub: "Today · 4 new",
    chips: {
      contactForm: "Contact Form",
      whatsappFlow: "WhatsApp Flow",
      mobile: "Mobile friendly",
      demos: "Demo Projects",
    },
  },
};

export const TRANSLATIONS: Record<Lang, Dict> = { tr: TR, az: AZ, en: EN };

export const LANG_LABELS: Record<Lang, string> = {
  tr: "TR",
  az: "AZ",
  en: "EN",
};
