import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Section, SectionTitle } from "./Section";
import { CATEGORIES } from "@/lib/site";
import { useT } from "@/lib/i18n/context";
import { submitLead } from "@/lib/leads.functions";
import { toast } from "sonner";

type FormState = {
  name: string;
  business_category: string;
  custom_business_category: string;
  email: string;
  preferred_contact_method: "WhatsApp" | "Mail";
  phone: string;
  message: string;
};

const initial: FormState = {
  name: "",
  business_category: "",
  custom_business_category: "",
  email: "",
  preferred_contact_method: "WhatsApp",
  phone: "",
  message: "",
};

export function ContactSection() {
  const t = useT();
  const submit = useServerFn(submitLead);
  const [state, setState] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isWA = state.preferred_contact_method === "WhatsApp";
  const isOther = state.business_category === t.contact.categoryOther;

  const schema = z
    .object({
      name: z.string().trim().min(2, t.contact.errors.name).max(120),
      business_category: z.string().min(1, t.contact.errors.category),
      custom_business_category: z.string().trim().max(120).optional(),
      email: z.string().trim().email(t.contact.errors.email).max(255),
      preferred_contact_method: z.enum(["WhatsApp", "Mail"]),
      phone: z.string().trim().max(40).optional(),
      message: z.string().trim().min(5, t.contact.errors.message).max(2000),
    })
    .refine((v) => v.preferred_contact_method !== "WhatsApp" || (v.phone && v.phone.length >= 6), {
      message: t.contact.errors.phone,
      path: ["phone"],
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
    const parsed = schema.safeParse(state);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await submit({
        data: {
          name: parsed.data.name,
          business_category: parsed.data.business_category,
          custom_business_category: parsed.data.custom_business_category || null,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          message: parsed.data.message,
          preferred_contact_method: parsed.data.preferred_contact_method,
          selected_package: null,
          source: "leony-website",
        },
      });
      setSuccess(true);
      setState(initial);
      toast.success(t.contact.toastSuccess);
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
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-purple to-pink grid place-items-center text-white text-xl">✓</div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">{t.contact.successTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.contact.successBody}</p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              {t.contact.successAgain}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <Field label={t.contact.fields.name} error={errors.name}>
              <input value={state.name} onChange={(e) => update("name", e.target.value)} className="input" placeholder={t.contact.fields.namePh} required />
            </Field>

            <Field label={t.contact.fields.category} error={errors.business_category}>
              <select value={state.business_category} onChange={(e) => update("business_category", e.target.value)} className="input" required>
                <option value="">{t.contact.fields.categoryPlaceholder}</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            {isOther && (
              <Field label={t.contact.fields.customCategory} error={errors.custom_business_category}>
                <input value={state.custom_business_category} onChange={(e) => update("custom_business_category", e.target.value)} className="input" placeholder={t.contact.fields.customCategoryPh} />
              </Field>
            )}

            <Field label={t.contact.fields.email} error={errors.email}>
              <input type="email" value={state.email} onChange={(e) => update("email", e.target.value)} className="input" placeholder={t.contact.fields.emailPh} required />
            </Field>

            <Field label={t.contact.fields.method}>
              <div className="grid grid-cols-2 gap-2">
                {(["WhatsApp", "Mail"] as const).map((m) => {
                  const active = state.preferred_contact_method === m;
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() => update("preferred_contact_method", m)}
                      className={
                        "h-11 rounded-xl border text-sm font-semibold transition-colors " +
                        (active
                          ? "border-purple bg-gradient-to-r from-purple/10 to-pink/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground")
                      }
                    >
                      {m === "WhatsApp" ? t.contact.methods.whatsapp : t.contact.methods.mail}
                    </button>
                  );
                })}
              </div>
            </Field>

            {isWA && (
              <Field label={t.contact.fields.phone} error={errors.phone}>
                <input type="tel" value={state.phone} onChange={(e) => update("phone", e.target.value)} className="input" placeholder={t.contact.fields.phonePh} required />
              </Field>
            )}

            <Field label={t.contact.fields.message} error={errors.message}>
              <textarea rows={5} value={state.message} onChange={(e) => update("message", e.target.value)} className="input resize-none" placeholder={t.contact.fields.messagePh} required />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-navy text-navy-foreground text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
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
    </Section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
