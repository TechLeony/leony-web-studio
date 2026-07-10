import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  STORYOFUS_SETUP_STEPS,
  createEmptyStoryOfUsSetupFormData,
  type StoryOfUsContactCoupleData,
  type StoryOfUsLetterItem,
  type StoryOfUsMusicData,
  type StoryOfUsPhotoDraftItem,
  type StoryOfUsPuzzleData,
  type StoryOfUsSkipState,
  type StoryOfUsSetupStepId,
  type StoryOfUsSetupFormData,
  type StoryOfUsTimelineItem,
  type StoryOfUsVoiceNoteData,
} from "../lib/storyofus/setupTypes";

export const Route = createFileRoute("/storyofus/setup")({
  component: StoryOfUsSetupRoute,
});

type PlaceholderCard = {
  title: string;
  description: string;
};

const STORYOFUS_SETUP_DRAFT_STORAGE_KEY = "storyofus.setup.draft.v1";

type StoryOfUsSetupDraft = Pick<
  StoryOfUsSetupFormData,
  "orderReference" | "status" | "contactCouple" | "confirmedSkips" | "timeline" | "letters"
> & {
  media: {
    puzzle: {
      selectedPhotoId: null;
      confirmedNoPuzzle: boolean;
    };
  };
  musicVoice: {
    music: StoryOfUsMusicData;
    voiceNote: null;
  };
};

