import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { listOrders, updateOrder } from "@/lib/storyofus/storage";
import {
  sendDeliveryEmail,
  sendPaymentConfirmationEmail,
  sendPaymentReminderEmail,
} from "@/lib/storyofus/emails";
import type { StoryOrder } from "@/lib/storyofus/types";
import type { OrderStatus, PaymentStatus } from "@/lib/storyofus/config";
import { formatTL } from "@/lib/storyofus/utils";

export const Route = createFileRoute("/admin/storyofus-orders")({
  ssr: false,
  component: StoryOrdersAdmin,
});

const PAYMENT_STATUSES: PaymentStatus[] = [
  "Ödeme Bekleniyor",
  "Ödeme Onaylandı",
  "Ödeme Alınamadı",
  "İade Edildi",
];

const ORDER_STATUSES: OrderStatus[] = [
  "Form Alındı",
  "Ödeme Bekleniyor",
  "Ödeme Onaylandı",
  "Hazırlanıyor",
  "Revizyon Bekleniyor",
  "Hazır",
  "Teslim Edildi",
  "İptal / Ödeme Yapılmadı",
];

function StoryOrdersAdmin() {
  const [orders, setOrders] = useState<StoryOrder[]>([]);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function reload() {
    setOrders(listOrders());
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return orders;
    const n = q.trim().toLowerCase();
    return orders.filter((o) =>
      [
        o.orderCode,
        o.customerName,
        o.customerEmail,
        o.deliveryEmail,
        o.customerPhone,
        o.selectedPackage,
        String(o.totalPrice),
        o.paymentStatus,
        o.orderStatus,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(n)),
    );
  }, [orders, q]);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8 md:py-10">
      <div>
        <h2 className="text-base font-semibold text-foreground md:text-lg">Story of Us Siparişleri</h2>
        <p className="text-xs text-muted-foreground md:text-sm">
          Sipariş kodu, tarih/saat, müşteri ve ödeme bilgilerini yönetin.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: kod, isim, email, telefon, paket, tutar, durum"
            className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm md:w-96"
          />
        </div>
        <button
          type="button"
          onClick={reload}
          className="h-9 rounded-full border border-border bg-card px-4 text-xs font-semibold hover:bg-muted cursor-pointer"
        >
          Yenile
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          Henüz Story of Us siparişi yok.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              open={openId === o.id}
              onToggle={() => setOpenId(openId === o.id ? null : o.id)}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function OrderRow({
  order, open, onToggle, onChanged,
}: {
  order: StoryOrder;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-rose-600">{order.orderCode}</span>
            <StatusBadge status={order.orderStatus} />
            <PayBadge status={order.paymentStatus} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {order.createdAtDate} {order.createdAtTime} · {order.customerName} · {order.selectedPackage} · {formatTL(order.totalPrice)}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && <OrderDetail order={order} onChanged={onChanged} />}
    </article>
  );
}

