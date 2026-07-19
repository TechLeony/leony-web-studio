export type StoryOfUsSetupStepId =
  "contactCouple" | "photosPuzzle" | "musicVoice" | "timeline" | "letters" | "review";

export type StoryOfUsOptionalSectionId =
  | "photos"
  | "puzzle"
  | "music"
  | "voiceNote"
  | "timeline"
  | "letters"
  | "relationshipStartDate"
  | "relationshipStory"
  | "recipientNickname"
  | "specialDateLabel";

export type StoryOfUsSubmissionStatus =
  "draft" | "submitted" | "in_review" | "published" | "archived";

export type StoryOfUsSkipState = {
  warned: boolean;
  confirmed: boolean;
  confirmedAt?: string;
};

export type StoryOfUsConfirmedSkips = Partial<
  Record<StoryOfUsOptionalSectionId, StoryOfUsSkipState>
>;

export type StoryOfUsContactCoupleData = {
  customerName: string;
  customerEmail: string;
  contactPhone: string;

  partnerName: string;
  coupleDisplayName: string;

  relationshipStartDate: string;
  specialDateLabel: string;

  recipientNickname: string;
  relationshipStory: string;
};

export type StoryOfUsPhotoDraftItem = {
  id: string;
  previewUrl: string;
  caption: string;
  sortOrder: number;

  /**
   * File is kept in memory while the user is on the setup page.
   * It should not be stored in localStorage.
   */
  file?: File;
};

export type StoryOfUsOpeningPhotosData = {
  firstPerson: StoryOfUsPhotoDraftItem | null;
  secondPerson: StoryOfUsPhotoDraftItem | null;
};

export type StoryOfUsPromptPhotoItem = {
  id: string;
  title: string;
  helperText: string;
  photo: StoryOfUsPhotoDraftItem | null;
  sortOrder: number;
};

export type StoryOfUsPuzzleSourceType = "gallery" | "separate";

export type StoryOfUsPuzzleData = {
  selectedPhotoId: string | null;
  puzzlePhoto: StoryOfUsPhotoDraftItem | null;
  sourceType: StoryOfUsPuzzleSourceType | null;
  confirmedNoPuzzle: boolean;
};

export type StoryOfUsMediaData = {
  openingPhotos: StoryOfUsOpeningPhotosData;
  promptPhotos: StoryOfUsPromptPhotoItem[];
  photos: StoryOfUsPhotoDraftItem[];
  puzzle: StoryOfUsPuzzleData;
  loveLetterPhoto: StoryOfUsPhotoDraftItem | null;
};

export type StoryOfUsMusicData = {
  spotifyUrl: string;
  spotifyTrackId: string;
  songTitle: string;
  artistName: string;
  startAtSeconds: number;
};

export type StoryOfUsVoiceNoteData = {
  previewUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;

  /**
   * File is kept in memory while the user is on the setup page.
   * It should not be stored in localStorage.
   */
  file?: File;
};

export type StoryOfUsMusicVoiceData = {
  music: StoryOfUsMusicData;
  voiceNote: StoryOfUsVoiceNoteData | null;
};

export type StoryOfUsTimelineItem = {
  id: string;
  title: string;
  eventDate: string;
  description: string;
  photo: StoryOfUsPhotoDraftItem | null;
  sortOrder: number;
};

export type StoryOfUsLetterType = "love_letter" | "open_when";

export type StoryOfUsLetterItem = {
  id: string;
  type: StoryOfUsLetterType;
  title: string;
  body: string;
  sortOrder: number;
};

export type StoryOfUsLegalConsentState = {
  accepted: boolean;
  acceptedAt?: string;
};

export type StoryOfUsLegalConsents = {
  privacyNoticeAccepted: StoryOfUsLegalConsentState;
  explicitConsentAccepted: StoryOfUsLegalConsentState;
  contentResponsibilityAccepted: StoryOfUsLegalConsentState;
  serviceStartConsentAccepted: StoryOfUsLegalConsentState;
};

export type StoryOfUsSiteAccessData = {
  passcode: string;
  confirmPasscode: string;
  passcodeHint: string;
  hasExistingPasscode?: boolean;
};

export type StoryOfUsSetupFormData = {
  orderReference: string;
  status: StoryOfUsSubmissionStatus;

  contactCouple: StoryOfUsContactCoupleData;
  media: StoryOfUsMediaData;
  musicVoice: StoryOfUsMusicVoiceData;
  siteAccess: StoryOfUsSiteAccessData;
  timeline: StoryOfUsTimelineItem[];
  letters: StoryOfUsLetterItem[];

  confirmedSkips: StoryOfUsConfirmedSkips;
  legalConsents: StoryOfUsLegalConsents;
};

export type StoryOfUsSerializablePhotoDraftItem = Omit<StoryOfUsPhotoDraftItem, "file">;

