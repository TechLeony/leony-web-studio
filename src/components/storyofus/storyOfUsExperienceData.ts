import {
  STORYOFUS_DEFAULT_FINAL_SURPRISE_NOTE,
  STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
  STORYOFUS_DEFAULT_LOVE_LETTER_TITLE,
} from "../../lib/storyofus/stableContentDefaults.ts";
import {
  formatStoryOfUsExperienceNumericDate,
  formatStoryOfUsExperienceSinceLabel,
} from "../../lib/storyofus/finalSiteUtils.ts";

export type DecorStyle = "hearts" | "stars" | "capybara" | "cat" | "dog" | "panda";
export type GalleryMode = "polaroid" | "carousel" | "stacked";
export type AnimationStyle = "soft-slide" | "fade" | "none";

const demoRelationshipStartDate = "2022-03-12T00:00:00";
const demoRelationshipHeroDateLabel =
  formatStoryOfUsExperienceNumericDate(demoRelationshipStartDate);
const demoRelationshipStartLabel = formatStoryOfUsExperienceSinceLabel(demoRelationshipStartDate);

export const demoStoryData = {
  intro: {
    introTitle: "Canım sevgilim,",
    introSubtitle: "Sana bir sürpriz hazırladım",
    introButtonText: "Sürprizi gör",
    openingText: "Romantik Hikayemize yolculuk...",
    openingDoneDelayMs: 1700,
    passwordModalTitle: "Sayfayı açmak için küçük sırrı tahmin et bakalım",
    wrongPasswordMessage: "Eminim yanlışlıkla rakamı kaydırmışsındır, tekrar dene 💌",
  },
  accessPin: "2022",
  accessPinHint: "Tanışma yılımız(demo şifresi:2022)",
  relationship: {
    partnerName: "Ceren",
    recipientName: "Arda",
    coupleNames: {
      first: "Ceren",
      second: "Arda",
      separator: "&",
    },
    relationshipStartDate: demoRelationshipStartDate,
    relationshipHeroDateLabel: demoRelationshipHeroDateLabel,
    relationshipStartLabel: demoRelationshipStartLabel,
    heroEyebrow: "Bizim sonsuz aşk hikâyemiz",
    heroMessage: "Bizim aşk dolu yolculuğumuz 💖",
    heroLeftPhoto: {
      src: "/demo-assets/ceren-hero-right.webp",
      alt: "Ceren solo portresi",
      caption: "",
      placeholder: "from-rose-200 via-pink-200 to-fuchsia-300",
    },
    heroRightPhoto: {
      src: "/demo-assets/arda-hero-left.webp",
      alt: "Arda solo portresi",
      caption: "",
      placeholder: "from-amber-100 via-rose-200 to-pink-300",
    },
  },
  stats: {
    statsTitle: "Birlikte geçirdiğimiz süre",
    statsSinceText: demoRelationshipStartLabel,
    loveMeterQuestion: "Sence seni ne kadar seviyorum?",
    loveMeterButtonText: "Hadi hemen butona bas da öğrenelim",
    loveMeterResultTitle: "Seni düşündüğünden daha çok seviyorum 💖",
    loveMeterResultMessage: "Başka türlü olacağını mı düşünmüştün yoksa? :)",
    loveMeterTarget: 100,
    counterLabels: {
      years: "yıl",
      days: "gün",
      hours: "saat",
      minutes: "dakika",
      seconds: "saniye",
    },
  },
  memories: {
    memoriesTitle: "Benim gözümde SEN",
    galleryMode: "polaroid" as GalleryMode,
    animationStyle: "soft-slide" as AnimationStyle,
    helperText: "Seni benim gözümden anlatan küçük kareler💖",
    items: [
      {
        title: "En tatlış fotiğin",
        caption: "Çok tatlı bir bebeksin",
        photoSrc: "/demo-assets/ceren-tatli-fotograf.webp",
        photoAlt: "Ceren tatlı fotoğraf",
        placeholder: "from-rose-200 via-pink-200 to-fuchsia-300",
      },
      {
        title: "En komik halin",
        caption: "Minik ve komik bitanemsin",
        photoSrc: "/demo-assets/ceren-komik-fotograf.webp",
        photoAlt: "Ceren komik fotoğraf",
        placeholder: "from-fuchsia-200 via-rose-200 to-pink-300",
      },
      {
        title: "En çekici sen",
        caption: "Güzelliğin adeta beni benden alıyor",
        photoSrc: "/demo-assets/ceren-cekici-fotograf.webp",
        photoAlt: "Ceren cekici fotoğraf",
        placeholder: "from-amber-100 via-rose-200 to-red-200",
      },
      {
        title: "En bebek halin",
        caption: "Minik kız çoçuğusun",
        photoSrc: "/demo-assets/ceren-bebek-fotograf.webp",
        photoAlt: "Ceren bebek hali",
        placeholder: "from-rose-200 via-orange-100 to-pink-300",
      },
      {
        title: "En güzel gülüşün",
        caption: "Gülüşünün olduğu her yer biraz daha güzel.",
        photoSrc: "/demo-assets/ceren-gulus-fotograf.webp",
        photoAlt: "Ceren güzel gülüşü",
        placeholder: "from-fuchsia-100 via-pink-200 to-rose-300",
      },
    ],
  },
  timeline: {
    timelineTitle: "Bizim hikayemiz",
    items: [
      {
        date: "12 Mart 2022",
        title: "İlk tanışmamız",
        description: "Her şeyin başladığı o tatlı an… İyi ki yollarımız kesişmiş.",
        photoSrc: "/demo-assets/arda-ceren-cafe.webp",
        photoAlt: "Ceren ve Arda ilk tanışma anısı",
        placeholder: "from-rose-100 via-pink-200 to-fuchsia-200",
      },
      {
        date: "2 Nisan 2022",
        title: "İlk buluşmamız",
        description: "Biraz heyecan, biraz utangaçlık, bolca güzel his.",
        photoSrc: "/demo-assets/arda-ceren-mirror.webp",
        photoAlt: "Ceren ve Arda birlikte geçen uzun sohbet",
        placeholder: "from-amber-100 via-rose-200 to-pink-300",
      },
      {
        date: "18 Haziran 2022",
        title: "İlk fotoğrafımız",
        description: "Beraber çekildiğimiz ilk kare, şimdi en güzel anılarımızdan biri.",
        photoSrc: "/demo-assets/arda-ceren-walk.webp",
        photoAlt: "Ceren ve Arda birlikte ilk kare",
        placeholder: "from-purple-200 via-pink-200 to-rose-300",
      },
      {
        date: "27 Ağustos 2022",
        title: "İlk date nightımız",
        description: "Süslenip birbirimize yeniden aşık olduğumuz o gece.",
        photoSrc: "/demo-assets/arda-ceren-hug.webp",
        photoAlt: "Ceren ve Arda birlikte gün batımı",
        placeholder: "from-rose-200 via-orange-100 to-pink-300",
      },
      {
        date: "24 Aralık 2022",
        title: "İlk tatilimiz",
        description: "Beraber kaçtığımız ilk küçük macera, hâlâ aklımda.",
        photoSrc: "/demo-assets/arda-ceren-closeup.webp",
        photoAlt: "Ceren ve Arda ilk tatil anısı",
        placeholder: "from-fuchsia-100 via-pink-200 to-rose-300",
      },
    ],
  },
  spotify: {
    sectionTitle: "Bize Özel",
    subtitle: "Bu şarkıyı her dinlediğimde aklıma sen geliyorsun 🥹",
    label: "BİZİM ŞARKIMIZ",
    songTitle: "Ahu",
    artist: "Mabel Matiz",
    note: "Bu şarkı tam olarak bizi anlatıyor 💖",
    spotifyUrl: "https://open.spotify.com/track/5dIFM4dkwEjMnFppbHTsEA?si=50cef257e6e34cbd",
  },
  photoPuzzle: {
    title: "Aşkımızın Parçaları",
    subtitle:
      "Her parçada bize ait bir anı saklı. Fotoğrafı tamamla ve hikâyemizi yeniden birleştir",
    buttonText: "Hadi başlayalım 💖",
    imageUrl: "/demo-assets/arda-ceren-puzzle.webp",
    completionTitle: "Harikasın bebeğim! 💖",
    completionMessage: "Biz tamamlandıkça, bu hikâye daha da güzelleşti sanırım 💗",
  },
  openWhenLetters: {
    sectionTitle: "Your open when letters",
    sectionSubtitle: "Küçük notlar bıraktım, ihtiyacın olduğunda aç diye",
    items: [
      {
        title: "Beni özlediğinde aç",
        message: "Gözlerini kapat ve beni yanında düşün. Kalbim tam orada, sana sarılıyor.",
        iconOrMotif: "heart",
      },
      {
        title: "Üzgün olduğunda aç",
        message: "Bugün zor geçmiş olabilir ama sen hala benim en güzel iyi ki'msin.",
        iconOrMotif: "sparkle",
      },
      {
        title: "Seni ne kadar sevdiğimi hatırlamak için aç",
        message: "Seni kelimelere sığmayacak kadar, her gün daha daha çokkk seviyorumm bitanemm.",
        iconOrMotif: "heart",
      },
      {
        title: "Gülümsemeye ihtiyacın olduğunda aç",
        message: "Şu an yüzünde küçücük bir gülümseme varsa, ben kazandım demekkk.",
        iconOrMotif: "sparkle",
      },
      {
        title: "Kendini yalnız hissettiğinde aç",
        message: "Mesafeler ne olursa olsun, sen benim en yakın yerimsinn.",
        iconOrMotif: "heart",
      },
    ],
  },
  voiceNote: {
    enabled: true,
    sectionTitle: "Küçük bir ses notum sana 💖",
    title: "Bitaneme",
    durationLimitSeconds: 30,
    src: "",
    audioUrl: "/demo-assets/arda-ceren-voice-note.mp3",
    autoplay: false,
    playText: "Ses notunu aç",
    replayText: "Tekrar aç",
    stopText: "Durdur",
  },
  couponQuiz: {
    title: "Hadi biraz eğlenelim",
    subtitle: "Tüm ödülleri kazanacağına eminim",
    nextButtonText: "Sıradaki soru",
    completionText: "Hadi iyisin, hepsini kaptın 😂",
    questions: [
      {
        question: "İlk buluşmamızda en çok neye gülmüştük?",
        options: ["Kahve siparişime", "Yağmura yakalanmamıza", "Yanlış masaya oturmama"],
        correctAnswer: "Yağmura yakalanmamıza",
        reward: "Kahve date kazandın",
      },
      {
        question: "En sevdiğimiz sakin plan hangisi?",
        options: ["Film gecesi", "Sabah koşusu", "Uzun alışveriş turu"],
        correctAnswer: "Film gecesi",
        reward: "1 film gecesi kazandın",
      },
      {
        question: "En hızlı iyileştiren şey ne?",
        options: ["Uzun bir sarılma", "Sessiz kalmak", "Telefonu kapatmak"],
        correctAnswer: "Uzun bir sarılma",
        reward: "Sonzuz uzun uzun sarılma kuponu kazandın :)",
      },
    ],
  },
  coupleWrapped: {
    title: "Bizim ilişki özetimiz",
    subtitle: "Küçük ama çok gerçek bir özet",
    stats: [
      {
        label: "%100 aşk",
        description: "Başka türlüsünü düşünemem bile",
      },
      {
        label: "%87 gülme krizi",
        description: "Birlikteyken sakin kalamayız ki",
      },
      {
        label: "%64 tatlı trip",
        description: "Ama cute olanından",
      },
      {
        label: "%999 bir-birimizi özleme",
        description: "Bunu hesaplamaya matematiğim yetmedi :)",
      },
    ],
  },
  reasons: {
    reasonsTitle: "Seni benim için özel kılan sadece birkaç sebep",
    items: [
      "Gülüşünle tüm kalbimi rahatlatıyorsun",
      "En sıradan günümüzü bile varlığınla özel yapman",
      "Beni dinlerken gözlerinin parlaması",
      "Küçük şeylere çocuk gibi sevinmen",
      "Yanındayken çok huzurlu hissedebilmem",
      "Kalbimin evini senin yanında bulması",
    ],
  },
  letter: {
    letterTitle: STORYOFUS_DEFAULT_LOVE_LETTER_TITLE,
    letterBody: STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
    signaturePrefix: "Sonsuza dek",
    letterSidePhoto: {
      src: "/demo-assets/arda-ceren-closeup.webp",
      alt: "Ceren ve Arda romantik yakın an",
      caption: "Kalbimin en güzel yeri",
      placeholder: "from-rose-200 via-pink-100 to-fuchsia-200",
    },
  },
  finalSurprise: {
    finalGiftButtonText: "Sürprize başla",
    finalLabel: "Gizli mesaj",
    finalSecretNote: STORYOFUS_DEFAULT_FINAL_SURPRISE_NOTE,
  },
  interactiveFeatures: {
    coupleWrapped: { enabled: true },
    miniQuiz: { enabled: false },
    loveCoupons: { enabled: true },
    moodMessages: { enabled: false },
    stickerVibe: { enabled: false },
    voiceNote: { enabled: true },
  },
  music: {
    songTitle: "Mabel Matiz - Ahu",
    songSrc: "",
    enabled: true,
  },
  footer: {
    textPrefix: "made by",
    brandLabel: "leony.tech",
    href: "https://leony.tech",
    iconSrc: "/logos/favicon-ask-site.png",
  },
  theme: {
    primaryColor: "#e11d48",
    secondaryColor: "#db2777",
    accentColor: "#f472b6",
    backgroundColor: "#fff5f7",
    backgroundEndColor: "#ffd1de",
    textColor: "#4c0519",
    mutedTextColor: "rgba(76, 5, 25, 0.65)",
    cardColor: "rgba(255, 255, 255, 0.78)",
    fontHeading: '"Great Vibes", cursive',
    fontBody: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontAccent: '"Playfair Display", Georgia, serif',
  },
  decor: {
    decorStyle: "hearts" as DecorStyle,
    density: 38,
    showHeroSparkles: true,
  },
};

export type StoryOfUsExperienceData = typeof demoStoryData;