function OrderDetail({ order, onChanged }: { order: StoryOrder; onChanged: () => void }) {
  const [loveNote, setLoveNote] = useState(order.loveNote);
  const [story, setStory] = useState(order.story);
  const [song, setSong] = useState(order.song);
  const [relationshipDate, setRelationshipDate] = useState(order.relationshipDate);
  const [specialDate, setSpecialDate] = useState(order.specialDate);
  const [desiredSlug, setDesiredSlug] = useState(order.desiredSlug);
  const [deliveryEmail, setDeliveryEmail] = useState(order.deliveryEmail);
  const [internalNotes, setInternalNotes] = useState(order.internalAdminNotes ?? "");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(order.orderStatus);

  const [showConfirm, setShowConfirm] = useState(false);
  const [payDate, setPayDate] = useState("");
  const [payTime, setPayTime] = useState("");
  const [payNote, setPayNote] = useState("");
  const [matchedBy, setMatchedBy] = useState<"Sipariş kodu" | "Tarih/Saat" | "E-posta" | "Manuel">("Sipariş kodu");

  const [deliveryLink, setDeliveryLink] = useState(order.finalWebsiteLink ?? "");

  function save() {
    const patch: Partial<StoryOrder> = {
      loveNote, story, song, relationshipDate, specialDate,
      desiredSlug, internalAdminNotes: internalNotes || null, orderStatus,
    };
    if (deliveryEmail !== order.deliveryEmail) {
      patch.deliveryEmail = deliveryEmail;
      patch.internalAdminNotes = `${internalNotes ? internalNotes + "\n" : ""}Delivery email updated by admin.`;
    }
    updateOrder(order.id, patch);
    toast.success("Kaydedildi");
    onChanged();
  }

  function confirmPayment() {
    updateOrder(order.id, {
      paymentStatus: "Ödeme Onaylandı",
      orderStatus: "Hazırlanıyor",
      shopierPaymentDate: payDate || null,
      shopierPaymentTime: payTime || null,
      shopierPaymentNote: payNote || null,
      matchedBy,
    });
    sendPaymentConfirmationEmail({ ...order, paymentStatus: "Ödeme Onaylandı", orderStatus: "Hazırlanıyor" });
    toast.success("Ödeme onaylandı");
    setShowConfirm(false);
    onChanged();
  }

  function sendDelivery() {
    if (!deliveryLink.trim()) return toast.error("Web sitesi linki girin.");
    sendDeliveryEmail(order, deliveryLink.trim());
    toast.success("Teslim maili gönderildi");
    onChanged();
  }

  return (
    <div className="border-t border-border p-4 md:p-5">
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Müşteri">
          <KV k="Ad Soyad" v={order.customerName} />
          <KV k="E-posta" v={order.customerEmail} />
          <KV k="Telefon" v={order.customerPhone} copy />
          <KV k="Aynı mail teslimatta kullanılsın" v={order.useSameEmailForDelivery ? "Evet" : "Hayır"} />
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">Teslimat e-postası</span>
            <input value={deliveryEmail} onChange={(e) => setDeliveryEmail(e.target.value)} className={cls} />
          </label>
        </Section>

        <Section title="Sipariş">
          <KV k="Kod" v={order.orderCode} copy />
          <KV k="Oluşturulma" v={`${order.createdAtDate} ${order.createdAtTime}`} />
          <KV k="Toplam" v={formatTL(order.totalPrice)} />
          <KV k="Stil" v={order.selectedStyle} />
          <KV k="Paket" v={`${order.selectedPackage} (${order.packageActivePrice} TL)`} />
          <KV k="Görünürlük" v={`${order.visibility}${order.visibilityExtraPrice ? ` (+${order.visibilityExtraPrice} TL)` : ""}`} />
          {order.password && <KV k="Şifre" v={order.password} copy />}
          <KV k="Tanıtım İzni" v={`${order.marketingPermissionType} (-${order.marketingDiscount} TL)`} />
          {order.marketingPrivacyPreference && (
            <KV k="Tanıtım gizlilik" v={order.marketingPrivacyPreference} />
          )}
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">Sipariş Durumu</span>
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value as OrderStatus)} className={cls}>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </Section>

        <Section title="Konfigürasyon">
          <KV k="Renk teması" v={order.selectedColorTheme} />
          <KV k="Font" v={order.selectedFont} />
          <KV k="Fotoğraf düzeni" v={order.selectedPhotoLayout} />
          <KV k="Animasyon" v={order.selectedAnimation} />
        </Section>

        <Section title="Çift İçeriği">
          <KV k="Partner 1" v={order.partnerOneName} />
          <KV k="Partner 2" v={order.partnerTwoName} />
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">Slug</span>
            <input value={desiredSlug} onChange={(e) => setDesiredSlug(e.target.value)} className={cls} />
            <span className="mt-1 block text-[10px] text-muted-foreground">
              leony.tech/storyofus/{desiredSlug}
            </span>
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">İlişki tarihi</span>
            <input type="date" value={relationshipDate} onChange={(e) => setRelationshipDate(e.target.value)} className={cls} />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">Özel tarih</span>
            <input type="date" value={specialDate} onChange={(e) => setSpecialDate(e.target.value)} className={cls} />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">Aşk notu</span>
            <textarea value={loveNote} onChange={(e) => setLoveNote(e.target.value)} rows={2} className={cls} />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">Hikaye</span>
            <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={3} className={cls} />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-semibold">Şarkı</span>
            <input value={song} onChange={(e) => setSong(e.target.value)} className={cls} />
          </label>
        </Section>

        <Section title="Shopier Ödeme">
          <KV k="Ödeme durumu" v={order.paymentStatus} />
          {order.shopierPaymentDate && <KV k="Tarih" v={`${order.shopierPaymentDate} ${order.shopierPaymentTime ?? ""}`} />}
          {order.shopierPaymentNote && <KV k="Not" v={order.shopierPaymentNote} />}
          {order.matchedBy && <KV k="Eşleşme" v={order.matchedBy} />}
        </Section>

        <Section title="Admin Notları">
          <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} className={cls} />
        </Section>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-navy-foreground cursor-pointer">
          Bilgileri Kaydet
        </button>
        <button type="button" onClick={() => setShowConfirm((v) => !v)} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted cursor-pointer">
          Ödeme Onaylandı Olarak İşaretle
        </button>
        <button
          type="button"
          onClick={() => { sendPaymentReminderEmail(order); toast.success("Hatırlatma gönderildi"); onChanged(); }}
          className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted cursor-pointer"
        >
          Hatırlatma Maili Gönder
        </button>

        <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
          <input
            value={deliveryLink}
            onChange={(e) => setDeliveryLink(e.target.value)}
            placeholder="leony.tech/storyofus/..."
            className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs md:w-80"
          />
          <button
            type="button"
            onClick={sendDelivery}
            className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 cursor-pointer"
          >
            Teslim Maili Gönder
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="mt-4 grid gap-3 rounded-xl border border-border bg-muted/40 p-4 md:grid-cols-4">
          <label className="text-xs">
            <span className="mb-1 block font-semibold">Ödeme tarihi</span>
            <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className={cls} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-semibold">Ödeme saati</span>
            <input type="time" value={payTime} onChange={(e) => setPayTime(e.target.value)} className={cls} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-semibold">Shopier notu</span>
            <input value={payNote} onChange={(e) => setPayNote(e.target.value)} className={cls} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-semibold">Eşleştirme</span>
            <select value={matchedBy} onChange={(e) => setMatchedBy(e.target.value as any)} className={cls}>
              <option>Sipariş kodu</option>
              <option>Tarih/Saat</option>
              <option>E-posta</option>
              <option>Manuel</option>
            </select>
          </label>
          <div className="md:col-span-4">
            <button type="button" onClick={confirmPayment} className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 cursor-pointer">
              Onayla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cls = "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="grid gap-2 text-sm">{children}</div>
    </div>
  );
}