export type StoryOfUsSerializableVoiceNoteData = Omit<StoryOfUsVoiceNoteData, "file">;

export type StoryOfUsSerializableSetupFormData = Omit<
  StoryOfUsSetupFormData,
  "media" | "musicVoice"
> & {
  media: {
    openingPhotos: {
      firstPerson: StoryOfUsSerializablePhotoDraftItem | null;
      secondPerson: StoryOfUsSerializablePhotoDraftItem | null;
    };
    promptPhotos: Array<Omit<StoryOfUsPromptPhotoItem, "photo"> & {
      photo: StoryOfUsSerializablePhotoDraftItem | null;
    }>;
    photos: StoryOfUsSerializablePhotoDraftItem[];
    puzzle: Omit<StoryOfUsPuzzleData, "puzzlePhoto"> & {
      puzzlePhoto: StoryOfUsSerializablePhotoDraftItem | null;
    };
    loveLetterPhoto: StoryOfUsSerializablePhotoDraftItem | null;
  };
  musicVoice: {
    music: StoryOfUsMusicData;
    voiceNote: StoryOfUsSerializableVoiceNoteData | null;
  };
};

export type StoryOfUsStepValidationResult = {
  isValid: boolean;
  blockingErrors: string[];
  warnings: string[];
};

export const STORYOFUS_SETUP_STEPS: {
  id: StoryOfUsSetupStepId;
  title: string;
  description: string;
}[] = [
  {
    id: "contactCouple",
    title: "İletişim & çift bilgileri",
    description: "Sipariş ve aşk hikayesi için temel bilgileri alıyoruz.",
  },
  {
    id: "photosPuzzle",
    title: "Fotoğraflar & puzzle",
    description: "Galeri ve puzzle alanı için görselleri seçiyoruz.",
  },
  {
    id: "musicVoice",
    title: "Müzik & ses notu",
    description: "Size özel şarkı ve istenirse ses notu ekliyoruz.",
  },
  {
    id: "timeline",
    title: "Zaman çizelgesi",
    description: "İlişkinizin özel anlarını sıralıyoruz.",
  },
  {
    id: "letters",
    title: "Mektuplar",
    description: "Aşk mektubu ve open-when mektuplarını hazırlıyoruz.",
  },
  {
    id: "review",
    title: "Kontrol & gönder",
    description: "Her şeyi son kez kontrol edip gönderiyoruz.",
  },
];

export const createEmptyStoryOfUsSetupFormData = (): StoryOfUsSetupFormData => ({
  orderReference: "",
  status: "draft",

  contactCouple: {
    customerName: "",
    customerEmail: "",
    contactPhone: "",

    partnerName: "",
    coupleDisplayName: "",

    relationshipStartDate: "",
    specialDateLabel: "",

    recipientNickname: "",
    relationshipStory: "",
  },

  media: {
    openingPhotos: {
      firstPerson: null,
      secondPerson: null,
    },
    promptPhotos: [
      {
        id: "sweetest",
        title: "En tatlı sen",
        helperText: "Sevgilinizi en tatlı haliyle gösteren bir fotoğraf seçin.",
        photo: null,
        sortOrder: 0,
      },
      {
        id: "funniest",
        title: "En komik halin",
        helperText: "Gülümseten, doğal ve komik bir kare seçin.",
        photo: null,
        sortOrder: 1,
      },
      {
        id: "most-attractive",
        title: "En çekici sen",
        helperText: "Onu en etkileyici bulduğunuz kareyi yükleyin.",
        photo: null,
        sortOrder: 2,
      },
      {
        id: "baby-face",
        title: "En bebek halin",
        helperText: "Tatlı, masum veya çok sevdiğiniz minik bir halini seçin.",
        photo: null,
        sortOrder: 3,
      },
      {
        id: "best-smile",
        title: "En güzel gülüşün",
        helperText: "Gülüşünü en güzel anlatan fotoğrafı ekleyin.",
        photo: null,
        sortOrder: 4,
      },
    ],
    photos: [],
    puzzle: {
      selectedPhotoId: null,
      puzzlePhoto: null,
      sourceType: null,
      confirmedNoPuzzle: false,
    },
    loveLetterPhoto: null,
  },

  musicVoice: {
    music: {
      spotifyUrl: "",
      spotifyTrackId: "",
      songTitle: "",
      artistName: "",
      startAtSeconds: 0,
    },
    voiceNote: null,
  },

  siteAccess: {
    passcode: "",
    confirmPasscode: "",
    passcodeHint: "",
    hasExistingPasscode: false,
  },

  timeline: [],

  letters: [],

  confirmedSkips: {},

  legalConsents: {
    privacyNoticeAccepted: {
      accepted: false,
    },
    explicitConsentAccepted: {
      accepted: false,
    },
    contentResponsibilityAccepted: {
      accepted: false,
    },
    serviceStartConsentAccepted: {
      accepted: false,
    },
  },
});
