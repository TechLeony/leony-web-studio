import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listTasks, createTask, updateTask } from "@/lib/tasks.functions";
import { toast } from "sonner";
import { Search, Plus, X, Copy, MessageCircle } from "lucide-react";
import { sourceLabel, sourceBadgeClass } from "@/lib/sources";

export const Route = createFileRoute("/admin/tasks")({
  ssr: false,
  component: TasksPage,
});

type TaskStatus = "todo" | "in_progress" | "done" | "canceled";
type TaskPriority = "low" | "medium" | "high";

type Task = {
  id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  business_category: string | null;
  source: string | null;
  admin_note: string | null;
  progress_note: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

function TasksPage() {
  const fetchTasks = useServerFn(listTasks);
  const addTask = useServerFn(createTask);
  const patchTask = useServerFn(updateTask);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  async function load() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchTasks();
      setTasks(res.tasks as Task[]);
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
    let list = tasks;
    if (filter !== "all") list = list.filter((t) => t.status === filter);
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      list = list.filter((t) =>
        [t.title, t.description, t.customer_name, t.customer_phone, t.business_category]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(n)),
      );
    }
    return list;
  }, [tasks, filter, q]);

  const open = openId ? tasks.find((t) => t.id === openId) ?? null : null;

  async function saveTask(id: string, patch: Partial<Task>) {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await patchTask({ data: { id, ...patch } as any });
      toast.success("Task güncellendi");
      load();
    } catch (e: any) {
      setTasks(prev);
      toast.error(e?.message ?? "Güncellenemedi");
    }
  }

  async function saveProgressNote(id: string, note: string) {
    try {
      await patchTask({ data: { id, progress_note: note || null } });
      toast.success("Not kaydedildi.");
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, progress_note: note || null, updated_at: new Date().toISOString() } : t)));
    } catch (e: any) {
      toast.error(e?.message ?? "Not kaydedilirken bir sorun oluştu.");
    }
  }

  async function createManual(input: { title: string; description: string; priority: TaskPriority; customer_name: string; customer_phone: string }) {
    try {
      const res = await addTask({
        data: {
          title: input.title,
          description: input.description || null,
          priority: input.priority,
          customer_name: input.customer_name || null,
          customer_phone: input.customer_phone || null,
          source: "manual",
        },
      });
      toast.success("Task oluşturuldu");
      setTasks((ts) => [res.task as Task, ...ts]);
      setNewOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Oluşturulamadı");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground">Tasklar</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Müşteri işlerini buradan organize edebilirsin.</p>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 rounded-full bg-navy text-navy-foreground px-4 text-xs font-semibold hover:bg-orange transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Yeni Task
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "todo", "in_progress", "done", "canceled"] as const).map((f) => (
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
              {statusLabel(f)}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: başlık, müşteri, telefon, kategori"
            className="w-full md:w-80 h-9 pl-9 pr-3 rounded-full border border-border bg-card text-sm"
          />
        </div>
      </div>

      {loading ? (
        <Empty>Yükleniyor...</Empty>
      ) : errorMsg ? (
        <Empty tone="error">
          Tasklar yüklenirken bir sorun oluştu.
          <div className="mt-3">
            <button type="button" onClick={load} className="h-9 px-4 rounded-full bg-navy text-navy-foreground text-xs font-semibold cursor-pointer">
              Tekrar dene
            </button>
          </div>
        </Empty>
      ) : filtered.length === 0 ? (
        <Empty>Henüz task oluşturulmadı.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpenId(t.id)}
              className="text-left rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground text-sm">{t.title}</h3>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <PriorityBadge p={t.priority} />
                {t.source && <SourceBadge source={t.source} />}
                {t.business_category && (
                  <span className="text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">{t.business_category}</span>
                )}
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                {t.customer_name && <div>{t.customer_name}</div>}
                {t.customer_phone && <div className="font-mono">{t.customer_phone}</div>}
                <div>Oluşturma: {new Date(t.created_at).toLocaleString("tr-TR")}</div>
                {t.due_date && <div>Bitiş: {new Date(t.due_date).toLocaleDateString("tr-TR")}</div>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <TaskDetail
          task={open}
          onClose={() => setOpenId(null)}
          onSave={(p) => saveTask(open.id, p)}
          onSaveProgress={(n) => saveProgressNote(open.id, n)}
        />
      )}
      {newOpen && <NewTaskModal onClose={() => setNewOpen(false)} onCreate={createManual} />}
    </main>
  );
}

