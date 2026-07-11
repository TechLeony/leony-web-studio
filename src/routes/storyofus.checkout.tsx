import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type FormEvent, useState } from "react";
import { Heart, Mail, ShieldCheck, Sparkles } from "lucide-react";

import {
  type StoryOfUsCheckoutContactErrors,
  type StoryOfUsCheckoutContactInput,
  validateStoryOfUsCheckoutContact,
} from "../lib/storyofus/contactValidation";
import { createStoryOfUsCheckoutOrder } from "../lib/storyofus/createCheckoutOrder.server";
import { storyOfUsDemoCtaConfig } from "../lib/storyofus/demoCtaConfig";

export const Route = createFileRoute("/storyofus/checkout")({
  head: () => ({
    meta: [
      { title: "StoryOfUs ödeme bilgisi | Leony" },
      {
        name: "description",
        content:
          "StoryOfUs ödeme öncesi iletişim bilgileri alınan kişiye özel romantik web sitesi akışı.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StoryOfUsCheckout,
});

type CheckoutOrderResult = {
  orderReference: string;
  customerEmail: string;
  customerName: string;
  contactPhone: string;
  paymentStatus: "pending";
  shopierPaymentUrl: string;
};

const initialCheckoutContactForm: StoryOfUsCheckoutContactInput = {
  customerName: "",
  customerEmail: "",
  confirmCustomerEmail: "",
  contactPhone: "",
  contactConsentAccepted: false,
  emailAccuracyAccepted: false,
};

function StoryOfUsCheckout() {
  const createCheckoutOrder = useServerFn(createStoryOfUsCheckoutOrder);
  const [formValue, setFormValue] = useState(initialCheckoutContactForm);
  const [fieldErrors, setFieldErrors] = useState<StoryOfUsCheckoutContactErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CheckoutOrderResult | null>(null);

  function updateField<K extends keyof StoryOfUsCheckoutContactInput>(
    field: K,
    value: StoryOfUsCheckoutContactInput[K],
  ) {
    setFormValue((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreatingOrder) {
      return;
    }

    const validation = validateStoryOfUsCheckoutContact(formValue);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setSubmitError("Devam etmeden önce iletişim bilgilerini kontrol edelim.");
      return;
    }

    setIsCreatingOrder(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const result = (await createCheckoutOrder({ data: formValue })) as CheckoutOrderResult;
      setCreatedOrder(result);
      savePendingCheckoutOrder(result);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Sipariş bilgisi oluşturulurken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsCreatingOrder(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_48%,#fffaf7_100%)] px-4 py-8 text-rose-950 sm:px-6 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-10">
          <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-rose-200/30 blur-3xl" />
          <div className="absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-pink-200/35 blur-3xl" />
          <Sparkles className="absolute right-8 top-8 h-5 w-5 text-rose-400/45" />
          <Heart className="absolute bottom-8 left-8 h-8 w-8 fill-rose-200/40 text-rose-300/50" />

          <div className="relative mx-auto grid max-w-3xl gap-7">
            <CheckoutHeader />

            {createdOrder ? (
              <CheckoutPaymentCard order={createdOrder} />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="grid gap-5 rounded-[1.75rem] border border-rose-100 bg-[#fffaf8]/90 p-4 shadow-sm shadow-rose-100/60 sm:p-6"
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <CheckoutTextField
                    label="Ad soyad *"
                    value={formValue.customerName}
                    error={fieldErrors.customerName}
                    autoComplete="name"
                    onChange={(value) => updateField("customerName", value)}
                  />
                  <CheckoutTextField
                    label="Telefon *"
                    value={formValue.contactPhone}
                    error={fieldErrors.contactPhone}
                    autoComplete="tel"
                    placeholder="Örn: 0532 123 45 67"
                    onChange={(value) => updateField("contactPhone", value)}
                  />
                  <CheckoutTextField
                    label="E-posta *"
                    value={formValue.customerEmail}
                    error={fieldErrors.customerEmail}
                    autoComplete="email"
                    inputMode="email"
                    onChange={(value) => updateField("customerEmail", value)}
                  />
                  <CheckoutTextField
                    label="E-posta tekrar *"
                    value={formValue.confirmCustomerEmail}
                    error={fieldErrors.confirmCustomerEmail}
                    autoComplete="email"
                    inputMode="email"
                    onChange={(value) => updateField("confirmCustomerEmail", value)}
                  />
                </div>

                <div className="grid gap-3">
                  <CheckoutCheckbox
                    checked={formValue.contactConsentAccepted}
                    error={fieldErrors.contactConsentAccepted}
                    onChange={(checked) => updateField("contactConsentAccepted", checked)}
                  >
                    Ödeme ve kurulum süreci için iletişim bilgilerimin kullanılmasını kabul
                    ediyorum.
                  </CheckoutCheckbox>
                  <CheckoutCheckbox
                    checked={formValue.emailAccuracyAccepted}
                    error={fieldErrors.emailAccuracyAccepted}
                    onChange={(checked) => updateField("emailAccuracyAccepted", checked)}
                  >
                    E-posta adresimi doğru yazdığımı ve kurulum bağlantısının bu adrese
                    gönderileceğini onaylıyorum.
                  </CheckoutCheckbox>
                </div>

                {submitError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {submitError}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to={storyOfUsDemoCtaConfig.demoPath}
                    className="rounded-full border border-rose-200 bg-white px-5 py-3 text-center text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Demoyu tekrar gör
                  </Link>
                  <button
                    type="submit"
                    disabled={isCreatingOrder}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    <Heart className="h-4 w-4 fill-white" />
                    {isCreatingOrder ? "Hazırlanıyor..." : "Ödeme adımına geç"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckoutHeader() {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-lg shadow-rose-100/70">
        <Mail className="h-7 w-7" strokeWidth={1.8} />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
        StoryOfUs
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
        Önce iletişim bilgilerinizi alalım 💌
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-rose-950/65 sm:text-base">
        Ödeme tamamlandıktan sonra kişiye özel kurulum bağlantınızı doğru adrese gönderebilmemiz
        için bu kısa formu doldurmanız gerekiyor.
      </p>
    </div>
  );
}

function CheckoutPaymentCard({ order }: { order: CheckoutOrderResult }) {
  return (
    <div className="grid gap-5 rounded-[1.75rem] border border-rose-100 bg-[#fffaf8]/90 p-5 text-center shadow-sm shadow-rose-100/60 sm:p-7">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-rose-500 shadow-sm shadow-rose-100/60">
        <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-rose-950 sm:text-3xl">
          Ödeme adımınız hazır
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-rose-950/65 sm:text-base">
          Sipariş referansınız: <span className="font-bold text-rose-700">{order.orderReference}</span>
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-rose-950/65 sm:text-base">
          Ödeme tamamlandıktan sonra kurulum bağlantınız e-posta adresinize gönderilecek.
        </p>
      </div>

      <div className="rounded-3xl border border-rose-100 bg-white/85 p-4 text-sm leading-7 text-rose-950/65">
        Kurulum bağlantısı şu adrese gönderilecek:{" "}
        <span className="font-semibold text-rose-700">{order.customerEmail}</span>
      </div>

      <a
        href={order.shopierPaymentUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
      >
        <Heart className="h-4 w-4 fill-white" />
        Shopier’de ödemeye devam et
      </a>

      <p className="mx-auto max-w-xl text-xs leading-6 text-rose-950/55">
        E-posta adresiniz yanlışsa lütfen ödeme yapmadan önce bu sayfayı yenileyip bilgilerinizi
        tekrar girin.
      </p>
    </div>
  );
}

function CheckoutTextField({
  label,
  value,
  error,
  placeholder,
  autoComplete,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "email" | "tel" | "text";
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-left text-sm font-semibold text-rose-950/75">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-rose-100 bg-white px-4 text-sm font-medium text-rose-950 outline-none transition placeholder:text-rose-950/30 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
      />
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function CheckoutCheckbox({
  checked,
  error,
  children,
  onChange,
}: {
  checked: boolean;
  error?: string;
  children: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="grid gap-2 rounded-2xl border border-rose-100 bg-white/85 p-4 text-left text-sm leading-6 text-rose-950/70">
      <span className="flex gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-rose-300 text-rose-500 accent-rose-500"
        />
        <span>{children}</span>
      </span>
      {error && <span className="pl-7 text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function savePendingCheckoutOrder(order: CheckoutOrderResult) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    "storyofus.checkout.pendingOrder.v1",
    JSON.stringify({
      orderReference: order.orderReference,
      customerEmail: order.customerEmail,
      createdAt: new Date().toISOString(),
    }),
  );
}
