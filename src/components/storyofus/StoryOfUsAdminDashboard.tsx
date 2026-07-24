import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  MailWarning,
  PackageCheck,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { StoryOfUsExperience } from "@/components/storyofus/StoryOfUsExperience";
import { createStoryOfUsExperienceDataFromFinalSite } from "@/components/storyofus/storyOfUsExperienceAdapter";
import {
  getStoryOfUsAdminFinalSitePreview,
  type StoryOfUsFinalSiteData,
  verifyStoryOfUsAdminPreviewPasscode,
} from "@/lib/storyofus/finalSite.server";
import {
  getStoryOfUsAdminDashboard,
  getStoryOfUsAdminDashboardOrderDetail,
  queueStoryOfUsFinalSiteDelivery,
  type StoryOfUsAdminActionItem,
  type StoryOfUsAdminDashboardOrder,
  type StoryOfUsAdminDetail,
  type StoryOfUsAdminOverview,
} from "@/lib/storyofus/storyOfUsAdminDashboard.server";

type StoryOfUsAdminView =
  "overview" | "orders" | "detail" | "previews" | "refunds" | "analytics" | "settings";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "6m", label: "Last 6 Months" },
  { value: "year", label: "This Year" },
];

const FILTERS = [
  ["all", "All"],
  ["payment_pending", "Payment Pending"],
  ["setup_pending", "Setup Pending"],
  ["editing", "Editing"],
  ["review_ready", "Review Ready"],
  ["queued_for_delivery", "Queued"],
  ["delivered", "Delivered"],
  ["refund_requested", "Refund Requested"],
  ["refunded", "Refunded"],
  ["payment_failed", "Failed"],
  ["overdue", "Overdue"],
] as const;

const SORTS = [
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["deadline", "Delivery Deadline"],
  ["updated", "Last Updated"],
  ["status", "Status"],
  ["revenue", "Revenue"],
] as const;

