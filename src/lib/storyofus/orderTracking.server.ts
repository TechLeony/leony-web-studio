import { createServerFn } from "@tanstack/react-start";

import { normalizeTurkeyMobilePhone } from "./contactValidation";
import {
  getStoryOfUsEditUsageLabel,
  getStoryOfUsEditingStateDescription,
  getStoryOfUsEditingStateLabel,
  shouldShowStoryOfUsEditDeadline,
} from "./setupSuccessCopy";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

type OrderTrackingInput = {
  trackingCode: string;
  contact: string;
};

type CustomerStatus =
  | "payment_pending"
  | "setup_pending"
  | "edit_window_open"
  | "preparing"
  | "in_review"
  | "ready"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refund_under_review"
  | "refund_approved"
  | "refund_processing"
  | "refunded"
  | "refund_failed";

type RefundCustomerStatus = Extract<
  CustomerStatus,
  | "refund_requested"
  | "refund_under_review"
  | "refund_approved"
  | "refund_processing"
  | "refunded"
  | "refund_failed"
>;

type OrderTrackingFoundResult = {
  status: "found";
  trackingCode: string;
  orderReference: string;
  customerName: string;
  customerEmailMasked: string;
  paymentStatusLabel: string;
  customerStatus: CustomerStatus;
  customerStatusLabel: string;
  customerStatusDescription: string;
  timeline: Array<{
    id: string;
    label: string;
    state: "completed" | "current" | "future";
  }>;
  setupLinkSentAt: string | null;
  paidAt: string | null;
  submittedAt: string | null;
  editableUntil: string | null;
  refundRequestUntil: string | null;
  editUsageLabel: string;
  editingStatusLabel: string;
  editingStatusDescription: string;
  deliveredAt: string | null;
  finalSiteUrl: string | null;
};

type OrderTrackingResult =
  | OrderTrackingFoundResult
  | {
      status: "not_found";
      message: string;
    };

export const getStoryOfUsOrderTracking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): OrderTrackingInput => {
    if (!data || typeof data !== "object") {
      return {
        trackingCode: "",
        contact: "",
      };
    }

    const input = data as Partial<OrderTrackingInput>;

    return {
      trackingCode: typeof input.trackingCode === "string" ? input.trackingCode : "",
      contact: typeof input.contact === "string" ? input.contact : "",
    };
  })
  .handler(async ({ data }): Promise<OrderTrackingResult> => {
    const trackingCode = data.trackingCode.trim().toUpperCase();
    const contact = data.contact.trim();
    const normalizedEmail = contact.includes("@") ? contact.toLowerCase() : null;
    const normalizedPhone = normalizeTurkeyMobilePhone(contact);

    if (!trackingCode || (!normalizedEmail && !normalizedPhone)) {
      return createNotFoundResult();
    }

    const { data: submission, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .select(
        [
          "tracking_code",
          "order_reference",
          "customer_name",
          "customer_email",
          "contact_phone",
          "payment_status",
          "refund_status",
          "status",
          "setup_link_sent_at",
          "paid_at",
          "submitted_at",
          "editable_until",
          "refund_request_until",
          "edits_used",
          "edit_limit",
          "editing_closed_at",
          "editing_closed_reason",
          "delivered_at",
          "final_site_url",
          "created_at",
        ].join(", "),
      )
      .eq("tracking_code", trackingCode)
      .maybeSingle();

    if (error) {
      throw new Error(`StoryOfUs order tracking could not be loaded: ${error.message}`);
    }

    if (!submission || !doesContactMatch(submission, normalizedEmail, normalizedPhone)) {
      return createNotFoundResult();
    }

    const customerStatus = getCustomerStatus(submission);
    const editStatus = {
      editsUsed: numberValue(submission.edits_used),
      editLimit: numberValue(submission.edit_limit) || 2,
      editableUntil: nullableString(submission.editable_until),
      refundRequestUntil: nullableString(submission.refund_request_until),
      editingClosedAt: nullableString(submission.editing_closed_at),
      editingClosedReason: nullableString(submission.editing_closed_reason),
      status: stringValue(submission.status),
    };
    const visibleEditableUntil = shouldShowStoryOfUsEditDeadline(editStatus)
      ? editStatus.editableUntil
      : null;

    return {
      status: "found",
      trackingCode: stringValue(submission.tracking_code),
      orderReference: stringValue(submission.order_reference),
      customerName: stringValue(submission.customer_name),
      customerEmailMasked: maskEmail(stringValue(submission.customer_email)),
      paymentStatusLabel: getPaymentStatusLabel(stringValue(submission.payment_status)),
      customerStatus: customerStatus.id,
      customerStatusLabel: customerStatus.label,
      customerStatusDescription: customerStatus.description,
      timeline: createTrackingTimeline(customerStatus.id),
      setupLinkSentAt: nullableString(submission.setup_link_sent_at),
      paidAt: nullableString(submission.paid_at),
      submittedAt: nullableString(submission.submitted_at),
      editableUntil: visibleEditableUntil,
      refundRequestUntil: nullableString(submission.refund_request_until),
      editUsageLabel: getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit),
      editingStatusLabel: getStoryOfUsEditingStateLabel(editStatus),
      editingStatusDescription: getStoryOfUsEditingStateDescription(editStatus),
      deliveredAt: nullableString(submission.delivered_at),
      finalSiteUrl:
        (customerStatus.id === "ready" || customerStatus.id === "delivered") &&
        stringValue(submission.final_site_url)
          ? stringValue(submission.final_site_url)
          : null,
    };
  });

