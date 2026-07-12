import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type FormEvent, useState } from "react";
import { Heart, Search, ShieldCheck } from "lucide-react";

import { getStoryOfUsOrderTracking } from "../lib/storyofus/orderTracking.server";
import { storyOfUsDemoCtaConfig } from "../lib/storyofus/demoCtaConfig";

export const Route = createFileRoute("/storyofus/track-order")({
  validateSearch: (search) => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  head: () => ({
    meta: [
      { title: "StoryOfUs sipariş takip | Leony" },
      {
        name: "description",
        content: "StoryOfUs sipariş durumunuzu takip numarası ve iletişim bilginizle sorgulayın.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StoryOfUsTrackOrder,
});

type TrackingResult = Awaited<ReturnType<typeof getStoryOfUsOrderTracking>>;

function StoryOfUsTrackOrder() {
  const search = Route.useSearch();
  const getOrderTracking = useServerFn(getStoryOfUsOrderTracking);
  const [trackingCode, setTrackingCode] = useState(search.code ?? "");
  const [contact, setContact] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ trackingCode?: string; contact?: string }>({});
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof fieldErrors = {};

    if (!trackingCode.trim()) {
      nextErrors.trackingCode = "Sipariş takip numarası zorunlu.";
    }

    if (!contact.trim()) {
      nextErrors.contact = "E-posta veya telefon bilginizi yazın.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setResult(null);
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      const nextResult = (await getOrderTracking({
        data: {
          trackingCode,
          contact,
        },
      })) as TrackingResult;
      setResult(nextResult);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_48%,#fffaf7_100%)] px-4 py-8 text-rose-950 sm:px-6 sm:py-12">
      <section className="mx-auto grid max-w-4xl gap-6">
        <div className="rounded-[2rem] border border-white/80 bg-white/80 p-5 text-center shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-lg shadow-rose-100/70">
            <Search className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
            StoryOfUs
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
            Siparişinizi takip edin
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-rose-950/65 sm:text-base">
            Takip numaranız ve e-posta/telefon bilginizle StoryOfUs sipariş durumunuzu
            görebilirsiniz.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-[1.75rem] border border-rose-100 bg-[#fffaf8]/90 p-4 shadow-sm shadow-rose-100/60 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6"
          noValidate
        >
          <TrackOrderField
            label="Sipariş takip numarası *"
            value={trackingCode}
            error={fieldErrors.trackingCode}
            placeholder="SOT-20260711-K8M2QA"
            onChange={(value) => {
              setTrackingCode(value.toUpperCase());
              setFieldErrors((current) => ({ ...current, trackingCode: undefined }));
            }}
          />
          <TrackOrderField
            label="E-posta veya telefon *"
            value={contact}
            error={fieldErrors.contact}
            placeholder="ornek@mail.com veya 05xx..."
            onChange={(value) => {
              setContact(value);
              setFieldErrors((current) => ({ ...current, contact: undefined }));
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-65"
          >
            <Heart className="h-4 w-4 fill-white" />
            {isLoading ? "Sorgulanıyor..." : "Siparişi sorgula"}
          </button>
        </form>

        {result?.status === "not_found" && (
          <div className="rounded-[1.75rem] border border-rose-100 bg-white/85 p-5 text-center shadow-sm shadow-rose-100/60">
            <p className="text-lg font-bold text-rose-950">
              Bu bilgilerle eşleşen bir sipariş bulunamadı.
            </p>
            <p className="mt-2 text-sm leading-7 text-rose-950/60">
              Takip numaranızı ve iletişim bilginizi kontrol edip tekrar deneyin.
            </p>
          </div>
        )}

        {result?.status === "found" && <TrackingResultCard result={result} />}
      </section>
    </main>
  );
}

function TrackingResultCard({ result }: { result: Extract<TrackingResult, { status: "found" }> }) {
  return (
    <div className="grid gap-5 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-2xl shadow-rose-100/60 backdrop-blur sm:p-7">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600 shadow-sm shadow-rose-100/70">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-rose-950">{result.customerStatusLabel}</h2>
          <p className="mt-2 text-sm leading-7 text-rose-950/65">
            {result.customerStatusDescription}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TrackingInfo label="Takip numarası" value={result.trackingCode} />
        <TrackingInfo label="Sipariş referansı" value={result.orderReference} />
        <TrackingInfo label="E-posta" value={result.customerEmailMasked} />
        <TrackingInfo label="Ödeme durumu" value={result.paymentStatusLabel} />
        <TrackingInfo label="Ödeme tarihi" value={formatTrackingDate(result.paidAt)} />
        <TrackingInfo label="Form gönderimi" value={formatTrackingDate(result.submittedAt)} />
        <TrackingInfo label="Düzenleme sonu" value={formatTrackingDate(result.editableUntil)} />
        <TrackingInfo label="Teslim tarihi" value={formatTrackingDate(result.deliveredAt)} />
      </div>

      {result.finalSiteUrl && (
        <a
          href={result.finalSiteUrl}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
        >
          Final siteyi aç
        </a>
      )}

      <div className="rounded-[1.5rem] border border-rose-100 bg-[#fffaf8] p-4">
        <p className="text-sm font-bold text-rose-950">Sipariş zaman çizelgesi</p>
        <div className="mt-4 grid gap-3">
          {result.timeline.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  item.state === "completed"
                    ? "border-rose-300 bg-rose-100 text-rose-700"
                    : item.state === "current"
                      ? "border-pink-400 bg-pink-500 text-white shadow-md shadow-pink-200"
                      : "border-rose-100 bg-white text-rose-300"
                }`}
              >
                {item.state === "completed" ? "✓" : ""}
              </span>
              <span
                className={`text-sm ${
                  item.state === "future" ? "text-rose-950/40" : "font-semibold text-rose-950/75"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Link
        to={storyOfUsDemoCtaConfig.mainPath}
        className="text-center text-sm font-semibold text-rose-700 underline-offset-4 hover:underline"
      >
        StoryOfUs sayfasına dön
      </Link>
    </div>
  );
}

function TrackOrderField({
  label,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-left text-sm font-semibold text-rose-950/75">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-rose-100 bg-white px-4 text-sm font-medium text-rose-950 outline-none transition placeholder:text-rose-950/30 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
      />
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function TrackingInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white/85 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-rose-950/75">{value || "—"}</p>
    </div>
  );
}

function formatTrackingDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
