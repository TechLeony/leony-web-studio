import { createFileRoute } from "@tanstack/react-router";

import { STORYOFUS_SETUP_STEPS } from "../lib/storyofus/setupTypes";

export const Route = createFileRoute("/storyofus/setup")({
  component: StoryOfUsSetupRoute,
});

function StoryOfUsSetupRoute() {
  return (
    <main className="min-h-screen bg-[#fff8f5] px-4 py-8 text-[#3d2323]">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#b56b7a]">
            StoryOfUs Setup
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Hikayenizi birlikte hazırlayalım 💌
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6d4b4b] sm:text-lg">
            Fotoğraflarınız, müziğiniz, anılarınız ve mektuplarınızla size özel romantik web
            sitesini hazırlamak için birkaç kısa adımı tamamlayın.
          </p>
        </header>

        <section className="rounded-[2rem] border border-[#f1d1d8] bg-white/80 p-5 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Kurulum adımları</h2>
            <p className="text-sm leading-6 text-[#7a5b5b]">
              Şimdilik setup sayfasının route iskeletini oluşturuyoruz. Sonraki adımda bu alan
              gerçek wizard UI’a dönüşecek.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {STORYOFUS_SETUP_STEPS.map((step, index) => (
              <article
                key={step.id}
                className="rounded-3xl border border-[#f5dce2] bg-[#fffaf8] p-5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#f3c3ce] text-sm font-bold text-[#7b2f42]">
                  {index + 1}
                </div>

                <h3 className="text-lg font-semibold">{step.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[#745757]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