export function StoryOfUsAdminDashboard({
  view,
  orderId,
}: {
  view: StoryOfUsAdminView;
  orderId?: string;
}) {
  const loadDashboard = useServerFn(getStoryOfUsAdminDashboard);
  const loadDetail = useServerFn(getStoryOfUsAdminDashboardOrderDetail);
  const loadPreview = useServerFn(getStoryOfUsAdminFinalSitePreview);
  const verifyPreviewPasscode = useServerFn(verifyStoryOfUsAdminPreviewPasscode);
  const queueFinalSiteDelivery = useServerFn(queueStoryOfUsFinalSiteDelivery);

  const [period, setPeriod] = useState("30d");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [dashboard, setDashboard] = useState<StoryOfUsAdminOverview | null>(null);
  const [detail, setDetail] = useState<StoryOfUsAdminDetail | null>(null);
  const [previewSite, setPreviewSite] = useState<StoryOfUsFinalSiteData | null>(null);
  const [previewSubmissionId, setPreviewSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [queueing, setQueueing] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function reloadDashboard() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await loadDashboard({
        data: {
          period,
          search,
          filter,
          sort,
        },
      });
      setDashboard(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Dashboard data could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function reloadDetail(id: string) {
    setDetailLoading(true);
    setDetail(null);

    try {
      const result = await loadDetail({ data: { orderId: id } });

      if (result.status === "found") {
        setDetail(result.order);
      } else {
        setErrorMessage("Order not found.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Order detail could not be loaded.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function openPreview(id: string) {
    setPreviewLoading(id);
    setPreviewSite(null);
    setPreviewSubmissionId(null);

    try {
      const result = await loadPreview({ data: { submissionId: id } });

      if (result.status === "found") {
        setPreviewSite(result.site);
        setPreviewSubmissionId(id);
      } else {
        toast.error("Preview is not available for this order.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview could not be loaded.");
    } finally {
      setPreviewLoading(null);
    }
  }

  async function queueDelivery(id: string) {
    const confirmed = window.confirm(
      "Queue delivery for this order? This protected action stores the order in the delivery queue. The worker will publish the final site and queue the customer email.",
    );

    if (!confirmed) {
      return;
    }

    setQueueing(id);

    try {
      const result = await queueFinalSiteDelivery({ data: { orderId: id } });

      if (result.status === "queued" || result.status === "already_queued") {
        toast.success(result.message);
        await reloadDashboard();
        if (orderId === id) {
          await reloadDetail(id);
        }
      } else {
        toast.error(result.message || "This order cannot be queued for delivery.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delivery could not be queued.");
    } finally {
      setQueueing(null);
    }
  }

  useEffect(() => {
    reloadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, search, filter, sort]);

  useEffect(() => {
    if (view === "detail" && orderId) {
      reloadDetail(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, orderId]);

  const previewOrders = useMemo(
    () =>
      dashboard?.orders.filter((order) =>
        ["review_ready", "queued_for_delivery", "delivered"].includes(order.status),
      ) ?? [],
    [dashboard],
  );
  const refundOrders = useMemo(
    () => dashboard?.orders.filter((order) => order.refundStatus !== "none") ?? [],
    [dashboard],
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <Header view={view} onRefresh={reloadDashboard} loading={loading} />

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {loading && !dashboard ? (
          <EmptyState>Loading StoryOfUs operations...</EmptyState>
        ) : dashboard ? (
          <>
            {view === "overview" && (
              <OverviewView
                dashboard={dashboard}
                period={period}
                onPeriodChange={setPeriod}
                onOpenPreview={openPreview}
                onQueueDelivery={queueDelivery}
                previewLoading={previewLoading}
                queueing={queueing}
              />
            )}
            {view === "orders" && (
              <OrdersView
                orders={dashboard.orders}
                search={search}
                filter={filter}
                sort={sort}
                onSearchChange={setSearch}
                onFilterChange={setFilter}
                onSortChange={setSort}
              />
            )}
            {view === "detail" && (
              <OrderDetailView
                detail={detail}
                loading={detailLoading}
                previewLoading={previewLoading}
                queueing={queueing}
                onOpenPreview={openPreview}
                onQueueDelivery={queueDelivery}
              />
            )}
            {view === "previews" && (
              <PreviewPagesView
                orders={previewOrders}
                onOpenPreview={openPreview}
                onQueueDelivery={queueDelivery}
                previewLoading={previewLoading}
                queueing={queueing}
              />
            )}
            {view === "refunds" && <RefundsView orders={refundOrders} />}
            {view === "analytics" && (
              <AnalyticsView dashboard={dashboard} period={period} onPeriodChange={setPeriod} />
            )}
            {view === "settings" && <SettingsView dashboard={dashboard} />}
          </>
        ) : null}
      </div>

      {previewSite && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Admin preview
                </p>
                <p className="text-sm font-semibold text-slate-950">
                  This is an admin-only preview. The site is not opened to the customer by
                  previewing it.
                </p>
                {!previewSite.loveLetterPhoto?.previewUrl && (
                  <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Required love-letter photo is missing. Do not queue delivery until it is fixed.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewSite(null);
                  setPreviewSubmissionId(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close preview
              </button>
            </div>
            <StoryOfUsExperience
              story={createStoryOfUsExperienceDataFromFinalSite(previewSite)}
              accessPinHint={previewSite.passcodeHint}
              verifyAccessPin={async (passcode) => {
                const result = await verifyPreviewPasscode({
                  data: {
                    submissionId: previewSubmissionId ?? "",
                    passcode,
                  },
                });

                return result.status === "unlocked";
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function Header({
  view,
  loading,
  onRefresh,
}: {
  view: StoryOfUsAdminView;
  loading: boolean;
  onRefresh: () => void;
}) {
  const titles: Record<StoryOfUsAdminView, { title: string; subtitle: string }> = {
    overview: {
      title: "Overview",
      subtitle: "Revenue, lifecycle health, and urgent StoryOfUs operations.",
    },
    orders: {
      title: "Orders",
      subtitle: "Search, filter, and inspect every checkout-created StoryOfUs order.",
    },
    detail: {
      title: "Order Details",
      subtitle: "Single-order lifecycle, payment, editing, delivery, and refund context.",
    },
    previews: {
      title: "Preview Pages",
      subtitle: "Review eligible final-site previews before delivery.",
    },
    refunds: {
      title: "Refunds",
      subtitle: "Read-only refund queue and customer refund history.",
    },
    analytics: {
      title: "Analytics",
      subtitle: "Financial reporting based on stored paid orders and refund data.",
    },
    settings: {
      title: "Settings",
      subtitle: "Operational configuration visibility for the pilot.",
    },
  };

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 pt-10 lg:flex-row lg:items-end lg:justify-between lg:pt-0">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
          StoryOfUs Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {titles[view].title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{titles[view].subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}

function OverviewView({
  dashboard,
  period,
  onPeriodChange,
  onOpenPreview,
  onQueueDelivery,
  previewLoading,
  queueing,
}: {
  dashboard: StoryOfUsAdminOverview;
  period: string;
  onPeriodChange: (period: string) => void;
  onOpenPreview: (id: string) => void;
  onQueueDelivery: (id: string) => void;
  previewLoading: string | null;
  queueing: string | null;
}) {
  return (
    <div className="space-y-6">
      <KpiGrid kpis={dashboard.kpis.slice(0, 10)} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <Panel className="min-h-[420px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Revenue</h2>
              <p className="text-sm text-slate-500">
                Gross and estimated net revenue by selected period.
              </p>
            </div>
            <SegmentedControl value={period} options={PERIODS} onChange={onPeriodChange} />
          </div>
          <RevenueChart data={dashboard.revenueSeries} />
        </Panel>
        <ActionNeededPanel actions={dashboard.actions} />
      </div>
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Orders needing review</h2>
            <p className="text-sm text-slate-500">Fast access to review-ready and urgent orders.</p>
          </div>
          <Link
            to="/admin/storyofus-orders/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <OrderTable
          orders={dashboard.orders.slice(0, 8)}
          onOpenPreview={onOpenPreview}
          onQueueDelivery={onQueueDelivery}
          previewLoading={previewLoading}
          queueing={queueing}
        />
      </Panel>
    </div>
  );
}

function OrdersView({
  orders,
  search,
  filter,
  sort,
  onSearchChange,
  onFilterChange,
  onSortChange,
}: {
  orders: StoryOfUsAdminDashboardOrder[];
  search: string;
  filter: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
}) {
  return (
    <Panel>
      <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(280px,1fr)_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            aria-label="Search orders"
          />
        </div>
        <Select value={filter} onChange={onFilterChange} label="Filter" options={FILTERS} />
        <Select value={sort} onChange={onSortChange} label="Sort" options={SORTS} />
      </div>
      <OrderTable orders={orders} />
    </Panel>
  );
}

function OrderDetailView({
  detail,
  loading,
  previewLoading,
  queueing,
  onOpenPreview,
  onQueueDelivery,
}: {
  detail: StoryOfUsAdminDetail | null;
  loading: boolean;
  previewLoading: string | null;
  queueing: string | null;
  onOpenPreview: (id: string) => void;
  onQueueDelivery: (id: string) => void;
}) {
  if (loading) {
    return <EmptyState>Loading order detail...</EmptyState>;
  }

  if (!detail) {
    return <EmptyState>Select an order to inspect.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <Panel>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={detail.statusLabel} urgency={detail.deliveryUrgency} />
              <span className="text-sm font-semibold text-slate-500">
                {detail.paymentStatusLabel}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">{detail.customerName}</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
              <CopyValue label="Tracking ID" value={detail.trackingCode} />
              <CopyValue label="Shopier Order Code" value={detail.shopierOrderCode} />
              <CopyValue label="Internal ID" value={detail.id} />
              <CopyValue label="Order Reference" value={detail.orderReference} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:w-64 xl:grid-cols-1">
            <button
              type="button"
              onClick={() => onOpenPreview(detail.id)}
              disabled={previewLoading === detail.id}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Eye className="h-4 w-4" />
              {previewLoading === detail.id ? "Opening..." : "Open Preview"}
            </button>
            <QueueButton order={detail} queueing={queueing} onQueueDelivery={onQueueDelivery} />
          </div>
        </div>
      </Panel>

      <LifecycleTimeline detail={detail} />

      <div className="grid gap-6 xl:grid-cols-2">
        <InfoPanel title="Customer Information">
          <CopyValue label="Full name" value={detail.customerName} />
          <CopyValue label="Email" value={detail.customerEmail} />
          <CopyValue label="Phone" value={detail.customerPhone} />
          <InfoRow label="Checkout submitted" value={formatDateTime(detail.createdAt)} />
          <InfoRow label="Last updated" value={formatDateTime(detail.updatedAt)} />
        </InfoPanel>

        <InfoPanel title="Payment Information">
          <InfoRow label="Payment status" value={detail.paymentStatusLabel} />
          <InfoRow
            label="Paid amount"
            value={`${detail.paymentAmount} ${detail.paymentCurrency}`}
          />
          <InfoRow label="Payment completed" value={formatDateTime(detail.paidAt)} />
          <CopyValue label="Shopier payment reference" value={detail.shopierPaymentReference} />
          <CopyValue label="Provider event ID" value={detail.paymentProviderEventId} />
          <InfoRow label="Payment error" value={detail.paymentError || "-"} />
        </InfoPanel>

        <InfoPanel title="Setup and Editing">
          <InfoRow label="Setup submitted" value={formatDateTime(detail.submittedAt)} />
          <InfoRow label="Editing ended" value={formatDateTime(detail.editingClosedAt)} />
          <InfoRow label="Edit count" value={detail.editCountLabel} />
          <InfoRow label="Refund deadline" value={formatDateTime(detail.refundRequestUntil)} />
          <InfoRow label="Review-ready time" value={formatDateTime(detail.reviewReadyAt)} />
          <InfoRow label="Finalization status" value={detail.statusLabel} />
        </InfoPanel>

        <InfoPanel title="Delivery Deadline">
          <InfoRow label="Editing ended" value={formatDateTime(detail.editingClosedAt)} />
          <InfoRow label="Delivery deadline" value={formatDateTime(detail.deliveryDeadline)} />
          <InfoRow label="Time remaining" value={detail.timeRemaining} />
          <InfoRow label="Urgency" value={capitalize(detail.deliveryUrgency)} />
          <InfoRow label="Final site URL" value={detail.finalSiteUrl ?? "-"} />
        </InfoPanel>

        <InfoPanel title="Refund Information">
          <InfoRow label="Refund status" value={detail.refundStatusLabel} />
          <InfoRow label="Refund requested" value={formatDateTime(detail.refundRequestedAt)} />
          <InfoRow label="Refund decided" value={formatDateTime(detail.refundDecidedAt)} />
          <InfoRow label="Refunded at" value={formatDateTime(detail.refundedAt)} />
          <InfoRow
            label="Refunded amount"
            value={
              detail.refundAmount
                ? `${detail.refundAmount} ${detail.refundCurrency || detail.paymentCurrency}`
                : "-"
            }
          />
          <InfoRow label="Reason" value={detail.refundReason || "-"} />
        </InfoPanel>

        <InfoPanel title="Technical Event Log">
          {detail.emailOutbox.length === 0 ? (
            <InfoRow label="Email outbox" value="No email rows found" />
          ) : (
            detail.emailOutbox.map((email) => (
              <InfoRow
                key={`${email.emailType}:${email.queuedAt}`}
                label={email.emailType}
                value={`${email.status} · queued ${formatDateTime(email.queuedAt)}${email.lastErrorCode ? ` · ${email.lastErrorCode}` : ""}`}
              />
            ))
          )}
        </InfoPanel>
      </div>
    </div>
  );
}

function PreviewPagesView({
  orders,
  previewLoading,
  queueing,
  onOpenPreview,
  onQueueDelivery,
}: {
  orders: StoryOfUsAdminDashboardOrder[];
  previewLoading: string | null;
  queueing: string | null;
  onOpenPreview: (id: string) => void;
  onQueueDelivery: (id: string) => void;
}) {
  return (
    <Panel>
      <OrderTable
        orders={orders}
        onOpenPreview={onOpenPreview}
        onQueueDelivery={onQueueDelivery}
        previewLoading={previewLoading}
        queueing={queueing}
        previewMode
      />
    </Panel>
  );
}

function RefundsView({ orders }: { orders: StoryOfUsAdminDashboardOrder[] }) {
  return (
    <Panel>
      {orders.length === 0 ? (
        <EmptyState>No refund activity yet.</EmptyState>
      ) : (
        <OrderTable orders={orders} />
      )}
    </Panel>
  );
}

function AnalyticsView({
  dashboard,
  period,
  onPeriodChange,
}: {
  dashboard: StoryOfUsAdminOverview;
  period: string;
  onPeriodChange: (period: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Financial Reporting</h2>
            <p className="text-sm text-slate-500">
              Estimated Shopier commission uses server-side configuration. Values are labeled
              estimated when processor-level fee data is not stored.
            </p>
          </div>
          <SegmentedControl value={period} options={PERIODS} onChange={onPeriodChange} />
        </div>
        <KpiGrid
          kpis={[
            {
              label: "Gross Revenue",
              value: money(dashboard.analytics.grossRevenue),
              detail: "Paid, non-refunded orders",
            },
            {
              label: "Paid Order Count",
              value: String(dashboard.analytics.paidOrderCount),
              detail: "Selected period",
            },
            {
              label: "Average Order Value",
              value: money(dashboard.analytics.averageOrderValue),
              detail: "Gross / paid count",
            },
            {
              label: "Estimated Shopier Commission",
              value: moneyOrUnavailable(dashboard.analytics.estimatedCommission),
              detail: dashboard.commissionConfig.configured
                ? `${formatPercent(dashboard.commissionConfig.commissionRate)} rate`
                : "Commission rate not configured",
            },
            {
              label: "Commission VAT",
              value: moneyOrUnavailable(dashboard.analytics.commissionVat),
              detail: dashboard.commissionConfig.configured
                ? `${formatPercent(dashboard.commissionConfig.commissionVatRate)} VAT`
                : "Commission rate not configured",
            },
            {
              label: "Estimated Net Revenue",
              value: moneyOrUnavailable(dashboard.analytics.estimatedNetRevenue),
              detail: dashboard.commissionConfig.configured
                ? "After estimated fees"
                : "Commission rate not configured",
            },
            {
              label: "Refund Total",
              value: money(dashboard.analytics.refundTotal),
              detail: "Refunded orders",
            },
            {
              label: "Net Revenue After Refunds",
              value: moneyOrUnavailable(dashboard.analytics.netRevenueAfterRefunds),
              detail: dashboard.commissionConfig.configured
                ? "Estimated net - refunds"
                : "Commission rate not configured",
            },
            {
              label: "Delivered Order Count",
              value: String(dashboard.analytics.deliveredOrderCount),
              detail: "Published final sites",
            },
            {
              label: "Checkout to Paid",
              value: `${dashboard.analytics.checkoutToPaidConversion}%`,
              detail: "All-time conversion",
            },
          ]}
        />
      </Panel>
      <Panel className="min-h-[380px]">
        <RevenueChart data={dashboard.revenueSeries} />
      </Panel>
    </div>
  );
}

function SettingsView({ dashboard }: { dashboard: StoryOfUsAdminOverview }) {
  return (
    <Panel>
      <h2 className="text-lg font-bold text-slate-950">Settings</h2>
      <p className="mt-1 text-sm text-slate-500">
        Production controls remain intentionally narrow for the pilot. Configure secrets and payment
        settings in the deployment environment.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoRow label="Commission rate env" value="STORYOFUS_SHOPIER_COMMISSION_RATE" />
        <InfoRow label="Commission VAT env" value="STORYOFUS_SHOPIER_COMMISSION_VAT_RATE" />
        <InfoRow
          label="Current commission rate"
          value={
            dashboard.commissionConfig.configured
              ? formatPercent(dashboard.commissionConfig.commissionRate)
              : "Commission rate not configured"
          }
        />
        <InfoRow
          label="Current commission VAT"
          value={
            dashboard.commissionConfig.configured
              ? formatPercent(dashboard.commissionConfig.commissionVatRate)
              : "Commission rate not configured"
          }
        />
      </div>
    </Panel>
  );
}

function KpiGrid({ kpis }: { kpis: Array<{ label: string; value: string; detail: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {kpi.label}
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{kpi.value}</p>
          <p className="mt-1 text-xs text-slate-500">{kpi.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ActionNeededPanel({ actions }: { actions: StoryOfUsAdminActionItem[] }) {
  return (
    <Panel className="xl:sticky xl:top-6 xl:self-start">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">Action Needed</h2>
        <p className="text-sm text-slate-500">Sorted by operational urgency.</p>
      </div>
      {actions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No urgent actions right now.
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <Link
              key={action.id}
              to="/admin/storyofus-orders/orders/$orderId"
              params={{ orderId: action.orderId }}
              className="block rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex gap-3">
                <UrgencyIcon urgency={action.urgency} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-950">{action.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                      {action.urgency}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                  <p className="mt-2 font-mono text-xs font-semibold text-blue-700">
                    {action.orderReference}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

function OrderTable({
  orders,
  previewLoading,
  queueing,
  previewMode = false,
  onOpenPreview,
  onQueueDelivery,
}: {
  orders: StoryOfUsAdminDashboardOrder[];
  previewLoading?: string | null;
  queueing?: string | null;
  previewMode?: boolean;
  onOpenPreview?: (id: string) => void;
  onQueueDelivery?: (id: string) => void;
}) {
  if (orders.length === 0) {
    return <EmptyState>No orders match this view.</EmptyState>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-500">
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Customer</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Tracking ID</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">
              Shopier Order Code
            </th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Current Status</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Payment</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Edit Count</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Delivery Deadline</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Last Updated</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="align-top">
              <td className="border-b border-slate-100 px-3 py-4">
                <p className="font-semibold text-slate-950">{order.customerName}</p>
                <p className="text-xs text-slate-500">{order.customerEmail}</p>
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <CopyInline value={order.trackingCode} />
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <CopyInline value={order.shopierOrderCode || order.orderReference} />
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <StatusPill status={order.statusLabel} urgency={order.deliveryUrgency} />
              </td>
              <td className="border-b border-slate-100 px-3 py-4">{order.paymentStatusLabel}</td>
              <td className="border-b border-slate-100 px-3 py-4">{order.editCountLabel}</td>
              <td className="border-b border-slate-100 px-3 py-4">
                <p className="font-medium text-slate-950">
                  {formatDateTime(order.deliveryDeadline)}
                </p>
                <p className="text-xs text-slate-500">{order.timeRemaining}</p>
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                {formatDateTime(order.updatedAt)}
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/admin/storyofus-orders/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white"
                  >
                    View Order
                  </Link>
                  {(previewMode ||
                    order.status === "review_ready" ||
                    order.status === "delivered") &&
                    onOpenPreview && (
                      <button
                        type="button"
                        onClick={() => onOpenPreview(order.id)}
                        disabled={previewLoading === order.id}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                      >
                        {previewLoading === order.id ? "Opening" : "Open Preview"}
                      </button>
                    )}
                  {order.status === "review_ready" && onQueueDelivery && (
                    <button
                      type="button"
                      onClick={() => onQueueDelivery(order.id)}
                      disabled={queueing === order.id}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {queueing === order.id ? "Queueing" : "Queue Delivery"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LifecycleTimeline({ detail }: { detail: StoryOfUsAdminDetail }) {
  return (
    <Panel>
      <h2 className="mb-5 text-lg font-bold text-slate-950">Lifecycle Progress</h2>
      <div className="grid gap-4 md:grid-cols-7">
        {detail.lifecycle.map((stage, index) => (
          <div key={stage.label} className="relative min-w-0">
            {index < detail.lifecycle.length - 1 && (
              <div className="absolute left-5 top-5 hidden h-px w-full bg-slate-200 md:block" />
            )}
            <div className="relative z-10 flex gap-3 md:block">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 ${
                  stage.state === "completed"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : stage.state === "current"
                      ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100"
                      : stage.state === "failed"
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {stage.state === "failed" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 md:mt-3">
                <p className="text-sm font-bold text-slate-950">{stage.label}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateParts(stage.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RevenueChart({
  data,
}: {
  data: Array<{ label: string; grossRevenue: number; estimatedNetRevenue: number | null }>;
}) {
  return (
    <div className="mt-6 h-[330px]">
      {data.length === 0 ? (
        <EmptyState>No paid revenue in this period.</EmptyState>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grossRevenue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="grossRevenue"
              name="Gross Revenue"
              stroke="#2563eb"
              fill="url(#grossRevenue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="estimatedNetRevenue"
              name="Estimated Net Revenue"
              stroke="#0f172a"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function QueueButton({
  order,
  queueing,
  onQueueDelivery,
}: {
  order: StoryOfUsAdminDashboardOrder;
  queueing: string | null;
  onQueueDelivery: (id: string) => void;
}) {
  const disabled = order.status !== "review_ready" || queueing === order.id;

  return (
    <button
      type="button"
      onClick={() => onQueueDelivery(order.id)}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      <Send className="h-4 w-4" />
      {queueing === order.id
        ? "Queueing..."
        : order.status === "review_ready"
          ? "Queue Delivery"
          : order.statusLabel}
    </button>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel>
      <h3 className="mb-4 text-base font-bold text-slate-950">{title}</h3>
      <div className="space-y-3">{children}</div>
    </Panel>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] break-words text-right font-semibold text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <CopyInline value={value || "-"} />
    </div>
  );
}

function CopyInline({ value }: { value: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
      <span className="truncate">{value || "-"}</span>
      {value && value !== "-" && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            toast.success("Copied");
          }}
          className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-white hover:text-slate-950"
          aria-label="Copy value"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

function StatusPill({ status, urgency }: { status: string; urgency: string }) {
  const className =
    urgency === "overdue"
      ? "border-red-200 bg-red-50 text-red-700"
      : urgency === "urgent"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-100 bg-blue-50 text-blue-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>
      {status}
    </span>
  );
}

function UrgencyIcon({ urgency }: { urgency: string }) {
  if (urgency === "overdue") {
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />;
  }

  if (urgency === "urgent") {
    return <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />;
  }

  if (urgency === "warning") {
    return <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />;
  }

  return <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />;
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            value === option.value
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
      {children}
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateParts(value: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Pending";
  }

  return `${date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}\n${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
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

function formatPercent(value: number | null) {
  return typeof value === "number" ? `${Math.round(value * 10000) / 100}%` : "Unavailable";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