function createNotFoundResult(): OrderTrackingResult {
  return {
    status: "not_found",
    message: "Bu bilgilerle eşleşen bir sipariş bulunamadı.",
  };
}

function getPaymentStatusLabel(paymentStatus: string) {
  switch (paymentStatus) {
    case "paid":
      return "Ödeme onaylandı";
    case "pending":
      return "Ödeme bekleniyor";
    case "failed":
      return "Ödeme tamamlanamadı";
    case "cancelled":
      return "Ödeme iptal edildi";
    case "refunded":
      return "İade edildi";
    default:
      return "Ödeme durumu kontrol ediliyor";
  }
}

function doesContactMatch(
  submission: Record<string, unknown>,
  normalizedEmail: string | null,
  normalizedPhone: string | null,
) {
  const storedEmail = stringValue(submission.customer_email).toLowerCase();
  const storedPhone = normalizeTurkeyMobilePhone(stringValue(submission.contact_phone));

  return Boolean(
    (normalizedEmail && storedEmail === normalizedEmail) ||
    (normalizedPhone && storedPhone === normalizedPhone),
  );
}

function getCustomerStatus(submission: Record<string, unknown>): {
  id: CustomerStatus;
  label: string;
  description: string;
} {
  const paymentStatus = stringValue(submission.payment_status);
  const refundStatus = stringValue(submission.refund_status);
  const internalStatus = stringValue(submission.status);
  const editableUntil = nullableString(submission.editable_until);
  const deliveredAt = nullableString(submission.delivered_at);

  const refundCustomerStatus = getRefundCustomerStatus(refundStatus);

  if (refundCustomerStatus) {
    return refundCustomerStatus;
  }

  if (
    ["failed", "cancelled", "refunded"].includes(paymentStatus) ||
    internalStatus === "archived"
  ) {
    return {
      id: "cancelled",
      label: "İptal edildi",
      description: "Bu sipariş aktif görünmüyor.",
    };
  }

  if (paymentStatus === "pending") {
    return {
      id: "payment_pending",
      label: "Ödeme bekleniyor",
      description:
        "İletişim bilgileriniz alındı. Kurulum bağlantısı ödeme onaylandıktan sonra e-posta adresinize gönderilecek.",
    };
  }

  if (deliveredAt) {
    return {
      id: "delivered",
      label: "Teslim edildi",
      description: "Final linkiniz teslim edildi.",
    };
  }

  if (paymentStatus === "paid" && internalStatus === "draft") {
    return {
      id: "setup_pending",
      label: "Kurulum formu bekleniyor",
      description: "Ödemeniz onaylandı. Kurulum formunu tamamlamanız bekleniyor.",
    };
  }

  if (internalStatus === "submitted") {
    if (editableUntil && new Date(editableUntil).getTime() > Date.now()) {
      return {
        id: "edit_window_open",
        label: "Bilgileriniz alındı",
        description: "Kurulum formunuz alındı. Düzenleme süreniz devam ediyor.",
      };
    }

    return {
      id: "preparing",
      label: "Hazırlanıyor",
      description: "Düzenleme süreniz sona erdi. Web sitenizin hazırlanma süreci başladı.",
    };
  }

  if (internalStatus === "in_review") {
    return {
      id: "in_review",
      label: "Kontrol ediliyor",
      description: "Web siteniz kontrol aşamasında.",
    };
  }

  if (internalStatus === "published") {
    return {
      id: "ready",
      label: "Hazır",
      description: "Web siteniz hazır. Teslimat adımı bekleniyor.",
    };
  }

  return {
    id: "preparing",
    label: "Hazırlanıyor",
    description: "Web sitenizin hazırlanma süreci devam ediyor.",
  };
}