function StoryOfUsSetupRoute() {
  const [initialSetupState] = useState(() => createInitialSetupState());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialSetupState.formData);
  const [wasDraftRestored, setWasDraftRestored] = useState(initialSetupState.wasDraftRestored);
  const photoPreviewUrlsRef = useRef<Set<string>>(new Set());
  const voiceNotePreviewUrlsRef = useRef<Set<string>>(new Set());
  const skipNextDraftSaveRef = useRef(false);

  const totalSteps = STORYOFUS_SETUP_STEPS.length;
  const currentStep = STORYOFUS_SETUP_STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  function revokeCurrentPreviewUrls() {
    photoPreviewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    photoPreviewUrlsRef.current.clear();
    voiceNotePreviewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    voiceNotePreviewUrlsRef.current.clear();
  }

  useEffect(() => {
    return () => {
      revokeCurrentPreviewUrls();
    };
  }, []);

  useEffect(() => {
    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      clearSetupDraft();
      return;
    }

    saveSetupDraft(formData);
  }, [formData]);

  function goToPreviousStep() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  function goToNextStep() {
    setCurrentStepIndex((index) => Math.min(index + 1, totalSteps - 1));
  }

  function goToStepById(stepId: StoryOfUsSetupStepId) {
    const nextStepIndex = STORYOFUS_SETUP_STEPS.findIndex((step) => step.id === stepId);

    if (nextStepIndex !== -1) {
      setCurrentStepIndex(nextStepIndex);
    }
  }

  function handleClearDraft() {
    clearSetupDraft();
    revokeCurrentPreviewUrls();
    skipNextDraftSaveRef.current = true;
    setFormData(createEmptyStoryOfUsSetupFormData());
    setCurrentStepIndex(0);
    setWasDraftRestored(false);
  }

  function updateContactCoupleField(field: keyof StoryOfUsContactCoupleData, value: string) {
    setFormData((current) => ({
      ...current,
      contactCouple: {
        ...current.contactCouple,
        [field]: value,
      },
    }));
  }

  function addPhotoFiles(files: FileList | File[]) {
    const selectedFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (selectedFiles.length === 0) {
      return;
    }

    const photoDrafts = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      photoPreviewUrlsRef.current.add(previewUrl);

      return {
        id: createPhotoDraftId(),
        previewUrl,
        caption: "",
        sortOrder: 0,
        file,
      };
    });

    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        photos: [
          ...current.media.photos,
          ...photoDrafts.map((photo, index) => ({
            ...photo,
            sortOrder: current.media.photos.length + index,
          })),
        ],
      },
    }));
  }

  function updatePhotoCaption(photoId: string, caption: string) {
    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        photos: current.media.photos.map((photo) =>
          photo.id === photoId ? { ...photo, caption } : photo,
        ),
      },
    }));
  }

  function removePhoto(photoId: string) {
    setFormData((current) => {
      const photoToRemove = current.media.photos.find((photo) => photo.id === photoId);

      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
        photoPreviewUrlsRef.current.delete(photoToRemove.previewUrl);
      }

      return {
        ...current,
        media: {
          ...current.media,
          photos: current.media.photos
            .filter((photo) => photo.id !== photoId)
            .map((photo, index) => ({ ...photo, sortOrder: index })),
          puzzle: {
            ...current.media.puzzle,
            selectedPhotoId:
              current.media.puzzle.selectedPhotoId === photoId
                ? null
                : current.media.puzzle.selectedPhotoId,
          },
        },
      };
    });
  }

  function selectPuzzlePhoto(photoId: string) {
    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        puzzle: {
          ...current.media.puzzle,
          selectedPhotoId: photoId,
          confirmedNoPuzzle: false,
        },
      },
    }));
  }

  function clearPuzzleSelection() {
    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        puzzle: {
          ...current.media.puzzle,
          selectedPhotoId: null,
          confirmedNoPuzzle: false,
        },
      },
    }));
  }

  function updateMusicField(field: keyof StoryOfUsMusicData, value: string) {
    setFormData((current) => {
      if (field === "startAtSeconds") {
        return {
          ...current,
          musicVoice: {
            ...current.musicVoice,
            music: {
              ...current.musicVoice.music,
              startAtSeconds: value.trim() === "" ? 0 : Number(value),
            },
          },
        };
      }

      return {
        ...current,
        musicVoice: {
          ...current.musicVoice,
          music: {
            ...current.musicVoice.music,
            [field]: value,
          },
        },
      };
    });
  }

  function addVoiceNoteFile(file: File) {
    if (!file.type.startsWith("audio/")) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    voiceNotePreviewUrlsRef.current.add(previewUrl);

    setFormData((current) => {
      if (current.musicVoice.voiceNote) {
        URL.revokeObjectURL(current.musicVoice.voiceNote.previewUrl);
        voiceNotePreviewUrlsRef.current.delete(current.musicVoice.voiceNote.previewUrl);
      }

      const { voiceNote, ...remainingSkips } = current.confirmedSkips;

      return {
        ...current,
        musicVoice: {
          ...current.musicVoice,
          voiceNote: {
            previewUrl,
            originalFilename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            file,
          },
        },
        confirmedSkips: remainingSkips,
      };
    });
  }

  function removeVoiceNote() {
    setFormData((current) => {
      if (current.musicVoice.voiceNote) {
        URL.revokeObjectURL(current.musicVoice.voiceNote.previewUrl);
        voiceNotePreviewUrlsRef.current.delete(current.musicVoice.voiceNote.previewUrl);
      }

      return {
        ...current,
        musicVoice: {
          ...current.musicVoice,
          voiceNote: null,
        },
      };
    });
  }

  function requestVoiceNoteSkip() {
    setFormData((current) => ({
      ...current,
      confirmedSkips: {
        ...current.confirmedSkips,
        voiceNote: {
          warned: true,
          confirmed: false,
        },
      },
    }));
  }

  function confirmVoiceNoteSkip() {
    setFormData((current) => {
      if (current.musicVoice.voiceNote) {
        URL.revokeObjectURL(current.musicVoice.voiceNote.previewUrl);
        voiceNotePreviewUrlsRef.current.delete(current.musicVoice.voiceNote.previewUrl);
      }

      return {
        ...current,
        musicVoice: {
          ...current.musicVoice,
          voiceNote: null,
        },
        confirmedSkips: {
          ...current.confirmedSkips,
          voiceNote: {
            warned: true,
            confirmed: true,
            confirmedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  function undoVoiceNoteSkip() {
    setFormData((current) => {
      const { voiceNote, ...remainingSkips } = current.confirmedSkips;

      return {
        ...current,
        confirmedSkips: remainingSkips,
      };
    });
  }

  function addTimelineItem() {
    setFormData((current) => ({
      ...current,
      timeline: [
        ...current.timeline,
        {
          id: createTimelineItemId(),
          title: "",
          eventDate: "",
          description: "",
          sortOrder: current.timeline.length,
        },
      ],
    }));
  }

  function updateTimelineItem(
    itemId: string,
    field: keyof Pick<StoryOfUsTimelineItem, "title" | "eventDate" | "description">,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      timeline: current.timeline.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeTimelineItem(itemId: string) {
    setFormData((current) => ({
      ...current,
      timeline: current.timeline
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({ ...item, sortOrder: index })),
    }));
  }

  function moveTimelineItem(itemId: string, direction: "up" | "down") {
    setFormData((current) => {
      const orderedItems = [...current.timeline].sort((a, b) => a.sortOrder - b.sortOrder);
      const currentIndex = orderedItems.findIndex((item) => item.id === itemId);

      if (currentIndex === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= orderedItems.length) {
        return current;
      }

      const nextItems = [...orderedItems];
      const [movedItem] = nextItems.splice(currentIndex, 1);
      nextItems.splice(targetIndex, 0, movedItem);

      return {
        ...current,
        timeline: nextItems.map((item, index) => ({ ...item, sortOrder: index })),
      };
    });
  }

  function addLoveLetter() {
    setFormData((current) => {
      if (current.letters.some((letter) => letter.type === "love_letter")) {
        return current;
      }

      return {
        ...current,
        letters: [
          ...current.letters,
          {
            id: createLetterItemId(),
            type: "love_letter",
            title: "Aşk mektubum",
            body: "",
            sortOrder: current.letters.length,
          },
        ],
      };
    });
  }

  function addOpenWhenLetter() {
    setFormData((current) => ({
      ...current,
      letters: [
        ...current.letters,
        {
          id: createLetterItemId(),
          type: "open_when",
          title: "",
          body: "",
          sortOrder: current.letters.length,
        },
      ],
    }));
  }

  function updateLetterItem(
    letterId: string,
    field: keyof Pick<StoryOfUsLetterItem, "title" | "body">,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      letters: current.letters.map((letter) =>
        letter.id === letterId ? { ...letter, [field]: value } : letter,
      ),
    }));
  }

  function removeLetterItem(letterId: string) {
    setFormData((current) => ({
      ...current,
      letters: current.letters
        .filter((letter) => letter.id !== letterId)
        .map((letter, index) => ({ ...letter, sortOrder: index })),
    }));
  }

  function moveLetterItem(letterId: string, direction: "up" | "down") {
    setFormData((current) => {
      const orderedLetters = [...current.letters].sort((a, b) => a.sortOrder - b.sortOrder);
      const currentIndex = orderedLetters.findIndex((letter) => letter.id === letterId);

      if (currentIndex === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= orderedLetters.length) {
        return current;
      }

      const nextLetters = [...orderedLetters];
      const [movedLetter] = nextLetters.splice(currentIndex, 1);
      nextLetters.splice(targetIndex, 0, movedLetter);

      return {
        ...current,
        letters: nextLetters.map((letter, index) => ({ ...letter, sortOrder: index })),
      };
    });
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

          <div className="mb-6 rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 text-sm leading-6 text-rose-950/60 shadow-sm shadow-rose-100/45 sm:mb-8">
            <p className="font-semibold text-rose-700">
              Taslak bu cihazda otomatik kaydediliyor.
            </p>
            {wasDraftRestored && (
              <p className="mt-1 text-rose-950/65">Kaydedilmiş taslağınız yüklendi.</p>
            )}
            <p className="mt-1">
              Güvenlik nedeniyle fotoğraf ve ses dosyalarını tekrar seçmeniz gerekebilir.
            </p>
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

              {currentStep.id === "contactCouple" ? (
                <ContactCoupleStep
                  value={formData.contactCouple}
                  onChange={updateContactCoupleField}
                />
              ) : currentStep.id === "photosPuzzle" ? (
                <PhotosPuzzleStep
                  photos={formData.media.photos}
                  puzzle={formData.media.puzzle}
                  onAddPhotoFiles={addPhotoFiles}
                  onUpdatePhotoCaption={updatePhotoCaption}
                  onRemovePhoto={removePhoto}
                  onSelectPuzzlePhoto={selectPuzzlePhoto}
                  onClearPuzzleSelection={clearPuzzleSelection}
                />
              ) : currentStep.id === "musicVoice" ? (
                <MusicVoiceStep
                  music={formData.musicVoice.music}
                  voiceNote={formData.musicVoice.voiceNote}
                  voiceNoteSkip={formData.confirmedSkips.voiceNote}
                  onUpdateMusicField={updateMusicField}
                  onAddVoiceNoteFile={addVoiceNoteFile}
                  onRemoveVoiceNote={removeVoiceNote}
                  onRequestVoiceNoteSkip={requestVoiceNoteSkip}
                  onConfirmVoiceNoteSkip={confirmVoiceNoteSkip}
                  onUndoVoiceNoteSkip={undoVoiceNoteSkip}
                />
              ) : currentStep.id === "timeline" ? (
                <TimelineStep
                  items={formData.timeline}
                  onAddItem={addTimelineItem}
                  onUpdateItem={updateTimelineItem}
                  onRemoveItem={removeTimelineItem}
                  onMoveItem={moveTimelineItem}
                />
              ) : currentStep.id === "letters" ? (
                <LettersStep
                  letters={formData.letters}
                  onAddLoveLetter={addLoveLetter}
                  onAddOpenWhenLetter={addOpenWhenLetter}
                  onUpdateLetter={updateLetterItem}
                  onRemoveLetter={removeLetterItem}
                  onMoveLetter={moveLetterItem}
                />
              ) : currentStep.id === "review" ? (
                <ReviewSubmitStep formData={formData} onEditStep={goToStepById} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {getStepPlaceholderCards(currentStep.id).map((card) => (
                    <StepPlaceholder
                      key={`${currentStep.id}-${card.title}`}
                      title={card.title}
                      description={card.description}
                    />
                  ))}
                </div>
              )}

              <pre className="sr-only" aria-hidden="true">
                {JSON.stringify(formData, null, 2)}
              </pre>

              <div className="mt-8 border-t border-rose-100 pt-5">
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Taslağı temizle
                  </button>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
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

function createInitialSetupState() {
  const restoredDraft = restoreSetupDraft();

  return {
    formData: restoredDraft ?? createEmptyStoryOfUsSetupFormData(),
    wasDraftRestored: Boolean(restoredDraft),
  };
}

function serializeSetupDraft(formData: StoryOfUsSetupFormData): StoryOfUsSetupDraft {
  return {
    orderReference: formData.orderReference,
    status: formData.status,
    contactCouple: formData.contactCouple,
    media: {
      puzzle: {
        selectedPhotoId: null,
        confirmedNoPuzzle: formData.media.puzzle.confirmedNoPuzzle,
      },
    },
    musicVoice: {
      music: formData.musicVoice.music,
      voiceNote: null,
    },
    confirmedSkips: formData.confirmedSkips,
    timeline: getOrderedTimelineItems(formData.timeline).map((item, index) => ({
      ...item,
      sortOrder: index,
    })),
    letters: getOrderedLetters(formData.letters).map((letter, index) => ({
      ...letter,
      sortOrder: index,
    })),
  };
}

function saveSetupDraft(formData: StoryOfUsSetupFormData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORYOFUS_SETUP_DRAFT_STORAGE_KEY,
    JSON.stringify(serializeSetupDraft(formData)),
  );
}

function restoreSetupDraft(): StoryOfUsSetupFormData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawDraft = window.localStorage.getItem(STORYOFUS_SETUP_DRAFT_STORAGE_KEY);

  if (!rawDraft) {
    return null;
  }

  try {
    const parsedDraft = JSON.parse(rawDraft) as Partial<StoryOfUsSetupDraft>;
    const emptyFormData = createEmptyStoryOfUsSetupFormData();
    const restoredTimeline: StoryOfUsTimelineItem[] = Array.isArray(parsedDraft.timeline)
      ? parsedDraft.timeline.map((item, index) => ({
          id: typeof item.id === "string" ? item.id : createTimelineItemId(),
          title: typeof item.title === "string" ? item.title : "",
          eventDate: typeof item.eventDate === "string" ? item.eventDate : "",
          description: typeof item.description === "string" ? item.description : "",
          sortOrder: index,
        }))
      : [];
    const restoredLetters: StoryOfUsLetterItem[] = Array.isArray(parsedDraft.letters)
      ? parsedDraft.letters.map((letter, index) => ({
          id: typeof letter.id === "string" ? letter.id : createLetterItemId(),
          type: letter.type === "love_letter" ? "love_letter" : "open_when",
          title: typeof letter.title === "string" ? letter.title : "",
          body: typeof letter.body === "string" ? letter.body : "",
          sortOrder: index,
        }))
      : [];

    return {
      ...emptyFormData,
      orderReference:
        typeof parsedDraft.orderReference === "string"
          ? parsedDraft.orderReference
          : emptyFormData.orderReference,
      status: parsedDraft.status ?? emptyFormData.status,
      contactCouple: {
        ...emptyFormData.contactCouple,
        ...(parsedDraft.contactCouple ?? {}),
      },
      media: {
        photos: [],
        puzzle: {
          selectedPhotoId: null,
          confirmedNoPuzzle: Boolean(parsedDraft.media?.puzzle?.confirmedNoPuzzle),
        },
      },
      musicVoice: {
        music: {
          ...emptyFormData.musicVoice.music,
          ...(parsedDraft.musicVoice?.music ?? {}),
        },
        voiceNote: null,
      },
      confirmedSkips: parsedDraft.confirmedSkips ?? emptyFormData.confirmedSkips,
      timeline: restoredTimeline,
      letters: restoredLetters,
    };
  } catch {
    clearSetupDraft();
    return null;
  }
}

function clearSetupDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORYOFUS_SETUP_DRAFT_STORAGE_KEY);
}

