import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  ExternalLink,
  FileText,
  Heart,
  Image as ImageIcon,
  Music,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { StoryOfUsFinalSiteRenderer } from "@/components/storyofus/FinalSiteRenderer";
import {
  getStoryOfUsAdminFinalSitePreview,
  publishStoryOfUsFinalSite,
  type StoryOfUsFinalSiteData,
} from "@/lib/storyofus/finalSite.server";
import {
  getStoryOfUsAdminReviewDetail,
  listStoryOfUsAdminReviewQueue,
  type StoryOfUsAdminReviewDetail,
  type StoryOfUsAdminReviewOrder,
} from "@/lib/storyofus/reviewReady.server";

export const Route = createFileRoute("/admin/storyofus-orders")({
  ssr: false,
  component: StoryOfUsOrdersAdmin,
});

function StoryOfUsOrdersAdmin() {
  const loadQueue = useServerFn(listStoryOfUsAdminReviewQueue);
  const loadDetail = useServerFn(getStoryOfUsAdminReviewDetail);
  const loadPreview = useServerFn(getStoryOfUsAdminFinalSitePreview);
  const publishFinalSite = useServerFn(publishStoryOfUsFinalSite);

  const [orders, setOrders] = useState<StoryOfUsAdminReviewOrder[]>([]);
  const [activeSubmittedOrders, setActiveSubmittedOrders] = useState<StoryOfUsAdminReviewOrder[]>(
    [],
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StoryOfUsAdminReviewDetail | null>(null);
  const [previewSite, setPreviewSite] = useState<StoryOfUsFinalSiteData | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function reloadQueue() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await loadQueue();
      setOrders(result.inReviewOrders);
      setActiveSubmittedOrders(result.activeSubmittedOrders);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "StoryOfUs kuyruğu yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(orderId: string) {
    setSelectedOrderId(orderId);
    setSelectedDetail(null);
    setPreviewSite(null);
    setPublishedUrl(null);
    setDetailLoading(true);

    try {
      const result = await loadDetail({ data: { submissionId: orderId } });

      if (result.status === "found") {
        setSelectedDetail(result.order);
      } else {
        toast.error("Sipariş detayı bulunamadı.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sipariş detayı yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function openPreview(orderId: string) {
    setPreviewLoading(true);
    setPreviewSite(null);

    try {
      const result = await loadPreview({ data: { submissionId: orderId } });

      if (result.status === "found") {
        setPreviewSite(result.site);
      } else {
        toast.error("Önizleme yüklenemedi.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Önizleme yüklenemedi.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function publishSelectedOrder(orderId: string) {
    const confirmed = window.confirm(
      "Bu işlem kalıcı müşteri linkini oluşturur, siteyi müşteriye açar ve teslim e-postasını kuyruğa ekler. Devam edilsin mi?",
    );

    if (!confirmed) {
      return;
    }

    setPublishing(true);

    try {
      const result = await publishFinalSite({ data: { submissionId: orderId } });

      if (result.status === "published" || result.status === "already_published") {
        setPublishedUrl(result.finalSiteUrl);
        toast.success("Final site yayınlandı.");
        await reloadQueue();
        return;
      }

      toast.error(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Final site yayınlanamadı.");
    } finally {
      setPublishing(false);
    }
  }

  useEffect(() => {
    reloadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => filterOrders(orders, query), [orders, query]);
  const filteredActiveSubmittedOrders = useMemo(
    () => filterOrders(activeSubmittedOrders, query),
    [activeSubmittedOrders, query],
  );

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
            StoryOfUs Review
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground md:text-xl">
            İnceleme kuyruğu
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground md:text-sm">
            Düzenleme süresi biten ve manuel incelemeye hazır olan StoryOfUs kurulumlarını güvenli
            şekilde kontrol edin. Yayınlama ve final e-postası Phase 1B'de eklenecek.
          </p>
        </div>

        <button
          type="button"
          onClick={reloadQueue}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sipariş, takip kodu veya müşteri adı ara"
          className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm"
        />
      </div>

      {errorMessage ? (
        <EmptyState tone="error">{errorMessage}</EmptyState>
      ) : loading ? (
        <EmptyState>StoryOfUs siparişleri yükleniyor...</EmptyState>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <QueueSection
              title="İncelemeye hazır"
              description="Düzenleme süresi bitmiş ve inceleme durumuna alınmış siparişler."
              orders={filteredOrders}
              emptyText="Şu anda incelemeye hazır StoryOfUs siparişi yok."
              selectedOrderId={selectedOrderId}
              onOpenDetail={openDetail}
            />

            <QueueSection
              title="Düzenleme süresi devam edenler"
              description="Müşteri hâlâ düzenleme yapabilir. Bu siparişler yayınlama için hazır değildir."
              orders={filteredActiveSubmittedOrders}
              emptyText="Düzenleme süresi devam eden sipariş yok."
              selectedOrderId={selectedOrderId}
              onOpenDetail={openDetail}
              muted
            />
          </div>

          <DetailPanel
            detail={selectedDetail}
            loading={detailLoading}
            previewLoading={previewLoading}
            publishing={publishing}
            publishedUrl={publishedUrl}
            onOpenPreview={openPreview}
            onPublish={publishSelectedOrder}
          />
        </div>
      )}

      {previewSite && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-rose-950/45 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-white px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                  Yönetici önizlemesi
                </p>
                <p className="text-sm font-semibold text-rose-950">
                  Bu yalnızca yönetici önizlemesidir; site henüz müşteriye açılmadı.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSite(null)}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Önizlemeyi kapat
              </button>
            </div>
            <StoryOfUsFinalSiteRenderer site={previewSite} />
          </div>
        </div>
      )}
    </main>
  );
}

function QueueSection({
  title,
  description,
  orders,
  emptyText,
  selectedOrderId,
  onOpenDetail,
  muted = false,
}: {
  title: string;
  description: string;
  orders: StoryOfUsAdminReviewOrder[];
  emptyText: string;
  selectedOrderId: string | null;
  onOpenDetail: (orderId: string) => void;
  muted?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground md:text-base">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onOpenDetail(order.id)}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                selectedOrderId === order.id
                  ? "border-rose-300 bg-rose-50/80 shadow-sm"
                  : muted
                    ? "border-border bg-muted/30"
                    : "border-border bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-600">
                      {order.orderReference || "Referans yok"}
                    </span>
                    <StatusBadge label={order.statusLabel} muted={muted} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{order.customerName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.customerEmailMasked || "E-posta yok"} ·{" "}
                    {order.trackingCode || "Takip kodu yok"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                  <ImageIcon className="h-3 w-3" />
                  {order.mediaCount}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <TimeCell label="Gönderim" value={order.submittedAt} />
                <TimeCell label="Düzenleme sonu" value={order.editableUntil} />
                <TimeCell label="İnceleme hazır" value={order.reviewReadyAt} />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailPanel({
  detail,
  loading,
  previewLoading,
  publishing,
  publishedUrl,
  onOpenPreview,
  onPublish,
}: {
  detail: StoryOfUsAdminReviewDetail | null;
  loading: boolean;
  previewLoading: boolean;
  publishing: boolean;
  publishedUrl: string | null;
  onOpenPreview: (orderId: string) => void;
  onPublish: (orderId: string) => void;
}) {
  return (
    <aside className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
      {!detail && !loading ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          İncelemek için bir StoryOfUs siparişi seçin.
        </div>
      ) : loading ? (
        <div className="grid min-h-64 place-items-center text-sm text-muted-foreground">
          Detay yükleniyor...
        </div>
      ) : detail ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
              Sipariş detayı
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{detail.customerName}</h3>
            <p className="text-xs text-muted-foreground">
              {detail.orderReference || "Referans yok"} · {detail.trackingCode || "Takip kodu yok"}
            </p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-3">
            <button
              type="button"
              onClick={() => onOpenPreview(detail.id)}
              disabled={previewLoading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {previewLoading ? "Önizleme açılıyor..." : "Siteyi önizle"}
            </button>
            {detail.status === "in_review" ? (
              <button
                type="button"
                onClick={() => onPublish(detail.id)}
                disabled={publishing}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-500 px-4 text-xs font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:opacity-60"
              >
                <Heart className="h-3.5 w-3.5 fill-white" />
                {publishing ? "Yayınlanıyor..." : "Yayınla ve teslim e-postasını sıraya al"}
              </button>
            ) : (
              <p className="rounded-xl bg-white px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                Bu sipariş yayınlama için aktif durumda değil.
              </p>
            )}
            {publishedUrl && (
              <div className="rounded-xl bg-white p-3 text-xs">
                <p className="font-semibold text-rose-950">Final bağlantı oluşturuldu:</p>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-semibold text-rose-600 underline-offset-4 hover:underline"
                >
                  {publishedUrl}
                </a>
              </div>
            )}
          </div>

          <SummaryCard title="Müşteri & sipariş" icon={<Heart className="h-4 w-4" />}>
            <Info label="E-posta" value={detail.customerEmailMasked || "-"} />
            <Info label="Telefon" value={detail.contactPhoneMasked || "-"} />
            <Info label="Ödeme" value={detail.paymentStatusLabel} />
            <Info label="İade" value={detail.refundStatusLabel} />
            <Info label="Durum" value={detail.statusLabel} />
          </SummaryCard>

          <SummaryCard title="Çift bilgileri" icon={<FileText className="h-4 w-4" />}>
            {detail.coupleDetails ? (
              <>
                <Info label="Partner" value={detail.coupleDetails.partnerName || "-"} />
                <Info label="Görünen isim" value={detail.coupleDetails.coupleDisplayName || "-"} />
                <Info
                  label="İlişki tarihi"
                  value={formatDateTime(detail.coupleDetails.relationshipStartDate)}
                />
                <Info label="Tarih etiketi" value={detail.coupleDetails.specialDateLabel || "-"} />
                <Info label="Hitap" value={detail.coupleDetails.recipientNickname || "-"} />
                <Paragraph label="Hikaye" value={detail.coupleDetails.relationshipStory} />
              </>
            ) : (
              <Muted>Çift bilgisi bulunamadı.</Muted>
            )}
          </SummaryCard>

          <SummaryCard title="Müzik" icon={<Music className="h-4 w-4" />}>
            {detail.music ? (
              <>
                <Info label="Şarkı" value={detail.music.songTitle || "-"} />
                <Info label="Sanatçı" value={detail.music.artistName || "-"} />
                <Info label="Başlangıç" value={`${detail.music.startAtSeconds} sn`} />
                <Paragraph label="Spotify URL" value={detail.music.spotifyUrl} />
              </>
            ) : (
              <Muted>Müzik bilgisi yok.</Muted>
            )}
          </SummaryCard>

          <SummaryCard
            title={`Medya (${detail.media.length})`}
            icon={<ImageIcon className="h-4 w-4" />}
          >
            {detail.media.length === 0 ? (
              <Muted>Medya dosyası yok.</Muted>
            ) : (
              <div className="grid gap-3">
                {detail.media.map((media) => (
                  <div key={media.id} className="rounded-2xl border border-border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {getMediaLabel(media.section, media.mediaType)}
                        </p>
                        <p className="break-all text-[11px] text-muted-foreground">
                          {media.originalFilename || "Dosya adı yok"}
                        </p>
                      </div>
                      {media.isPuzzleSource && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                          Puzzle
                        </span>
                      )}
                    </div>
                    {media.signedUrl ? (
                      media.mediaType === "voice_note" ? (
                        <audio controls src={media.signedUrl} className="mt-3 w-full" />
                      ) : (
                        <img
                          src={media.signedUrl}
                          alt={media.originalFilename || "StoryOfUs medya"}
                          className="mt-3 aspect-video w-full rounded-xl object-cover"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <Muted>Önizleme bağlantısı oluşturulamadı.</Muted>
                    )}
                    {media.caption && <Paragraph label="Not" value={media.caption} />}
                  </div>
                ))}
              </div>
            )}
          </SummaryCard>

          <SummaryCard title="Zaman çizelgesi" icon={<FileText className="h-4 w-4" />}>
            {detail.timeline.length === 0 ? (
              <Muted>Zaman çizelgesi yok.</Muted>
            ) : (
              <div className="space-y-3">
                {detail.timeline.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-white p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {item.title || "Başlıksız anı"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateTime(item.eventDate)}
                    </p>
                    {item.description && (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SummaryCard>

          <SummaryCard title="Mektuplar" icon={<FileText className="h-4 w-4" />}>
            {detail.letters.length === 0 ? (
              <Muted>Mektup yok.</Muted>
            ) : (
              <div className="space-y-3">
                {detail.letters.map((letter) => (
                  <div key={letter.id} className="rounded-2xl border border-border bg-white p-3">
                    <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
                      {letter.type === "love_letter" ? "Aşk mektubu" : "Open when"}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {letter.title || "Başlıksız mektup"}
                    </p>
                    {letter.body && (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-foreground">
                        {letter.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SummaryCard>
        </div>
      ) : null}
    </aside>
  );
}

function SummaryCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-rose-500 shadow-sm">
          {icon}
        </span>
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function StatusBadge({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        muted
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-rose-200 bg-rose-100 text-rose-700"
      }`}
    >
      {label}
    </span>
  );
}

function TimeCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs text-foreground">{formatDateTime(value)}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-right font-medium text-foreground">
        <span className="break-all">{value}</span>
        {value !== "-" && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(value);
              toast.success("Kopyalandı");
            }}
            className="rounded-full border border-border bg-white p-1 text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </span>
    </div>
  );
}

function Paragraph({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-white/80 p-3 text-xs leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-white/70 p-3 text-xs text-muted-foreground">{children}</p>;
}

function EmptyState({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-3xl border p-10 text-center text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </div>
  );
}

function filterOrders(orders: StoryOfUsAdminReviewOrder[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return orders;
  }

  return orders.filter((order) =>
    [
      order.orderReference,
      order.trackingCode,
      order.customerName,
      order.customerEmailMasked,
      order.statusLabel,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery)),
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

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  });
}

function getMediaLabel(section: string, mediaType: string) {
  if (mediaType === "voice_note") {
    return "Ses notu";
  }

  switch (section) {
    case "opening":
      return "Açılış fotoğrafı";
    case "memory_prompt":
      return "Benim gözümde SEN";
    case "timeline":
      return "Zaman çizelgesi fotoğrafı";
    case "letter":
      return "Mektup fotoğrafı";
    case "puzzle":
      return "Puzzle fotoğrafı";
    case "gallery":
      return "Galeri fotoğrafı";
    default:
      return "Medya";
  }
}
