export const STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE =
  "Bazı dosyalarınız henüz yüklenmemiş görünüyor. Lütfen işaretli dosyaları yeniden seçip yüklemenin tamamlanmasını bekleyin.";

export type StoryOfUsSubmitMediaSection =
  "opening" | "memory_prompt" | "gallery" | "timeline" | "letter" | "puzzle" | "voice_note";

export type StoryOfUsSubmitMediaRequirement = {
  mediaId: string;
  section: StoryOfUsSubmitMediaSection;
  semanticKey: string;
  sectionItemId: string;
  mediaType?: "photo" | "puzzle_photo" | "voice_note";
};

export type StoryOfUsSubmitMediaRow = {
  id: string;
  section: string;
  semanticKey: string | null;
  sectionItemId: string | null;
  mediaType: string;
  storageBucket: string | null;
  storagePath: string | null;
};

export class StoryOfUsDurableMediaSubmitError extends Error {
  constructor() {
    super(STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE);
    this.name = "StoryOfUsDurableMediaSubmitError";
  }
}

type SubmitPhotoLike = {
  id?: unknown;
  mediaId?: unknown;
  semanticKey?: unknown;
  sectionItemId?: unknown;
  storagePath?: unknown;
};

type SubmitVoiceNoteLike = SubmitPhotoLike;

type SubmitPayloadLike = {
  media?: {
    openingPhotos?: {
      firstPerson?: SubmitPhotoLike | null;
      secondPerson?: SubmitPhotoLike | null;
    };
    promptPhotos?: Array<{
      id?: unknown;
      sortOrder?: unknown;
      photo?: SubmitPhotoLike | null;
    }>;
    photos?: SubmitPhotoLike[];
    puzzle?: {
      selectedPhotoId?: unknown;
      puzzlePhoto?: SubmitPhotoLike | null;
      sourceType?: unknown;
      confirmedNoPuzzle?: unknown;
    };
    loveLetterPhoto?: SubmitPhotoLike | null;
  };
  musicVoice?: {
    voiceNote?: SubmitVoiceNoteLike | null;
  };
  timeline?: Array<{
    id?: unknown;
    sortOrder?: unknown;
    photo?: SubmitPhotoLike | null;
  }>;
  confirmedSkips?: Partial<Record<string, { confirmed?: boolean }>>;
};

export function assertNoSubmitTimeMediaFiles(formData: FormData) {
  for (const [key, value] of formData.entries()) {
    if (key === "payload" || typeof value === "string" || !isFileLike(value)) {
      continue;
    }

    if (Number(value.size) > 0) {
      throwDurableMediaSubmitError();
    }
  }
}

export function collectStoryOfUsSubmitMediaRequirements(
  payload: SubmitPayloadLike,
): StoryOfUsSubmitMediaRequirement[] {
  const requirements: StoryOfUsSubmitMediaRequirement[] = [];
  const galleryPhotos = payload.media?.photos ?? [];

  addPhotoRequirement(requirements, payload.media?.openingPhotos?.firstPerson ?? null, {
    section: "opening",
    semanticKey: "hero_left",
    sectionItemId: "firstPerson",
    mediaType: "photo",
  });
  addPhotoRequirement(requirements, payload.media?.openingPhotos?.secondPerson ?? null, {
    section: "opening",
    semanticKey: "hero_right",
    sectionItemId: "secondPerson",
    mediaType: "photo",
  });

  for (const prompt of payload.media?.promptPhotos ?? []) {
    const promptId = stringValue(prompt.id);
    addPhotoRequirement(requirements, prompt.photo ?? null, {
      section: "memory_prompt",
      semanticKey: promptId,
      sectionItemId: promptId,
      mediaType: "photo",
    });
  }

  if (!isConfirmedSkipped(payload, "photos")) {
    for (const photo of galleryPhotos) {
      addPhotoRequirement(requirements, photo, {
        section: "gallery",
        semanticKey: stringValue(photo.semanticKey) || "gallery_photo",
        sectionItemId: stringValue(photo.sectionItemId) || stringValue(photo.id),
        mediaType: "photo",
      });
    }
  }

  if (!isConfirmedSkipped(payload, "puzzle")) {
    if (payload.media?.puzzle?.sourceType === "separate") {
      addPhotoRequirement(requirements, payload.media.puzzle.puzzlePhoto ?? null, {
        section: "puzzle",
        semanticKey: "puzzle_source",
        sectionItemId: "puzzlePhoto",
        mediaType: "puzzle_photo",
      });
    }

    if (payload.media?.puzzle?.sourceType === "gallery") {
      const selectedPhotoId = stringValue(payload.media.puzzle.selectedPhotoId);

      if (!selectedPhotoId) {
        throwDurableMediaSubmitError();
      }

      const selectedGalleryPhoto = galleryPhotos.find((photo) =>
        isSelectedGalleryPuzzlePhoto(photo, selectedPhotoId),
      );

      if (!selectedGalleryPhoto) {
        throwDurableMediaSubmitError();
      }

      addPhotoRequirement(requirements, selectedGalleryPhoto, {
        section: "gallery",
        semanticKey: "gallery_photo",
        sectionItemId: selectedPhotoId,
        mediaType: "photo",
      });
    }
  }

  addPhotoRequirement(requirements, payload.media?.loveLetterPhoto ?? null, {
    section: "letter",
    semanticKey: "love_letter_side_photo",
    sectionItemId: "loveLetterPhoto",
    mediaType: "photo",
  });

  for (const item of payload.timeline ?? []) {
    const itemId = stringValue(item.id);
    addPhotoRequirement(requirements, item.photo ?? null, {
      section: "timeline",
      semanticKey: "timeline_item",
      sectionItemId: itemId,
      mediaType: "photo",
    });
  }

  if (!isConfirmedSkipped(payload, "voiceNote") && payload.musicVoice?.voiceNote) {
    addPhotoRequirement(requirements, payload.musicVoice.voiceNote, {
      section: "voice_note",
      semanticKey: "voice_note",
      sectionItemId: "voiceNote",
      mediaType: "voice_note",
    });
  }

  return dedupeRequirements(requirements);
}