function KV({ k, v, copy }: { k: string; v: string; copy?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</span>
      <span className="flex items-center gap-2 text-right text-sm text-foreground">
        <span className="break-all">{v}</span>
        {copy && (
          <button
            type="button"
            onClick={() => { navigator.clipboard?.writeText(v); toast.success("Kopyalandı"); }}
            className="rounded-full border border-border p-1 hover:bg-muted cursor-pointer"
            title="Kopyala"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cls =
    status === "Teslim Edildi"
      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
      : status === "İptal / Ödeme Yapılmadı"
        ? "bg-rose-100 text-rose-900 border-rose-200"
        : status === "Hazırlanıyor" || status === "Hazır"
          ? "bg-blue-100 text-blue-900 border-blue-200"
          : "bg-amber-100 text-amber-900 border-amber-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status}</span>;
}

function PayBadge({ status }: { status: PaymentStatus }) {
  const cls =
    status === "Ödeme Onaylandı"
      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
      : status === "İade Edildi"
        ? "bg-slate-100 text-slate-900 border-slate-200"
        : status === "Ödeme Alınamadı"
          ? "bg-rose-100 text-rose-900 border-rose-200"
          : "bg-amber-100 text-amber-900 border-amber-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status}</span>;
}

// Silence unused warning
void PAYMENT_STATUSES;