function createPhotoDraftId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTimelineItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `timeline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createLetterItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `letter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatFileSizeMb(sizeBytes: number) {
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatFileSize(sizeBytes: number) {
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

function getOrderedTimelineItems(items: StoryOfUsTimelineItem[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function getOrderedLetters(letters: StoryOfUsLetterItem[]) {
  return [...letters].sort((a, b) => a.sortOrder - b.sortOrder);
}

function getSelectedPuzzlePhoto(photos: StoryOfUsPhotoDraftItem[], selectedPhotoId: string | null) {
  if (!selectedPhotoId) {
    return undefined;
  }

  return photos.find((photo) => photo.id === selectedPhotoId);
}

function displayValue(value: string | number | null | undefined, fallback = "Belirtilmedi") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : fallback;
  }

  return value.trim() ? value : fallback;
}

function getOpenWhenTitlePlaceholder(index: number) {
  const placeholders = [
    "Beni özlediğinde aç",
    "Kötü hissettiğinde aç",
    "Gülümsemeye ihtiyacın olduğunda aç",
  ];

  return placeholders[index % placeholders.length];
}

function PhotosPuzzleStep({
  photos,
  puzzle,
  onAddPhotoFiles,
  onUpdatePhotoCaption,
  onRemovePhoto,
  onSelectPuzzlePhoto,
  onClearPuzzleSelection,
}: {
  photos: StoryOfUsPhotoDraftItem[];
  puzzle: StoryOfUsPuzzleData;
  onAddPhotoFiles: (files: FileList | File[]) => void;
  onUpdatePhotoCaption: (photoId: string, caption: string) => void;
  onRemovePhoto: (photoId: string) => void;
  onSelectPuzzlePhoto: (photoId: string) => void;
  onClearPuzzleSelection: () => void;
}) {
  const selectedPuzzlePhoto = photos.find((photo) => photo.id === puzzle.selectedPhotoId);

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h4 className="text-base font-semibold text-rose-950">Fotoğraflarınızı ekleyin</h4>
            <p className="mt-1 text-sm leading-6 text-rose-950/60">
              Birden fazla fotoğraf seçebilirsiniz. Bu görseller galeri alanında kullanılacak,
              içlerinden birini de puzzle için seçebileceksiniz.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300">
            Fotoğraf seç
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) {
                  onAddPhotoFiles(event.target.files);
                  event.target.value = "";
                }
              }}
            />
          </label>
        </div>
      </section>

      {photos.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-rose-200 bg-[#fffaf8] p-6 text-center shadow-sm shadow-rose-100/40">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100" />
          <h4 className="text-base font-semibold text-rose-950">Henüz fotoğraf eklenmedi.</h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-950/60">
            Eklediğiniz fotoğraflar romantik galeri için hazırlanacak. Bir tanesini de mini puzzle
            deneyimi için özel olarak seçebilirsiniz.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => {
            const isSelectedForPuzzle = photo.id === puzzle.selectedPhotoId;

            return (
              <article
                key={photo.id}
                className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition duration-200 ${
                  isSelectedForPuzzle
                    ? "border-rose-300 shadow-rose-200 ring-4 ring-rose-100"
                    : "border-rose-100 shadow-rose-100/50 hover:border-rose-200"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-rose-50">
                  <img
                    src={photo.previewUrl}
                    alt={`Fotoğraf önizlemesi ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {isSelectedForPuzzle && (
                    <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm shadow-rose-200">
                      Puzzle fotoğrafı
                    </span>
                  )}
                </div>
                <div className="grid gap-3 p-4">
                  <SetupTextField
                    label="Fotoğraf notu"
                    value={photo.caption}
                    onChange={(caption) => onUpdatePhotoCaption(photo.id, caption)}
                    placeholder="Bu anı birkaç kelimeyle anlatın"
                  />
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPuzzlePhoto(photo.id)}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                        isSelectedForPuzzle
                          ? "bg-rose-100 text-rose-700"
                          : "bg-rose-500 text-white shadow-md shadow-rose-200 hover:bg-rose-600"
                      }`}
                    >
                      {isSelectedForPuzzle ? "Puzzle fotoğrafı seçildi" : "Bu fotoğrafı puzzle yap"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(photo.id)}
                      className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Bu fotoğrafı kaldır
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedPuzzlePhoto ? (
        <section className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/50 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr_auto] sm:items-center">
            <img
              src={selectedPuzzlePhoto.previewUrl}
              alt="Seçilen puzzle fotoğrafı"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md shadow-rose-100 sm:w-[140px]"
              loading="lazy"
              decoding="async"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
                Puzzle fotoğrafı
              </p>
              <h4 className="mt-1 text-base font-semibold text-rose-950">
                Bu fotoğraf puzzle deneyimi için seçildi.
              </h4>
              {selectedPuzzlePhoto.caption && (
                <p className="mt-1 text-sm leading-6 text-rose-950/60">
                  {selectedPuzzlePhoto.caption}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClearPuzzleSelection}
              className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Puzzle seçimini temizle
            </button>
          </div>
        </section>
      ) : photos.length > 0 ? (
        <section className="rounded-3xl border border-dashed border-rose-200 bg-rose-50/70 p-4 text-sm leading-6 text-rose-950/60">
          Puzzle için bir fotoğraf seçmediğiniz sürece puzzle alanı boş kalacak. İsterseniz
          yukarıdaki kartlardan birini seçebilirsiniz.
        </section>
      ) : null}
    </div>
  );
}

function MusicVoiceStep({
  music,
  voiceNote,
  voiceNoteSkip,
  onUpdateMusicField,
  onAddVoiceNoteFile,
  onRemoveVoiceNote,
  onRequestVoiceNoteSkip,
  onConfirmVoiceNoteSkip,
  onUndoVoiceNoteSkip,
}: {
  music: StoryOfUsMusicData;
  voiceNote: StoryOfUsVoiceNoteData | null;
  voiceNoteSkip?: StoryOfUsSkipState;
  onUpdateMusicField: (field: keyof StoryOfUsMusicData, value: string) => void;
  onAddVoiceNoteFile: (file: File) => void;
  onRemoveVoiceNote: () => void;
  onRequestVoiceNoteSkip: () => void;
  onConfirmVoiceNoteSkip: () => void;
  onUndoVoiceNoteSkip: () => void;
}) {
  const isVoiceNoteSkipWarningVisible = !voiceNote && voiceNoteSkip?.warned && !voiceNoteSkip.confirmed;
  const isVoiceNoteSkipped = !voiceNote && voiceNoteSkip?.confirmed;

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Şarkınızı ekleyin</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Spotify bölümünde görünecek şarkı bilgilerini burada hazırlıyoruz. Şimdilik linki
            otomatik okumuyoruz; başlık ve sanatçıyı siz yazabilirsiniz.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SetupTextField
            label="Spotify şarkı linki"
            value={music.spotifyUrl}
            onChange={(nextValue) => onUpdateMusicField("spotifyUrl", nextValue)}
            placeholder="https://open.spotify.com/track/..."
            helperText="Şarkı linkini Spotify’dan kopyalayıp buraya yapıştırabilirsiniz."
            className="sm:col-span-2"
          />
          <SetupTextField
            label="Şarkı adı"
            value={music.songTitle}
            onChange={(nextValue) => onUpdateMusicField("songTitle", nextValue)}
            placeholder="Örn: Şarkımız"
          />
          <SetupTextField
            label="Sanatçı"
            value={music.artistName}
            onChange={(nextValue) => onUpdateMusicField("artistName", nextValue)}
            placeholder="Örn: Bize özel"
          />
          <SetupTextField
            label="Başlangıç saniyesi"
            type="number"
            value={music.startAtSeconds ? String(music.startAtSeconds) : ""}
            onChange={(nextValue) => onUpdateMusicField("startAtSeconds", nextValue)}
            placeholder="0"
            helperText="Şarkının özel bir yerden başlamasını isterseniz saniye olarak yazın. Boş bırakırsanız baştan başlar."
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Ses notu</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            İsterseniz sevgilinize özel kısa bir ses notu ekleyebilirsiniz. Dosya sadece bu ekranda
            yerel önizleme için tutulur.
          </p>
        </div>

        {voiceNote ? (
          <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/40">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
                  Seçilen ses notu
                </p>
                <h5 className="mt-1 text-base font-semibold text-rose-950">
                  {voiceNote.originalFilename}
                </h5>
                <p className="mt-1 text-sm text-rose-950/55">
                  {formatFileSizeMb(voiceNote.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={onRemoveVoiceNote}
                className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Ses notunu kaldır
              </button>
            </div>
            <audio
              src={voiceNote.previewUrl}
              controls
              className="w-full rounded-2xl"
            >
              Tarayıcınız ses önizlemeyi desteklemiyor.
            </audio>
          </div>
        ) : isVoiceNoteSkipped ? (
          <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-4 shadow-sm shadow-rose-100/40">
            <p className="text-sm font-semibold text-rose-800">
              Ses notu bölümü isteğiniz üzerine kaldırılacak.
            </p>
            <button
              type="button"
              onClick={onUndoVoiceNoteSkip}
              className="mt-4 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Vazgeç, ses notu ekleyeceğim
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-rose-200 bg-[#fffaf8] p-6 text-center transition hover:border-rose-300 hover:bg-rose-50/60">
              <span className="text-base font-semibold text-rose-950">Ses notunuzu seçin</span>
              <span className="mt-2 max-w-md text-sm leading-6 text-rose-950/60">
                MP3, MP4, WAV, WebM veya OGG formatında tek bir ses dosyası ekleyebilirsiniz.
              </span>
              <span className="mt-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200">
                Ses dosyası seç
              </span>
              <input
                type="file"
                accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    onAddVoiceNoteFile(file);
                    event.target.value = "";
                  }
                }}
              />
            </label>

            {isVoiceNoteSkipWarningVisible ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm shadow-amber-100/50">
                <p className="text-sm leading-6 text-amber-950/80">
                  Ses notu eklemezseniz size özel hazırlanan web sitesinde ses notu bölümü
                  görünmeyecek. Emin misiniz?
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={onConfirmVoiceNoteSkip}
                    className="rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-600"
                  >
                    Evet, ses notu istemiyorum
                  </button>
                  <button
                    type="button"
                    onClick={onUndoVoiceNoteSkip}
                    className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Vazgeç, ses notu ekleyeceğim
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onRequestVoiceNoteSkip}
                className="justify-self-start rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Ses notu eklemek istemiyorum
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TimelineStep({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
}: {
  items: StoryOfUsTimelineItem[];
  onAddItem: () => void;
  onUpdateItem: (
    itemId: string,
    field: keyof Pick<StoryOfUsTimelineItem, "title" | "eventDate" | "description">,
    value: string,
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
}) {
  const orderedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h4 className="text-base font-semibold text-rose-950">
              İlişkinizdeki özel anları sırayla ekleyin.
            </h4>
            <p className="mt-1 text-sm leading-6 text-rose-950/60">
              İlk tanışma, ilk buluşma, yıl dönümü, birlikte gidilen özel bir yer gibi anılar
              olabilir.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddItem}
            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
          >
            Yeni anı ekle
          </button>
        </div>
      </section>

      {orderedItems.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-rose-200 bg-[#fffaf8] p-6 text-center shadow-sm shadow-rose-100/40">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100" />
          <h4 className="text-base font-semibold text-rose-950">
            Henüz zaman çizelgesi anısı eklenmedi.
          </h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-950/60">
            Bu bölüm daha sonra doğrulama ve atlama sistemiyle isteğe bağlı hale getirilebilir.
            Şimdilik anılarınızı eklemek için yukarıdaki butonu kullanabilirsiniz.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {orderedItems.map((item, index) => {
            const isFirstItem = index === 0;
            const isLastItem = index === orderedItems.length - 1;

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm shadow-rose-100/50 sm:p-5"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                        Zaman çizelgesi anısı
                      </p>
                      <h5 className="mt-1 text-base font-semibold text-rose-950">
                        {item.title || "Başlıksız anı"}
                      </h5>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onMoveItem(item.id, "up")}
                      disabled={isFirstItem}
                      className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Yukarı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveItem(item.id, "down")}
                      disabled={isLastItem}
                      className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Aşağı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="rounded-full border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Anıyı kaldır
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SetupTextField
                    label="Anı başlığı"
                    value={item.title}
                    onChange={(nextValue) => onUpdateItem(item.id, "title", nextValue)}
                    placeholder="İlk tanıştığımız gün"
                  />
                  <SetupTextField
                    label="Tarih"
                    type="date"
                    value={item.eventDate}
                    onChange={(nextValue) => onUpdateItem(item.id, "eventDate", nextValue)}
                    placeholder="2024-06-12"
                  />
                  <div className="sm:col-span-2">
                    <SetupTextArea
                      label="Bu anıyı kısaca anlatın"
                      value={item.description}
                      onChange={(nextValue) => onUpdateItem(item.id, "description", nextValue)}
                      placeholder="O gün ne olmuştu, neden özeldi?"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {orderedItems.length > 0 && (
        <section className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/50 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
              Önizleme
            </p>
            <h4 className="mt-1 text-base font-semibold text-rose-950">
              Zaman çizelgesi önizlemesi
            </h4>
          </div>
          <div className="grid gap-3">
            {orderedItems.map((item, index) => (
              <article
                key={`preview-${item.id}`}
                className="relative rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/40"
              >
                <div className="flex gap-3">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-rose-400 shadow-sm shadow-rose-200" />
                  <div>
                    <h5 className="text-sm font-semibold text-rose-950">
                      {item.title || "Başlıksız anı"}
                    </h5>
                    {item.eventDate && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                        {item.eventDate}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-rose-950/60">
                        {item.description}
                      </p>
                    )}
                    {!item.eventDate && !item.description && (
                      <p className="mt-2 text-sm leading-6 text-rose-950/45">
                        {index + 1}. anı için detaylar eklendikçe burada görünecek.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LettersStep({
  letters,
  onAddLoveLetter,
  onAddOpenWhenLetter,
  onUpdateLetter,
  onRemoveLetter,
  onMoveLetter,
}: {
  letters: StoryOfUsLetterItem[];
  onAddLoveLetter: () => void;
  onAddOpenWhenLetter: () => void;
  onUpdateLetter: (
    letterId: string,
    field: keyof Pick<StoryOfUsLetterItem, "title" | "body">,
    value: string,
  ) => void;
  onRemoveLetter: (letterId: string) => void;
  onMoveLetter: (letterId: string, direction: "up" | "down") => void;
}) {
  const orderedLetters = [...letters].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasLoveLetter = orderedLetters.some((letter) => letter.type === "love_letter");

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h4 className="text-base font-semibold text-rose-950">
              Sevgilinize özel mektuplar ekleyin.
            </h4>
            <p className="mt-1 text-sm leading-6 text-rose-950/60">
              Aşk mektubu ana romantik mesajınız olacak. Open-when mektupları ise farklı anlarda
              açılacak küçük sürpriz notlar gibi düşünebilirsiniz.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <button
              type="button"
              onClick={onAddLoveLetter}
              disabled={hasLoveLetter}
              className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Aşk mektubu ekle
            </button>
            <button
              type="button"
              onClick={onAddOpenWhenLetter}
              className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Open-when mektubu ekle
            </button>
          </div>
        </div>
        {hasLoveLetter && (
          <p className="mt-3 text-xs leading-5 text-rose-950/45">
            Ana aşk mektubu eklendiği için ikinci bir aşk mektubu eklenemez.
          </p>
        )}
      </section>

      {orderedLetters.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-rose-200 bg-[#fffaf8] p-6 text-center shadow-sm shadow-rose-100/40">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100" />
          <h4 className="text-base font-semibold text-rose-950">Henüz mektup eklenmedi.</h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-950/60">
            Bu bölüm daha sonra doğrulama ve atlama sistemiyle isteğe bağlı hale getirilebilir.
            Şimdilik ana mektubunuzu veya open-when notlarınızı eklemek için yukarıdaki butonları
            kullanabilirsiniz.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {orderedLetters.map((letter, index) => {
            const isFirstLetter = index === 0;
            const isLastLetter = index === orderedLetters.length - 1;
            const isLoveLetter = letter.type === "love_letter";

            return (
              <article
                key={letter.id}
                className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm shadow-rose-100/50 sm:p-5"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                      {isLoveLetter ? "Aşk mektubu" : "Open when"}
                    </span>
                    <h5 className="text-base font-semibold text-rose-950">
                      {letter.title || "Başlıksız mektup"}
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onMoveLetter(letter.id, "up")}
                      disabled={isFirstLetter}
                      className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Yukarı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveLetter(letter.id, "down")}
                      disabled={isLastLetter}
                      className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Aşağı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveLetter(letter.id)}
                      className="rounded-full border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Mektubu kaldır
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <SetupTextField
                    label="Mektup başlığı"
                    value={letter.title}
                    onChange={(nextValue) => onUpdateLetter(letter.id, "title", nextValue)}
                    placeholder={
                      isLoveLetter ? "Aşk mektubum" : getOpenWhenTitlePlaceholder(index)
                    }
                  />
                  <SetupTextArea
                    label="Mektup içeriği"
                    value={letter.body}
                    onChange={(nextValue) => onUpdateLetter(letter.id, "body", nextValue)}
                    placeholder="Buraya mektubunuzu yazın…"
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {orderedLetters.length > 0 && (
        <section className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/50 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
              Önizleme
            </p>
            <h4 className="mt-1 text-base font-semibold text-rose-950">Mektup önizlemesi</h4>
          </div>
          <div className="grid gap-3">
            {orderedLetters.map((letter) => {
              const isLoveLetter = letter.type === "love_letter";

              return (
                <article
                  key={`preview-${letter.id}`}
                  className="rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/40"
                >
                  <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                    {isLoveLetter ? "Aşk mektubu" : "Open when"}
                  </span>
                  <h5 className="mt-3 text-sm font-semibold text-rose-950">
                    {letter.title || "Başlıksız mektup"}
                  </h5>
                  {letter.body ? (
                    <p className="mt-2 text-sm leading-6 text-rose-950/60">{letter.body}</p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-rose-950/45">
                      Mektup içeriği yazıldığında burada romantik bir önizleme olarak görünecek.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewSubmitStep({
  formData,
  onEditStep,
}: {
  formData: StoryOfUsSetupFormData;
  onEditStep: (stepId: StoryOfUsSetupStepId) => void;
}) {
  const selectedPuzzlePhoto = getSelectedPuzzlePhoto(
    formData.media.photos,
    formData.media.puzzle.selectedPhotoId,
  );
  const orderedTimelineItems = getOrderedTimelineItems(formData.timeline);
  const orderedLetters = getOrderedLetters(formData.letters);
  const voiceNoteSkip = formData.confirmedSkips.voiceNote;

  return (
    <div className="grid gap-5">
      <ReviewSection
        title="İletişim & çift bilgileri"
        description="Sipariş ve romantik metinler için temel bilgiler."
        onEdit={() => onEditStep("contactCouple")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ReviewField label="Adınız" value={displayValue(formData.contactCouple.customerName)} />
          <ReviewField
            label="E-posta adresiniz"
            value={displayValue(formData.contactCouple.customerEmail)}
          />
          <ReviewField
            label="Telefon numaranız"
            value={displayValue(formData.contactCouple.contactPhone)}
          />
          <ReviewField
            label="Partnerinizin adı"
            value={displayValue(formData.contactCouple.partnerName)}
          />
          <ReviewField
            label="Sitede nasıl görünsün?"
            value={displayValue(formData.contactCouple.coupleDisplayName)}
          />
          <ReviewField
            label="İlişki başlangıç tarihiniz"
            value={displayValue(formData.contactCouple.relationshipStartDate)}
          />
          <ReviewField
            label="Bu tarihe ne diyelim?"
            value={displayValue(formData.contactCouple.specialDateLabel)}
          />
          <ReviewField
            label="Partnerinize hitap şekliniz"
            value={displayValue(formData.contactCouple.recipientNickname)}
          />
          <ReviewField
            label="Kısaca hikayeniz"
            value={displayValue(formData.contactCouple.relationshipStory)}
            className="sm:col-span-2"
          />
        </div>
      </ReviewSection>

      <ReviewSection
        title="Fotoğraflar & puzzle"
        description="Galeri görselleri ve mini puzzle için seçilen fotoğraf."
        onEdit={() => onEditStep("photosPuzzle")}
      >
        <div className="grid gap-4">
          <ReviewField
            label="Toplam fotoğraf"
            value={`${formData.media.photos.length} fotoğraf`}
          />
          {formData.media.photos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {formData.media.photos.map((photo, index) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm shadow-rose-100/40"
                >
                  <img
                    src={photo.previewUrl}
                    alt={`Fotoğraf önizlemesi ${index + 1}`}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                      Fotoğraf {index + 1}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-rose-950/60">
                      {photo.caption || "Fotoğraf notu eklenmedi."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <ReviewSoftHint>Henüz galeri fotoğrafı eklenmedi.</ReviewSoftHint>
          )}

          {selectedPuzzlePhoto ? (
            <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                Seçilen puzzle fotoğrafı
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                <img
                  src={selectedPuzzlePhoto.previewUrl}
                  alt="Seçilen puzzle fotoğrafı"
                  className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm shadow-rose-100 sm:w-[120px]"
                  loading="lazy"
                  decoding="async"
                />
                <p className="text-sm leading-6 text-rose-950/60">
                  {selectedPuzzlePhoto.caption || "Bu fotoğraf puzzle için seçildi."}
                </p>
              </div>
            </div>
          ) : (
            <ReviewSoftHint>Puzzle için henüz bir fotoğraf seçilmedi.</ReviewSoftHint>
          )}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Müzik & ses notu"
        description="Spotify şarkısı ve isteğe bağlı ses notu özeti."
        onEdit={() => onEditStep("musicVoice")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ReviewField
            label="Spotify şarkı linki"
            value={displayValue(formData.musicVoice.music.spotifyUrl)}
            className="sm:col-span-2"
          />
          <ReviewField
            label="Şarkı adı"
            value={displayValue(formData.musicVoice.music.songTitle)}
          />
          <ReviewField
            label="Sanatçı"
            value={displayValue(formData.musicVoice.music.artistName)}
          />
          <ReviewField
            label="Başlangıç saniyesi"
            value={
              formData.musicVoice.music.startAtSeconds
                ? `${formData.musicVoice.music.startAtSeconds} saniye`
                : "Baştan başlasın"
            }
          />
          {formData.musicVoice.voiceNote ? (
            <ReviewField
              label="Ses notu"
              value={`${formData.musicVoice.voiceNote.originalFilename} · ${formatFileSize(
                formData.musicVoice.voiceNote.sizeBytes,
              )}`}
            />
          ) : voiceNoteSkip?.confirmed ? (
            <ReviewField
              label="Ses notu"
              value="Ses notu bölümü isteğiniz üzerine kaldırılacak."
            />
          ) : (
            <ReviewField label="Ses notu" value="Henüz ses notu eklenmedi." />
          )}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Zaman çizelgesi"
        description="İlişkinizin özel anları sıralı şekilde görünecek."
        onEdit={() => onEditStep("timeline")}
      >
        {orderedTimelineItems.length > 0 ? (
          <div className="grid gap-3">
            {orderedTimelineItems.map((item, index) => (
              <article
                key={item.id}
                className="rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/40"
              >
                <div className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                    {index + 1}
                  </span>
                  <div>
                    <h5 className="text-sm font-semibold text-rose-950">
                      {item.title || "Başlıksız anı"}
                    </h5>
                    {item.eventDate && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                        {item.eventDate}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-rose-950/60">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ReviewSoftHint>Henüz zaman çizelgesi anısı eklenmedi.</ReviewSoftHint>
        )}
      </ReviewSection>

      <ReviewSection
        title="Mektuplar"
        description="Aşk mektubu ve open-when sürpriz notları."
        onEdit={() => onEditStep("letters")}
      >
        {orderedLetters.length > 0 ? (
          <div className="grid gap-3">
            {orderedLetters.map((letter) => {
              const isLoveLetter = letter.type === "love_letter";

              return (
                <article
                  key={letter.id}
                  className="rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/40"
                >
                  <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                    {isLoveLetter ? "Aşk mektubu" : "Open when"}
                  </span>
                  <h5 className="mt-3 text-sm font-semibold text-rose-950">
                    {letter.title || "Başlıksız mektup"}
                  </h5>
                  {letter.body ? (
                    <p className="mt-2 text-sm leading-6 text-rose-950/60">{letter.body}</p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-rose-950/45">
                      Mektup içeriği henüz yazılmadı.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <ReviewSoftHint>Henüz mektup eklenmedi.</ReviewSoftHint>
        )}
      </ReviewSection>

      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-5 text-center shadow-sm shadow-rose-100/50">
        <h4 className="text-xl font-bold text-rose-950">Her şey hazır mı?</h4>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-rose-950/60">
          Bir sonraki adımda bu bilgiler güvenli şekilde gönderilecek. Şu an bu buton sadece
          görsel hazırlık olarak duruyor.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-rose-950/50">
          Eksik bıraktığınız alanlar varsa bir sonraki validation adımında size nazikçe
          hatırlatacağız.
        </p>
        <button
          type="button"
          disabled
          className="mt-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 disabled:cursor-not-allowed disabled:opacity-55"
        >
          Bilgileri gönder
        </button>
        <p className="mt-2 text-xs text-rose-950/45">
          Gönderim bağlantısı sonraki adımda eklenecek.
        </p>
      </section>
    </div>
  );
}

function ReviewSection({
  title,
  description,
  onEdit,
  children,
}: {
  title: string;
  description: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-rose-950">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">{description}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Düzenle
        </button>
      </div>
      {children}
    </section>
  );
}

function ReviewField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-rose-100 bg-[#fffaf8] p-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-rose-950/70">{value}</p>
    </div>
  );
}

function ReviewSoftHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 p-4 text-sm leading-6 text-rose-950/55">
      {children}
    </div>
  );
}

function ContactCoupleStep({
  value,
  onChange,
}: {
  value: StoryOfUsContactCoupleData;
  onChange: (field: keyof StoryOfUsContactCoupleData, value: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Size ulaşabileceğimiz bilgiler</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Siparişinizle ilgili iletişim için bu bilgileri kullanacağız.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SetupTextField
            label="Adınız"
            value={value.customerName}
            onChange={(nextValue) => onChange("customerName", nextValue)}
            placeholder="Örn: Cavanşir"
          />
          <SetupTextField
            label="E-posta adresiniz"
            type="email"
            value={value.customerEmail}
            onChange={(nextValue) => onChange("customerEmail", nextValue)}
            placeholder="ornek@mail.com"
          />
          <SetupTextField
            label="Telefon numaranız"
            type="tel"
            value={value.contactPhone}
            onChange={(nextValue) => onChange("contactPhone", nextValue)}
            placeholder="05xx xxx xx xx"
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Çift detayları</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Demo sayfanın romantik metinlerinde kullanılacak temel bilgileri hazırlıyoruz.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SetupTextField
            label="Partnerinizin adı"
            value={value.partnerName}
            onChange={(nextValue) => onChange("partnerName", nextValue)}
            placeholder="Örn: Derya"
          />
          <SetupTextField
            label="Sitede nasıl görünsün?"
            value={value.coupleDisplayName}
            onChange={(nextValue) => onChange("coupleDisplayName", nextValue)}
            placeholder="Derya & Cavanşir"
            helperText="Örn: Derya & Cavanşir"
          />
          <SetupTextField
            label="İlişki başlangıç tarihiniz"
            type="date"
            value={value.relationshipStartDate}
            onChange={(nextValue) => onChange("relationshipStartDate", nextValue)}
          />
          <SetupTextField
            label="Bu tarihe ne diyelim?"
            value={value.specialDateLabel}
            onChange={(nextValue) => onChange("specialDateLabel", nextValue)}
            placeholder="Tanıştığımız gün"
            helperText="Örn: Tanıştığımız gün, ilk buluşmamız, yıl dönümümüz"
          />
          <SetupTextField
            label="Partnerinize hitap şekliniz"
            value={value.recipientNickname}
            onChange={(nextValue) => onChange("recipientNickname", nextValue)}
            placeholder="Aşkım, sevgilim, bitanem..."
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <SetupTextArea
          label="Kısaca hikayeniz"
          value={value.relationshipStory}
          onChange={(nextValue) => onChange("relationshipStory", nextValue)}
          placeholder="Nasıl tanıştınız, ilişkinizi özel yapan küçük detaylar neler?"
          helperText="Birkaç cümle yeterli; bunu romantik metinlerde referans olarak kullanacağız."
        />
      </section>
    </div>
  );
}

function SetupTextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helperText,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "date" | "number";
  placeholder?: string;
  helperText?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-rose-950">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm text-rose-950 shadow-sm shadow-rose-100/40 outline-none transition placeholder:text-rose-950/35 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
      />
      {helperText && <span className="mt-1.5 block text-xs leading-5 text-rose-950/50">{helperText}</span>}
    </label>
  );
}

function SetupTextArea({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-rose-950">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="mt-2 w-full resize-y rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm leading-6 text-rose-950 shadow-sm shadow-rose-100/40 outline-none transition placeholder:text-rose-950/35 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
      />
      {helperText && <span className="mt-1.5 block text-xs leading-5 text-rose-950/50">{helperText}</span>}
    </label>
  );
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
