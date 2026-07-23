import { createFileRoute, notFound } from "@tanstack/react-router";
import { Monitor, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  getStoryOfUsEmailQaPreviews,
  isStoryOfUsEmailQaAllowed,
  type StoryOfUsEmailQaPreview,
} from "../lib/storyofus/storyOfUsEmailQaPreview";

export const Route = createFileRoute("/storyofus/internal/email-qa")({
  head: () => ({
    meta: [
      { title: "StoryOfUs email QA | Leony" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  loader: () => {
    if (!isStoryOfUsEmailQaAllowed()) {
      throw notFound();
    }

    return {
      previews: getStoryOfUsEmailQaPreviews(),
    };
  },
  component: StoryOfUsEmailQaRoute,
});

type PreviewWidth = "desktop" | "mobile";

function StoryOfUsEmailQaRoute() {
  const { previews } = Route.useLoaderData() as { previews: StoryOfUsEmailQaPreview[] };
  const [selectedId, setSelectedId] = useState<StoryOfUsEmailQaPreview["id"]>(previews[0].id);
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");
  const selectedPreview = previews.find((preview) => preview.id === selectedId) ?? previews[0];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#ffe7ef_48%,#fffaf7_100%)] px-4 py-8 text-rose-950 sm:px-6">
      <section className="mx-auto grid max-w-7xl gap-6">
        <header className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-rose-100/70 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-500">
            Preview-only internal QA
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-rose-950 sm:text-4xl">
                StoryOfUs müşteri e-postaları
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-rose-950/65">
                Bu ekran gerçek template fonksiyonlarını güvenli statik QA verisiyle render eder.
                Sipariş oluşturmaz, ödeme başlatmaz, Supabase'e bağlanmaz ve e-posta göndermez.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-rose-100 bg-white p-1 shadow-sm">
              <WidthToggleButton
                active={previewWidth === "desktop"}
                icon={<Monitor className="h-4 w-4" />}
                label="Desktop"
                onClick={() => setPreviewWidth("desktop")}
              />
              <WidthToggleButton
                active={previewWidth === "mobile"}
                icon={<Smartphone className="h-4 w-4" />}
                label="Mobil"
                onClick={() => setPreviewWidth("mobile")}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <aside className="grid content-start gap-3">
            {previews.map((preview) => (
              <button
                key={preview.id}
                type="button"
                onClick={() => setSelectedId(preview.id)}
                className={`rounded-3xl border p-4 text-left transition ${
                  preview.id === selectedId
                    ? "border-rose-300 bg-white text-rose-950 shadow-lg shadow-rose-100"
                    : "border-white/70 bg-white/60 text-rose-950/70 hover:border-rose-200 hover:bg-white/85"
                }`}
              >
                <span className="block text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
                  {preview.id}
                </span>
                <span className="mt-2 block text-sm font-bold">{preview.name}</span>
                <span className="mt-1 block text-xs leading-5">{preview.purpose}</span>
              </button>
            ))}
          </aside>

          <section className="grid min-w-0 gap-5">
            <EmailMetadataCard preview={selectedPreview} />

            <div className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white/75 p-3 shadow-2xl shadow-rose-100/70 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-rose-950">Email rendering</h2>
                  <p className="text-xs text-rose-950/55">
                    Linkler inert QA URL'leridir; iframe sandbox modunda render edilir.
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
                  {previewWidth === "desktop" ? "600px email genişliği" : "390px mobil önizleme"}
                </span>
              </div>

              <div className="overflow-x-auto rounded-[1.5rem] bg-rose-950/5 p-3 sm:p-5">
                <iframe
                  key={`${selectedPreview.id}-${previewWidth}`}
                  title={`${selectedPreview.name} email preview`}
                  srcDoc={selectedPreview.html}
                  sandbox=""
                  className={`mx-auto h-[760px] rounded-2xl border border-rose-100 bg-white shadow-lg ${
                    previewWidth === "mobile" ? "w-[390px] max-w-full" : "w-full max-w-[680px]"
                  }`}
                />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function EmailMetadataCard({ preview }: { preview: StoryOfUsEmailQaPreview }) {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-lg shadow-rose-100/70 sm:grid-cols-2 sm:p-6">
      <MetadataItem label="Stage" value={preview.name} />
      <MetadataItem label="Subject" value={preview.subject} />
      <MetadataItem label="From" value={`${preview.fromName} <${preview.fromAddress}>`} />
      <MetadataItem label="Reply-To" value={preview.replyTo} />
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-rose-100 bg-[#fffaf8]/85 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-rose-950/75">{value}</p>
    </div>
  );
}

function WidthToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
