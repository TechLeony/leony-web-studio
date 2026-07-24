import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SITE } from "@/lib/site";

import {
  calculateStoryOfUsFinancialSummary,
  classifyStoryOfUsDeliveryDeadline,
  formatStoryOfUsRemainingTime,
  getStoryOfUsAdminDeliveryDeadline,
  getStoryOfUsAdminStatus,
  getStoryOfUsAdminStatusLabel,
  getStoryOfUsPeriodStart,
  type StoryOfUsAdminStatus,
  type StoryOfUsAdminUrgency,
} from "./storyOfUsAdminDashboard";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

export type StoryOfUsAdminDashboardOrder = {
  id: string;
  shortId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderReference: string;
  trackingCode: string;
  shopierOrderCode: string;
  shopierPaymentReference: string;
  status: StoryOfUsAdminStatus;
  statusLabel: string;
  rawStatus: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  refundStatus: string;
  refundStatusLabel: string;
  editCountLabel: string;
  editsUsed: number;
  editLimit: number;
  createdAt: string | null;
  updatedAt: string | null;
  paidAt: string | null;
  submittedAt: string | null;
  editableUntil: string | null;
  editingClosedAt: string | null;
  reviewReadyAt: string | null;
  deliveryQueuedAt: string | null;
  deliveredAt: string | null;
  refundRequestUntil: string | null;
  refundRequestedAt: string | null;
  deliveryDeadline: string | null;
  deliveryUrgency: StoryOfUsAdminUrgency;
  timeRemaining: string;
  paymentAmount: number;
  paymentCurrency: string;
  finalSiteUrl: string | null;
  finalEmailStatus: string | null;
  mediaCount: number;
};

export type StoryOfUsAdminActionItem = {
  id: string;
  orderId: string;
  orderReference: string;
  title: string;
  description: string;
  urgency: StoryOfUsAdminUrgency;
  statusLabel: string;
};

export type StoryOfUsAdminOverview = {
  kpis: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  revenueSeries: Array<{
    label: string;
    grossRevenue: number;
    estimatedNetRevenue: number | null;
  }>;
  actions: StoryOfUsAdminActionItem[];
  orders: StoryOfUsAdminDashboardOrder[];
  analytics: ReturnType<typeof calculateStoryOfUsFinancialSummary> & {
    deliveredOrderCount: number;
    checkoutToPaidConversion: number;
  };
  commissionConfig: {
    configured: boolean;
    commissionRate: number | null;
    commissionVatRate: number | null;
    message: string | null;
  };
};

export type StoryOfUsAdminDetail = StoryOfUsAdminDashboardOrder & {
  checkoutExpiresAt: string | null;
  setupLinkSentAt: string | null;
  paymentProvider: string;
  paymentProviderEventId: string;
  paymentError: string;
  shopierProductId: string;
  shopierProductCreatedAt: string | null;
  shopierProductError: string;
  refundDecidedAt: string | null;
  refundedAt: string | null;
  refundReference: string;
  refundReason: string;
  refundAmount: number;
  refundCurrency: string;
  refundNote: string;
  editingClosedReason: string;
  lastResubmittedAt: string | null;
  serviceStartedAt: string | null;
  finalSiteSlug: string;
  emailOutbox: Array<{
    emailType: string;
    status: string;
    queuedAt: string | null;
    sentAt: string | null;
    failedAt: string | null;
    lastErrorCode: string;
  }>;
  lifecycle: Array<{
    label: string;
    state: "completed" | "current" | "future" | "failed";
    timestamp: string | null;
  }>;
};

export type StoryOfUsAdminDashboardInput = {
  period?: string;
  search?: string;
  filter?: string;
  sort?: string;
};

type AdminContext = {
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string,
        ) => {
          eq: (
            column: string,
            value: string,
          ) => {
            maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
          };
          maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
        };
      };
    };
  };
  userId: string;
  claims: {
    email?: unknown;
  };
};

type StoryOfUsCommissionConfig = StoryOfUsAdminOverview["commissionConfig"];