export function validateStoryOfUsSubmitMediaRows(
  requirements: StoryOfUsSubmitMediaRequirement[],
  rows: StoryOfUsSubmitMediaRow[],
) {
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  for (const requirement of requirements) {
    const row = rowsById.get(requirement.mediaId);

    if (
      !row ||
      row.section !== requirement.section ||
      row.semanticKey !== requirement.semanticKey ||
      row.sectionItemId !== requirement.sectionItemId ||
      (requirement.mediaType && row.mediaType !== requirement.mediaType) ||
      !row.storageBucket ||
      !row.storagePath ||
      isUnsafeClientMediaPath(row.storagePath)
    ) {
      throwDurableMediaSubmitError();
    }
  }
}

function addPhotoRequirement(
  requirements: StoryOfUsSubmitMediaRequirement[],
  photo: SubmitPhotoLike | null,
  expected: Omit<StoryOfUsSubmitMediaRequirement, "mediaId">,
) {
  if (!photo) {
    return;
  }

  assertSafeClientMediaMetadata(photo);

  const mediaId = stringValue(photo.mediaId);

  if (!mediaId) {
    throwDurableMediaSubmitError();
  }

  requirements.push({
    ...expected,
    mediaId,
  });
}

function assertSafeClientMediaMetadata(media: SubmitPhotoLike) {
  const storagePath = stringValue(media.storagePath);

  if (storagePath && isUnsafeClientMediaPath(storagePath)) {
    throwDurableMediaSubmitError();
  }
}

function dedupeRequirements(requirements: StoryOfUsSubmitMediaRequirement[]) {
  const seen = new Set<string>();
  const deduped: StoryOfUsSubmitMediaRequirement[] = [];

  for (const requirement of requirements) {
    const key = `${requirement.mediaId}:${requirement.section}:${requirement.semanticKey}:${requirement.sectionItemId}`;

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(requirement);
    }
  }

  return deduped;
}

function isConfirmedSkipped(payload: SubmitPayloadLike, sectionId: string) {
  return payload.confirmedSkips?.[sectionId]?.confirmed === true;
}

function isFileLike(
  value: unknown,
): value is { arrayBuffer: () => Promise<ArrayBuffer>; size: number } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
}

function isSelectedGalleryPuzzlePhoto(photo: SubmitPhotoLike, selectedPhotoId: string) {
  return (
    stringValue(photo.id) === selectedPhotoId ||
    stringValue(photo.sectionItemId) === selectedPhotoId
  );
}

function isUnsafeClientMediaPath(value: string) {
  return /^(blob:|https?:|data:)/i.test(value.trim());
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function throwDurableMediaSubmitError(): never {
  throw new StoryOfUsDurableMediaSubmitError();
}
