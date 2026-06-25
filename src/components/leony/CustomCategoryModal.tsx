import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { waLink } from "@/lib/site";

type FormState = {
  name: string;
  category: string;
  email: string;
  phone: string;
  message: string;
};

const initial: FormState = { name: "", category: "", email: "", phone: "", message: "" };

export function CustomCategoryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<FormState>(initial);
  const [err, setErr] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err = {};
    if (state.name.trim().length < 2) next.name = "Ad soyad gerekli";
    if (state.category.trim().length < 2) next.category = "Kategori gerekli";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) next.email = "Geçerli email gir";
    if (state.phone.replace(/\D/g, "").length < 6) next.phone = "Telefon gerekli";
    if (state.message.trim().length < 3) next.message = "Kısa bir mesaj yaz";
    setErr(next);
    if (Object.keys(next).length) return;

    const msg = `Merhaba, Leony üzerinden listede olmayan bir işletme kategorisi için web sitesi hizmeti hakkında bilgi almak istiyorum.

Ad Soyad: ${state.name}
İşletme Kategorisi: ${state.category}
Email: ${state.email}
Telefon: ${state.phone}
Mesaj: ${state.message}`;
    window.open(waLink(msg), "_blank", "noopener,noreferrer");
    setState(initial);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="İşletme kategorisi formu"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-navy via-purple to-pink text-navy-foreground">
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3 top-3 grid place-items-center h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" /> Özel Kategori
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-snug">İşletme kategorinizi yazın</h3>
          <p className="mt-1 text-xs text-white/80 leading-relaxed">
            Kategoriniz listede yoksa bilgilerinizi bırakın, size uygun web çözümünü birlikte değerlendirelim.
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-5 grid gap-3" noValidate>
          <FieldCK label="Ad Soyad" error={err.name}>
            <input className="ck-input" value={state.name} onChange={(e) => update("name", e.target.value)} placeholder="Adın ve soyadın" />
          </FieldCK>
          <FieldCK label="İşletme Kategorisi" error={err.category}>
            <input className="ck-input" value={state.category} onChange={(e) => update("category", e.target.value)} placeholder="Örn: Çiçekçi, Kişisel Antrenör" />
          </FieldCK>
          <FieldCK label="Email" error={err.email}>
            <input type="email" className="ck-input" value={state.email} onChange={(e) => update("email", e.target.value)} placeholder="ornek@email.com" />
          </FieldCK>
          <FieldCK label="Telefon" error={err.phone}>
            <input type="tel" className="ck-input" value={state.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+90 5XX XXX XX XX" />
          </FieldCK>
          <FieldCK label="Kısa Mesaj" error={err.message}>
            <textarea rows={3} className="ck-input ck-area" value={state.message} onChange={(e) => update("message", e.target.value)} placeholder="İhtiyacın hakkında kısaca bahset." />
          </FieldCK>

          <button
            type="submit"
            className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-whatsapp text-whatsapp-foreground text-sm font-semibold hover:brightness-95 transition-all shadow-sm"
          >
            WhatsApp’a Gönder
          </button>
        </form>

        <style>{`
          .ck-input {
            width: 100%;
            height: 2.75rem;
            border-radius: 0.75rem;
            border: 1px solid var(--color-border);
            background: var(--color-background);
            padding: 0 0.875rem;
            font-size: 0.875rem;
            color: var(--color-foreground);
            transition: border-color .15s, box-shadow .15s;
          }
          .ck-input:focus { outline: none; border-color: var(--color-orange); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-orange) 22%, transparent); }
          .ck-area { height: auto; padding: 0.65rem 0.875rem; resize: none; }
        `}</style>
      </div>
    </div>
  );
}

function FieldCK({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-foreground mb-1">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
