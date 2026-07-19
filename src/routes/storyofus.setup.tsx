import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";

import {
  getStoryOfUsSetupAccess,
  type StoryOfUsSetupAccessExistingMediaItem,
  type StoryOfUsSetupAccessInitialData,
  type StoryOfUsSetupAccessResult,
} from "../lib/storyofus/setupAccess.server";
import {
  removeStoryOfUsSetupMedia,
  uploadStoryOfUsSetupMedia,
} from "../lib/storyofus/mediaUpload.server";
import { submitStoryOfUsSetup } from "../lib/storyofus/submitSetup.server";
import { storyOfUsDemoCtaConfig } from "../lib/storyofus/demoCtaConfig";
import {
  STORYOFUS_SETUP_STEPS,
  createEmptyStoryOfUsSetupFormData,
  type StoryOfUsContactCoupleData,
  type StoryOfUsLetterItem,
  type StoryOfUsLegalConsents,
  type StoryOfUsMusicData,
  type StoryOfUsOpeningPhotosData,
  type StoryOfUsPhotoDraftItem,
  type StoryOfUsPromptPhotoItem,
  type StoryOfUsPuzzleData,
  type StoryOfUsOptionalSectionId,
  type StoryOfUsSkipState,
  type StoryOfUsSiteAccessData,
  type StoryOfUsSetupStepId,
  type StoryOfUsSetupFormData,
  type StoryOfUsTimelineItem,
  type StoryOfUsVoiceNoteData,
} from "../lib/storyofus/setupTypes";

export const Route = createFileRoute("/storyofus/setup")({
  validateSearch: (search) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: StoryOfUsSetupRoute,
});

type PlaceholderCard = {
  title: string;
  description: string;
};

const STORYOFUS_SETUP_DRAFT_STORAGE_KEY = "storyofus.setup.draft.v1";

const DEFAULT_LOVE_LETTER_TITLE = "Kalbimden sana birkaç satır";

const DEFAULT_OPEN_WHEN_LETTERS: Array<Pick<StoryOfUsLetterItem, "type" | "title" | "body">> = [
  {
    type: "open_when",
    title: "Beni özlediğinde aç",
    body: "Gözlerini kapat ve beni yanında düşün. Kalbim tam orada, sana sarılıyor.",
  },
  {
    type: "open_when",
    title: "Üzgün olduğunda aç",
    body: "Bugün zor geçmiş olabilir ama sen hala benim en güzel iyi ki'msin.",
  },
  {
    type: "open_when",
    title: "Seni ne kadar sevdiğimi hatırlamak için aç",
    body: "Seni kelimelere sığmayacak kadar, her gün daha daha çokkk seviyorumm bitanemm.",
  },
  {
    type: "open_when",
    title: "Gülümsemeye ihtiyacın olduğunda aç",
    body: "Şu an yüzünde küçücük bir gülümseme varsa, ben kazandım demekkk.",
  },
  {
    type: "open_when",
    title: "Kendini yalnız hissettiğinde aç",
    body: "Mesafeler ne olursa olsun, sen benim en yakın yerimsinn.",
  },
];

type StoryOfUsSetupDraft = Pick<
  StoryOfUsSetupFormData,
  | "orderReference"
  | "status"
  | "contactCouple"
  | "confirmedSkips"
  | "timeline"
  | "letters"
  | "legalConsents"
> & {
  siteAccess: Pick<StoryOfUsSiteAccessData, "passcodeHint" | "hasExistingPasscode">;
  media: {
    openingPhotos: {
      firstPerson: null;
      secondPerson: null;
    };
    promptPhotos: Array<Omit<StoryOfUsPromptPhotoItem, "photo"> & {
      photo: null;
    }>;
    puzzle: {
      selectedPhotoId: null;
      puzzlePhoto: null;
      sourceType: null;
      confirmedNoPuzzle: boolean;
    };
    loveLetterPhoto: null;
  };
  musicVoice: {
    music: StoryOfUsMusicData;
    voiceNote: null;
  };
};

type OptionalSectionWarning = {
  sectionId: StoryOfUsOptionalSectionId;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
};

type StepValidationNotice = {
  blockingErrors: string[];
  contactFieldErrors?: ContactCoupleFieldErrors;
  siteAccessFieldErrors?: SiteAccessFieldErrors;
  warning: OptionalSectionWarning | null;
  warnings?: OptionalSectionWarning[];
};

type ContactCoupleFieldErrors = Partial<Record<keyof StoryOfUsContactCoupleData, string>>;
type SiteAccessFieldErrors = Partial<Record<keyof StoryOfUsSiteAccessData, string>>;
type LegalConsentKey = keyof StoryOfUsLegalConsents;

type StoryOfUsSubmissionResult = {
  submissionId: string;
  setupToken: string | null;
  status: "submitted";
  editableUntil: string | null;
};

type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

type SetupAccessUiState =
  | {
      status: "missing_token";
    }
  | {
      status: "checking";
    }
  | {
      status: "error";
      message: string;
    }
  | StoryOfUsSetupAccessResult;