export const getStoryOfUsAdminDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): StoryOfUsAdminDashboardInput => {
    if (!data || typeof data !== "object") {
      return {};
    }

    const input = data as Record<string, unknown>;

    return {
      period: stringValue(input.period),
      search: stringValue(input.search),
      filter: stringValue(input.filter),
      sort: stringValue(input.sort),
    };
  })
  .handler(async ({ data, context }): Promise<StoryOfUsAdminOverview> => {
    await assertStoryOfUsAdmin(context as AdminContext);

    const nowIso = new Date().toISOString();
    const period = normalizePeriod(data.period);
    const orders = await loadDashboardOrders(nowIso);
    const filteredOrders = sortOrders(
      filterOrders(orders, data.search ?? "", data.filter ?? "all"),
      data.sort ?? "newest",
    );
    const periodStart = getStoryOfUsPeriodStart(period).toISOString();
    const periodOrders = orders.filter((order) => {
      const paidAt = order.paidAt ?? order.createdAt;
      return Boolean(paidAt && paidAt >= periodStart);
    });
    const commissionConfig = getCommissionConfig();
    const analyticsBase = calculateStoryOfUsFinancialSummary({
      orders: periodOrders.map((order) => ({
        amount: order.paymentAmount,
        refundAmount: order.refundAmount ?? 0,
        isPaid: order.paymentStatus === "paid",
        isRefunded: order.refundStatus === "refunded",
        isFailedOrCancelled: ["failed", "cancelled"].includes(order.paymentStatus),
      })),
      commissionRate: commissionConfig.commissionRate,
      commissionVatRate: commissionConfig.commissionVatRate,
    });

    const paidCount = orders.filter((order) => order.paymentStatus === "paid").length;
    const checkoutCount = orders.length;

    return {
      kpis: createKpis(orders, nowIso, analyticsBase, commissionConfig),
      revenueSeries: createRevenueSeries(periodOrders, period, commissionConfig),
      actions: createActionItems(orders),
      orders: filteredOrders,
      analytics: {
        ...analyticsBase,
        deliveredOrderCount: periodOrders.filter((order) => order.status === "delivered").length,
        checkoutToPaidConversion:
          checkoutCount > 0 ? Math.round((paidCount / checkoutCount) * 1000) / 10 : 0,
      },
      commissionConfig,
    };
  });

export const getStoryOfUsAdminDashboardOrderDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    orderId:
      data &&
      typeof data === "object" &&
      typeof (data as { orderId?: unknown }).orderId === "string"
        ? (data as { orderId: string }).orderId
        : "",
  }))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ status: "found"; order: StoryOfUsAdminDetail } | { status: "not_found" }> => {
      await assertStoryOfUsAdmin(context as AdminContext);

      if (!isUuid(data.orderId)) {
        return { status: "not_found" };
      }

      const nowIso = new Date().toISOString();
      const { data: row, error } = await storyOfUsSupabaseAdmin
        .from("storyofus_submissions")
        .select(DETAIL_SELECT)
        .eq("id", data.orderId)
        .maybeSingle();

      if (error) {
        throw new Error("StoryOfUs order detail could not be loaded.");
      }

      if (!row) {
        return { status: "not_found" };
      }

      const emailOutbox = await loadEmailOutbox(data.orderId);
      const mediaCount = await loadMediaCount(data.orderId);
      const mapped = mapDashboardOrder(row as Record<string, unknown>, nowIso, {
        finalEmailStatus: getFinalEmailStatus(emailOutbox),
        mediaCount,
      });

      return {
        status: "found",
        order: {
          ...mapped,
          checkoutExpiresAt: nullableString((row as Record<string, unknown>).checkout_expires_at),
          setupLinkSentAt: nullableString((row as Record<string, unknown>).setup_link_sent_at),
          paymentProvider: stringValue((row as Record<string, unknown>).payment_provider),
          paymentProviderEventId: stringValue(
            (row as Record<string, unknown>).payment_provider_event_id,
          ),
          paymentError: stringValue((row as Record<string, unknown>).payment_error),
          shopierProductId: stringValue((row as Record<string, unknown>).shopier_product_id),
          shopierProductCreatedAt: nullableString(
            (row as Record<string, unknown>).shopier_product_created_at,
          ),
          shopierProductError: stringValue((row as Record<string, unknown>).shopier_product_error),
          refundDecidedAt: nullableString((row as Record<string, unknown>).refund_decided_at),
          refundedAt: nullableString((row as Record<string, unknown>).refunded_at),
          refundReference: stringValue((row as Record<string, unknown>).refund_reference),
          refundReason: stringValue((row as Record<string, unknown>).refund_reason),
          refundAmount: numberValue((row as Record<string, unknown>).refund_amount),
          refundCurrency: stringValue((row as Record<string, unknown>).refund_currency),
          refundNote: stringValue((row as Record<string, unknown>).refund_note),
          editingClosedReason: stringValue((row as Record<string, unknown>).editing_closed_reason),
          lastResubmittedAt: nullableString((row as Record<string, unknown>).last_resubmitted_at),
          serviceStartedAt: nullableString((row as Record<string, unknown>).service_started_at),
          finalSiteSlug: stringValue((row as Record<string, unknown>).final_site_slug),
          emailOutbox,
          lifecycle: createLifecycle(mapped),
        },
      };
    },
  );

export const queueStoryOfUsFinalSiteDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    orderId:
      data &&
      typeof data === "object" &&
      typeof (data as { orderId?: unknown }).orderId === "string"
        ? (data as { orderId: string }).orderId
        : "",
  }))
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      status: "queued" | "already_queued" | "not_queueable" | "missing_setup_data" | "not_found";
      deliveryQueuedAt: string | null;
      message: string;
    }> => {
      await assertStoryOfUsAdmin(context as AdminContext);

      if (!isUuid(data.orderId)) {
        return {
          status: "not_found",
          deliveryQueuedAt: null,
          message: "Order was not found.",
        };
      }

      const { data: rows, error } = await storyOfUsSupabaseAdmin.rpc(
        "storyofus_queue_final_site_delivery",
        {
          p_submission_id: data.orderId,
        },
      );

      if (error) {
        throw new Error("StoryOfUs delivery queue action failed.");
      }

      const row = Array.isArray(rows) ? rows[0] : null;
      const status = stringValue(row?.result);
      const deliveryQueuedAt = nullableString(row?.delivery_queued_at);

      if (status === "queued" || status === "already_queued") {
        return {
          status,
          deliveryQueuedAt,
          message:
            status === "queued"
              ? "Order was queued for delivery."
              : "Order was already queued for delivery.",
        };
      }

      if (status === "missing_setup_data") {
        return {
          status,
          deliveryQueuedAt,
          message: "Required final-site setup data is missing.",
        };
      }

      if (status === "not_found") {
        return {
          status,
          deliveryQueuedAt,
          message: "Order was not found.",
        };
      }

      return {
        status: "not_queueable",
        deliveryQueuedAt,
        message: "Only review-ready eligible orders can be queued for delivery.",
      };
    },
  );

const DASHBOARD_SELECT = [
  "id",
  "order_reference",
  "tracking_code",
  "customer_email",
  "customer_name",
  "contact_phone",
  "status",
  "payment_status",
  "paid_at",
  "payment_reference",
  "payment_amount",
  "payment_currency",
  "shopier_product_id",
  "checkout_expires_at",
  "submitted_at",
  "editable_until",
  "last_resubmitted_at",
  "created_at",
  "updated_at",
  "delivered_at",
  "final_site_url",
  "final_site_slug",
  "refund_status",
  "refund_requested_at",
  "refund_request_until",
  "refund_amount",
  "refund_currency",
  "edits_used",
  "edit_limit",
  "editing_closed_at",
  "editing_closed_reason",
  "review_ready_at",
  "delivery_queued_at",
].join(", ");

const DETAIL_SELECT = [
  DASHBOARD_SELECT,
  "setup_link_sent_at",
  "payment_provider",
  "payment_provider_event_id",
  "payment_error",
  "shopier_product_created_at",
  "shopier_product_error",
  "refund_decided_at",
  "refunded_at",
  "refund_reference",
  "refund_reason",
  "refund_note",
  "service_started_at",
].join(", ");

async function loadDashboardOrders(nowIso: string): Promise<StoryOfUsAdminDashboardOrder[]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select(DASHBOARD_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("StoryOfUs admin dashboard could not be loaded.");
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const [outboxRows, mediaCounts] = await Promise.all([loadAllEmailOutbox(), loadAllMediaCounts()]);
  const outboxBySubmission = groupOutboxBySubmission(outboxRows);

  return rows.map((row) =>
    mapDashboardOrder(row, nowIso, {
      finalEmailStatus: getFinalEmailStatus(outboxBySubmission.get(stringValue(row.id)) ?? []),
      mediaCount: mediaCounts.get(stringValue(row.id)) ?? 0,
    }),
  );
}

