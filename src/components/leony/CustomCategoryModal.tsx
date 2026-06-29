import { useEffect, useState } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { useT } from "@/lib/i18n/context";
import { submitLead } from "@/lib/leads.functions";
import { COUNTRIES, DEFAULT_COUNTRY, findCountry, type Country } from "@/lib/countries";
import { CountryCodeSelect } from "./CountryCodeSelect";
import { toast } from "sonner";

type FormState = { name: string; category: string; email: string; phone: string; message: string };
const initial: FormState = { name: "", category: "", email: "", phone: "", message: "" };

const COUNTRY_STORAGE_KEY = "leony.phone_country";

function detectCountry(): Country {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/Istanbul") return findCountry("TR")!;
    if (tz === "Asia/Baku") return findCountry("AZ")!;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== "undefined") {
    const langs = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((l) => l.toLowerCase());
    for (const l of langs) {
      if (l.startsWith("tr")) return findCountry("TR")!;
      if (l.startsWith("az")) return findCountry("AZ")!;
    }
  }
  return DEFAULT_COUNTRY;
}

export function CustomCategoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const submit = useServerFn(submitLead);
  const [state, setState] = useState<FormState>(initial);
  const [err, setErr] = useState<Partial<Record<keyof FormState, string>>>({});
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const saved = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
      const c = saved && findCountry(saved);
      if (c) setCountry(c);
      else setCountry(detectCountry());
    } catch {
      setCountry(detectCountry());
    }
  }, [open]);

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

  function pickCountry(c: Country) {
    setCountry(c);
    try {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, c.code);
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const next: typeof err = {};
    if (state.name.trim().length < 2) next.name = t.customCatModal.errors.name;
    if (state.category.trim().length < 2) next.category = t.customCatModal.errors.category;
    if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) next.email = t.customCatModal.errors.email;
    const parsed = parsePhoneNumberFromString(state.phone, country.code as CountryCode);
    const phoneValid = !!parsed && parsed.isValid() && parsed.country === country.code;
    if (!phoneValid) next.phone = t.customCatModal.errors.phone;
    if (state.message.trim().length < 3) next.message = t.customCatModal.errors.message;
    setErr(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await submit({
        data: {
          name: state.name.trim(),
          business_category: t.customCatModal.tag, // generic bucket
          custom_business_category: state.category.trim(),
          email: state.email.trim() ? state.email.trim() : null,
          phone: parsed!.nationalNumber,
          phone_country: country.name,
          phone_country_code: country.code,
          phone_dial_code: country.dial,
          whatsapp_number: parsed!.number,
          message: state.message.trim(),
          preferred_contact_method: "WhatsApp",
          selected_package: null,
          source: "custom_category_form",
        },
      });
      toast.success(t.customCatModal.toastSuccess);
      setSuccess(true);
      setState(initial);
    } catch (e) {
      console.error(e);
      toast.error(t.customCatModal.toastError);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSuccess(false);
    setErr({});
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-label={t.customCatModal.dialogAria}>
      <button type="button" aria-label={t.customCatModal.closeAria} onClick={handleClose} className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-navy via-purple to-pink text-navy-foreground">
          <button type="button" onClick={handleClose} aria-label={t.customCatModal.closeAria} className="absolute right-3 top-3 grid place-items-center h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors">
            <X className="h-4 w-4" />
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" /> {t.customCatModal.tag}
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-snug">{t.customCatModal.title}</h3>
          <p className="mt-1 text-xs text-white/80 leading-relaxed">{t.customCatModal.subtitle}</p>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h4 className="mt-4 text-base font-semibold text-foreground">{t.customCatModal.successTitle}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{t.customCatModal.toastSuccess}</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-navy text-navy-foreground px-5 text-sm font-semibold hover:bg-navy/90 cursor-pointer"
            >
              {t.customCatModal.closeAria}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-5 grid gap-3" noValidate>
            <FieldCK label={t.customCatModal.fields.name} error={err.name}>
              <input className="ck-input" value={state.name} onChange={(e) => update("name", e.target.value)} placeholder={t.customCatModal.fields.nameP} />
            </FieldCK>
            <FieldCK label={t.customCatModal.fields.category} error={err.category}>
              <input className="ck-input" value={state.category} onChange={(e) => update("category", e.target.value)} placeholder={t.customCatModal.fields.categoryP} />
            </FieldCK>
            <FieldCK label={t.customCatModal.fields.email} error={err.email}>
              <input type="email" className="ck-input" value={state.email} onChange={(e) => update("email", e.target.value)} placeholder={t.customCatModal.fields.emailP} />
            </FieldCK>
            <FieldCK label={t.customCatModal.fields.phone} error={err.phone}>
              <div className="flex">
                <CountryCodeSelect value={country} onChange={pickCountry} ariaLabel={t.customCatModal.fields.phone} />
                <input
                  type="tel"
                  inputMode="tel"
                  className="ck-input rounded-l-none"
                  value={state.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder={t.customCatModal.fields.phoneP}
                />
              </div>
            </FieldCK>
            <FieldCK label={t.customCatModal.fields.message} error={err.message}>
              <textarea rows={3} className="ck-input ck-area" value={state.message} onChange={(e) => update("message", e.target.value)} placeholder={t.customCatModal.fields.messageP} />
            </FieldCK>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-navy-foreground text-sm font-semibold hover:bg-navy/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? t.customCatModal.submitting : t.customCatModal.submit}
            </button>
          </form>
        )}

        <style>{`
          .ck-input { width: 100%; height: 2.75rem; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0 0.875rem; font-size: 0.875rem; color: var(--color-foreground); transition: border-color .15s, box-shadow .15s; }
          .ck-input:focus { outline: none; border-color: var(--color-orange); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-orange) 22%, transparent); }
          .ck-area { height: auto; padding: 0.65rem 0.875rem; resize: none; }
        `}</style>
      </div>
      {/* keep import alive */}
      {false && <span>{COUNTRIES.length}</span>}
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
