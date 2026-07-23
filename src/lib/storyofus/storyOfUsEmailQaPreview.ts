import {
  createStoryOfUsEmailTemplate,
  type StoryOfUsEmailTemplate,
  type StoryOfUsEmailTemplateInput,
} from "./storyOfUsEmailTemplates.server.ts";

export const STORYOFUS_EMAIL_QA_PATH = "/storyofus/internal/email-qa";

export const STORYOFUS_EMAIL_QA_FROM = {
  name: "StoryOfUs by Leony",
  address: "storyofus@mail.leony.tech",
  label: "StoryOfUs by Leony <storyofus@mail.leony.tech>",
} as const;

export const STORYOFUS_EMAIL_QA_REPLY_TO = "contact@leony.tech";

export type StoryOfUsEmailQaStageId =
  "checkout_created" | "order_created" | "setup_submitted" | "final_site_ready";

export type StoryOfUsEmailQaPreview = {
  id: StoryOfUsEmailQaStageId;
  name: string;
  purpose: string;
  templateInput: StoryOfUsEmailTemplateInput;
  subject: string;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  html: string;
  text: string;
};

type StoryOfUsQaEnvironment = {
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

const QA_CUSTOMER_NAME = "Derya";
const QA_ORDER_REFERENCE = "SOU-QA-2026";
const QA_TRACKING_CODE = "QA-TRACK-2026";
const QA_PAYMENT_URL = "https://preview.local/storyofus/qa/inert-shopier-payment";
const QA_SETUP_URL = "https://preview.local/storyofus/qa/inert-setup";
const QA_TRACK_ORDER_URL = `https://preview.local/storyofus/track-order?code=${QA_TRACKING_CODE}`;
const QA_FINAL_SITE_URL = "https://preview.local/storyofus/site/qa-final-site";
const QA_EDITABLE_UNTIL = "2026-07-23T08:25:00.000Z";
const QA_REFUND_UNTIL = "2026-07-23T08:25:00.000Z";
const QA_EDITABLE_UNTIL_LABEL = "23 Temmuz 2026 11:25";
const QA_REFUND_UNTIL_LABEL = "23 Temmuz 2026 11:25";

export function isStoryOfUsEmailQaAllowed(env: StoryOfUsQaEnvironment | null = getRuntimeEnv()) {
  if (!env) {
    return false;
  }

  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnv === "production") {
    return false;
  }

  if (vercelEnv === "preview" || vercelEnv === "development") {
    return true;
  }

  return env.NODE_ENV !== "production";
}

export function getStoryOfUsEmailQaPreviews(): StoryOfUsEmailQaPreview[] {
  return getStoryOfUsEmailQaTemplateInputs().map((stage) => {
    const template = createStoryOfUsEmailTemplate(stage.templateInput);
    return createEmailQaPreview(stage, template);
  });
}

export function getStoryOfUsEmailQaTemplateInputs() {
  return [
    {
      id: "checkout_created",
      name: "Checkout tamamlandı / ödeme bekleniyor",
      purpose: "Sipariş kaydı oluşturuldu; müşteri Shopier ödemesini henüz tamamlamadı.",
      templateInput: {
        emailType: "checkout_created",
        customerName: QA_CUSTOMER_NAME,
        orderReference: QA_ORDER_REFERENCE,
        trackingCode: QA_TRACKING_CODE,
        shopierPaymentUrl: QA_PAYMENT_URL,
        trackOrderUrl: QA_TRACK_ORDER_URL,
      },
    },
    {
      id: "order_created",
      name: "Ödeme onaylandı / kurulum bağlantısı",
      purpose: "Ödeme doğrulandı; müşteri kişiselleştirme kurulumuna başlayabilir.",
      templateInput: {
        emailType: "order_created",
        customerName: QA_CUSTOMER_NAME,
        orderReference: QA_ORDER_REFERENCE,
        trackingCode: QA_TRACKING_CODE,
        setupUrl: QA_SETUP_URL,
        trackOrderUrl: QA_TRACK_ORDER_URL,
      },
    },
    {
      id: "setup_submitted",
      name: "Kurulum başarıyla gönderildi",
      purpose: "Müşterinin kurulum bilgileri alındı; düzenleme ve iade talebi süreleri başladı.",
      templateInput: {
        emailType: "setup_submitted",
        customerName: QA_CUSTOMER_NAME,
        orderReference: QA_ORDER_REFERENCE,
        trackingCode: QA_TRACKING_CODE,
        setupUrl: QA_SETUP_URL,
        trackOrderUrl: QA_TRACK_ORDER_URL,
        editableUntil: QA_EDITABLE_UNTIL,
        editableUntilLabel: QA_EDITABLE_UNTIL_LABEL,
        refundRequestUntil: QA_REFUND_UNTIL,
        refundRequestUntilLabel: QA_REFUND_UNTIL_LABEL,
      },
    },
    {
      id: "final_site_ready",
      name: "Website hazır",
      purpose: "Final StoryOfUs sitesi yayına hazırlandı ve müşteriye bildiriliyor.",
      templateInput: {
        emailType: "final_site_ready",
        customerName: QA_CUSTOMER_NAME,
        orderReference: QA_ORDER_REFERENCE,
        finalSiteUrl: QA_FINAL_SITE_URL,
        passcodeHint: "Tanıştığımız yıl",
      },
    },
  ] as const satisfies readonly {
    id: StoryOfUsEmailQaStageId;
    name: string;
    purpose: string;
    templateInput: StoryOfUsEmailTemplateInput;
  }[];
}

function createEmailQaPreview(
  stage: ReturnType<typeof getStoryOfUsEmailQaTemplateInputs>[number],
  template: StoryOfUsEmailTemplate,
): StoryOfUsEmailQaPreview {
  return {
    id: stage.id,
    name: stage.name,
    purpose: stage.purpose,
    templateInput: stage.templateInput,
    subject: template.subject,
    fromName: STORYOFUS_EMAIL_QA_FROM.name,
    fromAddress: STORYOFUS_EMAIL_QA_FROM.address,
    replyTo: STORYOFUS_EMAIL_QA_REPLY_TO,
    html: template.html,
    text: template.text,
  };
}

function getRuntimeEnv(): StoryOfUsQaEnvironment | null {
  if (typeof process === "undefined") {
    return null;
  }

  return {
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };
}