async function loadAllEmailOutbox() {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_email_outbox")
    .select("submission_id, email_type, status, queued_at, sent_at, failed_at, last_error_code");

  if (error) {
    return [];
  }

  return (data ?? []) as Array<Record<string, unknown>>;
}

async function loadEmailOutbox(submissionId: string): Promise<StoryOfUsAdminDetail["emailOutbox"]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_email_outbox")
    .select("email_type, status, queued_at, sent_at, failed_at, last_error_code")
    .eq("submission_id", submissionId)
    .order("queued_at", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    emailType: stringValue(row.email_type),
    status: stringValue(row.status),
    queuedAt: nullableString(row.queued_at),
    sentAt: nullableString(row.sent_at),
    failedAt: nullableString(row.failed_at),
    lastErrorCode: stringValue(row.last_error_code),
  }));
}

async function loadAllMediaCounts() {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .select("submission_id, id");

  const counts = new Map<string, number>();

  if (error) {
    return counts;
  }

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const submissionId = stringValue(row.submission_id);
    counts.set(submissionId, (counts.get(submissionId) ?? 0) + 1);
  }

  return counts;
}

async function loadMediaCount(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .select("id")
    .eq("submission_id", submissionId);

  if (error) {
    return 0;
  }

  return (data ?? []).length;
}

async function assertStoryOfUsAdmin(context: AdminContext) {
  const email = typeof context.claims?.email === "string" ? context.claims.email : "";
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify admin role.");
  }

  if (!data && email.toLowerCase() !== SITE.adminEmail.toLowerCase()) {
    throw new Error("Forbidden: admin access required.");
  }
}

function mapDashboardOrder(
  row: Record<string, unknown>,
  nowIso: string,
  options: {
    finalEmailStatus: string | null;
    mediaCount: number;
  },
): StoryOfUsAdminDashboardOrder & { refundAmount?: number } {
  const editingClosedAt =
    nullableString(row.editing_closed_at) ??
    (isPast(nullableString(row.editable_until), nowIso)
      ? nullableString(row.editable_until)
      : null);
  const deliveryDeadline = getStoryOfUsAdminDeliveryDeadline(editingClosedAt);
  const status = getStoryOfUsAdminStatus({
    status: stringValue(row.status),
    paymentStatus: stringValue(row.payment_status),
    refundStatus: stringValue(row.refund_status) || "none",
    checkoutExpiresAt: nullableString(row.checkout_expires_at),
    submittedAt: nullableString(row.submitted_at),
    editableUntil: nullableString(row.editable_until),
    editingClosedAt,
    reviewReadyAt: nullableString(row.review_ready_at),
    deliveryQueuedAt: nullableString(row.delivery_queued_at),
    deliveredAt: nullableString(row.delivered_at),
    finalSiteUrl: nullableString(row.final_site_url),
    finalEmailStatus: options.finalEmailStatus,
  });
  const editsUsed = numberValue(row.edits_used);
  const editLimit = numberValue(row.edit_limit) || 2;

  return {
    id: stringValue(row.id),
    shortId: stringValue(row.id).slice(0, 8),
    customerName: stringValue(row.customer_name) || "Unnamed customer",
    customerEmail: stringValue(row.customer_email),
    customerPhone: stringValue(row.contact_phone),
    orderReference: stringValue(row.order_reference),
    trackingCode: stringValue(row.tracking_code),
    shopierOrderCode: stringValue(row.shopier_product_id),
    shopierPaymentReference: stringValue(row.payment_reference),
    status,
    statusLabel: getStoryOfUsAdminStatusLabel(status),
    rawStatus: stringValue(row.status),
    paymentStatus: stringValue(row.payment_status),
    paymentStatusLabel: getPaymentStatusLabel(stringValue(row.payment_status)),
    refundStatus: stringValue(row.refund_status) || "none",
    refundStatusLabel: getRefundStatusLabel(stringValue(row.refund_status)),
    editCountLabel: `${editsUsed}/${editLimit}`,
    editsUsed,
    editLimit,
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
    paidAt: nullableString(row.paid_at),
    submittedAt: nullableString(row.submitted_at),
    editableUntil: nullableString(row.editable_until),
    editingClosedAt,
    reviewReadyAt: nullableString(row.review_ready_at),
    deliveryQueuedAt: nullableString(row.delivery_queued_at),
    deliveredAt: nullableString(row.delivered_at),
    refundRequestUntil: nullableString(row.refund_request_until),
    refundRequestedAt: nullableString(row.refund_requested_at),
    deliveryDeadline,
    deliveryUrgency: classifyStoryOfUsDeliveryDeadline(deliveryDeadline, nowIso),
    timeRemaining: formatStoryOfUsRemainingTime(deliveryDeadline, nowIso),
    paymentAmount: numberValue(row.payment_amount),
    paymentCurrency: stringValue(row.payment_currency) || "TRY",
    finalSiteUrl: nullableString(row.final_site_url),
    finalEmailStatus: options.finalEmailStatus,
    mediaCount: options.mediaCount,
    refundAmount: numberValue(row.refund_amount),
  };
}

