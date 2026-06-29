import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listLeads, updateLead } from "@/lib/admin.functions";
import { createTaskFromLead } from "@/lib/tasks.functions";
import { toast } from "sonner";
import { Copy, MessageCircle, Search, ClipboardPlus } from "lucide-react";
import { sourceLabel, sourceBadgeClass } from "@/lib/sources";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: LeadsPage,
});

type Lead = {
  id: string;
  name: string;
  business_category: string;
  custom_business_category: string | null;
  email: string | null;
  phone: string | null;
  phone_country: string | null;
  phone_country_code: string | null;
  phone_dial_code: string | null;
  whatsapp_number: string | null;
  message: string;
  preferred_contact_method: string;
  selected_package: string | null;
  source: string | null;
  status: "pending" | "confirmed" | "canceled";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};
type Status = Lead["status"];

function LeadsPage() {
  const fetchLeads = useServerFn(listLeads);
  const patchLead = useServerFn(updateLead);
  const taskFromLead = useServerFn(createTaskFromLead);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchLeads();
      setLeads(res.leads as Lead[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = leads;
    if (filter !== "all") list = list.filter((l) => l.status === filter);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((l) =>
        [l.name, l.email, l.phone, l.whatsapp_number, l.business_category, l.message]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      );
    }
    return list;
  }, [leads, filter, q]);

  async function setStatus(id: string, status: Status) {
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await patchLead({ data: { id, status } });
      toast.success("Durum güncellendi");
    } catch (e: any) {
      setLeads(prev);
      toast.error(e?.message ?? "Güncelleme başarısız");
    }
  }

  async function saveNote(id: string, note: string) {
    try {
      await patchLead({ data: { id, admin_note: note || null } });
      toast.success("Not kaydedildi");
    } catch (e: any) {
      toast.error(e?.message ?? "Not kaydedilemedi");
    }
  }

  async function makeTask(leadId: string) {
    try {
      await taskFromLead({ data: { lead_id: leadId } });
      toast.success("Task oluşturuldu");
    } catch (e: any) {
      toast.error(e?.message ?? "Task oluşturulamadı");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10 space-y-5">
      <div>
        <h2 className="text-base md:text-lg font-semibold text-foreground">Gelen Talepler</h2>
        <p className="text-xs md:text-sm text-muted-foreground">Müşteri taleplerini buradan takip edebilirsiniz.</p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "confirmed", "canceled"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "h-9 px-3 rounded-full text-xs font-semibold border cursor-pointer transition-colors " +
                (filter === f
                  ? "bg-navy text-navy-foreground border-navy"
                  : "bg-card text-foreground border-border hover:bg-muted")
              }
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: isim, email, telefon, kategori, mesaj"
            className="w-full md:w-80 h-9 pl-9 pr-3 rounded-full border border-border bg-card text-sm"
          />
        </div>
      </div>

      {loading ? (
        <Empty>Yükleniyor...</Empty>
      ) : errorMsg ? (
        <Empty tone="error">
          Lead verileri yüklenirken bir sorun oluştu.
          <div className="mt-3">
            <button
              type="button"
              onClick={load}
              className="h-9 px-4 rounded-full bg-navy text-navy-foreground text-xs font-semibold cursor-pointer"
            >
              Tekrar dene
            </button>
          </div>
        </Empty>
      ) : filtered.length === 0 ? (
        <Empty>Henüz gelen bir talep yok.</Empty>
      ) : (
        <div className="grid gap-4">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={(s) => setStatus(lead.id, s)}
              onSaveNote={(n) => saveNote(lead.id, n)}
              onCreateTask={() => makeTask(lead.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function filterLabel(f: "all" | Status) {
  return f === "all" ? "Tümü" : f === "pending" ? "Bekleyen" : f === "confirmed" ? "Onaylandı" : "İptal";
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    pending: "bg-amber-100 text-amber-900 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-900 border-emerald-200",
    canceled: "bg-rose-100 text-rose-900 border-rose-200",
  };
  const labels: Record<Status, string> = { pending: "Bekleyen", confirmed: "Onaylandı", canceled: "İptal" };
  return (
    <span className={"inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " + styles[status]}>
      {labels[status]}
    </span>
  );
}

function SourceBadge({ source }: { source: string | null }) {
  return (
    <span className={"inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " + sourceBadgeClass(source)}>
      {sourceLabel(source)}
    </span>
  );
}

function LeadCard({
  lead,
  onStatusChange,
  onSaveNote,
  onCreateTask,
}: {
  lead: Lead;
  onStatusChange: (s: Status) => void;
  onSaveNote: (note: string) => void;
  onCreateTask: () => void;
}) {
  const [note, setNote] = useState(lead.admin_note ?? "");
  const dirty = note !== (lead.admin_note ?? "");

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{lead.name}</h3>
            <StatusBadge status={lead.status} />
            <SourceBadge source={lead.source} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(lead.created_at).toLocaleString("tr-TR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateTask}
            className="inline-flex items-center gap-1.5 h-9 rounded-full border border-border bg-card px-3 text-xs font-semibold hover:bg-muted cursor-pointer"
          >
            <ClipboardPlus className="h-3.5 w-3.5" /> Task Oluştur
          </button>
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(e.target.value as Status)}
            className="h-9 rounded-lg border border-border bg-background px-2 text-xs cursor-pointer"
          >
            <option value="pending">Bekleyen</option>
            <option value="confirmed">Onaylandı</option>
            <option value="canceled">İptal</option>
          </select>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Info label="Talep Kaynağı" value={sourceLabel(lead.source)} />
        <Info label="İşletme Kategorisi" value={lead.business_category} />
        {lead.custom_business_category && <Info label="Özel Kategori" value={lead.custom_business_category} />}
        {(lead.whatsapp_number || lead.phone) && (
          <Info label="WhatsApp Numarası" value={<WhatsAppCell number={lead.whatsapp_number || lead.phone || ""} />} />
        )}
        {(lead.phone_country || lead.phone_dial_code) && (
          <Info label="Ülke" value={`${lead.phone_country ?? ""}${lead.phone_dial_code ? ` (${lead.phone_dial_code})` : ""}`.trim()} />
        )}
        {lead.email && <Info label="Email" value={<a className="hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>} />}
        <Info label="Tercih Edilen İletişim" value={lead.preferred_contact_method} />
        {lead.selected_package && <Info label="Seçilen Paket" value={lead.selected_package} />}
      </dl>

      <div className="mt-4">
        <div className="text-xs font-semibold text-foreground mb-1">Mesaj</div>
        <p className="text-sm text-foreground whitespace-pre-wrap rounded-lg bg-muted/60 p-3">{lead.message}</p>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-foreground mb-1">Admin Notu</div>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Örn: WhatsApp’tan cevaplandı"
          className="w-full rounded-lg border border-border bg-background p-2 text-sm"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={!dirty}
            onClick={() => onSaveNote(note)}
            className="h-8 px-3 rounded-full bg-navy text-navy-foreground text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            Notu Kaydet
          </button>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Empty({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "error" }) {
  return (
    <div
      className={
        "rounded-2xl border p-10 text-center " +
        (tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border bg-card text-muted-foreground")
      }
    >
      {children}
    </div>
  );
}

function WhatsAppCell({ number }: { number: string }) {
  const digits = number.replace(/\D/g, "");
  const waMsg = "Merhaba, Leony üzerinden oluşturduğunuz web sitesi talebi hakkında iletişime geçiyorum.";
  const waHref = `https://wa.me/${digits}?text=${encodeURIComponent(waMsg)}`;
  const display = number.startsWith("+") ? number : `+${digits}`;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-mono tabular-nums">{display}</span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(display).then(
            () => toast.success("Kopyalandı"),
            () => toast.error("Kopyalanamadı"),
          );
        }}
        className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-card px-2 text-[11px] font-semibold hover:bg-muted cursor-pointer"
        title="Numarayı kopyala"
      >
        <Copy className="h-3 w-3" /> Kopyala
      </button>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 text-[11px] font-semibold hover:bg-emerald-600"
      >
        <MessageCircle className="h-3 w-3" /> WhatsApp'tan Yaz
      </a>
    </div>
  );
}