function statusLabel(s: "all" | TaskStatus) {
  return s === "all" ? "Tümü" : s === "todo" ? "Yapılacak" : s === "in_progress" ? "Devam Ediyor" : s === "done" ? "Tamamlandı" : "İptal";
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    todo: "bg-slate-100 text-slate-900 border-slate-200",
    in_progress: "bg-amber-100 text-amber-900 border-amber-200",
    done: "bg-emerald-100 text-emerald-900 border-emerald-200",
    canceled: "bg-rose-100 text-rose-900 border-rose-200",
  };
  return (
    <span className={"inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " + styles[status]}>
      {statusLabel(status)}
    </span>
  );
}

function PriorityBadge({ p }: { p: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-sky-100 text-sky-900 border-sky-200",
    high: "bg-rose-100 text-rose-900 border-rose-200",
  };
  const labels: Record<TaskPriority, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" };
  return <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold " + styles[p]}>{labels[p]}</span>;
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold " + sourceBadgeClass(source)}>
      {sourceLabel(source)}
    </span>
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

function TaskDetail({
  task,
  onClose,
  onSave,
  onSaveProgress,
}: {
  task: Task;
  onClose: () => void;
  onSave: (patch: Partial<Task>) => void;
  onSaveProgress: (note: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [adminNote, setAdminNote] = useState(task.admin_note ?? "");
  const [progress, setProgress] = useState(task.progress_note ?? "");
  const [due, setDue] = useState(task.due_date ? task.due_date.slice(0, 10) : "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function saveAll() {
    onSave({
      title,
      description: description || null,
      status,
      priority,
      admin_note: adminNote || null,
      due_date: due ? new Date(due).toISOString() : null,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 bg-foreground/50 backdrop-blur-sm cursor-pointer" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-card">
          <h3 className="text-base font-semibold text-foreground">Task Detayı</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid place-items-center h-8 w-8 rounded-full hover:bg-muted cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 grid gap-5">
          {(task.customer_name || task.customer_phone || task.customer_email || task.business_category) && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="text-xs font-semibold text-foreground mb-2">Müşteri Bilgileri</div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {task.customer_name && <Info label="Ad Soyad" value={task.customer_name} />}
                {task.customer_phone && (
                  <Info label="WhatsApp" value={<WhatsAppCell number={task.customer_phone} />} />
                )}
                {task.customer_email && (
                  <Info label="Email" value={<a className="hover:underline" href={`mailto:${task.customer_email}`}>{task.customer_email}</a>} />
                )}
                {task.business_category && <Info label="Kategori" value={task.business_category} />}
                {task.source && <Info label="Talep Kaynağı" value={sourceLabel(task.source)} />}
              </dl>
              {task.description && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-foreground mb-1">İlk Mesaj</div>
                  <p className="text-sm text-foreground whitespace-pre-wrap rounded-lg bg-card border border-border p-3">{task.description}</p>
                </div>
              )}
            </div>
          )}

          <Field label="Başlık">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="t-input" />
          </Field>

          <Field label="Açıklama">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="t-input t-area" />
          </Field>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Durum">
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="t-input cursor-pointer">
                <option value="todo">Yapılacak</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="done">Tamamlandı</option>
                <option value="canceled">İptal</option>
              </select>
            </Field>
            <Field label="Öncelik">
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="t-input cursor-pointer">
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </Field>
            <Field label="Bitiş Tarihi">
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="t-input" />
            </Field>
          </div>

          <Field label="Admin Notu (kısa)">
            <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="t-input t-area" />
          </Field>

          <div className="flex justify-end">
            <button type="button" onClick={saveAll} className="h-10 px-5 rounded-full bg-navy text-navy-foreground text-sm font-semibold hover:bg-orange transition-colors cursor-pointer">
              Değişiklikleri Kaydet
            </button>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-sm font-semibold text-foreground">Gidişat Notları</div>
              <div className="text-[11px] text-muted-foreground">Son güncelleme: {new Date(task.updated_at).toLocaleString("tr-TR")}</div>
            </div>
            <textarea
              rows={8}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="Bu işin ilerleyişiyle ilgili notlarını buraya yaz…"
              className="t-input t-area"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onSaveProgress(progress)}
                className="h-9 px-4 rounded-full bg-purple text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Notu Kaydet
              </button>
            </div>
          </div>

          {/* TODO: Design files / reference images attachments */}
        </div>
      </div>

      <style>{`
        .t-input { width: 100%; height: 2.5rem; border-radius: 0.6rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0 0.75rem; font-size: 0.875rem; color: var(--color-foreground); }
        .t-input:focus { outline: none; border-color: var(--color-purple); }
        .t-area { height: auto; min-height: 4rem; padding: 0.6rem 0.75rem; resize: vertical; }
      `}</style>
    </div>
  );
}

function NewTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { title: string; description: string; priority: TaskPriority; customer_name: string; customer_phone: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 1) return;
    onCreate({ title: title.trim(), description: description.trim(), priority, customer_name: customerName.trim(), customer_phone: customerPhone.trim() });
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button type="button" onClick={onClose} aria-label="Kapat" className="absolute inset-0 bg-foreground/50 backdrop-blur-sm cursor-pointer" />
      <form onSubmit={submit} className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Yeni Task</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid place-items-center h-8 w-8 rounded-full hover:bg-muted cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <Field label="Başlık">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="t-input" placeholder="Örn: Cafe website tasarımı" />
        </Field>
        <Field label="Açıklama">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="t-input t-area" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Müşteri Adı">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="t-input" />
          </Field>
          <Field label="WhatsApp">
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="t-input" placeholder="+90..." />
          </Field>
        </div>
        <Field label="Öncelik">
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="t-input cursor-pointer">
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
          </select>
        </Field>
        <button type="submit" className="mt-2 h-11 rounded-full bg-navy text-navy-foreground text-sm font-semibold hover:bg-orange transition-colors cursor-pointer">
          Oluştur
        </button>
        <style>{`
          .t-input { width: 100%; height: 2.5rem; border-radius: 0.6rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0 0.75rem; font-size: 0.875rem; color: var(--color-foreground); }
          .t-input:focus { outline: none; border-color: var(--color-purple); }
          .t-area { height: auto; min-height: 4rem; padding: 0.6rem 0.75rem; resize: vertical; }
        `}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-foreground mb-1">{label}</span>
      {children}
    </label>
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

function WhatsAppCell({ number }: { number: string }) {
  const digits = number.replace(/\D/g, "");
  const waHref = `https://wa.me/${digits}`;
  const display = number.startsWith("+") ? number : `+${digits}`;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-mono tabular-nums text-sm">{display}</span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(display).then(
            () => toast.success("Kopyalandı"),
            () => toast.error("Kopyalanamadı"),
          );
        }}
        className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-card px-2 text-[11px] font-semibold hover:bg-muted cursor-pointer"
      >
        <Copy className="h-3 w-3" /> Kopyala
      </button>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 text-[11px] font-semibold hover:bg-emerald-600"
      >
        <MessageCircle className="h-3 w-3" /> Yaz
      </a>
    </div>
  );
}