function createLifecycle(order: StoryOfUsAdminDashboardOrder): StoryOfUsAdminDetail["lifecycle"] {
  const stageTimestamps = [
    { label: "Checkout", timestamp: order.createdAt },
    { label: "Payment", timestamp: order.paidAt },
    { label: "Setup", timestamp: order.submittedAt },
    { label: "Editing", timestamp: order.editingClosedAt },
    { label: "Review Ready", timestamp: order.reviewReadyAt },
    { label: "Queued", timestamp: order.deliveryQueuedAt },
    { label: "Delivered", timestamp: order.deliveredAt },
  ];
  const currentIndex = getCurrentLifecycleIndex(order.status);

  return stageTimestamps.map((stage, index) => ({
    ...stage,
    state: ["payment_failed", "cancelled", "refunded", "delivery_failed"].includes(order.status)
      ? index <= currentIndex
        ? "failed"
        : "future"
      : stage.timestamp
        ? "completed"
        : index === currentIndex
          ? "current"
          : "future",
  }));
}

function createKpis(
  orders: StoryOfUsAdminDashboardOrder[],
  nowIso: string,
  analytics: ReturnType<typeof calculateStoryOfUsFinancialSummary>,
  commissionConfig: StoryOfUsCommissionConfig,
) {
  const todayStart = getStoryOfUsPeriodStart("today", new Date(nowIso)).toISOString();
  const todayOrders = orders.filter((order) => order.paidAt && order.paidAt >= todayStart);
  const todayAnalytics = calculateStoryOfUsFinancialSummary({
    orders: todayOrders.map((order) => ({
      amount: order.paymentAmount,
      refundAmount: order.refundAmount ?? 0,
      isPaid: order.paymentStatus === "paid",
      isRefunded: order.refundStatus === "refunded",
      isFailedOrCancelled: ["failed", "cancelled"].includes(order.paymentStatus),
    })),
    commissionRate: commissionConfig.commissionRate,
    commissionVatRate: commissionConfig.commissionVatRate,
  });
  const unavailableDetail = commissionConfig.message ?? "Commission rate not configured";

  return [
    {
      label: "Today's Gross Revenue",
      value: money(todayAnalytics.grossRevenue),
      detail: "Paid today",
    },
    {
      label: "Today's Estimated Net Revenue",
      value: moneyOrUnavailable(todayAnalytics.estimatedNetRevenue),
      detail: todayAnalytics.estimatedNetRevenue === null ? unavailableDetail : "Estimated fees",
    },
    {
      label: "Paid Orders",
      value: String(orders.filter((order) => order.paymentStatus === "paid").length),
      detail: "All time",
    },
    {
      label: "Payment Pending",
      value: String(orders.filter((order) => order.status === "payment_pending").length),
      detail: "Checkout created",
    },
    {
      label: "Setup Pending",
      value: String(orders.filter((order) => order.status === "setup_pending").length),
      detail: "Paid, not submitted",
    },
    {
      label: "Editing",
      value: String(orders.filter((order) => order.status === "editing").length),
      detail: "Edit window open",
    },
    {
      label: "Review Ready",
      value: String(orders.filter((order) => order.status === "review_ready").length),
      detail: "Needs admin review",
    },
    {
      label: "Queued for Delivery",
      value: String(orders.filter((order) => order.status === "queued_for_delivery").length),
      detail: "Publishing/email in progress",
    },
    {
      label: "Delivered Today",
      value: String(
        orders.filter((order) => order.deliveredAt && order.deliveredAt >= todayStart).length,
      ),
      detail: "Final site delivered",
    },
    {
      label: "Refund Requests",
      value: String(orders.filter((order) => order.status === "refund_requested").length),
      detail: "Awaiting decision",
    },
    {
      label: "Period Gross Revenue",
      value: money(analytics.grossRevenue),
      detail: "Selected period",
    },
  ];
}

