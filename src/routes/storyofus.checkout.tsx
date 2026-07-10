import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { storyOfUsDemoCtaConfig } from "../lib/storyofus/demoCtaConfig";

export const Route = createFileRoute("/storyofus/checkout")({
  head: () => ({
    meta: [
      { title: "StoryOfUs ödeme bilgisi | Leony" },
      {
        name: "description",
        content:
          "StoryOfUs ödeme sonrası kurulum linki e-posta ile gönderilen kişiye özel romantik web sitesi akışı.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StoryOfUsCheckout,
});

function StoryOfUsCheckout() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_48%,#fffaf7_100%)] px-4 py-8 text-rose-950 sm:px-6 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-5 text-center shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-10">
          <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-rose-200/30 blur-3xl" />
          <div className="absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-pink-200/35 blur-3xl" />
          <Sparkles className="absolute right-8 top-8 h-5 w-5 text-rose-400/45" />
          <Heart className="absolute bottom-8 left-8 h-8 w-8 fill-rose-200/40 text-rose-300/50" />

          <div className="relative mx-auto grid max-w-2xl gap-6">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-lg shadow-rose-100/70">
              <Mail className="h-7 w-7" strokeWidth={1.8} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
                StoryOfUs
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
                {storyOfUsDemoCtaConfig.checkoutTitle} 💌
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-rose-950/65 sm:text-base">
                StoryOfUs kişiye özel hazırlanan dijital bir hediye olduğu için önce ödemenizi
                tamamlamanız gerekiyor. {storyOfUsDemoCtaConfig.checkoutDescription}
              </p>
            </div>

            <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-5 text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/50">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-white text-rose-500 shadow-sm shadow-rose-100/60">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
              </div>
              Lütfen ödeme sırasında e-posta adresinizi doğru yazdığınızdan emin olun. Kurulum
              formu bu adrese gönderilecektir.
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              <a
                href={storyOfUsDemoCtaConfig.shopierPaymentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
              >
                <Heart className="h-4 w-4 fill-white" />
                {storyOfUsDemoCtaConfig.paymentCtaLabel}
              </a>
              <Link
                to={storyOfUsDemoCtaConfig.demoPath}
                className="rounded-full border border-rose-200 bg-white px-6 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Demoyu tekrar gör
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
