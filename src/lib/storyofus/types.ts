import type {
  AnimationId,
  ColorThemeId,
  FontId,
  MarketingPermissionId,
  MarketingPrivacyId,
  OrderStatus,
  PackageId,
  PaymentStatus,
  PhotoLayoutId,
  StyleId,
  VisibilityId,
} from "./config";

export interface StoryOrder {
  id: string;
  orderCode: string;

  createdAt: string;
  createdAtDate: string;
  createdAtTime: string;

  customerName: string;
  customerEmail: string;
  useSameEmailForDelivery: boolean;
  deliveryEmail: string;
  customerPhone: string;

  partnerOneName: string;
  partnerTwoName: string;
  relationshipDate: string;
  specialDate: string;
  desiredSlug: string;

  selectedStyle: StyleId;
  selectedColorTheme: ColorThemeId;
  selectedFont: FontId;
  selectedPhotoLayout: PhotoLayoutId;
  selectedAnimation: AnimationId;
  selectedPackage: PackageId;

  packageOriginalPrice: number;
  packageDiscountedPrice: number;
  packageActivePrice: number;

  visibility: VisibilityId;
  visibilityExtraPrice: number;
  password?: string | null;
  accessPin: string;
  accessPinHint?: string | null;

  loveNote: string;
  story: string;
  song: string;
  spotifySongTitle?: string | null;
  spotifyArtist?: string | null;
  spotifyNote?: string | null;
  spotifyUrl?: string | null;
  voiceNoteTitle?: string | null;
  voiceNoteAudioFileName?: string | null;
  voiceNoteTranscript?: string | null;
  photos: string[];

  marketingPermissionType: MarketingPermissionId;
  marketingDiscount: number;
  marketingPrivacyPreference: MarketingPrivacyId | null;
  marketingConsentAccepted: boolean;

  totalPrice: number;

  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;

  shopierPaymentDate?: string | null;
  shopierPaymentTime?: string | null;
  shopierPaymentNote?: string | null;
  matchedBy?: "Sipariş kodu" | "Tarih/Saat" | "E-posta" | "Manuel" | null;

  finalWebsiteLink?: string | null;

  internalAdminNotes?: string | null;

  adminLeadEmailSent: boolean;
  adminLeadEmailSentAt?: string | null;
  customerOrderReceivedEmailSent: boolean;
  customerOrderReceivedEmailSentAt?: string | null;
  paymentConfirmationEmailSent: boolean;
  paymentConfirmationEmailSentAt?: string | null;
  deliveryEmailSent: boolean;
  deliveryEmailSentAt?: string | null;
  reminderEmailSent: boolean;
  reminderEmailSentAt?: string | null;
}