function createRevenueSeries(
  orders: StoryOfUsAdminDashboardOrder[],
  period: string,
  commissionConfig: StoryOfUsCommissionConfig,
) {
  const groups = new Map<string, StoryOfUsAdminDashboardOrder[]>();

  for (const order of orders) {
    const key = getRevenueBucket(order.paidAt ?? order.createdAt, period);

    if (!key) {
      continue;
    }

    groups.set(key, [...(groups.get(key) ?? []), order]);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, groupedOrders]) => {
      const summary = calculateStoryOfUsFinancialSummary({
        orders: groupedOrders.map((order) => ({
          amount: order.paymentAmount,
          refundAmount: order.refundAmount ?? 0,
          isPaid: order.paymentStatus === "paid",
          isRefunded: order.refundStatus === "refunded",
          isFailedOrCancelled: ["failed", "cancelled"].includes(order.paymentStatus),
        })),
        ...commissionConfig,
      });

      return {
        label,
        grossRevenue: summary.grossRevenue,
        estimatedNetRevenue: summary.estimatedNetRevenue,
      };
    });
}

function createActionItems(orders: StoryOfUsAdminDashboardOrder[]): StoryOfUsAdminActionItem[] {
  return orders
    .flatMap((order): StoryOfUsAdminActionItem[] => {
      const items: StoryOfUsAdminActionItem[] = [];

      if (order.deliveryDeadline && ["urgent", "overdue"].includes(order.deliveryUrgency)) {
        items.push({
          id: `${order.id}:deadline`,
          orderId: order.id,
          orderReference: order.orderReference,
          title:
            order.deliveryUrgency === "overdue"
              ? "Delivery deadline exceeded"
              : "Delivery deadline under 3 hours",
          description: order.timeRemaining,
          urgency: order.deliveryUrgency,
          statusLabel: order.statusLabel,
        });
      }

      if (order.status === "review_ready") {
        items.push({
          id: `${order.id}:review`,
          orderId: order.id,
          orderReference: order.orderReference,
          title: "Order ready for review",
          description: "Open the preview and decide whether to queue delivery.",
          urgency: order.deliveryUrgency === "normal" ? "warning" : order.deliveryUrgency,
          statusLabel: order.statusLabel,
        });
      }

      if (order.status === "refund_requested") {
        items.push({
          id: `${order.id}:refund`,
          orderId: order.id,
          orderReference: order.orderReference,
          title: "Refund request waiting",
          description: "Review refund details before the order progresses.",
          urgency: "urgent",
          statusLabel: order.statusLabel,
        });
      }

      if (order.finalEmailStatus === "dead") {
        items.push({
          id: `${order.id}:email`,
          orderId: order.id,
          orderReference: order.orderReference,
          title: "Final email failed",
          description: "Delivery email is dead in the outbox.",
          urgency: "urgent",
          statusLabel: order.statusLabel,
        });
      }

      if (order.status === "payment_pending") {
        items.push({
          id: `${order.id}:payment`,
          orderId: order.id,
          orderReference: order.orderReference,
          title: "Payment still pending",
          description: "Checkout exists but payment has not completed.",
          urgency: "normal",
          statusLabel: order.statusLabel,
        });
      }

      if (order.status === "setup_pending") {
        items.push({
          id: `${order.id}:setup`,
          orderId: order.id,
          orderReference: order.orderReference,
          title: "Setup not submitted",
          description: "Customer can access setup but has not submitted it.",
          urgency: "normal",
          statusLabel: order.statusLabel,
        });
      }

      return items;
    })
    .sort((left, right) => urgencyRank(left.urgency) - urgencyRank(right.urgency))
    .slice(0, 12);
}