function StoryOfUsSetupRoute() {
  const search = Route.useSearch();
  const setupToken = typeof search.token === "string" ? search.token.trim() : "";
  const checkSetupAccess = useServerFn(getStoryOfUsSetupAccess);
  const submitSetup = useServerFn(submitStoryOfUsSetup);
  const uploadSetupMedia = useServerFn(uploadStoryOfUsSetupMedia);
  const removeSetupMedia = useServerFn(removeStoryOfUsSetupMedia);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(() => createEmptyStoryOfUsSetupFormData());
  const [wasDraftRestored, setWasDraftRestored] = useState(false);
  const [existingMedia, setExistingMedia] = useState<StoryOfUsSetupAccessExistingMediaItem[]>([]);
  const [setupAccess, setSetupAccess] = useState<SetupAccessUiState>(() =>
    setupToken ? { status: "checking" } : { status: "missing_token" },
  );
  const [validationNotice, setValidationNotice] = useState<StepValidationNotice | null>(null);
  const [legalConsentErrors, setLegalConsentErrors] = useState<string[]>([]);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<StoryOfUsSubmissionResult | null>(null);
  const [hasEnteredSubmittedEditMode, setHasEnteredSubmittedEditMode] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const photoPreviewUrlsRef = useRef<Set<string>>(new Set());
  const puzzlePhotoPreviewUrlsRef = useRef<Set<string>>(new Set());
  const voiceNotePreviewUrlsRef = useRef<Set<string>>(new Set());
  const skipNextDraftSaveRef = useRef(false);
  const draftSaveSequenceRef = useRef(0);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const stepCardRef = useRef<HTMLElement | null>(null);
  const validationPanelRef = useRef<HTMLElement | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [highlightedWarningId, setHighlightedWarningId] =
    useState<StoryOfUsOptionalSectionId | null>(null);

  const totalSteps = STORYOFUS_SETUP_STEPS.length;
  const currentStep = STORYOFUS_SETUP_STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const displayedValidationNotice =
    currentStep.id === "contactCouple" && validationNotice?.contactFieldErrors
      ? mergeLiveContactValidationNotice(
          getLiveContactValidationNotice(formData.contactCouple),
          validationNotice,
        )
      : validationNotice;
  const draftSaveStatusLabel =
    draftSaveStatus === "saving"
      ? "Kaydediliyor..."
      : draftSaveStatus === "saved"
        ? "Kaydedildi"
        : draftSaveStatus === "error"
          ? "Kaydetme başarısız"
          : "Hazır";
  const draftSaveStatusClassName =
    draftSaveStatus === "saving"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : draftSaveStatus === "saved"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : draftSaveStatus === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-rose-100 bg-white text-rose-600";

  function revokeCurrentPreviewUrls() {
    photoPreviewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    photoPreviewUrlsRef.current.clear();
    puzzlePhotoPreviewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    puzzlePhotoPreviewUrlsRef.current.clear();
    voiceNotePreviewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    voiceNotePreviewUrlsRef.current.clear();
  }

  useEffect(() => {
    return () => {
      revokeCurrentPreviewUrls();
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      if (draftSaveTimeoutRef.current) {
        window.clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    setValidationNotice(null);
    setLegalConsentErrors([]);
    setSubmitError(null);
    setSubmissionResult(null);
    setHasEnteredSubmittedEditMode(false);

    if (!setupToken) {
      revokeCurrentPreviewUrls();
      setSetupAccess({ status: "missing_token" });
      setExistingMedia([]);
      setWasDraftRestored(false);
      setCurrentStepIndex(0);
      setFormData(createEmptyStoryOfUsSetupFormData());
      return () => {
        isActive = false;
      };
    }

    setSetupAccess({ status: "checking" });

    void checkSetupAccess({ data: { token: setupToken } })
      .then((accessResult) => {
        if (!isActive) {
          return;
        }

        setSetupAccess(accessResult as StoryOfUsSetupAccessResult);

        if ((accessResult as StoryOfUsSetupAccessResult).status !== "ready") {
          revokeCurrentPreviewUrls();
          setExistingMedia([]);
          setWasDraftRestored(false);
          setCurrentStepIndex(0);
          setFormData(createEmptyStoryOfUsSetupFormData());
          setHasEnteredSubmittedEditMode(false);
          return;
        }

        const readyAccess = accessResult as Extract<StoryOfUsSetupAccessResult, { status: "ready" }>;
        const restoredDraft = restoreSetupDraft(setupToken);

        revokeCurrentPreviewUrls();
        setExistingMedia(readyAccess.initialData.existingMedia);
        setFormData(
          restoredDraft
            ? {
                ...restoredDraft,
                siteAccess: {
                  ...restoredDraft.siteAccess,
                  passcode: "",
                  confirmPasscode: "",
                  hasExistingPasscode: readyAccess.initialData.siteAccess.hasExistingPasscode,
                },
              }
            : createSetupFormDataFromAccessInitialData(readyAccess.initialData),
        );
        setWasDraftRestored(Boolean(restoredDraft));
        setCurrentStepIndex(0);
        setHasEnteredSubmittedEditMode(false);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setSetupAccess({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Kurulum bağlantısı kontrol edilirken beklenmeyen bir hata oluştu.",
        });
        setExistingMedia([]);
      });

    return () => {
      isActive = false;
    };
  }, [checkSetupAccess, setupToken]);

  useEffect(() => {
    if (setupAccess.status !== "ready" || !setupToken) {
      return;
    }

    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      clearSetupDraft(setupToken);
      setDraftSaveStatus("idle");
      return;
    }

    const saveSequence = draftSaveSequenceRef.current + 1;
    draftSaveSequenceRef.current = saveSequence;
    setDraftSaveStatus("saving");

    if (draftSaveTimeoutRef.current) {
      window.clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = window.setTimeout(() => {
      try {
        saveSetupDraft(formData, setupToken);

        if (draftSaveSequenceRef.current === saveSequence) {
          setDraftSaveStatus("saved");
        }
      } catch {
        if (draftSaveSequenceRef.current === saveSequence) {
          setDraftSaveStatus("error");
        }
      }
    }, 350);

    return () => {
      if (draftSaveTimeoutRef.current) {
        window.clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [formData, setupAccess.status, setupToken]);

  function goToPreviousStep() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
    setValidationNotice(null);
    scheduleStepCardScroll();
  }

  function proceedToNextStep() {
    setCurrentStepIndex((index) => Math.min(index + 1, totalSteps - 1));
    setValidationNotice(null);
    scheduleStepCardScroll();
  }

  function goToNextStep() {
    const nextValidationNotice = validateCurrentStep(currentStep.id, formData);

    if (
      nextValidationNotice.blockingErrors.length > 0 ||
      getValidationWarnings(nextValidationNotice).length > 0
    ) {
      setValidationNotice(nextValidationNotice);
      scheduleValidationScroll(nextValidationNotice);
      return;
    }

    proceedToNextStep();
  }

  function goToStepById(stepId: StoryOfUsSetupStepId) {
    const nextStepIndex = STORYOFUS_SETUP_STEPS.findIndex((step) => step.id === stepId);

    if (nextStepIndex !== -1) {
      setCurrentStepIndex(nextStepIndex);
      setValidationNotice(null);
      scheduleStepCardScroll();
    }
  }

  function handleClearDraft() {
    if (!setupToken) {
      return;
    }

    clearSetupDraft(setupToken);
    revokeCurrentPreviewUrls();
    skipNextDraftSaveRef.current = true;
    setFormData(
      setupAccess.status === "ready"
        ? createSetupFormDataFromAccessInitialData(setupAccess.initialData)
        : createEmptyStoryOfUsSetupFormData(),
    );
    setCurrentStepIndex(0);
    setValidationNotice(null);
    setLegalConsentErrors([]);
    setWasDraftRestored(false);
  }

  function enterSubmittedEditMode() {
    setHasEnteredSubmittedEditMode(true);
    setCurrentStepIndex(0);
    setValidationNotice(null);
    setLegalConsentErrors([]);
    setSubmitError(null);
    scheduleStepCardScroll(120);
  }

  async function handleSubmitSetup() {
    if (isSubmittingSetup) {
      return;
    }

    if (setupAccess.status !== "ready" || !setupToken) {
      setSubmitError("Kurulum formunu göndermek için geçerli ödeme bağlantısı gerekiyor.");
      return;
    }

    const contactValidation = validateCurrentStep("contactCouple", formData);

    if (contactValidation.blockingErrors.length > 0) {
      setValidationNotice(contactValidation);
      setSubmitError("Devam etmeden önce temel iletişim bilgilerini tamamlamanız gerekiyor.");
      setCurrentStepIndex(0);
      scheduleValidationScroll(contactValidation, 120);
      return;
    }

    const mediaUploadBlocker = getMediaUploadBlocker(formData);

    if (mediaUploadBlocker) {
      setSubmitError(mediaUploadBlocker);
      setCurrentStepIndex(mediaUploadBlocker.includes("Ses notu") ? 2 : 1);
      scheduleStepCardScroll(120);
      return;
    }

    const setupWarnings = getFullSetupWarnings(formData);

    if (setupWarnings.length > 0) {
      setValidationNotice({
        blockingErrors: [],
        warning: setupWarnings[0],
        warnings: setupWarnings,
      });
      setSubmitError(
        "Devam etmeden önce eksik bırakılan bölümleri tamamlamanız veya istemediğinizi onaylamanız gerekiyor.",
      );
      setCurrentStepIndex(totalSteps - 1);
      scheduleWarningScroll(setupWarnings[0].sectionId, 120);
      return;
    }

    const nextLegalConsentErrors = validateLegalConsents(
      formData.legalConsents,
      formData.status === "draft",
    );

    if (nextLegalConsentErrors.length > 0) {
      setLegalConsentErrors(nextLegalConsentErrors);
      setSubmitError("Gönderim için onaylarınızı tamamlamamız gerekiyor.");
      return;
    }

    setIsSubmittingSetup(true);
    setSubmitError(null);
    setLegalConsentErrors([]);
    setSubmissionResult(null);

    try {
      const result = await submitSetup({
        data: createStoryOfUsSubmissionFormData(formData, setupToken),
      });
      clearSetupDraft(setupToken);
      revokeCurrentPreviewUrls();
      setValidationNotice(null);
      setWasDraftRestored(false);
      if (setupAccess.status === "ready") {
        setSetupAccess({
          ...setupAccess,
          mode: "edit",
          editableUntil: (result as StoryOfUsSubmissionResult).editableUntil,
        });
      }
      setSubmissionResult(result as StoryOfUsSubmissionResult);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Bilgiler gönderilirken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsSubmittingSetup(false);
    }
  }

  function requestSectionSkip(sectionId: StoryOfUsOptionalSectionId, showNotice = true) {
    setFormData((current) => ({
      ...current,
      confirmedSkips: {
        ...current.confirmedSkips,
        [sectionId]: {
          warned: true,
          confirmed: false,
        },
      },
    }));

    if (showNotice) {
      const warning = getOptionalSectionWarning(sectionId);

      setValidationNotice({
        blockingErrors: [],
        warning,
        warnings: [warning],
      });
    }
  }

  function confirmSectionSkip(sectionId: StoryOfUsOptionalSectionId, shouldProceed = true) {
    const currentWarnings = getRenderableValidationWarnings(validationNotice);
    const remainingWarnings = currentWarnings.filter((warning) => warning.sectionId !== sectionId);

    setFormData((current) => ({
      ...current,
      media:
        sectionId === "puzzle"
          ? {
              ...current.media,
              puzzle: {
                ...current.media.puzzle,
                confirmedNoPuzzle: true,
              },
            }
          : current.media,
      confirmedSkips: {
        ...current.confirmedSkips,
        [sectionId]: {
          warned: true,
          confirmed: true,
          confirmedAt: new Date().toISOString(),
        },
      },
    }));

    if (remainingWarnings.length > 0) {
      setValidationNotice((currentNotice) =>
        currentNotice
          ? {
              ...currentNotice,
              warning: remainingWarnings[0],
              warnings: remainingWarnings,
            }
          : {
              blockingErrors: [],
              warning: remainingWarnings[0],
              warnings: remainingWarnings,
            },
      );
      scheduleWarningScroll(remainingWarnings[0].sectionId);
      return;
    }

    setValidationNotice((currentNotice) =>
      currentNotice?.blockingErrors.length
        ? {
            ...currentNotice,
            warning: null,
            warnings: [],
          }
        : null,
    );

    if (shouldProceed) {
      if (
        currentStep.id === "photosPuzzle" &&
        sectionId === "photos" &&
        !hasPuzzleSource(formData.media.puzzle) &&
        !isSectionConfirmedSkipped("puzzle", formData)
      ) {
        setValidationNotice({
          blockingErrors: [],
          warning: getOptionalSectionWarning("puzzle"),
          warnings: [getOptionalSectionWarning("puzzle")],
        });
        return;
      }

      proceedToNextStep();
    }
  }

  function undoSectionSkip(sectionId: StoryOfUsOptionalSectionId) {
    setFormData((current) => ({
      ...current,
      media:
        sectionId === "puzzle"
          ? {
              ...current.media,
              puzzle: {
                ...current.media.puzzle,
                confirmedNoPuzzle: false,
              },
            }
          : current.media,
      confirmedSkips: removeConfirmedSkip(current.confirmedSkips, sectionId),
    }));
    setValidationNotice(null);
  }

  function cancelValidationWarning(sectionId: StoryOfUsOptionalSectionId) {
    undoSectionSkip(sectionId);
    goToStepById(getStepIdForOptionalSection(sectionId));
    scheduleOptionalSectionScroll(sectionId, 120);
  }

  function scheduleStepCardScroll(delayMs = 80) {
    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      scrollElementIntoView(stepCardRef.current);
    }, delayMs);
  }

  function scheduleValidationScroll(notice: StepValidationNotice, delayMs = 60) {
    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      const blockingTarget = getFirstBlockingValidationTarget(notice);

      if (blockingTarget) {
        scrollToSelector(blockingTarget, true);
        return;
      }

      const firstWarning = getRenderableValidationWarnings(notice)[0];

      if (firstWarning) {
        scrollToWarning(firstWarning.sectionId);
        return;
      }

      scrollElementIntoView(validationPanelRef.current);
    }, delayMs);
  }

  function scheduleWarningScroll(sectionId: StoryOfUsOptionalSectionId, delayMs = 60) {
    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      scrollToWarning(sectionId);
    }, delayMs);
  }

  function scheduleOptionalSectionScroll(sectionId: StoryOfUsOptionalSectionId, delayMs = 60) {
    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      const selector = getOptionalSectionTargetSelector(sectionId);
      scrollToSelector(selector, shouldFocusOptionalSection(sectionId));
    }, delayMs);
  }

  function scrollToWarning(sectionId: StoryOfUsOptionalSectionId) {
    const warningElement = document.querySelector<HTMLElement>(
      `[data-setup-warning="${sectionId}"]`,
    );

    scrollElementIntoView(warningElement ?? validationPanelRef.current);
    setHighlightedWarningId(sectionId);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedWarningId(null);
    }, 1400);
  }

  function scrollToSelector(selector: string, shouldFocus = false) {
    const element = document.querySelector<HTMLElement>(selector);
    scrollElementIntoView(element ?? stepCardRef.current, shouldFocus);
  }

  function scrollElementIntoView(element: HTMLElement | null, shouldFocus = false) {
    if (!element || typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollTop = window.scrollY + element.getBoundingClientRect().top - 88;

    window.scrollTo({
      top: Math.max(scrollTop, 0),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });

    if (!shouldFocus) {
      return;
    }

    window.setTimeout(() => {
      const focusTarget = element.matches("input, textarea, select, button")
        ? element
        : element.querySelector<HTMLElement>("input:not([type='file']), textarea, select, button");

      focusTarget?.focus({ preventScroll: true });
    }, prefersReducedMotion ? 0 : 220);
  }

  function clearSectionSkip(sectionId: StoryOfUsOptionalSectionId) {
    setFormData((current) => ({
      ...current,
      confirmedSkips: removeConfirmedSkip(current.confirmedSkips, sectionId),
    }));
  }

  function clearValidationWarning(sectionId: StoryOfUsOptionalSectionId) {
    setValidationNotice((currentNotice) => {
      const remainingWarnings = getValidationWarnings(currentNotice).filter(
        (warning) => warning.sectionId !== sectionId,
      );

      if (!currentNotice || (currentNotice.blockingErrors.length === 0 && remainingWarnings.length === 0)) {
        return null;
      }

      return {
        ...currentNotice,
        warning: remainingWarnings[0] ?? null,
        warnings: remainingWarnings,
      };
    });
  }

  function updateContactCoupleField(field: keyof StoryOfUsContactCoupleData, value: string) {
    setSubmitError(null);
    const optionalSectionId = field as StoryOfUsOptionalSectionId;
    setFormData((current) => ({
      ...current,
      contactCouple: {
        ...current.contactCouple,
        [field]: value,
      },
      confirmedSkips: value.trim()
        ? removeConfirmedSkip(current.confirmedSkips, optionalSectionId)
        : current.confirmedSkips,
    }));

    if (value.trim()) {
      clearValidationWarning(optionalSectionId);
    }
  }

  function updateSiteAccessField(field: keyof StoryOfUsSiteAccessData, value: string) {
    setSubmitError(null);
    setFormData((current) => ({
      ...current,
      siteAccess: {
        ...current.siteAccess,
        [field]: field === "passcode" || field === "confirmPasscode" ? value.replace(/\D/g, "").slice(0, 4) : value,
      },
    }));
  }

  function updateLegalConsent(consentKey: LegalConsentKey, accepted: boolean) {
    setSubmitError(null);
    setLegalConsentErrors([]);
    setFormData((current) => ({
      ...current,
      legalConsents: {
        ...current.legalConsents,
        [consentKey]: accepted
          ? {
              accepted: true,
              acceptedAt: new Date().toISOString(),
            }
          : {
              accepted: false,
            },
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
        uploadStatus: "uploading" as const,
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
      confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "photos"),
    }));
    setValidationNotice(null);

    photoDrafts.forEach((photo, index) => {
      void uploadPhotoDraft(photo, {
        section: "gallery",
        mediaType: "photo",
        semanticKey: "gallery_photo",
        sectionItemId: photo.id,
        sortOrder: formData.media.photos.length + index,
      });
    });
  }

  function createImageDraft(file: File, caption = ""): StoryOfUsPhotoDraftItem | null {
    if (!file.type.startsWith("image/")) {
      return null;
    }

    const previewUrl = URL.createObjectURL(file);
    photoPreviewUrlsRef.current.add(previewUrl);

    return {
      id: createPhotoDraftId(),
      previewUrl,
      caption,
      sortOrder: 0,
      uploadStatus: "uploading",
      file,
    };
  }

  function revokePhotoDraft(photo: StoryOfUsPhotoDraftItem | null) {
    if (!photo) {
      return;
    }

    URL.revokeObjectURL(photo.previewUrl);
    photoPreviewUrlsRef.current.delete(photo.previewUrl);
    puzzlePhotoPreviewUrlsRef.current.delete(photo.previewUrl);
  }

  async function uploadPhotoDraft(
    photo: StoryOfUsPhotoDraftItem,
    options: {
      section: "opening" | "memory_prompt" | "gallery" | "timeline" | "letter" | "puzzle";
      mediaType: "photo" | "puzzle_photo";
      semanticKey: string;
      sectionItemId: string;
      sortOrder: number;
    },
  ) {
    if (!photo.file) {
      return;
    }

    const uploadData = new FormData();
    uploadData.append("setupToken", setupToken);
    uploadData.append("section", options.section);
    uploadData.append("mediaType", options.mediaType);
    uploadData.append("semanticKey", options.semanticKey);
    uploadData.append("sectionItemId", options.sectionItemId);
    uploadData.append("caption", photo.caption);
    uploadData.append("sortOrder", String(options.sortOrder));
    uploadData.append("file", photo.file, photo.file.name);

    try {
      const result = await uploadSetupMedia({ data: uploadData });
      applyUploadedPhotoResult(photo.id, {
        ...result,
        semanticKey: options.semanticKey,
        sectionItemId: options.sectionItemId,
      });
    } catch (error) {
      markPhotoUploadFailed(
        photo.id,
        error instanceof Error ? error.message : "Yükleme başarısız oldu.",
      );
    }
  }

  async function uploadVoiceNoteDraft(file: File, previewUrl: string) {
    const uploadData = new FormData();
    uploadData.append("setupToken", setupToken);
    uploadData.append("section", "voice_note");
    uploadData.append("mediaType", "voice_note");
    uploadData.append("semanticKey", "voice_note");
    uploadData.append("sectionItemId", "voiceNote");
    uploadData.append("sortOrder", "0");
    uploadData.append("file", file, file.name);

    try {
      const result = await uploadSetupMedia({ data: uploadData });
      setFormData((current) => {
        if (current.musicVoice.voiceNote?.previewUrl !== previewUrl) {
          return current;
        }

        return {
          ...current,
          musicVoice: {
            ...current.musicVoice,
            voiceNote: {
              ...current.musicVoice.voiceNote,
              previewUrl: result.previewUrl || current.musicVoice.voiceNote.previewUrl,
              originalFilename: result.originalFilename,
              mimeType: result.mimeType,
              sizeBytes: result.sizeBytes,
              uploadStatus: "uploaded",
              uploadError: undefined,
              mediaId: result.mediaId,
              storagePath: result.storagePath,
              semanticKey: "voice_note",
              sectionItemId: "voiceNote",
              file: undefined,
            },
          },
        };
      });
    } catch (error) {
      setFormData((current) => {
        if (current.musicVoice.voiceNote?.previewUrl !== previewUrl) {
          return current;
        }

        return {
          ...current,
          musicVoice: {
            ...current.musicVoice,
            voiceNote: current.musicVoice.voiceNote
              ? {
                  ...current.musicVoice.voiceNote,
                  uploadStatus: "failed",
                  uploadError:
                    error instanceof Error ? error.message : "Ses notu yüklenemedi.",
                }
              : null,
          },
        };
      });
    }
  }

  function applyUploadedPhotoResult(
    photoId: string,
    result: {
      mediaId: string;
      previewUrl: string;
      storagePath: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
      semanticKey: string;
      sectionItemId: string;
    },
  ) {
    const updatePhoto = (photo: StoryOfUsPhotoDraftItem | null) =>
      photo?.id === photoId
        ? {
            ...photo,
            previewUrl: result.previewUrl || photo.previewUrl,
            uploadStatus: "uploaded" as const,
            uploadError: undefined,
            mediaId: result.mediaId,
            storagePath: result.storagePath,
            semanticKey: result.semanticKey,
            sectionItemId: result.sectionItemId,
            originalFilename: result.originalFilename,
            mimeType: result.mimeType,
            sizeBytes: result.sizeBytes,
            file: undefined,
          }
        : photo;

    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        openingPhotos: {
          firstPerson: updatePhoto(current.media.openingPhotos.firstPerson),
          secondPerson: updatePhoto(current.media.openingPhotos.secondPerson),
        },
        promptPhotos: current.media.promptPhotos.map((prompt) => ({
          ...prompt,
          photo: updatePhoto(prompt.photo),
        })),
        photos: current.media.photos.map((photo) => updatePhoto(photo) ?? photo),
        puzzle: {
          ...current.media.puzzle,
          puzzlePhoto: updatePhoto(current.media.puzzle.puzzlePhoto),
        },
        loveLetterPhoto: updatePhoto(current.media.loveLetterPhoto),
      },
      timeline: current.timeline.map((item) => ({
        ...item,
        photo: updatePhoto(item.photo),
      })),
    }));
  }

  function markPhotoUploadFailed(photoId: string, message: string) {
    const updatePhoto = (photo: StoryOfUsPhotoDraftItem | null) =>
      photo?.id === photoId ? { ...photo, uploadStatus: "failed" as const, uploadError: message } : photo;

    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        openingPhotos: {
          firstPerson: updatePhoto(current.media.openingPhotos.firstPerson),
          secondPerson: updatePhoto(current.media.openingPhotos.secondPerson),
        },
        promptPhotos: current.media.promptPhotos.map((prompt) => ({
          ...prompt,
          photo: updatePhoto(prompt.photo),
        })),
        photos: current.media.photos.map((photo) => updatePhoto(photo) ?? photo),
        puzzle: {
          ...current.media.puzzle,
          puzzlePhoto: updatePhoto(current.media.puzzle.puzzlePhoto),
        },
        loveLetterPhoto: updatePhoto(current.media.loveLetterPhoto),
      },
      timeline: current.timeline.map((item) => ({
        ...item,
        photo: updatePhoto(item.photo),
      })),
    }));
  }

  async function removePersistedMedia({
    section,
    semanticKey,
    sectionItemId,
  }: {
    section: "opening" | "memory_prompt" | "gallery" | "timeline" | "letter" | "puzzle" | "voice_note";
    semanticKey: string;
    sectionItemId: string;
  }) {
    try {
      await removeSetupMedia({
        data: {
          setupToken,
          section,
          semanticKey,
          sectionItemId,
        },
      });
    } catch {
      setSubmitError("Dosya kaldırılırken sorun oluştu. Lütfen tekrar deneyin.");
    }
  }

  function updateOpeningPhoto(position: keyof StoryOfUsOpeningPhotosData, file: File) {
    const nextPhoto = createImageDraft(file);

    if (!nextPhoto) {
      return;
    }

    setFormData((current) => {
      revokePhotoDraft(current.media.openingPhotos[position]);

      return {
        ...current,
        media: {
          ...current.media,
          openingPhotos: {
            ...current.media.openingPhotos,
            [position]: nextPhoto,
          },
        },
      };
    });

    void uploadPhotoDraft(nextPhoto, {
      section: "opening",
      mediaType: "photo",
      semanticKey: position === "firstPerson" ? "hero_left" : "hero_right",
      sectionItemId: position,
      sortOrder: position === "firstPerson" ? 0 : 1,
    });
  }

  function removeOpeningPhoto(position: keyof StoryOfUsOpeningPhotosData) {
    void removePersistedMedia({
      section: "opening",
      semanticKey: position === "firstPerson" ? "hero_left" : "hero_right",
      sectionItemId: position,
    });

    setFormData((current) => {
      revokePhotoDraft(current.media.openingPhotos[position]);

      return {
        ...current,
        media: {
          ...current.media,
          openingPhotos: {
            ...current.media.openingPhotos,
            [position]: null,
          },
        },
      };
    });
  }

  function updatePromptPhoto(promptId: string, file: File) {
    const prompt = formData.media.promptPhotos.find((item) => item.id === promptId);
    const nextPhoto = createImageDraft(file, prompt?.title ?? "");

    if (!nextPhoto) {
      return;
    }

    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        promptPhotos: current.media.promptPhotos.map((item) => {
          if (item.id !== promptId) {
            return item;
          }

          revokePhotoDraft(item.photo);

          return {
            ...item,
            photo: nextPhoto,
          };
        }),
      },
      confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "photos"),
    }));
    setValidationNotice(null);

    void uploadPhotoDraft(nextPhoto, {
      section: "memory_prompt",
      mediaType: "photo",
      semanticKey: promptId,
      sectionItemId: promptId,
      sortOrder: prompt?.sortOrder ?? 0,
    });
  }

  function updatePromptPhotoCaption(promptId: string, caption: string) {
    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        promptPhotos: current.media.promptPhotos.map((item) =>
          item.id === promptId && item.photo
            ? { ...item, photo: { ...item.photo, caption } }
            : item,
        ),
      },
    }));
  }

  function removePromptPhoto(promptId: string) {
    void removePersistedMedia({
      section: "memory_prompt",
      semanticKey: promptId,
      sectionItemId: promptId,
    });

    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        promptPhotos: current.media.promptPhotos.map((item) => {
          if (item.id !== promptId) {
            return item;
          }

          revokePhotoDraft(item.photo);
          return { ...item, photo: null };
        }),
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
    void removePersistedMedia({
      section: "gallery",
      semanticKey: "gallery_photo",
      sectionItemId: photoId,
    });

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
            sourceType:
              current.media.puzzle.selectedPhotoId === photoId ? null : current.media.puzzle.sourceType,
          },
        },
      };
    });
  }

  function selectGalleryPhotoForPuzzle(photoId: string) {
    setFormData((current) => {
      if (current.media.puzzle.puzzlePhoto) {
        URL.revokeObjectURL(current.media.puzzle.puzzlePhoto.previewUrl);
        puzzlePhotoPreviewUrlsRef.current.delete(current.media.puzzle.puzzlePhoto.previewUrl);
      }

      return {
        ...current,
        media: {
          ...current.media,
          puzzle: {
            ...current.media.puzzle,
            selectedPhotoId: photoId,
            puzzlePhoto: null,
            sourceType: "gallery",
            confirmedNoPuzzle: false,
          },
        },
        confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "puzzle"),
      };
    });
    setValidationNotice(null);
  }

  function addSeparatePuzzlePhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    puzzlePhotoPreviewUrlsRef.current.add(previewUrl);

    const puzzlePhoto: StoryOfUsPhotoDraftItem = {
        id: createPhotoDraftId(),
        previewUrl,
        caption: "",
        sortOrder: 0,
        uploadStatus: "uploading",
        file,
      };

    setFormData((current) => {
      if (current.media.puzzle.puzzlePhoto) {
        URL.revokeObjectURL(current.media.puzzle.puzzlePhoto.previewUrl);
        puzzlePhotoPreviewUrlsRef.current.delete(current.media.puzzle.puzzlePhoto.previewUrl);
      }

      return {
        ...current,
        media: {
          ...current.media,
          puzzle: {
            ...current.media.puzzle,
            selectedPhotoId: null,
            puzzlePhoto,
            sourceType: "separate",
            confirmedNoPuzzle: false,
          },
        },
        confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "puzzle"),
      };
    });
    setValidationNotice(null);

    void uploadPhotoDraft(puzzlePhoto, {
      section: "puzzle",
      mediaType: "puzzle_photo",
      semanticKey: "puzzle_source",
      sectionItemId: "puzzlePhoto",
      sortOrder: 0,
    });
  }

  function updatePuzzlePhotoCaption(caption: string) {
    setFormData((current) => ({
      ...current,
      media: {
        ...current.media,
        puzzle: {
          ...current.media.puzzle,
          puzzlePhoto: current.media.puzzle.puzzlePhoto
            ? {
                ...current.media.puzzle.puzzlePhoto,
                caption,
              }
            : null,
        },
      },
    }));
  }

  function removeSeparatePuzzlePhoto() {
    void removePersistedMedia({
      section: "puzzle",
      semanticKey: "puzzle_source",
      sectionItemId: "puzzlePhoto",
    });

    setFormData((current) => {
      if (current.media.puzzle.puzzlePhoto) {
        URL.revokeObjectURL(current.media.puzzle.puzzlePhoto.previewUrl);
        puzzlePhotoPreviewUrlsRef.current.delete(current.media.puzzle.puzzlePhoto.previewUrl);
      }

      return {
        ...current,
        media: {
          ...current.media,
          puzzle: {
            ...current.media.puzzle,
            selectedPhotoId: null,
            puzzlePhoto: null,
            sourceType: null,
            confirmedNoPuzzle: false,
          },
        },
      };
    });
  }

  function clearPuzzleSelection() {
    void removePersistedMedia({
      section: "puzzle",
      semanticKey: "puzzle_source",
      sectionItemId: "puzzlePhoto",
    });

    setFormData((current) => {
      if (current.media.puzzle.puzzlePhoto) {
        URL.revokeObjectURL(current.media.puzzle.puzzlePhoto.previewUrl);
        puzzlePhotoPreviewUrlsRef.current.delete(current.media.puzzle.puzzlePhoto.previewUrl);
      }

      return {
        ...current,
        media: {
          ...current.media,
          puzzle: {
            ...current.media.puzzle,
            selectedPhotoId: null,
            puzzlePhoto: null,
            sourceType: null,
            confirmedNoPuzzle: false,
          },
        },
      };
    });
  }

  function updateMusicField(field: keyof StoryOfUsMusicData, value: string) {
    setFormData((current) => {
      const nextMusic =
        field === "startAtSeconds"
          ? {
              ...current.musicVoice.music,
              startAtSeconds: value.trim() === "" ? 0 : Number(value),
            }
          : {
              ...current.musicVoice.music,
              [field]: value,
            };
      const hasMusicContent =
        nextMusic.spotifyUrl.trim() !== "" ||
        nextMusic.songTitle.trim() !== "" ||
        nextMusic.artistName.trim() !== "";

      if (field === "startAtSeconds") {
        return {
          ...current,
          musicVoice: {
            ...current.musicVoice,
            music: nextMusic,
          },
          confirmedSkips: hasMusicContent
            ? removeConfirmedSkip(current.confirmedSkips, "music")
            : current.confirmedSkips,
        };
      }

      return {
        ...current,
        musicVoice: {
          ...current.musicVoice,
          music: nextMusic,
        },
        confirmedSkips: hasMusicContent
          ? removeConfirmedSkip(current.confirmedSkips, "music")
          : current.confirmedSkips,
      };
    });
    setValidationNotice(null);
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
            uploadStatus: "uploading",
            file,
          },
        },
        confirmedSkips: remainingSkips,
      };
    });
    setValidationNotice(null);

    void uploadVoiceNoteDraft(file, previewUrl);
  }

  function removeVoiceNote() {
    void removePersistedMedia({
      section: "voice_note",
      semanticKey: "voice_note",
      sectionItemId: "voiceNote",
    });

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
    requestSectionSkip("voiceNote", false);
  }

  function confirmVoiceNoteSkip() {
    void removePersistedMedia({
      section: "voice_note",
      semanticKey: "voice_note",
      sectionItemId: "voiceNote",
    });

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
    setValidationNotice(null);
  }

  function undoVoiceNoteSkip() {
    undoSectionSkip("voiceNote");
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
          photo: null,
          sortOrder: current.timeline.length,
        },
      ],
      confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "timeline"),
    }));
    setValidationNotice(null);
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

  function updateTimelineItemPhoto(itemId: string, file: File) {
    const nextPhoto = createImageDraft(file);

    if (!nextPhoto) {
      return;
    }

    setFormData((current) => ({
      ...current,
      timeline: current.timeline.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        revokePhotoDraft(item.photo);
        return { ...item, photo: nextPhoto };
      }),
      confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "timeline"),
    }));
    setValidationNotice(null);

    void uploadPhotoDraft(nextPhoto, {
      section: "timeline",
      mediaType: "photo",
      semanticKey: "timeline_item",
      sectionItemId: itemId,
      sortOrder: formData.timeline.find((item) => item.id === itemId)?.sortOrder ?? 0,
    });
  }

  function removeTimelineItemPhoto(itemId: string) {
    void removePersistedMedia({
      section: "timeline",
      semanticKey: "timeline_item",
      sectionItemId: itemId,
    });

    setFormData((current) => ({
      ...current,
      timeline: current.timeline.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        revokePhotoDraft(item.photo);
        return { ...item, photo: null };
      }),
    }));
  }

  function removeTimelineItem(itemId: string) {
    void removePersistedMedia({
      section: "timeline",
      semanticKey: "timeline_item",
      sectionItemId: itemId,
    });

    setFormData((current) => {
      const removedItem = current.timeline.find((item) => item.id === itemId);
      revokePhotoDraft(removedItem?.photo ?? null);

      return {
        ...current,
        timeline: current.timeline
          .filter((item) => item.id !== itemId)
          .map((item, index) => ({ ...item, sortOrder: index })),
      };
    });
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
            title: DEFAULT_LOVE_LETTER_TITLE,
            body: "",
            sortOrder: current.letters.length,
          },
        ],
        confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "letters"),
      };
    });
    setValidationNotice(null);
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
      confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "letters"),
    }));
    setValidationNotice(null);
  }

  function addDefaultOpenWhenLetters() {
    setFormData((current) => {
      const currentOpenWhenCount = current.letters.filter((letter) => letter.type === "open_when").length;

      if (currentOpenWhenCount > 0) {
        return current;
      }

      return {
        ...current,
        letters: [
          ...current.letters,
          ...DEFAULT_OPEN_WHEN_LETTERS.map((letter, index) => ({
            id: createLetterItemId(),
            type: letter.type,
            title: letter.title,
            body: letter.body,
            sortOrder: current.letters.length + index,
          })),
        ],
        confirmedSkips: removeConfirmedSkip(current.confirmedSkips, "letters"),
      };
    });
    setValidationNotice(null);
  }

  function updateLoveLetterPhoto(file: File) {
    const nextPhoto = createImageDraft(file, "Kalbimden sana birkaç satır");

    if (!nextPhoto) {
      return;
    }

    setFormData((current) => {
      revokePhotoDraft(current.media.loveLetterPhoto);

      return {
        ...current,
        media: {
          ...current.media,
          loveLetterPhoto: nextPhoto,
        },
      };
    });

    void uploadPhotoDraft(nextPhoto, {
      section: "letter",
      mediaType: "photo",
      semanticKey: "love_letter_side_photo",
      sectionItemId: "loveLetterPhoto",
      sortOrder: 0,
    });
  }

  function removeLoveLetterPhoto() {
    void removePersistedMedia({
      section: "letter",
      semanticKey: "love_letter_side_photo",
      sectionItemId: "loveLetterPhoto",
    });

    setFormData((current) => {
      revokePhotoDraft(current.media.loveLetterPhoto);

      return {
        ...current,
        media: {
          ...current.media,
          loveLetterPhoto: null,
        },
      };
    });
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

  if (submissionResult) {
    return (
      <StoryOfUsSetupSuccessScreen
        editableUntil={submissionResult.editableUntil}
        onEditAgain={() => {
          setSubmissionResult(null);
          enterSubmittedEditMode();
        }}
      />
    );
  }

  if (setupAccess.status !== "ready") {
    return <StoryOfUsSetupAccessScreen access={setupAccess} />;
  }

  if (setupAccess.mode === "edit" && !hasEnteredSubmittedEditMode) {
    return (
      <StoryOfUsSubmittedReentryScreen
        editableUntil={setupAccess.editableUntil}
        onEnterEditMode={enterSubmittedEditMode}
      />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#fff7f3_0%,#fff1f6_52%,#fffaf7_100%)] px-3 py-5 text-[#3d2323] sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-5 sm:gap-8">
        <header className="w-full min-w-0 overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white/75 px-4 py-6 text-center shadow-xl shadow-rose-100/50 backdrop-blur sm:rounded-[2rem] sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500 sm:tracking-[0.35em]">
            StoryOfUs Setup
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-2xl font-bold tracking-tight text-rose-950 sm:text-5xl">
            Hikayenizi birlikte hazırlayalım
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-rose-950/65 sm:text-base">
            Fotoğraflarınız, müziğiniz, anılarınız ve mektuplarınızla size özel romantik web
            sitesini hazırlamak için birkaç kısa adımı tamamlayın.
          </p>
        </header>

        <section className="w-full min-w-0 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/70 p-3 pb-24 shadow-2xl shadow-rose-100/60 backdrop-blur sm:rounded-[2rem] sm:p-6 lg:p-8">
          <div className="mb-5 grid min-w-0 gap-3 sm:mb-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                Adım {currentStepIndex + 1} / {totalSteps}
              </p>
              <h2 className="mt-2 break-words text-xl font-bold text-rose-950 sm:text-3xl">
                {currentStep.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-950/60">
                {currentStep.description}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-left shadow-sm shadow-rose-100/50 sm:text-right">
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

          <div className="mb-5 min-w-0 rounded-2xl border border-rose-100 bg-[#fffaf8] p-3 text-sm leading-6 text-rose-950/60 shadow-sm shadow-rose-100/45 sm:mb-8 sm:rounded-3xl sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-rose-700">
                Taslak bu cihazda otomatik kaydedilir.
              </p>
              <span
                className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${draftSaveStatusClassName}`}
                aria-live="polite"
              >
                {draftSaveStatusLabel}
              </span>
            </div>
            {wasDraftRestored && (
              <p className="mt-1 text-rose-950/65">Kaydedilmiş taslağınız yüklendi.</p>
            )}
            <p className="mt-1">
              Güvenlik nedeniyle fotoğraf ve ses dosyalarını tekrar seçmeniz gerekebilir.
            </p>
          </div>

          {setupAccess.mode === "edit" && (
            <div className="mb-5 min-w-0 rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-white to-fuchsia-50/70 p-3 text-sm leading-6 text-rose-950/65 shadow-sm shadow-fuchsia-100/50 sm:mb-8 sm:rounded-3xl sm:p-4">
              <p className="font-semibold text-fuchsia-700">
                Bilgilerinizi düzenleme modundasınız.
              </p>
              {setupAccess.editableUntil && (
                <p className="mt-1">
                  Bu formu {formatEditableUntil(setupAccess.editableUntil)} tarihine kadar
                  düzenleyebilirsiniz. {getRemainingEditWindowText(setupAccess.editableUntil)}
                </p>
              )}
            </div>
          )}

          <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5">
            <aside className="w-full min-w-0 overflow-hidden rounded-[1.25rem] border border-rose-100 bg-[#fffaf8] p-2 shadow-sm shadow-rose-100/50 sm:rounded-[1.5rem] sm:p-3">
              <nav
                className="flex w-full min-w-0 snap-x gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] lg:grid lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
                aria-label="StoryOfUs setup adımları"
              >
                {STORYOFUS_SETUP_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;
                  const isLocked = index > currentStepIndex;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStepById(step.id)}
                      disabled={isLocked}
                      aria-current={isActive ? "step" : undefined}
                      className={`flex w-[8.75rem] shrink-0 snap-start items-start gap-2 rounded-2xl border px-3 py-3 text-left transition duration-200 disabled:cursor-not-allowed sm:w-[10rem] sm:gap-3 lg:w-full ${
                        isActive
                          ? "border-rose-300 bg-white text-rose-950 shadow-md shadow-rose-100"
                          : isCompleted
                            ? "border-rose-100 bg-rose-50/80 text-rose-900 hover:border-rose-200 hover:bg-white"
                            : "border-transparent bg-transparent text-rose-950/40"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-8 sm:w-8 ${
                          isActive
                            ? "bg-rose-500 text-white"
                            : isCompleted
                              ? "bg-rose-100 text-rose-600"
                              : "bg-white text-rose-400"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-xs font-semibold leading-4 sm:text-sm sm:leading-5">
                          {step.title}
                        </span>
                        <span className="mt-1 hidden text-xs leading-5 text-current opacity-70 sm:block">
                          {step.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section
              ref={stepCardRef}
              className="w-full min-w-0 overflow-hidden rounded-[1.25rem] border border-rose-100 bg-white/85 p-3 shadow-lg shadow-rose-100/45 sm:rounded-[1.5rem] sm:p-7"
            >
              <div className="mb-5 min-w-0 sm:mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                  {currentStep.title}
                </p>
                <h3 className="mt-2 break-words text-xl font-bold text-rose-950 sm:text-2xl">
                  {getStepHeading(currentStep.id)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-rose-950/65">
                  {getStepIntro(currentStep.id)}
                </p>
              </div>

              <StepValidationPanel
                panelRef={validationPanelRef}
                notice={displayedValidationNotice}
                highlightedWarningId={highlightedWarningId}
                onConfirmSkip={(sectionId) =>
                  confirmSectionSkip(sectionId, currentStep.id !== "review")
                }
                onCancelSkip={cancelValidationWarning}
              />

              <ConfirmedSkipNotices
                sections={getStepOptionalSections(currentStep.id)}
                formData={formData}
                onUndoSkip={undoSectionSkip}
              />

              {currentStep.id === "contactCouple" ? (
                <ContactCoupleStep
                  value={formData.contactCouple}
                  siteAccess={formData.siteAccess}
                  onChange={updateContactCoupleField}
                  onSiteAccessChange={updateSiteAccessField}
                  fieldErrors={displayedValidationNotice?.contactFieldErrors ?? {}}
                  siteAccessErrors={displayedValidationNotice?.siteAccessFieldErrors ?? {}}
                />
              ) : currentStep.id === "photosPuzzle" ? (
                <PhotosPuzzleStep
                  contactCouple={formData.contactCouple}
                  openingPhotos={formData.media.openingPhotos}
                  promptPhotos={formData.media.promptPhotos}
                  photos={formData.media.photos}
                  puzzle={formData.media.puzzle}
                  existingMedia={existingMedia}
                  onUpdateOpeningPhoto={updateOpeningPhoto}
                  onRemoveOpeningPhoto={removeOpeningPhoto}
                  onUpdatePromptPhoto={updatePromptPhoto}
                  onUpdatePromptPhotoCaption={updatePromptPhotoCaption}
                  onRemovePromptPhoto={removePromptPhoto}
                  onAddPhotoFiles={addPhotoFiles}
                  onUpdatePhotoCaption={updatePhotoCaption}
                  onRemovePhoto={removePhoto}
                  onSelectGalleryPhotoForPuzzle={selectGalleryPhotoForPuzzle}
                  onAddSeparatePuzzlePhoto={addSeparatePuzzlePhoto}
                  onUpdatePuzzlePhotoCaption={updatePuzzlePhotoCaption}
                  onRemoveSeparatePuzzlePhoto={removeSeparatePuzzlePhoto}
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
                  onUpdateItemPhoto={updateTimelineItemPhoto}
                  onRemoveItemPhoto={removeTimelineItemPhoto}
                  onRemoveItem={removeTimelineItem}
                  onMoveItem={moveTimelineItem}
                />
              ) : currentStep.id === "letters" ? (
                <LettersStep
                  letters={formData.letters}
                  loveLetterPhoto={formData.media.loveLetterPhoto}
                  onAddLoveLetter={addLoveLetter}
                  onAddOpenWhenLetter={addOpenWhenLetter}
                  onAddDefaultOpenWhenLetters={addDefaultOpenWhenLetters}
                  onUpdateLetter={updateLetterItem}
                  onUpdateLoveLetterPhoto={updateLoveLetterPhoto}
                  onRemoveLoveLetterPhoto={removeLoveLetterPhoto}
                  onRemoveLetter={removeLetterItem}
                  onMoveLetter={moveLetterItem}
                />
              ) : currentStep.id === "review" ? (
                <ReviewSubmitStep
                  formData={formData}
                  existingMedia={existingMedia}
                  onEditStep={goToStepById}
                  onSubmit={handleSubmitSetup}
                  isSubmitting={isSubmittingSetup}
                  submitError={submitError}
                  legalConsentErrors={legalConsentErrors}
                  onUpdateLegalConsent={updateLegalConsent}
                />
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

              <div className="sticky bottom-0 z-20 -mx-3 mt-8 border-t border-rose-100 bg-white/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(244,63,94,0.08)] backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:shadow-none">
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="min-h-10 max-w-full rounded-full border border-rose-200 bg-white px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Taslağı temizle
                  </button>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    disabled={isFirstStep}
                    className="min-h-12 w-full rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={isLastStep}
                    className="min-h-12 w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
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
      return "Önce size ulaşacağımız bilgileri ve sitenin romantik metinlerinde kullanılacak çift detaylarını alıyoruz.";
    case "photosPuzzle":
      return "Galeri fotoğrafları ve puzzle fotoğrafı ayrı ayrı seçilebilir. İsterseniz aynı görseli iki yerde de kullanabilirsiniz.";
    case "musicVoice":
      return "Şarkı ve ses notu birbirinden bağımsızdır. İkisini de ekleyebilir, sadece birini seçebilir veya istemediğinizi onaylayabilirsiniz.";
    case "timeline":
      return "İlişkinizdeki özel anları kısa başlık, tarih ve birkaç cümleyle sıralayın.";
    case "letters":
      return "Ana aşk mektubunuzu ve ihtiyaç anlarında açılacak küçük notları burada hazırlayın.";
    case "review":
      return "Göndermeden önce her şeyi sakince kontrol edin. Gönderimden sonra 3 saatlik düzenleme süreniz başlar.";
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

function validateCurrentStep(
  stepId: StoryOfUsSetupStepId,
  formData: StoryOfUsSetupFormData,
): StepValidationNotice {
  const blockingErrors: string[] = [];
  const warnings: OptionalSectionWarning[] = [];
  let contactFieldErrors: ContactCoupleFieldErrors | undefined;
  let siteAccessFieldErrors: SiteAccessFieldErrors | undefined;

  if (stepId === "contactCouple") {
    const contactValidation = validateContactCoupleData(formData.contactCouple);
    const siteAccessValidation = validateSiteAccessData(formData.siteAccess);
    blockingErrors.push(...contactValidation.blockingErrors);
    blockingErrors.push(...siteAccessValidation.blockingErrors);
    contactFieldErrors = contactValidation.fieldErrors;
    siteAccessFieldErrors = siteAccessValidation.fieldErrors;
  }

  if (blockingErrors.length > 0) {
    return {
      blockingErrors,
      contactFieldErrors,
      siteAccessFieldErrors,
      warning: null,
    };
  }

  if (stepId === "contactCouple") {
    warnings.push(...getImportantFieldWarnings(formData));
  }

  if (
    stepId === "photosPuzzle" &&
    formData.media.photos.length === 0 &&
    !isSectionConfirmedSkipped("photos", formData)
  ) {
    warnings.push(getOptionalSectionWarning("photos"));
  }

  if (
    stepId === "photosPuzzle" &&
    !hasPuzzleSource(formData.media.puzzle) &&
    !isSectionConfirmedSkipped("puzzle", formData)
  ) {
    warnings.push(getOptionalSectionWarning("puzzle"));
  }

  if (
    stepId === "musicVoice" &&
    isMusicSectionEmpty(formData.musicVoice.music) &&
    !isSectionConfirmedSkipped("music", formData)
  ) {
    warnings.push(getOptionalSectionWarning("music"));
  }

  if (
    stepId === "musicVoice" &&
    !formData.musicVoice.voiceNote &&
    !isSectionConfirmedSkipped("voiceNote", formData)
  ) {
    warnings.push(getOptionalSectionWarning("voiceNote"));
  }

  if (
    stepId === "timeline" &&
    formData.timeline.length === 0 &&
    !isSectionConfirmedSkipped("timeline", formData)
  ) {
    warnings.push(getOptionalSectionWarning("timeline"));
  }

  if (
    stepId === "letters" &&
    formData.letters.length === 0 &&
    !isSectionConfirmedSkipped("letters", formData)
  ) {
    warnings.push(getOptionalSectionWarning("letters"));
  }

  return {
    blockingErrors: [],
    warning: warnings[0] ?? null,
    warnings,
  };
}

function validateContactCoupleData(contactCouple: StoryOfUsContactCoupleData) {
  const blockingErrors: string[] = [];
  const fieldErrors: ContactCoupleFieldErrors = {};
  const customerName = contactCouple.customerName.trim();
  const customerEmail = contactCouple.customerEmail.trim();
  const contactPhone = contactCouple.contactPhone.trim();
  const partnerName = contactCouple.partnerName.trim();

  if (!customerName) {
    fieldErrors.customerName = "Adınız zorunlu.";
    blockingErrors.push(fieldErrors.customerName);
  }

  if (!customerEmail) {
    fieldErrors.customerEmail = "E-posta adresiniz zorunlu.";
    blockingErrors.push(fieldErrors.customerEmail);
  } else if (!isValidEmailAddress(customerEmail)) {
    fieldErrors.customerEmail = "Lütfen geçerli bir e-posta adresi girin.";
    blockingErrors.push(fieldErrors.customerEmail);
  }

  if (!contactPhone) {
    fieldErrors.contactPhone = "Telefon numaranız zorunlu.";
    blockingErrors.push(fieldErrors.contactPhone);
  } else if (!normalizeTurkeyMobilePhone(contactPhone)) {
    fieldErrors.contactPhone = "Lütfen geçerli bir Türkiye cep telefonu numarası girin.";
    blockingErrors.push(fieldErrors.contactPhone);
  }

  if (!partnerName) {
    fieldErrors.partnerName = "Partnerinizin adı zorunlu.";
    blockingErrors.push(fieldErrors.partnerName);
  }

  return {
    blockingErrors,
    fieldErrors,
  };
}

function validateSiteAccessData(siteAccess: StoryOfUsSiteAccessData) {
  const blockingErrors: string[] = [];
  const fieldErrors: SiteAccessFieldErrors = {};
  const passcode = siteAccess.passcode.trim();
  const confirmPasscode = siteAccess.confirmPasscode.trim();
  const hint = siteAccess.passcodeHint.trim();
  const isChangingExistingPasscode = Boolean(passcode || confirmPasscode);
  const shouldRequirePasscode = !siteAccess.hasExistingPasscode || isChangingExistingPasscode;

  if (shouldRequirePasscode && !/^\d{4}$/.test(passcode)) {
    fieldErrors.passcode = "Website giriş şifresi tam 4 rakam olmalı.";
    blockingErrors.push(fieldErrors.passcode);
  }

  if (shouldRequirePasscode && confirmPasscode !== passcode) {
    fieldErrors.confirmPasscode = "Şifre tekrarı aynı olmalı.";
    blockingErrors.push(fieldErrors.confirmPasscode);
  }

  if (hint.length < 2) {
    fieldErrors.passcodeHint = "Şifre ipucu zorunlu.";
    blockingErrors.push(fieldErrors.passcodeHint);
  } else if (hint.length > 80) {
    fieldErrors.passcodeHint = "Şifre ipucu en fazla 80 karakter olabilir.";
    blockingErrors.push(fieldErrors.passcodeHint);
  }

  return {
    blockingErrors,
    fieldErrors,
  };
}

function getLiveContactValidationNotice(
  contactCouple: StoryOfUsContactCoupleData,
): StepValidationNotice | null {
  const contactValidation = validateContactCoupleData(contactCouple);

  if (contactValidation.blockingErrors.length === 0) {
    return null;
  }

  return {
    blockingErrors: contactValidation.blockingErrors,
    contactFieldErrors: contactValidation.fieldErrors,
    warning: null,
  };
}

function mergeLiveContactValidationNotice(
  liveContactNotice: StepValidationNotice | null,
  currentNotice: StepValidationNotice,
): StepValidationNotice | null {
  const currentWarnings = getValidationWarnings(currentNotice);

  if (!liveContactNotice && !currentNotice.siteAccessFieldErrors && currentWarnings.length === 0) {
    return null;
  }

  return {
    blockingErrors: [
      ...(liveContactNotice?.blockingErrors ?? []),
      ...Object.values(currentNotice.siteAccessFieldErrors ?? {}).filter(Boolean),
    ],
    contactFieldErrors: liveContactNotice?.contactFieldErrors,
    siteAccessFieldErrors: currentNotice.siteAccessFieldErrors,
    warning: currentWarnings[0] ?? null,
    warnings: currentWarnings,
  };
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function normalizeTurkeyMobilePhone(value: string) {
  const compactValue = value.trim().replace(/[\s()-]/g, "");

  if (/^\+905\d{9}$/.test(compactValue)) {
    return compactValue;
  }

  if (/^05\d{9}$/.test(compactValue)) {
    return `+9${compactValue}`;
  }

  if (/^5\d{9}$/.test(compactValue)) {
    return `+90${compactValue}`;
  }

  return null;
}

function validateLegalConsents(
  legalConsents: StoryOfUsLegalConsents,
  requireServiceStartConsent = false,
) {
  const errors: string[] = [];

  if (!legalConsents.privacyNoticeAccepted.accepted) {
    errors.push("Aydınlatma metni onayı zorunlu.");
  }

  if (!legalConsents.explicitConsentAccepted.accepted) {
    errors.push("İçeriklerin işlenmesine yönelik açık rıza zorunlu.");
  }

  if (!legalConsents.contentResponsibilityAccepted.accepted) {
    errors.push("Yüklenen içeriklerin sorumluluğu kabulü zorunlu.");
  }

  if (requireServiceStartConsent && !legalConsents.serviceStartConsentAccepted.accepted) {
    errors.push("3 saatlik düzenleme ve iade süresi bilgilendirmesi onayı zorunlu.");
  }

  return errors;
}

function isSectionConfirmedSkipped(
  sectionId: StoryOfUsOptionalSectionId,
  formData: StoryOfUsSetupFormData,
) {
  return formData.confirmedSkips[sectionId]?.confirmed === true;
}

function getValidationWarnings(notice: StepValidationNotice | null) {
  if (!notice) {
    return [];
  }

  if (notice.warnings?.length) {
    return notice.warnings;
  }

  return notice.warning ? [notice.warning] : [];
}

function getRenderableValidationWarnings(notice: StepValidationNotice | null) {
  return getValidationWarnings(notice).filter(
    (warning): warning is OptionalSectionWarning =>
      Boolean(warning?.sectionId && warning.message),
  );
}

function getImportantFieldWarnings(formData: StoryOfUsSetupFormData) {
  const importantFields: Array<keyof Pick<
    StoryOfUsContactCoupleData,
    "relationshipStartDate" | "relationshipStory" | "recipientNickname" | "specialDateLabel"
  >> = ["relationshipStartDate", "relationshipStory", "recipientNickname", "specialDateLabel"];

  return importantFields
    .filter((field) => !formData.contactCouple[field].trim() && !isSectionConfirmedSkipped(field, formData))
    .map((field) => getOptionalSectionWarning(field));
}

function getFullSetupWarnings(formData: StoryOfUsSetupFormData) {
  const warnings = [...getImportantFieldWarnings(formData)];

  if (formData.media.photos.length === 0 && !isSectionConfirmedSkipped("photos", formData)) {
    warnings.push(getOptionalSectionWarning("photos"));
  }

  if (!hasPuzzleSource(formData.media.puzzle) && !isSectionConfirmedSkipped("puzzle", formData)) {
    warnings.push(getOptionalSectionWarning("puzzle"));
  }

  if (isMusicSectionEmpty(formData.musicVoice.music) && !isSectionConfirmedSkipped("music", formData)) {
    warnings.push(getOptionalSectionWarning("music"));
  }

  if (!formData.musicVoice.voiceNote && !isSectionConfirmedSkipped("voiceNote", formData)) {
    warnings.push(getOptionalSectionWarning("voiceNote"));
  }

  if (formData.timeline.length === 0 && !isSectionConfirmedSkipped("timeline", formData)) {
    warnings.push(getOptionalSectionWarning("timeline"));
  }

  if (formData.letters.length === 0 && !isSectionConfirmedSkipped("letters", formData)) {
    warnings.push(getOptionalSectionWarning("letters"));
  }

  return warnings;
}

function hasPuzzleSource(puzzle: StoryOfUsPuzzleData) {
  return (
    (puzzle.sourceType === "gallery" && Boolean(puzzle.selectedPhotoId)) ||
    (puzzle.sourceType === "separate" && Boolean(puzzle.puzzlePhoto))
  );
}

function getStepOptionalSections(stepId: StoryOfUsSetupStepId): StoryOfUsOptionalSectionId[] {
  switch (stepId) {
    case "photosPuzzle":
      return ["photos", "puzzle"];
    case "musicVoice":
      return ["music", "voiceNote"];
    case "timeline":
      return ["timeline"];
    case "letters":
      return ["letters"];
    case "review":
      return ["photos", "puzzle", "music", "voiceNote", "timeline", "letters"];
    case "contactCouple":
      return [];
  }
}

function getStepIdForOptionalSection(sectionId: StoryOfUsOptionalSectionId): StoryOfUsSetupStepId {
  switch (sectionId) {
    case "photos":
    case "puzzle":
      return "photosPuzzle";
    case "music":
    case "voiceNote":
      return "musicVoice";
    case "timeline":
      return "timeline";
    case "letters":
      return "letters";
    case "relationshipStartDate":
    case "relationshipStory":
    case "recipientNickname":
    case "specialDateLabel":
      return "contactCouple";
  }
}

function getOptionalSectionTargetSelector(sectionId: StoryOfUsOptionalSectionId) {
  switch (sectionId) {
    case "relationshipStartDate":
    case "relationshipStory":
    case "recipientNickname":
    case "specialDateLabel":
      return `[data-setup-field="${sectionId}"]`;
    case "photos":
    case "puzzle":
    case "music":
    case "voiceNote":
    case "timeline":
    case "letters":
      return `[data-setup-section="${sectionId}"]`;
  }
}

function shouldFocusOptionalSection(sectionId: StoryOfUsOptionalSectionId) {
  return [
    "relationshipStartDate",
    "relationshipStory",
    "recipientNickname",
    "specialDateLabel",
    "music",
    "timeline",
    "letters",
  ].includes(sectionId);
}

function getFirstBlockingValidationTarget(notice: StepValidationNotice) {
  const contactFieldOrder: Array<keyof StoryOfUsContactCoupleData> = [
    "customerName",
    "customerEmail",
    "contactPhone",
    "partnerName",
  ];
  const siteAccessFieldOrder: Array<keyof StoryOfUsSiteAccessData> = [
    "passcode",
    "confirmPasscode",
    "passcodeHint",
  ];
  const contactField = contactFieldOrder.find((field) => notice.contactFieldErrors?.[field]);

  if (contactField) {
    return `[data-setup-field="${contactField}"]`;
  }

  const siteAccessField = siteAccessFieldOrder.find((field) => notice.siteAccessFieldErrors?.[field]);

  if (siteAccessField) {
    return `[data-setup-field="${siteAccessField}"]`;
  }

  return "";
}

function getOptionalSectionWarning(sectionId: StoryOfUsOptionalSectionId): OptionalSectionWarning {
  switch (sectionId) {
    case "photos":
      return {
        sectionId,
        message:
          "Fotoğraflar sitenizi daha kişisel hale getirir. Eklemek istemiyorsanız galeri bölümünü atlayabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "puzzle":
      return {
        sectionId,
        message:
          "Puzzle bölümü küçük ve interaktif bir sürprizdir. Kullanmak istemiyorsanız bu bölümü atlayabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "music":
      return {
        sectionId,
        message:
          "Şarkı bölümü hikayenize duygu katar. Eklemek istemiyorsanız müzik bölümünü atlayabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "voiceNote":
      return {
        sectionId,
        message:
          "Ses notu tamamen isteğe bağlıdır. Eklemek istemiyorsanız bu bölümü web sitesinde göstermeyiz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "timeline":
      return {
        sectionId,
        message:
          "Zaman çizelgesi özel anlarınızı sıralar. Kullanmak istemiyorsanız bu bölümü atlayabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "letters":
      return {
        sectionId,
        message:
          "Mektuplar siteyi daha duygusal yapar. Yazmak istemiyorsanız mektup bölümünü atlayabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "relationshipStartDate":
      return {
        sectionId,
        message:
          "Başlangıç tarihi, birlikte geçen zamanı göstermek için kullanılır. Eklemek istemiyorsanız bu detayı atlayabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "relationshipStory":
      return {
        sectionId,
        message:
          "Kısa hikayeniz romantik metinleri kişiselleştirir. Yazmak istemiyorsanız bu detayı atlayabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "recipientNickname":
      return {
        sectionId,
        message:
          "Hitap şekli metinleri daha doğal hissettirir. Eklemek istemiyorsanız genel hitap kullanabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
    case "specialDateLabel":
      return {
        sectionId,
        message:
          "Tarih başlığı bu anı daha anlamlı gösterir. Eklemek istemiyorsanız sade bırakabiliriz.",
        confirmLabel: "Bunu istemiyorum",
        cancelLabel: "Eksikleri tamamlayacağım",
      };
  }
}

function isMusicSectionEmpty(music: StoryOfUsMusicData) {
  return !music.spotifyUrl.trim() && !music.songTitle.trim() && !music.artistName.trim();
}

function createSetupFormDataFromAccessInitialData(
  initialData: StoryOfUsSetupAccessInitialData,
): StoryOfUsSetupFormData {
  const formData = createEmptyStoryOfUsSetupFormData();
  const initialLetters =
    initialData.letters.length > 0
      ? initialData.letters
      : DEFAULT_OPEN_WHEN_LETTERS.map((letter, index) => ({
          id: createLetterItemId(),
          type: letter.type,
          title: letter.title,
          body: letter.body,
          sortOrder: index,
        }));
  const existingMedia = initialData.existingMedia;
  const firstPersonPhoto = existingMediaToPhoto(
    existingMedia.find((media) => media.section === "opening" && media.sectionItemId === "firstPerson"),
  );
  const secondPersonPhoto = existingMediaToPhoto(
    existingMedia.find((media) => media.section === "opening" && media.sectionItemId === "secondPerson"),
  );
  const galleryPhotos = existingMedia
    .filter((media) => media.section === "gallery" && media.mediaType === "photo")
    .map(existingMediaToPhoto)
    .filter((photo): photo is StoryOfUsPhotoDraftItem => Boolean(photo))
    .map((photo, index) => ({ ...photo, sortOrder: index }));
  const puzzlePhoto = existingMediaToPhoto(
    existingMedia.find((media) => media.section === "puzzle" && media.mediaType === "puzzle_photo"),
  );
  const voiceNoteMedia = existingMedia.find((media) => media.section === "voice_note");

  return {
    ...formData,
    orderReference: initialData.orderReference,
    status: isStoryOfUsSubmissionStatus(initialData.status) ? initialData.status : "draft",
    contactCouple: {
      ...formData.contactCouple,
      customerName: initialData.customerName,
      customerEmail: initialData.customerEmail,
      contactPhone: initialData.contactPhone,
      partnerName: initialData.contactCouple.partnerName,
      coupleDisplayName: initialData.contactCouple.coupleDisplayName,
      relationshipStartDate: initialData.contactCouple.relationshipStartDate,
      specialDateLabel: initialData.contactCouple.specialDateLabel,
      recipientNickname: initialData.contactCouple.recipientNickname,
      relationshipStory: initialData.contactCouple.relationshipStory,
    },
    media: {
      ...formData.media,
      openingPhotos: {
        firstPerson: firstPersonPhoto,
        secondPerson: secondPersonPhoto,
      },
      promptPhotos: formData.media.promptPhotos.map((prompt) => ({
        ...prompt,
        photo: existingMediaToPhoto(
          existingMedia.find(
            (media) => media.section === "memory_prompt" && media.sectionItemId === prompt.id,
          ),
        ),
      })),
      photos: galleryPhotos,
      puzzle: {
        ...formData.media.puzzle,
        selectedPhotoId: null,
        puzzlePhoto,
        sourceType: puzzlePhoto ? "separate" : null,
      },
      loveLetterPhoto: existingMediaToPhoto(
        existingMedia.find((media) => media.section === "letter"),
      ),
    },
    musicVoice: {
      ...formData.musicVoice,
      music: initialData.music,
      voiceNote:
        voiceNoteMedia && voiceNoteMedia.previewUrl
          ? {
              previewUrl: voiceNoteMedia.previewUrl,
              originalFilename: voiceNoteMedia.originalFilename,
              mimeType: voiceNoteMedia.mimeType,
              sizeBytes: voiceNoteMedia.sizeBytes,
              uploadStatus: "uploaded",
              mediaId: voiceNoteMedia.id,
              storagePath: voiceNoteMedia.storagePath,
              semanticKey: voiceNoteMedia.semanticKey,
              sectionItemId: voiceNoteMedia.sectionItemId,
            }
          : null,
    },
    siteAccess: {
      passcode: "",
      confirmPasscode: "",
      passcodeHint: initialData.siteAccess.passcodeHint,
      hasExistingPasscode: initialData.siteAccess.hasExistingPasscode,
    },
    timeline: initialData.timeline.map((item, index) => ({
      ...item,
      photo: existingMediaToPhoto(
        existingMedia.find(
          (media) => media.section === "timeline" && media.sectionItemId === item.id,
        ),
      ),
      sortOrder: index,
    })),
    letters: initialLetters.map((letter, index) => ({ ...letter, sortOrder: index })),
    confirmedSkips: initialData.confirmedSkips,
    legalConsents: initialData.legalConsents ?? formData.legalConsents,
  };
}

function isStoryOfUsSubmissionStatus(value: string): value is StoryOfUsSetupFormData["status"] {
  return ["draft", "submitted", "in_review", "published", "archived"].includes(value);
}

function existingMediaToPhoto(
  media: StoryOfUsSetupAccessExistingMediaItem | undefined,
): StoryOfUsPhotoDraftItem | null {
  if (!media) {
    return null;
  }

  return {
    id: media.sectionItemId || media.id,
    previewUrl: media.previewUrl,
    caption: media.caption,
    sortOrder: media.sortOrder,
    uploadStatus: media.previewUrl ? "uploaded" : "failed",
    uploadError: media.previewUrl ? undefined : "Bu dosya henüz yüklenmemiş.",
    mediaId: media.id,
    storagePath: media.storagePath,
    semanticKey: media.semanticKey,
    sectionItemId: media.sectionItemId,
    originalFilename: media.originalFilename,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
  };
}

function removeConfirmedSkip(
  confirmedSkips: StoryOfUsSetupFormData["confirmedSkips"],
  sectionId: StoryOfUsOptionalSectionId,
) {
  const nextConfirmedSkips = { ...confirmedSkips };
  delete nextConfirmedSkips[sectionId];
  return nextConfirmedSkips;
}

function serializeSetupDraft(formData: StoryOfUsSetupFormData): StoryOfUsSetupDraft {
  return {
    orderReference: formData.orderReference,
    status: formData.status,
    contactCouple: formData.contactCouple,
    siteAccess: {
      passcodeHint: formData.siteAccess.passcodeHint,
      hasExistingPasscode: formData.siteAccess.hasExistingPasscode,
    },
    media: {
      openingPhotos: {
        firstPerson: null,
        secondPerson: null,
      },
      promptPhotos: formData.media.promptPhotos.map((prompt) => ({
        id: prompt.id,
        title: prompt.title,
        helperText: prompt.helperText,
        photo: null,
        sortOrder: prompt.sortOrder,
      })),
      puzzle: {
        selectedPhotoId: null,
        puzzlePhoto: null,
        sourceType: null,
        confirmedNoPuzzle: formData.media.puzzle.confirmedNoPuzzle,
      },
      loveLetterPhoto: null,
    },
    musicVoice: {
      music: formData.musicVoice.music,
      voiceNote: null,
    },
    confirmedSkips: formData.confirmedSkips,
    legalConsents: formData.legalConsents,
    timeline: getOrderedTimelineItems(formData.timeline).map((item, index) => ({
      ...item,
      photo: null,
      sortOrder: index,
    })),
    letters: getOrderedLetters(formData.letters).map((letter, index) => ({
      ...letter,
      sortOrder: index,
    })),
  };
}

function createStoryOfUsSubmissionFormData(formData: StoryOfUsSetupFormData, setupToken: string) {
  const submissionFormData = new FormData();
  const photos = getOrderedPhotos(formData.media.photos);
  const promptPhotos = [...formData.media.promptPhotos].sort((a, b) => a.sortOrder - b.sortOrder);
  const timelineItems = getOrderedTimelineItems(formData.timeline);
  const normalizedContactPhone = normalizeTurkeyMobilePhone(formData.contactCouple.contactPhone);
  const payload = {
    setupToken,
    orderReference: formData.orderReference,
    contactCouple: {
      ...formData.contactCouple,
      contactPhone: normalizedContactPhone ?? formData.contactCouple.contactPhone,
    },
    siteAccess: formData.siteAccess,
    media: {
      openingPhotos: {
        firstPerson: createPhotoPayload(formData.media.openingPhotos.firstPerson, {
          semanticKey: "hero_left",
          sectionItemId: "firstPerson",
          sortOrder: 0,
        }),
        secondPerson: createPhotoPayload(formData.media.openingPhotos.secondPerson, {
          semanticKey: "hero_right",
          sectionItemId: "secondPerson",
          sortOrder: 1,
        }),
      },
      promptPhotos: promptPhotos.map((prompt, index) => ({
        id: prompt.id,
        title: prompt.title,
        helperText: prompt.helperText,
        sortOrder: index,
        photo: createPhotoPayload(prompt.photo, {
          semanticKey: prompt.id,
          sortOrder: index,
        }),
      })),
      photos: photos
        .map((photo) =>
          createPhotoPayload(photo, {
            semanticKey: "gallery_photo",
            sectionItemId: photo.id,
            sortOrder: photo.sortOrder,
          }),
        )
        .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo)),
      puzzle: {
        selectedPhotoId: formData.media.puzzle.selectedPhotoId,
        puzzlePhoto:
          formData.media.puzzle.sourceType === "separate"
            ? createPhotoPayload(formData.media.puzzle.puzzlePhoto, {
                semanticKey: "puzzle_source",
                sectionItemId: "puzzlePhoto",
                sortOrder: 0,
              })
            : null,
        sourceType: formData.media.puzzle.sourceType,
        confirmedNoPuzzle: formData.media.puzzle.confirmedNoPuzzle,
      },
      loveLetterPhoto: createPhotoPayload(formData.media.loveLetterPhoto, {
        semanticKey: "love_letter_side_photo",
        sectionItemId: "loveLetterPhoto",
        sortOrder: 0,
      }),
    },
    musicVoice: {
      music: formData.musicVoice.music,
      voiceNote:
        formData.musicVoice.voiceNote && formData.musicVoice.voiceNote.file
          ? {
              originalFilename: formData.musicVoice.voiceNote.file.name,
              mimeType: formData.musicVoice.voiceNote.file.type,
              sizeBytes: formData.musicVoice.voiceNote.file.size,
            }
          : null,
    },
    confirmedSkips: formData.confirmedSkips,
    legalConsents: formData.legalConsents,
    timeline: timelineItems.map((item, index) => ({
      ...item,
      sortOrder: index,
      photo: createPhotoPayload(item.photo, {
        semanticKey: "timeline_item",
        sectionItemId: item.id,
        sortOrder: index,
      }),
    })),
    letters: getOrderedLetters(formData.letters),
  };

  submissionFormData.append("payload", JSON.stringify(payload));

  photos.forEach((photo) => {
    if (photo.file) {
      submissionFormData.append(`photoFile:${photo.id}`, photo.file, photo.file.name);
    }
  });

  appendPhotoFile(submissionFormData, "openingPhoto:firstPerson", formData.media.openingPhotos.firstPerson);
  appendPhotoFile(submissionFormData, "openingPhoto:secondPerson", formData.media.openingPhotos.secondPerson);
  promptPhotos.forEach((prompt) => {
    appendPhotoFile(submissionFormData, `promptPhoto:${prompt.id}`, prompt.photo);
  });
  timelineItems.forEach((item) => {
    appendPhotoFile(submissionFormData, `timelinePhoto:${item.id}`, item.photo);
  });
  appendPhotoFile(submissionFormData, "loveLetterPhoto", formData.media.loveLetterPhoto);

  if (formData.musicVoice.voiceNote?.file) {
    submissionFormData.append(
      "voiceNoteFile",
      formData.musicVoice.voiceNote.file,
      formData.musicVoice.voiceNote.file.name,
    );
  }

  if (
    formData.media.puzzle.sourceType === "separate" &&
    formData.media.puzzle.puzzlePhoto?.file
  ) {
    submissionFormData.append(
      "puzzlePhotoFile",
      formData.media.puzzle.puzzlePhoto.file,
      formData.media.puzzle.puzzlePhoto.file.name,
    );
  }

  return submissionFormData;
}

function createPhotoPayload(
  photo: StoryOfUsPhotoDraftItem | null,
  options: { semanticKey?: string; sectionItemId?: string; sortOrder?: number } = {},
) {
  if (!photo?.file) {
    if (!photo?.mediaId) {
      return null;
    }

    return {
      id: photo.id,
      caption: photo.caption,
      sortOrder: options.sortOrder ?? photo.sortOrder,
      originalFilename: photo.originalFilename ?? "",
      mimeType: photo.mimeType ?? "",
      sizeBytes: photo.sizeBytes ?? 0,
      semanticKey: options.semanticKey ?? photo.semanticKey ?? "",
      sectionItemId: options.sectionItemId ?? photo.sectionItemId ?? "",
      mediaId: photo.mediaId,
      storagePath: photo.storagePath ?? "",
    };
  }

  return {
    id: photo.id,
    caption: photo.caption,
    sortOrder: options.sortOrder ?? photo.sortOrder,
    originalFilename: photo.file.name,
    mimeType: photo.file.type,
    sizeBytes: photo.file.size,
    semanticKey: options.semanticKey ?? "",
    sectionItemId: options.sectionItemId ?? "",
    mediaId: photo.mediaId,
    storagePath: photo.storagePath,
  };
}

function appendPhotoFile(formData: FormData, key: string, photo: StoryOfUsPhotoDraftItem | null) {
  if (photo?.file) {
    formData.append(key, photo.file, photo.file.name);
  }
}

function getMediaUploadBlocker(formData: StoryOfUsSetupFormData) {
  const photoItems = collectPhotoItems(formData);
  const hasUploadingPhoto = photoItems.some((photo) => photo.uploadStatus === "uploading");
  const hasFailedPhoto = photoItems.some((photo) => photo.uploadStatus === "failed");
  const voiceStatus = formData.musicVoice.voiceNote?.uploadStatus;

  if (hasUploadingPhoto || voiceStatus === "uploading") {
    return "Dosya yüklemeleri devam ediyor. Lütfen yüklemeler tamamlandıktan sonra gönderin.";
  }

  if (hasFailedPhoto) {
    return "Bazı fotoğraflar yüklenemedi. Lütfen başarısız dosyaları tekrar yükleyin veya kaldırın.";
  }

  if (voiceStatus === "failed") {
    return "Ses notu yüklenemedi. Lütfen tekrar yükleyin veya ses notu bölümünü istemediğinizi onaylayın.";
  }

  return null;
}

function collectPhotoItems(formData: StoryOfUsSetupFormData) {
  return [
    formData.media.openingPhotos.firstPerson,
    formData.media.openingPhotos.secondPerson,
    ...formData.media.promptPhotos.map((prompt) => prompt.photo),
    ...formData.media.photos,
    formData.media.puzzle.puzzlePhoto,
    formData.media.loveLetterPhoto,
    ...formData.timeline.map((item) => item.photo),
  ].filter((photo): photo is StoryOfUsPhotoDraftItem => Boolean(photo));
}

function saveSetupDraft(formData: StoryOfUsSetupFormData, setupToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getSetupDraftStorageKey(setupToken);

  if (!storageKey) {
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify(serializeSetupDraft(formData)),
  );
}

function restoreSetupDraft(setupToken: string): StoryOfUsSetupFormData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = getSetupDraftStorageKey(setupToken);

  if (!storageKey) {
    return null;
  }

  const rawDraft = window.localStorage.getItem(storageKey);

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
          photo: null,
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
        openingPhotos: {
          firstPerson: null,
          secondPerson: null,
        },
        promptPhotos: createEmptyStoryOfUsSetupFormData().media.promptPhotos,
        photos: [],
        puzzle: {
          selectedPhotoId: null,
          puzzlePhoto: null,
          sourceType: null,
          confirmedNoPuzzle: Boolean(parsedDraft.media?.puzzle?.confirmedNoPuzzle),
        },
        loveLetterPhoto: null,
      },
      musicVoice: {
        music: {
          ...emptyFormData.musicVoice.music,
          ...(parsedDraft.musicVoice?.music ?? {}),
        },
        voiceNote: null,
      },
      siteAccess: {
        passcode: "",
        confirmPasscode: "",
        passcodeHint:
          typeof parsedDraft.siteAccess?.passcodeHint === "string"
            ? parsedDraft.siteAccess.passcodeHint
            : "",
        hasExistingPasscode: Boolean(parsedDraft.siteAccess?.hasExistingPasscode),
      },
      confirmedSkips: parsedDraft.confirmedSkips ?? emptyFormData.confirmedSkips,
      legalConsents: restoreLegalConsents(parsedDraft.legalConsents, emptyFormData.legalConsents),
      timeline: restoredTimeline,
      letters: restoredLetters,
    };
  } catch {
    clearSetupDraft(setupToken);
    return null;
  }
}

function restoreLegalConsents(
  legalConsents: Partial<StoryOfUsLegalConsents> | undefined,
  fallback: StoryOfUsLegalConsents,
): StoryOfUsLegalConsents {
  return {
    privacyNoticeAccepted: restoreLegalConsentState(
      legalConsents?.privacyNoticeAccepted,
      fallback.privacyNoticeAccepted,
    ),
    explicitConsentAccepted: restoreLegalConsentState(
      legalConsents?.explicitConsentAccepted,
      fallback.explicitConsentAccepted,
    ),
    contentResponsibilityAccepted: restoreLegalConsentState(
      legalConsents?.contentResponsibilityAccepted,
      fallback.contentResponsibilityAccepted,
    ),
    serviceStartConsentAccepted: restoreLegalConsentState(
      legalConsents?.serviceStartConsentAccepted,
      fallback.serviceStartConsentAccepted,
    ),
  };
}

function restoreLegalConsentState(
  consentState: Partial<StoryOfUsLegalConsents[LegalConsentKey]> | undefined,
  fallback: StoryOfUsLegalConsents[LegalConsentKey],
) {
  if (!consentState || typeof consentState.accepted !== "boolean") {
    return fallback;
  }

  return consentState.accepted
    ? {
        accepted: true,
        acceptedAt:
          typeof consentState.acceptedAt === "string"
            ? consentState.acceptedAt
            : new Date().toISOString(),
      }
    : {
        accepted: false,
      };
}

function clearSetupDraft(setupToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getSetupDraftStorageKey(setupToken);

  if (!storageKey) {
    return;
  }

  window.localStorage.removeItem(storageKey);
}

function getSetupDraftStorageKey(setupToken: string) {
  const normalizedToken = setupToken.trim();

  if (!normalizedToken) {
    return null;
  }

  return `${STORYOFUS_SETUP_DRAFT_STORAGE_KEY}.${normalizedToken}`;
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

function formatExistingMediaName(media: StoryOfUsSetupAccessExistingMediaItem) {
  const filename = media.originalFilename || media.storagePath.split("/").pop() || "Yüklenmiş dosya";
  const sizeText = media.sizeBytes > 0 ? ` · ${formatFileSize(media.sizeBytes)}` : "";
  return `${filename}${sizeText}`;
}

function formatEditableUntil(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRemainingEditWindowText(value: string) {
  const editUntilTime = new Date(value).getTime();
  const remainingMs = editUntilTime - Date.now();

  if (!Number.isFinite(editUntilTime) || remainingMs <= 0) {
    return "";
  }

  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `Yaklaşık ${hours} saat ${minutes} dakika kaldı.`;
  }

  if (hours > 0) {
    return `Yaklaşık ${hours} saat kaldı.`;
  }

  return `Yaklaşık ${minutes} dakika kaldı.`;
}

function getSkippedImportantFieldReviewItems(formData: StoryOfUsSetupFormData) {
  const items: string[] = [];

  if (isSectionConfirmedSkipped("relationshipStartDate", formData)) {
    items.push("İlişki başlangıç tarihi eklenmeyecek.");
  }

  if (isSectionConfirmedSkipped("relationshipStory", formData)) {
    items.push("Hikaye bölümü eklenmeyecek.");
  }

  if (isSectionConfirmedSkipped("recipientNickname", formData)) {
    items.push("Hitap ismi eklenmeyecek.");
  }

  if (isSectionConfirmedSkipped("specialDateLabel", formData)) {
    items.push("Özel tarih başlığı eklenmeyecek.");
  }

  return items;
}

function getOrderedPhotos(photos: StoryOfUsPhotoDraftItem[]) {
  return [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
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

function getFirstPersonDisplayName(contactCouple: StoryOfUsContactCoupleData) {
  const coupleNames = contactCouple.coupleDisplayName
    .split("&")
    .map((part) => part.trim())
    .filter(Boolean);

  return coupleNames[0] || contactCouple.customerName.trim() || "İlk kişi";
}

function getSecondPersonDisplayName(contactCouple: StoryOfUsContactCoupleData) {
  const coupleNames = contactCouple.coupleDisplayName
    .split("&")
    .map((part) => part.trim())
    .filter(Boolean);

  return coupleNames[1] || contactCouple.partnerName.trim() || "İkinci kişi";
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

function StepValidationPanel({
  panelRef,
  notice,
  highlightedWarningId,
  onConfirmSkip,
  onCancelSkip,
}: {
  panelRef: RefObject<HTMLElement | null>;
  notice: StepValidationNotice | null;
  highlightedWarningId: StoryOfUsOptionalSectionId | null;
  onConfirmSkip: (sectionId: StoryOfUsOptionalSectionId) => void;
  onCancelSkip: (sectionId: StoryOfUsOptionalSectionId) => void;
}) {
  const warnings = getRenderableValidationWarnings(notice);

  if (!notice || (notice.blockingErrors.length === 0 && warnings.length === 0)) {
    return null;
  }

  const hasBlockingErrors = notice.blockingErrors.length > 0;

  return (
    <section
      ref={panelRef}
      aria-live="polite"
      className={`mb-5 rounded-3xl border p-4 shadow-sm ${
        hasBlockingErrors
          ? "border-red-200 bg-red-50/80 shadow-red-100/60"
          : "border-rose-200 bg-rose-50/80 shadow-rose-100/60"
      }`}
    >
      {notice.blockingErrors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-900">
            Devam etmeden önce birkaç temel bilgiyi tamamlamamız gerekiyor.
          </h4>
          <p className="mt-2 text-sm leading-6 text-red-900/70">
            Size kurulum linkini ve gerekirse destek mesajlarını doğru şekilde ulaştırabilmemiz
            için bu bilgileri net almamız gerekiyor.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-red-900/80">
            {notice.blockingErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className={hasBlockingErrors ? "mt-5 border-t border-rose-200 pt-5" : ""}>
          <h4 className="text-sm font-semibold text-rose-900">
            {warnings.length === 1 ? "Küçük bir hatırlatma" : "Kontrol etmeniz gereken bölümler"}
          </h4>
          <p className="mt-2 text-sm leading-6 text-rose-950/70">
            Eksik bırakmak istediğiniz bölümleri tek tek onaylayabilir ya da ilgili adıma dönüp
            tamamlayabilirsiniz.
          </p>
          <div className="mt-4 grid gap-3">
            {warnings.map((warning) => (
              <div
                key={warning.sectionId}
                data-setup-warning={warning.sectionId}
                className={`rounded-2xl border bg-white/80 p-3 shadow-sm transition duration-300 ${
                  highlightedWarningId === warning.sectionId
                    ? "border-rose-300 shadow-lg shadow-rose-200/70 ring-4 ring-rose-100"
                    : "border-rose-100 shadow-rose-100/50"
                }`}
              >
                <p className="text-sm leading-6 text-rose-950/70">{warning.message}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onConfirmSkip(warning.sectionId)}
                    className="rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-600"
                  >
                    {warning.confirmLabel || "Bunu istemiyorum"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelSkip(warning.sectionId)}
                    className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    {warning.cancelLabel || "Eksikleri tamamlayacağım"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ConfirmedSkipNotices({
  sections,
  formData,
  onUndoSkip,
}: {
  sections: StoryOfUsOptionalSectionId[];
  formData: StoryOfUsSetupFormData;
  onUndoSkip: (sectionId: StoryOfUsOptionalSectionId) => void;
}) {
  const skippedSections = sections.filter((sectionId) =>
    isSectionConfirmedSkipped(sectionId, formData),
  );

  if (skippedSections.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 grid gap-2">
      {skippedSections.map((sectionId) => (
        <div
          key={sectionId}
          className="flex flex-col gap-3 rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 text-sm leading-6 text-rose-950/65 shadow-sm shadow-rose-100/45 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            <span className="font-semibold text-rose-700">
              {getOptionalSectionTitle(sectionId)}:
            </span>{" "}
            Bu bölüm isteğiniz üzerine web sitesinde gösterilmeyecek.
          </p>
          <button
            type="button"
            onClick={() => onUndoSkip(sectionId)}
            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Geri al
          </button>
        </div>
      ))}
    </div>
  );
}

function getOptionalSectionTitle(sectionId: StoryOfUsOptionalSectionId) {
  switch (sectionId) {
    case "photos":
      return "Fotoğraflar";
    case "puzzle":
      return "Puzzle";
    case "music":
      return "Müzik";
    case "voiceNote":
      return "Ses notu";
    case "timeline":
      return "Zaman çizelgesi";
    case "letters":
      return "Mektuplar";
  }
}

function PhotosPuzzleStep({
  contactCouple,
  openingPhotos,
  promptPhotos,
  photos,
  puzzle,
  existingMedia,
  onUpdateOpeningPhoto,
  onRemoveOpeningPhoto,
  onUpdatePromptPhoto,
  onUpdatePromptPhotoCaption,
  onRemovePromptPhoto,
  onAddPhotoFiles,
  onUpdatePhotoCaption,
  onRemovePhoto,
  onSelectGalleryPhotoForPuzzle,
  onAddSeparatePuzzlePhoto,
  onUpdatePuzzlePhotoCaption,
  onRemoveSeparatePuzzlePhoto,
  onClearPuzzleSelection,
}: {
  contactCouple: StoryOfUsContactCoupleData;
  openingPhotos: StoryOfUsOpeningPhotosData;
  promptPhotos: StoryOfUsPromptPhotoItem[];
  photos: StoryOfUsPhotoDraftItem[];
  puzzle: StoryOfUsPuzzleData;
  existingMedia: StoryOfUsSetupAccessExistingMediaItem[];
  onUpdateOpeningPhoto: (position: keyof StoryOfUsOpeningPhotosData, file: File) => void;
  onRemoveOpeningPhoto: (position: keyof StoryOfUsOpeningPhotosData) => void;
  onUpdatePromptPhoto: (promptId: string, file: File) => void;
  onUpdatePromptPhotoCaption: (promptId: string, caption: string) => void;
  onRemovePromptPhoto: (promptId: string) => void;
  onAddPhotoFiles: (files: FileList | File[]) => void;
  onUpdatePhotoCaption: (photoId: string, caption: string) => void;
  onRemovePhoto: (photoId: string) => void;
  onSelectGalleryPhotoForPuzzle: (photoId: string) => void;
  onAddSeparatePuzzlePhoto: (file: File) => void;
  onUpdatePuzzlePhotoCaption: (caption: string) => void;
  onRemoveSeparatePuzzlePhoto: () => void;
  onClearPuzzleSelection: () => void;
}) {
  const selectedGalleryPuzzlePhoto = photos.find((photo) => photo.id === puzzle.selectedPhotoId);
  const firstPersonName = getFirstPersonDisplayName(contactCouple);
  const secondPersonName = getSecondPersonDisplayName(contactCouple);
  const existingOpeningMedia = existingMedia.filter((media) => media.section === "opening");
  const existingPromptMedia = existingMedia.filter((media) => media.section === "memory_prompt");

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">
            Sayfanızın açılışında görünecek fotoğraflar
          </h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Sayfanızın açılışında, isimlerinizin yanında ikinize ait ayrı fotoğraflar yer alacak.
            Lütfen her biriniz için birer tek kişilik fotoğraf yükleyin.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SinglePhotoPicker
            title={`${firstPersonName} için fotoğraf`}
            description="İsim sıralamasında solda görünen kişinin yanında yer alır."
            photo={openingPhotos.firstPerson}
            buttonText="Fotoğraf seç"
            emptyText="Henüz fotoğraf seçilmedi."
            onSelect={(file) => onUpdateOpeningPhoto("firstPerson", file)}
            onRemove={() => onRemoveOpeningPhoto("firstPerson")}
          />
          <SinglePhotoPicker
            title={`${secondPersonName} için fotoğraf`}
            description="İsim sıralamasında sağda görünen kişinin yanında yer alır."
            photo={openingPhotos.secondPerson}
            buttonText="Fotoğraf seç"
            emptyText="Henüz fotoğraf seçilmedi."
            onSelect={(file) => onUpdateOpeningPhoto("secondPerson", file)}
            onRemove={() => onRemoveOpeningPhoto("secondPerson")}
          />
        </div>
        {existingOpeningMedia.length > 0 && (
          <div className="mt-4">
            <ExistingMediaList title="Mevcut açılış fotoğrafları korunacak" items={existingOpeningMedia} />
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Benim gözümde sen fotoğrafları</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Bu bölümde her karta, başlıktaki duyguya uygun bir fotoğraf seçiyorsunuz.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {promptPhotos.map((prompt) => (
            <article
              key={prompt.id}
              className="min-w-0 rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/45"
            >
              <SinglePhotoPicker
                title={prompt.title}
                description={prompt.helperText}
                photo={prompt.photo}
                buttonText="Bu karta fotoğraf seç"
                emptyText="Bu karta henüz fotoğraf seçilmedi."
                onSelect={(file) => onUpdatePromptPhoto(prompt.id, file)}
                onRemove={() => onRemovePromptPhoto(prompt.id)}
              />
              {prompt.photo && (
                <div className="mt-3">
                  <SetupTextField
                    label="Kart başlığı / notu"
                    value={prompt.photo.caption}
                    onChange={(caption) => onUpdatePromptPhotoCaption(prompt.id, caption)}
                    placeholder={`Örn. ${prompt.title}`}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
        {existingPromptMedia.length > 0 && (
          <div className="mt-4">
            <ExistingMediaList title="Mevcut Benim gözümde sen fotoğrafları korunacak" items={existingPromptMedia} />
          </div>
        )}
      </section>

      <section
        data-setup-section="photos"
        className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h4 className="text-base font-semibold text-rose-950">Galeri fotoğrafları</h4>
            <p className="mt-1 text-sm leading-6 text-rose-950/60">
              Galeri fotoğrafları sitenin anı bölümlerinde kullanılır. Puzzle için ayrıca seçim
              yapabilirsiniz.
            </p>
          </div>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300">
            Fotoğraflarınızı ekleyin
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
            Eklediğiniz fotoğraflar romantik galeri için hazırlanacak. Galeriyi boş bırakıp
            puzzle için ayrıca fotoğraf da yükleyebilirsiniz.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => {
            const isSelectedForPuzzle =
              puzzle.sourceType === "gallery" && photo.id === puzzle.selectedPhotoId;

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
                  <MediaUploadStatus status={photo.uploadStatus} error={photo.uploadError} />
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectGalleryPhotoForPuzzle(photo.id)}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                        isSelectedForPuzzle
                          ? "bg-rose-100 text-rose-700"
                          : "bg-rose-500 text-white shadow-md shadow-rose-200 hover:bg-rose-600"
                      }`}
                    >
                      {isSelectedForPuzzle ? "Puzzle fotoğrafı seçildi" : "Puzzle için de kullan"}
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

      <section
        data-setup-section="puzzle"
        className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/50 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h4 className="text-base font-semibold text-rose-950">Puzzle fotoğrafı</h4>
            <p className="mt-1 text-sm leading-6 text-rose-950/60">
              Puzzle ayrı bir mini oyun olarak hazırlanır. Galeriden bir fotoğraf seçebilir veya
              sadece puzzle için ayrı bir görsel yükleyebilirsiniz.
            </p>
          </div>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 shadow-sm shadow-rose-100 transition hover:bg-rose-50">
            Puzzle için ayrı fotoğraf yükle
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  onAddSeparatePuzzlePhoto(file);
                  event.target.value = "";
                }
              }}
            />
          </label>
        </div>

        {puzzle.sourceType === "separate" && puzzle.puzzlePhoto ? (
          <div className="mt-5 grid gap-4 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm shadow-rose-100/40 sm:grid-cols-[160px_1fr_auto] sm:items-center">
            <img
              src={puzzle.puzzlePhoto.previewUrl}
              alt="Ayrı puzzle fotoğrafı önizlemesi"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md shadow-rose-100 sm:w-[160px]"
              loading="lazy"
              decoding="async"
            />
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
                  Puzzle fotoğrafı
                </p>
                <h5 className="mt-1 text-base font-semibold text-rose-950">
                  Ayrı puzzle fotoğrafı yüklendi.
                </h5>
                {puzzle.puzzlePhoto.file?.name && (
                  <p className="mt-1 text-sm leading-6 text-rose-950/60">
                    {puzzle.puzzlePhoto.file.name}
                  </p>
                )}
              </div>
              <SetupTextField
                label="Puzzle fotoğraf notu"
                value={puzzle.puzzlePhoto.caption}
                onChange={onUpdatePuzzlePhotoCaption}
                placeholder="Bu puzzle fotoğrafı için kısa bir not"
              />
              <MediaUploadStatus
                status={puzzle.puzzlePhoto.uploadStatus}
                error={puzzle.puzzlePhoto.uploadError}
              />
            </div>
            <button
              type="button"
              onClick={onRemoveSeparatePuzzlePhoto}
              className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Puzzle fotoğrafını kaldır
            </button>
          </div>
        ) : puzzle.sourceType === "gallery" && selectedGalleryPuzzlePhoto ? (
          <div className="mt-5 grid gap-4 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm shadow-rose-100/40 sm:grid-cols-[140px_1fr_auto] sm:items-center">
            <img
              src={selectedGalleryPuzzlePhoto.previewUrl}
              alt="Galeri içinden seçilen puzzle fotoğrafı"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md shadow-rose-100 sm:w-[140px]"
              loading="lazy"
              decoding="async"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
                Puzzle fotoğrafı
              </p>
              <h5 className="mt-1 text-base font-semibold text-rose-950">
                Puzzle için galeri fotoğrafı seçildi.
              </h5>
              {selectedGalleryPuzzlePhoto.caption && (
                <p className="mt-1 text-sm leading-6 text-rose-950/60">
                  {selectedGalleryPuzzlePhoto.caption}
                </p>
              )}
              <MediaUploadStatus
                status={selectedGalleryPuzzlePhoto.uploadStatus}
                error={selectedGalleryPuzzlePhoto.uploadError}
              />
            </div>
            <button
              type="button"
              onClick={onClearPuzzleSelection}
              className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Puzzle seçimini temizle
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-rose-200 bg-rose-50/70 p-4 text-sm leading-6 text-rose-950/60">
            Henüz puzzle fotoğrafı seçilmedi.
          </div>
        )}
      </section>
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
      <section
        data-setup-section="music"
        className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5"
      >
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Şarkınızı ekleyin</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Spotify şarkısı ayrı bir bölüm olarak görünür. Linki, şarkı adını ve sanatçıyı
            eklemeniz yeterli.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SetupTextField
            label="Spotify şarkı linki"
            value={music.spotifyUrl}
            onChange={(nextValue) => onUpdateMusicField("spotifyUrl", nextValue)}
            placeholder="https://open.spotify.com/track/..."
            helperText="Şarkı linkini Spotify’dan kopyalayıp buraya yapıştırabilirsiniz."
            fieldKey="music"
            className="sm:col-span-2"
          />
          <SetupTextField
            label="Şarkı adı"
            value={music.songTitle}
            onChange={(nextValue) => onUpdateMusicField("songTitle", nextValue)}
            placeholder="Ahu"
          />
          <SetupTextField
            label="Sanatçı"
            value={music.artistName}
            onChange={(nextValue) => onUpdateMusicField("artistName", nextValue)}
            placeholder="Mabel Matiz"
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

      <section
        data-setup-section="voiceNote"
        className="rounded-3xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/50 sm:p-5"
      >
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Ses notu</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Ses notu tamamen isteğe bağlıdır. Eklemek isterseniz kısa ve içten bir kayıt yeterli.
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
            <div className="mt-3">
              <MediaUploadStatus status={voiceNote.uploadStatus} error={voiceNote.uploadError} />
            </div>
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
  onUpdateItemPhoto,
  onRemoveItemPhoto,
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
  onUpdateItemPhoto: (itemId: string, file: File) => void;
  onRemoveItemPhoto: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
}) {
  const orderedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid gap-5">
      <section
        data-setup-section="timeline"
        className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5"
      >
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
            className="min-h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
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
                      className="min-h-11 rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Yukarı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveItem(item.id, "down")}
                      disabled={isLastItem}
                      className="min-h-11 rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Aşağı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="min-h-11 rounded-full border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
                  <div className="sm:col-span-2">
                    <SinglePhotoPicker
                      title="Bu anıya ait fotoğraf"
                      description="Bu fotoğraf yalnızca bu zaman çizelgesi anısıyla eşleşir."
                      photo={item.photo}
                      buttonText="Anı fotoğrafı seç"
                      emptyText="Bu anıya henüz fotoğraf eklenmedi."
                      onSelect={(file) => onUpdateItemPhoto(item.id, file)}
                      onRemove={() => onRemoveItemPhoto(item.id)}
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
  loveLetterPhoto,
  onAddLoveLetter,
  onAddOpenWhenLetter,
  onAddDefaultOpenWhenLetters,
  onUpdateLetter,
  onUpdateLoveLetterPhoto,
  onRemoveLoveLetterPhoto,
  onRemoveLetter,
  onMoveLetter,
}: {
  letters: StoryOfUsLetterItem[];
  loveLetterPhoto: StoryOfUsPhotoDraftItem | null;
  onAddLoveLetter: () => void;
  onAddOpenWhenLetter: () => void;
  onAddDefaultOpenWhenLetters: () => void;
  onUpdateLetter: (
    letterId: string,
    field: keyof Pick<StoryOfUsLetterItem, "title" | "body">,
    value: string,
  ) => void;
  onUpdateLoveLetterPhoto: (file: File) => void;
  onRemoveLoveLetterPhoto: () => void;
  onRemoveLetter: (letterId: string) => void;
  onMoveLetter: (letterId: string, direction: "up" | "down") => void;
}) {
  const orderedLetters = [...letters].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasLoveLetter = orderedLetters.some((letter) => letter.type === "love_letter");
  const hasOpenWhenLetters = orderedLetters.some((letter) => letter.type === "open_when");

  return (
    <div className="grid gap-5">
      <section
        data-setup-section="letters"
        className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-sm shadow-rose-100/50 sm:p-5"
      >
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
              className="min-h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Aşk mektubu ekle
            </button>
            <button
              type="button"
              onClick={onAddOpenWhenLetter}
              className="min-h-12 rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Open-when mektubu ekle
            </button>
            <button
              type="button"
              onClick={onAddDefaultOpenWhenLetters}
              disabled={hasOpenWhenLetters}
              className="min-h-12 rounded-full border border-pink-200 bg-pink-50/70 px-5 py-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Demo open-when notlarını kullan
            </button>
          </div>
        </div>
        {hasLoveLetter && (
          <p className="mt-3 text-xs leading-5 text-rose-950/45">
            Ana aşk mektubu eklendiği için ikinci bir aşk mektubu eklenemez.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 shadow-sm shadow-rose-100/50 sm:p-5">
        <SinglePhotoPicker
          title="Mektubunuzun yanında görünecek fotoğraf"
          description="Kalbimden sana bölümünde mektubun yanında yer alacak özel fotoğrafı seçin."
          photo={loveLetterPhoto}
          buttonText="Mektup fotoğrafı seç"
          emptyText="Mektup bölümüne henüz fotoğraf eklenmedi."
          onSelect={onUpdateLoveLetterPhoto}
          onRemove={onRemoveLoveLetterPhoto}
        />
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
                      className="min-h-11 rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Yukarı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveLetter(letter.id, "down")}
                      disabled={isLastLetter}
                      className="min-h-11 rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Aşağı taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveLetter(letter.id)}
                      className="min-h-11 rounded-full border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
                      isLoveLetter ? DEFAULT_LOVE_LETTER_TITLE : getOpenWhenTitlePlaceholder(index)
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

function StoryOfUsSetupAccessScreen({ access }: { access: SetupAccessUiState }) {
  const content = getSetupAccessScreenContent(access);
  const note = typeof content.note === "string" && content.note.trim() ? content.note : null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#fff1f6_52%,#fffaf7_100%)] px-4 py-8 text-[#3d2323] sm:px-6 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 text-center shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-10">
          <div className="absolute -left-16 top-10 h-36 w-36 rounded-full bg-rose-200/25 blur-3xl" />
          <div className="absolute -right-12 bottom-8 h-40 w-40 rounded-full bg-pink-200/30 blur-3xl" />

          <div className="relative mx-auto grid max-w-2xl gap-5">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rose-100 bg-rose-50 text-2xl shadow-lg shadow-rose-100/70">
              {content.icon || "💌"}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
                StoryOfUs Setup
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-rose-950 sm:text-4xl">
                {content.title || "Kurulum bağlantısı kontrol ediliyor"}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-rose-950/65 sm:text-base">
                {content.body || "Lütfen birkaç saniye sonra tekrar deneyin."}
              </p>
              {note && (
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-rose-950/55">
                  {note}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function getSetupAccessScreenContent(access: SetupAccessUiState) {
  switch (access.status) {
    case "missing_token":
      return {
        icon: "💌",
        title: "Kurulum bağlantısı gerekiyor",
        body:
          "Kurulum formuna erişmek için ödeme sonrası size gönderilen özel bağlantıyı kullanmanız gerekiyor.",
        note:
          "Eğer ödeme yaptıysanız ve bağlantınızı bulamıyorsanız, lütfen e-posta kutunuzu ve spam klasörünüzü kontrol edin.",
      };
    case "checking":
      return {
        icon: "⏳",
        title: "Kurulum bağlantınız kontrol ediliyor...",
        body: "Sizin için özel kurulum bağlantısını nazikçe kontrol ediyoruz.",
      };
    case "not_found":
      return {
        icon: "💔",
        title: "Bu kurulum bağlantısı bulunamadı veya geçersiz.",
        body:
          "Bağlantıyı e-postanızdan eksiksiz açtığınızdan emin olun. Sorun devam ederse bizimle iletişime geçebilirsiniz.",
      };
    case "not_paid":
      return {
        icon: "💳",
        title: "Ödeme onayı bekleniyor.",
        body: "Kurulum formu, ödeme onaylandıktan sonra aktif hale gelir.",
        note: access.paymentStatus ? `Ödeme durumu: ${access.paymentStatus}` : undefined,
      };
    case "refund_under_review":
      return {
        icon: "💌",
        title: access.title,
        body: (
          <>
            {access.body} Ayrıntılı bilgi için{" "}
            <a
              href="mailto:contact@leony.tech"
              className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4 transition hover:text-rose-700"
            >
              contact@leony.tech
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </>
        ),
      };
    case "edit_locked":
      return {
        icon: "💌",
        title: "Düzenleme süreniz doldu.",
        body:
          "Kurulum bilgileriniz alınmış görünüyor. Düzenleme süresi sona erdiği için form artık değiştirilemez.",
        note: access.editableUntil
          ? `Son düzenleme zamanı: ${formatEditableUntil(access.editableUntil)}. Bu aşamadan sonra web sitenizin hazırlanma süreci başlar.`
          : "Bu aşamadan sonra web sitenizin hazırlanma süreci başlar.",
      };
    case "error":
      return {
        icon: "!",
        title: "Kurulum bağlantısı kontrol edilemedi.",
        body: access.message,
      };
  }
}

function StoryOfUsSubmittedReentryScreen({
  editableUntil,
  onEnterEditMode,
}: {
  editableUntil: string | null;
  onEnterEditMode: () => void;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#fff1f6_52%,#fffaf7_100%)] px-4 py-8 text-[#3d2323] sm:px-6 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 text-center shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-10">
          <div className="absolute -left-16 top-10 h-36 w-36 rounded-full bg-rose-200/25 blur-3xl" />
          <div className="absolute -right-12 bottom-8 h-40 w-40 rounded-full bg-pink-200/30 blur-3xl" />

          <div className="relative mx-auto grid max-w-2xl gap-6">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-rose-50 text-2xl shadow-lg shadow-rose-100/70">
              💌
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
                StoryOfUs Setup
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
                Bilgilerinizi aldık 💌
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-rose-950/65 sm:text-base">
                Kurulum formunuz başarıyla gönderildi. Aşağıdaki saate kadar bilgilerinizi yeniden
                düzenleyebilirsiniz.
              </p>
            </div>

            <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-5 text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/50">
              {editableUntil ? (
                <>
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                    Son düzenleme ve iade talebi zamanı
                  </span>
                  <span className="mt-2 block text-2xl font-bold text-rose-800 sm:text-3xl">
                    {formatEditableUntil(editableUntil)}
                  </span>
                  <span className="mt-3 block">
                    Aynı süre, iade talebinizi bize iletebileceğiniz son zamanı da gösterir.
                  </span>
                </>
              ) : (
                "Bilgilerinizi 3 saatlik düzenleme süresi içinde güncelleyebilirsiniz."
              )}
            </div>

            <div className="rounded-3xl border border-pink-100 bg-white/80 p-5 text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/40">
              Herhangi bir konuda bize ulaşmanız gerekirse veya eklemek istediğiniz bir şey olursa{" "}
              <a
                href="mailto:contact@leony.tech"
                className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4 transition hover:text-rose-700"
              >
                contact@leony.tech
              </a>{" "}
              adresinden bize yazabilirsiniz.
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onEnterEditMode}
                className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
              >
                Bilgilerimi düzenle
              </button>
              <Link
                to={storyOfUsDemoCtaConfig.mainPath}
                className="rounded-full border border-rose-200 bg-white/85 px-6 py-3 text-sm font-semibold text-rose-700 shadow-sm shadow-rose-100 transition hover:border-rose-300 hover:bg-rose-50"
              >
                StoryOfUs sayfasına dön
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StoryOfUsSetupSuccessScreen({
  editableUntil,
  onEditAgain,
}: {
  editableUntil: string | null;
  onEditAgain: () => void;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f3_0%,#fff1f6_52%,#fffaf7_100%)] px-4 py-8 text-[#3d2323] sm:px-6 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 text-center shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-10">
          <div className="absolute -left-16 top-10 h-36 w-36 rounded-full bg-rose-200/25 blur-3xl" />
          <div className="absolute -right-12 bottom-8 h-40 w-40 rounded-full bg-pink-200/30 blur-3xl" />

          <div className="relative mx-auto grid max-w-2xl gap-6">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-rose-50 text-2xl shadow-lg shadow-rose-100/70">
              💌
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
                StoryOfUs Setup
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
                Bilgileriniz başarıyla alındı 💌
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-rose-950/65 sm:text-base">
                Bilgilerinizi aldık 💌 Herhangi bir konuda bize ulaşmanız gerekirse veya eklemek
                istediğiniz bir şey olursa{" "}
                <a
                  href="mailto:contact@leony.tech"
                  className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4 transition hover:text-rose-700"
                >
                  contact@leony.tech
                </a>{" "}
                adresinden bize yazabilirsiniz.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-rose-950/60 sm:text-base">
                {editableUntil
                  ? `Bilgilerinizi ${formatEditableUntil(editableUntil)} tarihine kadar düzenleyebilirsiniz. Aynı süre içinde iade talebinizi bize iletebilirsiniz.`
                  : "Bilgilerinizi 3 saatlik düzenleme süresi içinde güncelleyebilirsiniz."}
              </p>
            </div>

            <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-5 text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/50">
              Fotoğraf, müzik, zaman çizelgesi ve mektup detaylarınız güvenli şekilde kaydedildi.
              <span className="mt-2 block font-semibold text-rose-700">
                Final site giriş şifreniz kaydedildi.
              </span>
              {editableUntil && (
                <span className="mt-2 block font-semibold text-rose-700">
                  Son düzenleme ve iade talebi zamanı: {formatEditableUntil(editableUntil)}
                </span>
              )}
            </div>

            {editableUntil && (
              <div className="rounded-3xl border border-pink-100 bg-white/80 p-5 text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/40">
                İade talebinizin bu süre dolmadan Leony’ye ulaşması gerekir ve talep bu politika
                kapsamında işleme alınır. Süre sona erdiğinde bilgileriniz kilitlenir ve
                kişiselleştirilmiş web sitenizin hazırlanmasına başlanır. Bize{" "}
                <a
                  href="mailto:contact@leony.tech"
                  className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4 transition hover:text-rose-700"
                >
                  contact@leony.tech
                </a>{" "}
                adresinden yazabilirsiniz.
              </div>
            )}

            <div className="mx-auto inline-flex rounded-full border border-rose-100 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 shadow-sm shadow-rose-100/50">
              Başvuru durumunuz: Alındı
            </div>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onEditAgain}
                className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300"
              >
                Bilgileri düzenle
              </button>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}

function ReviewSubmitStep({
  formData,
  existingMedia,
  onEditStep,
  onSubmit,
  isSubmitting,
  submitError,
  legalConsentErrors,
  onUpdateLegalConsent,
}: {
  formData: StoryOfUsSetupFormData;
  existingMedia: StoryOfUsSetupAccessExistingMediaItem[];
  onEditStep: (stepId: StoryOfUsSetupStepId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  legalConsentErrors: string[];
  onUpdateLegalConsent: (consentKey: LegalConsentKey, accepted: boolean) => void;
}) {
  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(false);
  const selectedGalleryPuzzlePhoto = getSelectedPuzzlePhoto(
    formData.media.photos,
    formData.media.puzzle.selectedPhotoId,
  );
  const orderedTimelineItems = getOrderedTimelineItems(formData.timeline);
  const orderedLetters = getOrderedLetters(formData.letters);
  const voiceNoteSkip = formData.confirmedSkips.voiceNote;
  const isPhotosSkipped = isSectionConfirmedSkipped("photos", formData);
  const isPuzzleSkipped = isSectionConfirmedSkipped("puzzle", formData);
  const isMusicSkipped = isSectionConfirmedSkipped("music", formData);
  const isTimelineSkipped = isSectionConfirmedSkipped("timeline", formData);
  const isLettersSkipped = isSectionConfirmedSkipped("letters", formData);
  const existingGalleryMedia = existingMedia.filter(
    (media) => media.mediaType === "photo" && media.section === "gallery",
  );
  const existingOpeningMedia = existingMedia.filter(
    (media) => media.mediaType === "photo" && media.section === "opening",
  );
  const existingPromptMedia = existingMedia.filter(
    (media) => media.mediaType === "photo" && media.section === "memory_prompt",
  );
  const existingTimelineMedia = existingMedia.filter(
    (media) => media.mediaType === "photo" && media.section === "timeline",
  );
  const existingLetterMedia = existingMedia.filter(
    (media) => media.mediaType === "photo" && media.section === "letter",
  );
  const existingPuzzleMedia = existingMedia.filter(
    (media) => media.section === "puzzle" || media.isPuzzleSource,
  );
  const existingVoiceNoteMedia = existingMedia.filter((media) => media.section === "voice_note");
  const shouldRequireServiceStartConsent = formData.status === "draft";
  const areLegalConsentsComplete =
    validateLegalConsents(formData.legalConsents, shouldRequireServiceStartConsent).length === 0;
  const skippedImportantFields = getSkippedImportantFieldReviewItems(formData);

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
          <ReviewField
            label="Website giriş şifresi"
            value={
              formData.siteAccess.hasExistingPasscode || formData.siteAccess.passcode
                ? "Ayarlandı"
                : "Henüz ayarlanmadı"
            }
          />
          <ReviewField
            label="Şifre ipucu"
            value={displayValue(formData.siteAccess.passcodeHint)}
          />
        </div>
        {skippedImportantFields.length > 0 && (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-white/80 p-4 text-sm leading-7 text-rose-950/65">
            <p className="font-semibold text-rose-700">Eklenmeyecek kişisel detaylar</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {skippedImportantFields.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </ReviewSection>

      <ReviewSection
        title="Fotoğraflar & puzzle"
        description="Galeri görselleri ve mini puzzle için seçilen fotoğraf."
        onEdit={() => onEditStep("photosPuzzle")}
      >
        <div className="grid gap-4">
          <ReviewField
            label="Açılış fotoğrafları"
            value={`${[
              formData.media.openingPhotos.firstPerson,
              formData.media.openingPhotos.secondPerson,
            ].filter(Boolean).length} / 2 yeni fotoğraf`}
          />
          {(formData.media.openingPhotos.firstPerson ||
            formData.media.openingPhotos.secondPerson) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[formData.media.openingPhotos.firstPerson, formData.media.openingPhotos.secondPerson]
                .filter((photo): photo is StoryOfUsPhotoDraftItem => Boolean(photo))
                .map((photo, index) => (
                  <ReviewPhotoCard
                    key={photo.id}
                    photo={photo}
                    title={`Açılış fotoğrafı ${index + 1}`}
                  />
                ))}
            </div>
          )}
          {existingOpeningMedia.length > 0 && (
            <ExistingMediaList
              title="Mevcut açılış fotoğrafları korunacak"
              items={existingOpeningMedia}
            />
          )}

          <ReviewField
            label="Benim gözümde SEN"
            value={`${formData.media.promptPhotos.filter((prompt) => prompt.photo).length} / ${
              formData.media.promptPhotos.length
            } yeni fotoğraf`}
          />
          {formData.media.promptPhotos.some((prompt) => prompt.photo) && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {formData.media.promptPhotos
                .filter((prompt) => Boolean(prompt.photo))
                .map((prompt) => (
                  <ReviewPhotoCard
                    key={prompt.id}
                    photo={prompt.photo as StoryOfUsPhotoDraftItem}
                    title={prompt.title}
                  />
                ))}
            </div>
          )}
          {existingPromptMedia.length > 0 && (
            <ExistingMediaList
              title="Mevcut Benim gözümde SEN fotoğrafları korunacak"
              items={existingPromptMedia}
            />
          )}

          <ReviewField
            label="Toplam fotoğraf"
            value={`${formData.media.photos.length} fotoğraf`}
          />
          {formData.media.photos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {formData.media.photos.map((photo, index) => (
                <ReviewPhotoCard
                  key={photo.id}
                  photo={photo}
                  title={`Fotoğraf ${index + 1}`}
                />
              ))}
            </div>
          ) : (
            <ReviewSoftHint>
              {isPhotosSkipped
                ? "Galeri fotoğrafları isteğiniz üzerine kaldırılacak."
                : "Henüz galeri fotoğrafı eklenmedi."}
            </ReviewSoftHint>
          )}

          {existingGalleryMedia.length > 0 && !isPhotosSkipped && (
            <ExistingMediaList
              title="Mevcut galeri fotoğrafları korunacak"
              items={existingGalleryMedia}
            />
          )}

          {formData.media.puzzle.sourceType === "gallery" && selectedGalleryPuzzlePhoto ? (
            <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                Seçilen puzzle fotoğrafı
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                <img
                  src={selectedGalleryPuzzlePhoto.previewUrl}
                  alt="Seçilen puzzle fotoğrafı"
                  className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm shadow-rose-100 sm:w-[120px]"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="text-sm font-semibold text-rose-950">
                    Galeri fotoğrafı puzzle için kullanılacak.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-rose-950/60">
                    {selectedGalleryPuzzlePhoto.caption || "Bu fotoğraf puzzle için seçildi."}
                  </p>
                </div>
              </div>
            </div>
          ) : formData.media.puzzle.sourceType === "separate" &&
            formData.media.puzzle.puzzlePhoto ? (
            <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                Seçilen puzzle fotoğrafı
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                <img
                  src={formData.media.puzzle.puzzlePhoto.previewUrl}
                  alt="Ayrı puzzle fotoğrafı"
                  className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm shadow-rose-100 sm:w-[120px]"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="text-sm font-semibold text-rose-950">
                    Ayrı puzzle fotoğrafı yüklendi.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-rose-950/60">
                    {formData.media.puzzle.puzzlePhoto.caption ||
                      formData.media.puzzle.puzzlePhoto.file?.name ||
                      "Bu fotoğraf puzzle için seçildi."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ReviewSoftHint>
              {isPuzzleSkipped
                ? "Puzzle bölümü isteğiniz üzerine kaldırılacak."
                : "Puzzle için henüz bir fotoğraf seçilmedi."}
            </ReviewSoftHint>
          )}

          {existingPuzzleMedia.length > 0 && !isPuzzleSkipped && (
            <ExistingMediaList title="Mevcut puzzle fotoğrafı korunacak" items={existingPuzzleMedia} />
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
            value={
              isMusicSkipped
                ? "Bu bölüm isteğiniz üzerine kaldırılacak."
                : displayValue(formData.musicVoice.music.spotifyUrl)
            }
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
          ) : existingVoiceNoteMedia.length > 0 ? (
            <ReviewField
              label="Ses notu"
              value={`Mevcut ses notu korunacak: ${formatExistingMediaName(existingVoiceNoteMedia[0])}`}
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
                className="min-w-0 rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/40"
              >
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold text-rose-950">
                      {item.title || "Başlıksız anı"}
                    </h5>
                    {item.eventDate && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                        {item.eventDate}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-2 break-words text-sm leading-6 text-rose-950/60 [overflow-wrap:anywhere]">
                        {item.description}
                      </p>
                    )}
                    {item.photo && (
                      <img
                        src={item.photo.previewUrl}
                        alt={`${item.title || "Anı"} fotoğrafı`}
                        className="mt-3 aspect-[4/3] w-full max-w-xs rounded-2xl object-cover shadow-sm shadow-rose-100"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ReviewSoftHint>
            {isTimelineSkipped
              ? "Bu bölüm isteğiniz üzerine kaldırılacak."
              : "Henüz zaman çizelgesi anısı eklenmedi."}
          </ReviewSoftHint>
        )}
        {existingTimelineMedia.length > 0 && (
          <div className="mt-4">
            <ExistingMediaList title="Mevcut zaman çizelgesi fotoğrafları korunacak" items={existingTimelineMedia} />
          </div>
        )}
      </ReviewSection>

      <ReviewSection
        title="Mektuplar"
        description="Aşk mektubu ve open-when sürpriz notları."
        onEdit={() => onEditStep("letters")}
      >
        {formData.media.loveLetterPhoto ? (
          <div className="mb-4">
            <ReviewPhotoCard
              photo={formData.media.loveLetterPhoto}
              title="Kalbimden sana fotoğrafı"
            />
          </div>
        ) : existingLetterMedia.length > 0 ? (
          <div className="mb-4">
            <ExistingMediaList title="Mevcut mektup fotoğrafı korunacak" items={existingLetterMedia} />
          </div>
        ) : null}
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
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-rose-950/60 [overflow-wrap:anywhere]">
                      {letter.body}
                    </p>
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
          <ReviewSoftHint>
            {isLettersSkipped
              ? "Bu bölüm isteğiniz üzerine kaldırılacak."
              : "Henüz mektup eklenmedi."}
          </ReviewSoftHint>
        )}
      </ReviewSection>

      <ReviewSection
        title="Onaylar"
        description="StoryOfUs web sitenizi hazırlayabilmemiz için paylaştığınız içerikleri yalnızca bu hizmet kapsamında kullanacağız."
        onEdit={() => setIsPrivacyNoticeOpen((isOpen) => !isOpen)}
        editLabel={isPrivacyNoticeOpen ? "Aydınlatma metnini gizle" : "Aydınlatma metnini görüntüle"}
      >
        <div className="grid gap-4">
          {legalConsentErrors.length > 0 && (
            <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-left shadow-sm shadow-red-100/60">
              <h5 className="text-sm font-semibold text-red-900">
                Gönderim için onaylarınızı tamamlamamız gerekiyor.
              </h5>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-red-900/80">
                {legalConsentErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm leading-6 text-rose-950/60">
            Bu alanlar gönderimden önce zorunludur.
          </p>

          {isPrivacyNoticeOpen && (
            <div className="rounded-3xl border border-rose-100 bg-[#fffaf8] p-4 text-sm leading-7 text-rose-950/65 shadow-sm shadow-rose-100/45">
              Bu metin taslak bilgilendirme amaçlıdır. StoryOfUs kapsamında paylaştığınız bilgiler,
              web sitenizin hazırlanması, sizinle iletişim kurulması ve sipariş sürecinin
              yönetilmesi amacıyla işlenir.
            </div>
          )}

          <div className="grid gap-3">
            <ConsentCheckbox
              checked={formData.legalConsents.privacyNoticeAccepted.accepted}
              onChange={(accepted) => onUpdateLegalConsent("privacyNoticeAccepted", accepted)}
              label="Aydınlatma metnini okudum ve anladım."
            />
            <ConsentCheckbox
              checked={formData.legalConsents.explicitConsentAccepted.accepted}
              onChange={(accepted) => onUpdateLegalConsent("explicitConsentAccepted", accepted)}
              label="StoryOfUs web sitesinin hazırlanması için paylaştığım fotoğraf, ses kaydı, isim, anı, mektup ve benzeri içeriklerin işlenmesine onay veriyorum."
            />
            <ConsentCheckbox
              checked={formData.legalConsents.contentResponsibilityAccepted.accepted}
              onChange={(accepted) =>
                onUpdateLegalConsent("contentResponsibilityAccepted", accepted)
              }
              label="Yüklediğim içerikleri paylaşma hakkına sahip olduğumu; içeriklerde yer alan kişilerin gerekli izinlerini aldığımı ve bu içeriklerin doğruluğundan/sorumluluğundan benim sorumlu olduğumu kabul ediyorum."
            />
            {shouldRequireServiceStartConsent && (
              <ConsentCheckbox
                checked={formData.legalConsents.serviceStartConsentAccepted.accepted}
                onChange={(accepted) =>
                  onUpdateLegalConsent("serviceStartConsentAccepted", accepted)
                }
                label={
                  <>
                    Kurulum formunu gönderdikten sonra 3 saat boyunca bilgilerimi
                    düzenleyebileceğimi ve bu süre içinde iade talebinde bulunabileceğimi biliyorum.
                    Bu sürenin sonunda paylaştığım bilgilere göre kişiselleştirilmiş StoryOfUs
                    hizmetinin hazırlanmasına başlanmasını açıkça talep ediyorum. Hazırlık başladıktan
                    sonra yalnızca fikir değişikliğine dayalı standart cayma hakkının
                    uygulanmayabileceği konusunda bilgilendirildim.{" "}
                    <Link
                      to={storyOfUsDemoCtaConfig.refundPolicyPath}
                      className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4 hover:text-rose-700"
                    >
                      İade Politikası
                    </Link>
                  </>
                }
              />
            )}
          </div>

          {areLegalConsentsComplete && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-900">
              Onaylar tamamlandı.
            </div>
          )}
        </div>
      </ReviewSection>

      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-5 text-center shadow-sm shadow-rose-100/50">
        <h4 className="text-xl font-bold text-rose-950">Her şey hazır mı?</h4>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-rose-950/60">
          Bilgilerinizi güvenli şekilde alacağız. Fotoğraf ve ses dosyaları yalnızca gönderim
          sırasında sunucu tarafında yüklenecek.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-rose-950/50">
          Eksik bıraktığınız alanlar varsa bir sonraki validation adımında size nazikçe
          hatırlatacağız.
        </p>
        {submitError && (
          <div className="mx-auto mt-5 max-w-xl rounded-3xl border border-rose-200 bg-white/85 p-4 text-sm leading-6 text-rose-700">
            {submitError}
          </div>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="mt-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isSubmitting ? "Gönderiliyor..." : "Bilgileri gönder"}
        </button>
      </section>
    </div>
  );
}

function ReviewSection({
  title,
  description,
  onEdit,
  editLabel = "Düzenle",
  children,
}: {
  title: string;
  description: string;
  onEdit: () => void;
  editLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-sm shadow-rose-100/50 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-rose-950">{title}</h4>
          <p className="mt-1 break-words text-sm leading-6 text-rose-950/60 [overflow-wrap:anywhere]">{description}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          {editLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-left text-sm leading-6 shadow-sm transition ${
        checked
          ? "border-rose-200 bg-rose-50/80 text-rose-950 shadow-rose-100/60"
          : "border-rose-100 bg-white/85 text-rose-950/70 shadow-rose-100/40 hover:border-rose-200"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-rose-300 text-rose-500 focus:ring-rose-200"
      />
      <span>{label}</span>
    </label>
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
    <div className={`min-w-0 rounded-2xl border border-rose-100 bg-[#fffaf8] p-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-rose-950/70 [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function ReviewPhotoCard({
  photo,
  title,
}: {
  photo: StoryOfUsPhotoDraftItem;
  title: string;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm shadow-rose-100/40">
      <img
        src={photo.previewUrl}
        alt={`${title} önizlemesi`}
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="min-w-0 p-3">
        <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-rose-500 [overflow-wrap:anywhere]">
          {title}
        </p>
        <p className="mt-1 break-words text-sm leading-6 text-rose-950/60 [overflow-wrap:anywhere]">
          {photo.caption || "Fotoğraf notu eklenmedi."}
        </p>
      </div>
    </article>
  );
}

function ReviewSoftHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 p-4 text-sm leading-6 text-rose-950/55">
      {children}
    </div>
  );
}

function SinglePhotoPicker({
  title,
  description,
  photo,
  buttonText,
  emptyText,
  onSelect,
  onRemove,
}: {
  title: string;
  description?: string;
  photo: StoryOfUsPhotoDraftItem | null;
  buttonText: string;
  emptyText: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-rose-100 bg-white/85 p-3 shadow-sm shadow-rose-100/35">
      <div className="min-w-0">
        <h5 className="break-words text-sm font-semibold text-rose-950">{title}</h5>
        {description && (
          <p className="mt-1 break-words text-xs leading-5 text-rose-950/55">{description}</p>
        )}
      </div>
      {photo ? (
        <div className="mt-3 grid gap-3">
          <img
            src={photo.previewUrl}
            alt={`${title} önizlemesi`}
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm shadow-rose-100"
            loading="lazy"
            decoding="async"
          />
          <button
            type="button"
            onClick={onRemove}
            className="min-h-10 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Fotoğrafı kaldır
          </button>
          <MediaUploadStatus status={photo.uploadStatus} error={photo.uploadError} />
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 p-3 text-sm leading-6 text-rose-950/55">
          {emptyText}
        </div>
      )}
      <label className="mt-3 inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:shadow-rose-300">
        {buttonText}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              onSelect(file);
              event.target.value = "";
            }
          }}
        />
      </label>
    </div>
  );
}

function MediaUploadStatus({
  status,
  error,
}: {
  status?: "idle" | "uploading" | "uploaded" | "failed";
  error?: string;
}) {
  if (!status || status === "idle") {
    return null;
  }

  const content =
    status === "uploading"
      ? "Yükleniyor..."
      : status === "uploaded"
        ? "Yüklendi"
        : "Yükleme başarısız";
  const className =
    status === "uploading"
      ? "border-amber-100 bg-amber-50 text-amber-800"
      : status === "uploaded"
        ? "border-emerald-100 bg-emerald-50 text-emerald-800"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${className}`}>
      {content}
      {status === "failed" && error && (
        <span className="mt-1 block font-normal leading-5">{error}</span>
      )}
    </div>
  );
}

function ExistingMediaList({
  title,
  items,
}: {
  title: string;
  items: StoryOfUsSetupAccessExistingMediaItem[];
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm shadow-rose-100/35">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="min-w-0 overflow-hidden rounded-2xl border border-rose-50 bg-[#fffaf8] text-sm leading-6 text-rose-950/65"
          >
            {item.previewUrl && item.mimeType.startsWith("image/") && (
              <img
                src={item.previewUrl}
                alt={formatExistingMediaName(item)}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="min-w-0 px-3 py-2">
              <p className="break-words [overflow-wrap:anywhere]">{formatExistingMediaName(item)}</p>
              {item.caption && (
                <p className="mt-1 break-words text-xs leading-5 text-rose-950/50 [overflow-wrap:anywhere]">
                  {item.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactCoupleStep({
  value,
  siteAccess,
  onChange,
  onSiteAccessChange,
  fieldErrors,
  siteAccessErrors,
}: {
  value: StoryOfUsContactCoupleData;
  siteAccess: StoryOfUsSiteAccessData;
  onChange: (field: keyof StoryOfUsContactCoupleData, value: string) => void;
  onSiteAccessChange: (field: keyof StoryOfUsSiteAccessData, value: string) => void;
  fieldErrors: ContactCoupleFieldErrors;
  siteAccessErrors: SiteAccessFieldErrors;
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
            label="Adınız *"
            value={value.customerName}
            onChange={(nextValue) => onChange("customerName", nextValue)}
            placeholder="Örn. Elif"
            errorText={fieldErrors.customerName}
            fieldKey="customerName"
          />
          <SetupTextField
            label="E-posta adresiniz *"
            type="email"
            value={value.customerEmail}
            onChange={(nextValue) => onChange("customerEmail", nextValue)}
            placeholder="ornek@mail.com"
            errorText={fieldErrors.customerEmail}
            fieldKey="customerEmail"
          />
          <SetupTextField
            label="Telefon numaranız *"
            type="tel"
            value={value.contactPhone}
            onChange={(nextValue) => onChange("contactPhone", nextValue)}
            placeholder="05xx xxx xx xx"
            errorText={fieldErrors.contactPhone}
            fieldKey="contactPhone"
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
            label="Partnerinizin adı *"
            value={value.partnerName}
            onChange={(nextValue) => onChange("partnerName", nextValue)}
            placeholder="Örn. Mert"
            errorText={fieldErrors.partnerName}
            fieldKey="partnerName"
          />
          <SetupTextField
            label="Sitede nasıl görünsün?"
            value={value.coupleDisplayName}
            onChange={(nextValue) => onChange("coupleDisplayName", nextValue)}
            placeholder="Örn. Elif & Mert"
            helperText="Örn. Elif & Mert"
            fieldKey="coupleDisplayName"
          />
          <SetupTextField
            label="İlişki başlangıç tarihiniz"
            type="date"
            value={value.relationshipStartDate}
            onChange={(nextValue) => onChange("relationshipStartDate", nextValue)}
            fieldKey="relationshipStartDate"
          />
          <SetupTextField
            label="Bu tarihe ne diyelim?"
            value={value.specialDateLabel}
            onChange={(nextValue) => onChange("specialDateLabel", nextValue)}
            placeholder="Tanıştığımız gün"
            helperText="Örn: Tanıştığımız gün, ilk buluşmamız, yıl dönümümüz"
            fieldKey="specialDateLabel"
          />
          <SetupTextField
            label="Partnerinize hitap şekliniz"
            value={value.recipientNickname}
            onChange={(nextValue) => onChange("recipientNickname", nextValue)}
            placeholder="Aşkım, sevgilim, bitanem..."
            fieldKey="recipientNickname"
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
          fieldKey="relationshipStory"
        />
      </section>

      <section className="rounded-3xl border border-fuchsia-100 bg-gradient-to-br from-white to-fuchsia-50/70 p-4 shadow-sm shadow-fuchsia-100/50 sm:p-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-rose-950">Website giriş şifresi</h4>
          <p className="mt-1 text-sm leading-6 text-rose-950/60">
            Final site bu 4 rakamlı kodla açılacak. Kodunuz ekranda görünür şekilde
            saklanmaz; sadece giriş kontrolü için güvenli şekilde hazırlanır.
          </p>
          {siteAccess.hasExistingPasscode && (
            <div className="mt-3 rounded-2xl border border-fuchsia-100 bg-white/80 px-4 py-3 text-sm leading-6 text-fuchsia-800">
              <p className="font-semibold">Mevcut giriş şifresi kayıtlı.</p>
              <p>Değiştirmek isterseniz yeni 4 rakamlı şifre girin.</p>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SetupTextField
            label="Website giriş şifresi *"
            value={siteAccess.passcode}
            onChange={(nextValue) => onSiteAccessChange("passcode", nextValue)}
            placeholder="4 rakamlı şifre"
            inputMode="numeric"
            errorText={siteAccessErrors.passcode}
            fieldKey="passcode"
          />
          <SetupTextField
            label="Şifre tekrar *"
            value={siteAccess.confirmPasscode}
            onChange={(nextValue) => onSiteAccessChange("confirmPasscode", nextValue)}
            placeholder="Şifrenizi tekrar girin"
            inputMode="numeric"
            errorText={siteAccessErrors.confirmPasscode}
            fieldKey="confirmPasscode"
          />
          <SetupTextField
            label="Şifre ipucu *"
            value={siteAccess.passcodeHint}
            onChange={(nextValue) => onSiteAccessChange("passcodeHint", nextValue)}
            placeholder="Örn. ilk buluştuğumuz yer"
            helperText="Sevgiliniz şifreyi hatırlamak için bu ipucunu görebilir."
            errorText={siteAccessErrors.passcodeHint}
            fieldKey="passcodeHint"
            className="sm:col-span-2"
          />
        </div>
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
  errorText,
  inputMode,
  fieldKey,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "date" | "number";
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
  fieldKey?: string;
  className?: string;
}) {
  const fieldId = fieldKey ? `storyofus-${fieldKey}` : undefined;
  const helperId = fieldKey ? `${fieldId}-helper` : undefined;
  const errorId = fieldKey ? `${fieldId}-error` : undefined;
  const describedBy = errorText ? errorId : helperText ? helperId : undefined;

  return (
    <label className={`block ${className}`} data-setup-field={fieldKey}>
      <span className="text-sm font-semibold text-rose-950">{label}</span>
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 min-h-12 w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-rose-950 shadow-sm outline-none transition placeholder:text-rose-950/35 focus:ring-4 ${
          errorText
            ? "border-red-300 shadow-red-100/40 focus:border-red-400 focus:ring-red-100"
            : "border-rose-100 shadow-rose-100/40 focus:border-rose-300 focus:ring-rose-100"
        }`}
      />
      {errorText ? (
        <span id={errorId} className="mt-1.5 block text-xs leading-5 text-red-600">
          {errorText}
        </span>
      ) : (
        helperText && (
          <span id={helperId} className="mt-1.5 block text-xs leading-5 text-rose-950/50">
            {helperText}
          </span>
        )
      )}
    </label>
  );
}

function SetupTextArea({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  fieldKey,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  fieldKey?: string;
}) {
  const fieldId = fieldKey ? `storyofus-${fieldKey}` : undefined;
  const helperId = fieldKey ? `${fieldId}-helper` : undefined;

  return (
    <label className="block" data-setup-field={fieldKey}>
      <span className="text-sm font-semibold text-rose-950">{label}</span>
      <textarea
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        aria-describedby={helperText ? helperId : undefined}
        className="mt-2 w-full min-w-0 resize-y rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm leading-6 text-rose-950 shadow-sm shadow-rose-100/40 outline-none transition placeholder:text-rose-950/35 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 [overflow-wrap:anywhere]"
      />
      {helperText && (
        <span id={helperId} className="mt-1.5 block text-xs leading-5 text-rose-950/50">
          {helperText}
        </span>
      )}
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
