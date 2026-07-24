export type StoryOfUsAdminStatus =
  | "checkout_submitted"
  | "payment_pending"
  | "paid"
  | "setup_pending"
  | "setup_submitted"
  | "editing"
  | "review_ready"
  | "queued_for_delivery"
  | "delivered"
  | "payment_failed"
  | "checkout_abandoned"
  | "refund_requested"
  | "refund_approved"
  | "refunded"
  | "cancelled"
  | "delivery_failed";

export type StoryOfUsAdminUrgency = "overdue" | "urgent" | "warning" | "normal";

export type StoryOfUsAdminOrderStatusInput = {
  status: string;
  paymentStatus: string;
  refundStatus: string;
  checkoutExpiresAt: string | null;
  submittedAt: string | null;
  editableUntil: string | null;
  editingClosedAt: string | null;
  reviewReadyAt: string | null;
  deliveryQueuedAt?: string | null;
  deliveredAt: string | null;
  finalSiteUrl: string | null;
  finalEmailStatus?: string | null;
};

export type StoryOfUsAdminFinancialInput = {
  amount: number;
  refundAmount: number;
  isPaid: boolean;
  isRefunded: boolean;
  isFailedOrCancelled: boolean;
};

export type StoryOfUsAdminFinancialSummary = {
  grossRevenue: number;
  paidOrderCount: number;
  averageOrderValue: number;
  estimatedCommission: number | null;
  commissionVat: number | null;
  estimatedNetRevenue: number | null;
  refundTotal: number;
  netRevenueAfterRefunds: number | null;
};

export const STORYOFUS_ADMIN_LIFECYCLE_STAGES = [
  "Checkout",
  "Payment",
  "Setup",
  "Editing",
  "Review Ready",
  "Queued",
  "Delivered",
] as const;

export function getStoryOfUsAdminStatus(
  input: StoryOfUsAdminOrderStatusInput,
): StoryOfUsAdminStatus {
  if (input.refundStatus === "refunded") {
    return "refunded";
  }

  if (
    input.refundStatus === "requested" ||
    input.refundStatus === "under_review" ||
    input.refundStatus === "processing"
  ) {
    return "refund_requested";
  }

  if (input.refundStatus === "approved") {
    return "refund_approved";
  }

  if (input.paymentStatus === "cancelled") {
    return "cancelled";
  }

  if (input.paymentStatus === "failed") {
    return "payment_failed";
  }

  if (input.paymentStatus === "pending") {
    if (isPast(input.checkoutExpiresAt)) {
      return "checkout_abandoned";
    }

    return "payment_pending";
  }

  if (input.status === "published" && input.deliveredAt && input.finalSiteUrl) {
    return input.finalEmailStatus === "dead" ? "delivery_failed" : "delivered";
  }

  if (input.status === "queued_for_delivery") {
    return "queued_for_delivery";
  }

  if (input.status === "published") {
    return input.finalEmailStatus === "dead" ? "delivery_failed" : "queued_for_delivery";
  }

  if (input.status === "in_review") {
    return "review_ready";
  }

  if (input.status === "submitted") {
    if (input.editingClosedAt || isPast(input.editableUntil) || input.reviewReadyAt) {
      return "review_ready";
    }

    return "editing";
  }

  if (input.paymentStatus === "paid" && input.status === "draft") {
    return "setup_pending";
  }

  return input.paymentStatus === "paid" ? "paid" : "checkout_submitted";
}

export function getStoryOfUsAdminStatusLabel(status: StoryOfUsAdminStatus) {
  const labels: Record<StoryOfUsAdminStatus, string> = {
    checkout_submitted: "Checkout Submitted",
    payment_pending: "Payment Pending",
    paid: "Paid",
    setup_pending: "Setup Pending",
    setup_submitted: "Setup Submitted",
    editing: "Editing",
    review_ready: "Review Ready",
    queued_for_delivery: "Queued for Delivery",
    delivered: "Delivered",
    payment_failed: "Payment Failed",
    checkout_abandoned: "Checkout Abandoned",
    refund_requested: "Refund Requested",
    refund_approved: "Refund Approved",
    refunded: "Refunded",
    cancelled: "Cancelled",
    delivery_failed: "Delivery Failed",
  };

  return labels[status];
}

export function getStoryOfUsAdminDeliveryDeadline(editingEndedAt: string | null) {
  const editingEnd = parseTime(editingEndedAt);

  if (!editingEnd) {
    return null;
  }

  return new Date(editingEnd.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

export function classifyStoryOfUsDeliveryDeadline(
  deadlineIso: string | null,
  nowIso = new Date().toISOString(),
): StoryOfUsAdminUrgency {
  const deadline = parseTime(deadlineIso);
  const now = parseTime(nowIso) ?? new Date();

  if (!deadline) {
    return "normal";
  }

  const remainingMs = deadline.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return "overdue";
  }

  if (remainingMs < 3 * 60 * 60 * 1000) {
    return "urgent";
  }

  if (remainingMs < 12 * 60 * 60 * 1000) {
    return "warning";
  }

  return "normal";
}

export function formatStoryOfUsRemainingTime(
  deadlineIso: string | null,
  nowIso = new Date().toISOString(),
) {
  const deadline = parseTime(deadlineIso);
  const now = parseTime(nowIso) ?? new Date();

  if (!deadline) {
    return "Not available";
  }

  const diffMs = deadline.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(absMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return diffMs < 0 ? `${value} overdue` : `${value} remaining`;
}

export function calculateStoryOfUsFinancialSummary({
  orders,
  commissionRate,
  commissionVatRate,
}: {
  orders: StoryOfUsAdminFinancialInput[];
  commissionRate?: number | null;
  commissionVatRate?: number | null;
}): StoryOfUsAdminFinancialSummary {
  const paidOrders = orders.filter(
    (order) => order.isPaid && !order.isFailedOrCancelled && !order.isRefunded,
  );
  const grossRevenue = roundMoney(paidOrders.reduce((sum, order) => sum + order.amount, 0));
  const paidOrderCount = paidOrders.length;
  const commissionConfigured =
    typeof commissionRate === "number" &&
    Number.isFinite(commissionRate) &&
    typeof commissionVatRate === "number" &&
    Number.isFinite(commissionVatRate);
  const estimatedCommission = commissionConfigured
    ? roundMoney(grossRevenue * commissionRate)
    : null;
  const commissionVat =
    commissionConfigured && estimatedCommission !== null
      ? roundMoney(estimatedCommission * commissionVatRate)
      : null;
  const refundTotal = roundMoney(
    orders
      .filter((order) => order.isRefunded)
      .reduce((sum, order) => sum + (order.refundAmount || order.amount), 0),
  );
  const estimatedNetRevenue =
    estimatedCommission !== null && commissionVat !== null
      ? roundMoney(grossRevenue - estimatedCommission - commissionVat)
      : null;

  return {
    grossRevenue,
    paidOrderCount,
    averageOrderValue: paidOrderCount > 0 ? roundMoney(grossRevenue / paidOrderCount) : 0,
    estimatedCommission,
    commissionVat,
    estimatedNetRevenue,
    refundTotal,
    netRevenueAfterRefunds:
      estimatedNetRevenue !== null ? roundMoney(estimatedNetRevenue - refundTotal) : null,
  };
}

export function getStoryOfUsPeriodStart(period: string, now = new Date()) {
  const start = new Date(now);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      return start;
    case "7d":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return start;
    case "30d":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return start;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      return start;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return start;
    default:
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return start;
  }
}

function isPast(value: string | null) {
  const date = parseTime(value);

  return Boolean(date && date.getTime() <= Date.now());
}

function parseTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
