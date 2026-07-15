export const STORYOFUS_REFUND_POLICY_VERSION = "storyofus-refund-policy-v1";

export const STORYOFUS_ACTIVE_REFUND_STATUSES = [
  "requested",
  "under_review",
  "approved",
  "processing",
  "refunded",
] as const;

export const STORYOFUS_TERMINAL_OR_ACTIVE_REFUND_STATUSES = [
  ...STORYOFUS_ACTIVE_REFUND_STATUSES,
  "failed",
] as const;

type RefundStatus =
  | "none"
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "processing"
  | "refunded"
  | "failed";

export type StoryOfUsRefundEligibilityInput = {
  paymentStatus: string | null;
  submissionStatus: string | null;
  editableUntil: string | null;
  refundStatus: string | null;
};

export type StoryOfUsRefundEligibilityResult = {
  eligible: boolean;
  reason:
    | "within_window"
    | "payment_not_paid"
    | "not_submitted"
    | "missing_deadline"
    | "window_closed"
    | "refund_already_active_or_completed";
};

export function getStoryOfUsServiceStartConsent({
  acceptedAt,
  serviceScheduledAt,
}: {
  acceptedAt: string;
  serviceScheduledAt: string | null;
}) {
  return {
    accepted: true,
    acceptedAt,
    policyVersion: STORYOFUS_REFUND_POLICY_VERSION,
    serviceScheduledAt,
    copy:
      "Kurulum formunu gönderdikten sonra 3 saat boyunca bilgilerimi düzenleyebileceğimi ve bu süre içinde iade talebinde bulunabileceğimi biliyorum. Bu sürenin sonunda paylaştığım bilgilere göre kişiselleştirilmiş StoryOfUs hizmetinin hazırlanmasına başlanmasını açıkça talep ediyorum. Hazırlık başladıktan sonra yalnızca fikir değişikliğine dayalı standart cayma hakkının uygulanmayabileceği konusunda bilgilendirildim.",
  };
}

export function isStoryOfUsActiveRefundStatus(status: string | null | undefined) {
  return STORYOFUS_ACTIVE_REFUND_STATUSES.includes(status as never);
}

export function normalizeStoryOfUsRefundStatus(status: unknown): RefundStatus {
  return typeof status === "string" && isKnownRefundStatus(status) ? status : "none";
}

export function getStoryOfUsRefundRequestEligibility(
  input: StoryOfUsRefundEligibilityInput,
  now = new Date(),
): StoryOfUsRefundEligibilityResult {
  if (input.paymentStatus !== "paid") {
    return {
      eligible: false,
      reason: "payment_not_paid",
    };
  }

  if (input.submissionStatus !== "submitted") {
    return {
      eligible: false,
      reason: "not_submitted",
    };
  }

  if (!input.editableUntil) {
    return {
      eligible: false,
      reason: "missing_deadline",
    };
  }

  if (STORYOFUS_TERMINAL_OR_ACTIVE_REFUND_STATUSES.includes(input.refundStatus as never)) {
    return {
      eligible: false,
      reason: "refund_already_active_or_completed",
    };
  }

  const editableUntilTime = new Date(input.editableUntil).getTime();

  if (!Number.isFinite(editableUntilTime) || now.getTime() >= editableUntilTime) {
    return {
      eligible: false,
      reason: "window_closed",
    };
  }

  return {
    eligible: true,
    reason: "within_window",
  };
}

function isKnownRefundStatus(status: string): status is RefundStatus {
  return [
    "none",
    "requested",
    "under_review",
    "approved",
    "rejected",
    "processing",
    "refunded",
    "failed",
  ].includes(status);
}
