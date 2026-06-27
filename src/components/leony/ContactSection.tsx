import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Section, SectionTitle } from "./Section";
import { CATEGORIES } from "@/lib/site";
import { useT } from "@/lib/i18n/context";
import { submitLead } from "@/lib/leads.functions";
import { COUNTRIES, DEFAULT_COUNTRY, findCountry, type Country } from "@/lib/countries";
import { CountryCodeSelect } from "./CountryCodeSelect";
import { toast } from "sonner";

type FormState = {
  name: string;
  business_category: string;
  custom_business_category: string;
  email: string;
  phone: string;
  message: string;
};

const initial: FormState = {
  name: "",
  business_category: "",
  custom_business_category: "",
  email: "",
  phone: "",
  message: "",
};

const COUNTRY_STORAGE_KEY = "leony.phone_country";

function detectCountryFromLocale(): Country {
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

export function ContactSection() {
  const t = useT();
  const submit = useServerFn(submitLead);
  const [state, setState] = useState<FormState>(initial);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [countryManual, setCountryManual] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isOther = state.business_category === t.contact.categoryOther;

  // Restore saved country, then run geo detection (only if user hasn't picked).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
      if (saved) {
        const c = findCountry(saved);
        if (c) {
          setCountry(c);
          setCountryManual(true);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setCountry(detectCountryFromLocale());

    // Optional: refine with IP geo
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    fetch("https://ipapi.co/country/", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.text() : null))
      .then((code) => {
        clearTimeout(timer);
        if (cancelled || !code) return;
        const c = findCountry(code.trim());
        if (c) {
          setCountry((prev) => (countryManualRef.current ? prev : c));
        }
      })
      .catch(() => clearTimeout(timer));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track manual selection via ref so the async geo callback respects it.
  const countryManualRef = useRefMirror(countryManual);

  function pickCountry(c: Country) {
    setCountry(c);
    setCountryManual(true);
    try {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, c.code);
    } catch {
      /* ignore */
    }
  }

  const schema = z
    .object({
      name: z.string().trim().min(2, t.contact.errors.name).max(120),
      business_category: z.string().min(1, t.contact.errors.category),
      custom_business_category: z.string().trim().max(120).optional(),
      email: z
        .string()
        .trim()
        .max(255)
        .optional()
        .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: t.contact.errors.email }),
      phone: z
        .string()
        .trim()
        .min(6, t.contact.errors.phone)
        .max(30, t.contact.errors.phone)
        .refine((v) => /\d{6,}/.test(v.replace(/\D/g, "")), { message: t.contact.errors.phone }),
      message: z.string().trim().min(5, t.contact.errors.message).max(2000),
    })
    .refine(
      (v) => v.business_category !== t.contact.categoryOther || (v.custom_business_category && v.custom_business_category.length > 1),
      { message: t.contact.errors.customCategory, path: ["custom_business_category"] },
    );

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const parsed = schema.safeParse(state);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const localDigits = parsed.data.phone.replace(/\D/g, "");
    const dialDigits = country.dial.replace(/\D/g, "");
    const whatsappNumber = `+${dialDigits}${localDigits.replace(new RegExp(`^${dialDigits}`), "")}`;

    try {
      await submit({
        data: {
          name: parsed.data.name,
          business_category: parsed.data.business_category,
          custom_business_category: parsed.data.custom_business_category || null,
          email: parsed.data.email && parsed.data.email.length > 0 ? parsed.data.email : null,
          phone: localDigits,
          phone_country: country.name,
          phone_country_code: country.code,
          phone_dial_code: country.dial,
          whatsapp_number: whatsappNumber,
          message: parsed.data.message,
          preferred_contact_method: "WhatsApp",
          selected_package: null,
          source: "main_contact_form",
        },
      });
      toast.success(t.contact.toastSuccess);
      setSuccess(true);
      setState(initial);
    } catch (err) {
      console.error(err);
      toast.error(t.contact.toastError);
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = [
    ...CATEGORIES.map((c) => t.categories.items[c.slug].title),
    t.contact.categoryOther,
  ];

  return (
    <Section id="iletisim" className="bg-muted/40">
      <SectionTitle eyebrow={t.contact.eyebrow} title={t.contact.title} subtitle={t.contact.subtitle} />

      <div className="mt-12 mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{t.contact.successTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.contact.toastSuccess}</p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-navy text-navy-foreground px-5 text-sm font-semibold hover:bg-navy/90 cursor-pointer"
            >
              {t.contact.successAgain}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <Field label={t.contact.fields.name} required error={errors.name}>
              <input value={state.name} onChange={(e) => update("name", e.target.value)} className="input" placeholder={t.contact.fields.namePh} required />
            </Field>

            <Field label={t.contact.fields.category} required error={errors.business_category}>
              <select value={state.business_category} onChange={(e) => update("business_category", e.target.value)} className="input" required>
                <option value="">{t.contact.fields.categoryPlaceholder}</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            {isOther && (
              <Field label={t.contact.fields.customCategory} required error={errors.custom_business_category}>
                <input value={state.custom_business_category} onChange={(e) => update("custom_business_category", e.target.value)} className="input" placeholder={t.contact.fields.customCategoryPh} />
              </Field>
            )}

            <Field
              label={t.contact.fields.whatsappLabel}
              required
              error={errors.phone}
              helper={t.contact.fields.whatsappHelper}
            >
              <div className="flex">
                <CountryCodeSelect
                  value={country}
                  onChange={pickCountry}
                  searchPlaceholder={t.contact.fields.countrySearchPh}
                  ariaLabel={t.contact.fields.countrySearchPh}
                />
                <input
                  type="tel"
                  inputMode="tel"
                  value={state.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="input rounded-l-none"
                  placeholder={t.contact.fields.phonePh}
                  required
                />
              </div>
            </Field>

            <Field label={t.contact.fields.emailOptional} error={errors.email}>
              <input
                type="email"
                value={state.email}
                onChange={(e) => update("email", e.target.value)}
                className="input"
                placeholder={t.contact.fields.emailPh}
              />
            </Field>

            <Field label={t.contact.fields.message} required error={errors.message}>
              <textarea rows={5} value={state.message} onChange={(e) => update("message", e.target.value)} className="input resize-none" placeholder={t.contact.fields.messagePh} required />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-navy text-navy-foreground text-sm font-semibold hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? t.contact.submitting : t.contact.submit}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .input {
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
        .input:focus { outline: none; border-color: var(--color-purple); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-purple) 18%, transparent); }
        textarea.input { height: auto; padding: 0.75rem 0.875rem; }
      `}</style>
      {/* Silence unused-import warning if COUNTRIES tree-shaken. */}
      {false && <span>{COUNTRIES.length}</span>}
    </Section>
  );
}

function Field({
  label,
  error,
  helper,
  required,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
      {helper && !error && <span className="mt-1 block text-xs text-muted-foreground">{helper}</span>}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

// Tiny helper: a ref that always mirrors the latest state value.
import { useRef } from "react";
function useRefMirror<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
