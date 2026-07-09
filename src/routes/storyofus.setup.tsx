import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  STORYOFUS_SETUP_STEPS,
  createEmptyStoryOfUsSetupFormData,
  type StoryOfUsSetupStepId,
} from "../lib/storyofus/setupTypes";

export const Route = createFileRoute("/storyofus/setup")({
  component: StoryOfUsSetupRoute,
});

type PlaceholderCard = {
  title: string;
  description: string;
};

function StoryOfUsSetupRoute() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData] = useState(() => createEmptyStoryOfUsSetupFormData());

  const totalSteps = STORYOFUS_SETUP_STEPS.length;
  const currentStep = STORYOFUS_SETUP_STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  function goToPreviousStep() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  function goToNextStep() {
    setCurrentStepIndex((index) => Math.min(index + 1, totalSteps - 1));
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#fff1f6_52%,#fffaf7_100%)] px-4 py-6 text-[#3d2323] sm:px-6 sm:py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
        <header className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white/75 px-5 py-7 text-center shadow-xl shadow-rose-100/50 backdrop-blur sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500 sm:tracking-[0.35em]">
            StoryOfUs Setup
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
            Hikayenizi birlikte hazırlayalım
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-rose-950/65 sm:text-base">
            Fotoğraflarınız, müziğiniz, anılarınız ve mektuplarınızla size özel romantik web
            sitesini hazırlamak için birkaç kısa adımı tamamlayın.
          </p>
        </header>

        <section className="rounded-[2rem] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-rose-100/60 backdrop-blur sm:p-6 lg:p-8">
          <div className="mb-6 grid gap-4 sm:mb-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                Adım {currentStepIndex + 1} / {totalSteps}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-rose-950 sm:text-3xl">
                {currentStep.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-950/60">
                {currentStep.description}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-left shadow-sm shadow-rose-100/50 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                İlerleme
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{progressPercent}%</p>
            </div>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-rose-100 sm:mb-8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-[1.5rem] border border-rose-100 bg-[#fffaf8] p-3 shadow-sm shadow-rose-100/50">
              <nav className="grid gap-2" aria-label="StoryOfUs setup adımları">
                {STORYOFUS_SETUP_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStepIndex(index)}
                      className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition duration-200 ${
                        isActive
                          ? "border-rose-300 bg-white text-rose-950 shadow-md shadow-rose-100"
                          : isCompleted
                            ? "border-rose-100 bg-rose-50/80 text-rose-900 hover:border-rose-200 hover:bg-white"
                            : "border-transparent bg-transparent text-rose-950/60 hover:border-rose-100 hover:bg-white/70"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          isActive
                            ? "bg-rose-500 text-white"
                            : isCompleted
                              ? "bg-rose-100 text-rose-600"
                              : "bg-white text-rose-400"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{step.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-current opacity-70">
                          {step.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="rounded-[1.5rem] border border-rose-100 bg-white/85 p-5 shadow-lg shadow-rose-100/45 sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                  {currentStep.title}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-rose-950">
                  {getStepHeading(currentStep.id)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-rose-950/65">
                  {getStepIntro(currentStep.id)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {getStepPlaceholderCards(currentStep.id).map((card) => (
                  <StepPlaceholder
                    key={`${currentStep.id}-${card.title}`}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </div>

              <pre className="sr-only" aria-hidden="true">
                {JSON.stringify(formData, null, 2)}
              </pre>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-rose-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={isFirstStep}
                  className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isLastStep}
                  className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Devam et
                </button>
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function getStepHeading(stepId: StoryOfUsSetupStepId) {
  switch (stepId) {
    case "contactCouple":
      return "Çift ve iletişim bilgileri";
    case "photosPuzzle":
      return "Fotoğraflar ve puzzle seçimi";
    case "musicVoice":
      return "Şarkı ve ses notu";
    case "timeline":
      return "İlişkinizin özel anları";
    case "letters":
      return "Aşk mektupları";
    case "review":
      return "Son kontrol";
  }
}

function getStepIntro(stepId: StoryOfUsSetupStepId) {
  switch (stepId) {
    case "contactCouple":
      return "Bu adımda sipariş sahibi, çift isimleri, özel tarih ve kısa hikaye alanları yer alacak.";
    case "photosPuzzle":
      return "Galeri fotoğrafları ve mini puzzle için kullanılacak görseller burada hazırlanacak.";
    case "musicVoice":
      return "Spotify şarkısı ve isteğe bağlı ses notu için alanlar bu bölümde toplanacak.";
    case "timeline":
      return "İlk tanışma, ilk buluşma ve özel anlar gibi hikaye kartları burada düzenlenecek.";
    case "letters":
      return "Ana aşk mektubu ve open-when notları bu adımda yazılacak.";
    case "review":
      return "Gönderimden önce tüm bilgiler burada özetlenecek. Şimdilik gerçek gönderim yapılmıyor.";
  }
}

function getStepPlaceholderCards(stepId: StoryOfUsSetupStepId): PlaceholderCard[] {
  switch (stepId) {
    case "contactCouple":
      return [
        { title: "İletişim alanları", description: "Ad, e-posta ve telefon bilgileri için form alanları gelecek." },
        { title: "Çift bilgileri", description: "İsimler, özel tarih ve ilişki hikayesi burada toplanacak." },
      ];
    case "photosPuzzle":
      return [
        { title: "Fotoğraf yükleme", description: "Galeri fotoğrafları için sıralanabilir yükleme alanı eklenecek." },
        { title: "Puzzle seçimi", description: "Puzzle için hangi fotoğrafın kullanılacağı burada seçilecek." },
      ];
    case "musicVoice":
      return [
        { title: "Spotify şarkısı", description: "Şarkı linki, başlık ve sanatçı bilgisi için alanlar gelecek." },
        { title: "Ses notu", description: "İsteğe bağlı ses notu yükleme alanı burada görünecek." },
      ];
    case "timeline":
      return [
        { title: "Hikaye kartları", description: "Başlık, tarih ve açıklama alanlarıyla özel anlar eklenecek." },
        { title: "Sıralama", description: "Anılar istenen sıraya göre düzenlenebilir olacak." },
      ];
    case "letters":
      return [
        { title: "Ana mektup", description: "Kalbimden sana bölümü için uzun mektup alanı gelecek." },
        { title: "Open-when notları", description: "İhtiyaç anlarında açılacak küçük mektuplar hazırlanacak." },
      ];
    case "review":
      return [
        { title: "Özet", description: "Tüm adımlardan gelen bilgiler tek yerde kontrol edilecek." },
        { title: "Gönderim beklemede", description: "Bu skeleton aşamasında hiçbir veri kaydedilmiyor veya gönderilmiyor." },
      ];
  }
}

function StepPlaceholder({ title, description }: PlaceholderCard) {
  return (
    <article className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/70 p-5 shadow-sm shadow-rose-100/50">
      <div className="mb-4 h-10 w-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100" />
      <h4 className="text-base font-semibold text-rose-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-rose-950/60">{description}</p>
    </article>
  );
}