function filterOrders(orders: StoryOfUsAdminDashboardOrder[], query: string, filter: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedFilter = filter.trim();

  return orders.filter((order) => {
    const matchesFilter =
      normalizedFilter === "" ||
      normalizedFilter === "all" ||
      order.status === normalizedFilter ||
      order.paymentStatus === normalizedFilter ||
      order.refundStatus === normalizedFilter ||
      (normalizedFilter === "overdue" && order.deliveryUrgency === "overdue");

    if (!matchesFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.trackingCode,
      order.id,
      order.orderReference,
      order.shopierOrderCode,
      order.shopierPaymentReference,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

function sortOrders(orders: StoryOfUsAdminDashboardOrder[], sort: string) {
  const sorted = [...orders];

  switch (sort) {
    case "oldest":
      return sorted.sort((left, right) => compareNullableDates(left.createdAt, right.createdAt));
    case "deadline":
      return sorted.sort((left, right) =>
        compareNullableDates(left.deliveryDeadline, right.deliveryDeadline),
      );
    case "updated":
      return sorted.sort((left, right) => compareNullableDates(right.updatedAt, left.updatedAt));
    case "status":
      return sorted.sort((left, right) => left.statusLabel.localeCompare(right.statusLabel));
    case "revenue":
      return sorted.sort((left, right) => right.paymentAmount - left.paymentAmount);
    default:
      return sorted.sort((left, right) => compareNullableDates(right.createdAt, left.createdAt));
  }
}

function groupOutboxBySubmission(rows: Array<Record<string, unknown>>) {
  const grouped = new Map<string, Array<Record<string, unknown>>>();

  for (const row of rows) {
    const submissionId = stringValue(row.submission_id);
    grouped.set(submissionId, [...(grouped.get(submissionId) ?? []), row]);
  }

  return grouped;
}

function getFinalEmailStatus(
  rows: Array<Record<string, unknown>> | StoryOfUsAdminDetail["emailOutbox"],
) {
  const finalEmail = rows.find((row) =>
    "emailType" in row
      ? row.emailType === "final_site_ready"
      : stringValue(row.email_type) === "final_site_ready",
  );

  if (!finalEmail) {
    return null;
  }

  return "status" in finalEmail
    ? stringValue(finalEmail.status)
    : stringValue((finalEmail as Record<string, unknown>).status);
}

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function getRefundStatusLabel(status: string) {
  switch (status) {
    case "requested":
      return "Requested";
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "processing":
      return "Processing";
    case "refunded":
      return "Refunded";
    case "failed":
      return "Failed";
    case "rejected":
      return "Rejected";
    default:
      return "None";
  }
}

function getCurrentLifecycleIndex(status: StoryOfUsAdminStatus) {
  switch (status) {
    case "checkout_submitted":
    case "payment_pending":
    case "checkout_abandoned":
      return 0;
    case "paid":
    case "setup_pending":
    case "payment_failed":
      return 1;
    case "setup_submitted":
    case "editing":
      return 3;
    case "review_ready":
    case "refund_requested":
    case "refund_approved":
      return 4;
    case "queued_for_delivery":
    case "delivery_failed":
      return 5;
    case "delivered":
    case "refunded":
    case "cancelled":
      return 6;
    default:
      return 0;
  }
}

function getRevenueBucket(value: string | null, period: string) {
  const date = value ? new Date(value) : null;

  if (!date || !Number.isFinite(date.getTime())) {
    return null;
  }

  if (period === "today") {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  if (period === "6m" || period === "year") {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getCommissionConfig(): StoryOfUsCommissionConfig {
  const commissionRate = parseRate(process.env.STORYOFUS_SHOPIER_COMMISSION_RATE);
  const commissionVatRate = parseRate(process.env.STORYOFUS_SHOPIER_COMMISSION_VAT_RATE);
  const configured = commissionRate !== null && commissionVatRate !== null;

  return {
    configured,
    commissionRate: configured ? commissionRate : null,
    commissionVatRate: configured ? commissionVatRate : null,
    message: configured ? null : "Commission rate not configured",
  };
}

function normalizePeriod(value = "") {
  return ["today", "7d", "30d", "6m", "year"].includes(value) ? value : "30d";
}

function urgencyRank(urgency: StoryOfUsAdminUrgency) {
  return urgency === "overdue" ? 0 : urgency === "urgent" ? 1 : urgency === "warning" ? 2 : 3;
}

function parseRate(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : null;
}

function compareNullableDates(left: string | null, right: string | null) {
  const leftTime = left ? new Date(left).getTime() : Number.POSITIVE_INFINITY;
  const rightTime = right ? new Date(right).getTime() : Number.POSITIVE_INFINITY;

  return leftTime - rightTime;
}

function isPast(value: string | null, nowIso: string) {
  return Boolean(value && new Date(value).getTime() <= new Date(nowIso).getTime());
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function moneyOrUnavailable(value: number | null) {
  return value === null ? "Unavailable" : money(value);
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