function getRefundCustomerStatus(refundStatus: string): {
  id: CustomerStatus;
  label: string;
  description: string;
} | null {
  switch (refundStatus) {
    case "requested":
      return {
        id: "refund_requested",
        label: "İade talebi alındı",
        description: "İade talebiniz alındı. Değerlendirme için sizinle iletişim kurulabilir.",
      };
    case "under_review":
      return {
        id: "refund_under_review",
        label: "İade talebi inceleniyor",
        description: "İade talebiniz inceleniyor. Gerekirse sizinle iletişime geçeceğiz.",
      };
    case "approved":
      return {
        id: "refund_approved",
        label: "İade talebi onaylandı",
        description: "İade talebiniz onaylandı. İşlem adımları takip ediliyor.",
      };
    case "processing":
      return {
        id: "refund_processing",
        label: "İade işlemi sürüyor",
        description: "İade işleminiz devam ediyor.",
      };
    case "refunded":
      return {
        id: "refunded",
        label: "İade edildi",
        description: "Bu sipariş için iade işlemi tamamlandı.",
      };
    case "failed":
      return {
        id: "refund_failed",
        label: "İade işlemi için sizinle iletişime geçeceğiz",
        description: "İade işleminde ek kontrol gerekiyor. Sizinle iletişim kurulacaktır.",
      };
    case "rejected":
    case "none":
    default:
      return null;
  }
}

function createTrackingTimeline(customerStatus: CustomerStatus) {
  if (isRefundCustomerStatus(customerStatus)) {
    return createRefundTrackingTimeline(customerStatus);
  }

  const steps = [
    { id: "created", label: "Sipariş oluşturuldu" },
    { id: "payment_pending", label: "Ödeme onayı" },
    { id: "setup_pending", label: "Kurulum formu" },
    { id: "edit_window_open", label: "Düzenleme süresi" },
    { id: "preparing", label: "Hazırlık" },
    { id: "in_review", label: "Kontrol" },
    { id: "ready", label: "Hazır" },
    { id: "delivered", label: "Teslim edildi" },
  ];
  const statusOrder: Record<Exclude<CustomerStatus, RefundCustomerStatus>, number> = {
    payment_pending: 1,
    setup_pending: 2,
    edit_window_open: 3,
    preparing: 4,
    in_review: 5,
    ready: 6,
    delivered: 7,
    cancelled: 1,
  };
  const currentIndex = statusOrder[customerStatus] ?? 0;

  return steps.map((step, index) => ({
    ...step,
    state:
      customerStatus !== "cancelled" && index < currentIndex
        ? "completed"
        : index === currentIndex
          ? "current"
          : "future",
  }));
}

function isRefundCustomerStatus(
  customerStatus: CustomerStatus,
): customerStatus is RefundCustomerStatus {
  return [
    "refund_requested",
    "refund_under_review",
    "refund_approved",
    "refund_processing",
    "refunded",
    "refund_failed",
  ].includes(customerStatus);
}

function createRefundTrackingTimeline(customerStatus: RefundCustomerStatus) {
  const steps = [
    { id: "refund_requested", label: "İade talebi alındı" },
    { id: "refund_under_review", label: "İnceleme" },
    { id: "refund_processing", label: "İade işlemi" },
    { id: "refunded", label: "Tamamlandı" },
  ];
  const statusOrder: Record<RefundCustomerStatus, number> = {
    refund_requested: 0,
    refund_under_review: 1,
    refund_approved: 2,
    refund_processing: 2,
    refunded: 3,
    refund_failed: 2,
  };
  const currentIndex = statusOrder[customerStatus];

  return steps.map((step, index) => ({
    ...step,
    state: index < currentIndex ? "completed" : index === currentIndex ? "current" : "future",
  }));
}

function maskEmail(value: string) {
  const [name, domain] = value.split("@");

  if (!name || !domain) {
    return "";
  }

  return `${name.slice(0, 2)}***@${domain}`;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
