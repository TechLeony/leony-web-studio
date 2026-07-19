import {
  STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
  STORYOFUS_DEFAULT_LOVE_LETTER_TITLE,
} from "./stableContentDefaults.ts";
import type {
  StoryOfUsEditableDefaultContentId,
  StoryOfUsEditableDefaultContentState,
  StoryOfUsLetterItem,
  StoryOfUsSetupStepId,
} from "./setupTypes.ts";

export type StoryOfUsEditableDefaultConfirmation = {
  contentId: StoryOfUsEditableDefaultContentId;
  title: string;
  preview: string;
};

export function createDefaultLoveLetterItem(id: string, sortOrder = 0): StoryOfUsLetterItem {
  return {
    id,
    type: "love_letter",
    title: STORYOFUS_DEFAULT_LOVE_LETTER_TITLE,
    body: STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
    sortOrder,
  };
}

export function ensureLoveLetterDefaults(
  letters: StoryOfUsLetterItem[],
  createId: () => string,
): StoryOfUsLetterItem[] {
  const orderedLetters = [...letters].sort((a, b) => a.sortOrder - b.sortOrder);
  const loveLetter = orderedLetters.find((letter) => letter.type === "love_letter");

  if (!loveLetter) {
    return [
      createDefaultLoveLetterItem(createId(), 0),
      ...orderedLetters.map((letter, index) => ({ ...letter, sortOrder: index + 1 })),
    ];
  }

  return orderedLetters.map((letter, index) => {
    if (letter.type !== "love_letter") {
      return { ...letter, sortOrder: index };
    }

    return {
      ...letter,
      title: letter.title.trim() || STORYOFUS_DEFAULT_LOVE_LETTER_TITLE,
      body: letter.body.trim() ? letter.body : STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
      sortOrder: index,
    };
  });
}

export function getPendingEditableDefaultConfirmation(
  stepId: StoryOfUsSetupStepId,
  letters: StoryOfUsLetterItem[],
  state: StoryOfUsEditableDefaultContentState,
): StoryOfUsEditableDefaultConfirmation | null {
  if (stepId !== "letters") {
    return null;
  }

  const loveLetter = getLoveLetterItem(letters);

  if (!loveLetter || loveLetter.body.trim() !== STORYOFUS_DEFAULT_LOVE_LETTER_BODY) {
    return null;
  }

  if (state.loveLetterBody?.outcome === "default_accepted") {
    return null;
  }

  return {
    contentId: "loveLetterBody",
    title: "Kalbimden sana metni varsayılan haliyle duruyor.",
    preview: createDefaultContentPreview(STORYOFUS_DEFAULT_LOVE_LETTER_BODY),
  };
}

export function getNextEditableDefaultContentState(
  currentState: StoryOfUsEditableDefaultContentState,
  contentId: StoryOfUsEditableDefaultContentId,
  value: string,
  defaultValue: string,
) {
  if (value.trim() && value.trim() !== defaultValue) {
    return {
      ...currentState,
      [contentId]: {
        outcome: "customized" as const,
      },
    };
  }

  return removeEditableDefaultContentState(currentState, contentId);
}

export function recordDefaultContentAccepted(
  currentState: StoryOfUsEditableDefaultContentState,
  contentId: StoryOfUsEditableDefaultContentId,
  confirmedAt: string,
) {
  return {
    ...currentState,
    [contentId]: {
      outcome: "default_accepted" as const,
      confirmedAt,
    },
  };
}

export function removeEditableDefaultContentState(
  currentState: StoryOfUsEditableDefaultContentState,
  contentId: StoryOfUsEditableDefaultContentId,
) {
  const nextState = { ...currentState };
  delete nextState[contentId];
  return nextState;
}

export function restoreEditableDefaultContent(
  rawState: unknown,
  letters: StoryOfUsLetterItem[],
): StoryOfUsEditableDefaultContentState {
  const loveLetter = getLoveLetterItem(letters);
  const rawLoveLetterState = isRecord(rawState) ? rawState.loveLetterBody : null;

  if (isEditableDefaultEntry(rawLoveLetterState)) {
    if (
      rawLoveLetterState.outcome === "default_accepted" &&
      loveLetter?.body.trim() === STORYOFUS_DEFAULT_LOVE_LETTER_BODY
    ) {
      return {
        loveLetterBody: {
          outcome: "default_accepted",
          confirmedAt:
            typeof rawLoveLetterState.confirmedAt === "string"
              ? rawLoveLetterState.confirmedAt
              : undefined,
        },
      };
    }

    if (
      rawLoveLetterState.outcome === "customized" &&
      Boolean(loveLetter?.body.trim()) &&
      loveLetter?.body.trim() !== STORYOFUS_DEFAULT_LOVE_LETTER_BODY
    ) {
      return {
        loveLetterBody: {
          outcome: "customized",
        },
      };
    }
  }

  if (loveLetter?.body.trim() && loveLetter.body.trim() !== STORYOFUS_DEFAULT_LOVE_LETTER_BODY) {
    return {
      loveLetterBody: {
        outcome: "customized",
      },
    };
  }

  return {};
}

export function getLoveLetterDefaultContentSubmitError(
  letters: StoryOfUsLetterItem[],
  state: StoryOfUsEditableDefaultContentState,
) {
  const loveLetter = getLoveLetterItem(letters);

  if (!loveLetter?.body.trim()) {
    return "Kalbimden sana metni boş bırakılamaz.";
  }

  if (
    loveLetter.body.trim() === STORYOFUS_DEFAULT_LOVE_LETTER_BODY &&
    state.loveLetterBody?.outcome !== "default_accepted"
  ) {
    return "Varsayılan aşk mektubu metni için onay gerekiyor.";
  }

  return null;
}

export function createDefaultContentPreview(value: string) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();
  return normalizedValue.length > 140
    ? `${normalizedValue.slice(0, 140).trimEnd()}...`
    : normalizedValue;
}

function getLoveLetterItem(letters: StoryOfUsLetterItem[]) {
  return letters.find((letter) => letter.type === "love_letter") ?? null;
}

function isEditableDefaultEntry(value: unknown): value is {
  outcome: "default_accepted" | "customized";
  confirmedAt?: unknown;
} {
  return (
    isRecord(value) && (value.outcome === "default_accepted" || value.outcome === "customized")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
