import { createServerFn } from "@tanstack/react-start";

import {
  STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID,
  STORYOFUS_LOVE_LETTER_PHOTO_SEMANTIC_KEY,
  getLoveLetterPhotoSubmitError,
} from "./loveLetterRequirements";
import { getLoveLetterDefaultContentSubmitError } from "./editableDefaultContent";
import { enqueueStoryOfUsEmail } from "./emailOutbox.server";
import { hashSitePasscode, validateSitePasscode } from "./passcode.server";
import {
  getStoryOfUsServiceStartConsent,
  isStoryOfUsActiveRefundStatus,
} from "./refundEligibility.server";
import {
  STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE,
  assertNoSubmitTimeMediaFiles,
  collectStoryOfUsSubmitMediaRequirements,
  validateStoryOfUsSubmitMediaRows,
} from "./setupMediaSubmitBoundary";
import type { StoryOfUsEditableDefaultContentState } from "./setupTypes";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

type SkipState = {
  warned: boolean;
  confirmed: boolean;
  confirmedAt?: string;
};

type ConfirmedSkips = Partial<
  Record<
    | "photos"
    | "puzzle"
    | "music"
    | "voiceNote"
    | "timeline"
    | "letters"
    | "relationshipStartDate"
    | "relationshipStory"
    | "recipientNickname"
    | "specialDateLabel",
    SkipState
  >
>;

type SubmitPhotoMetadata = {
  id: string;
  caption: string;
  sortOrder: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  semanticKey?: string;
  sectionItemId?: string;
  mediaId?: string;
  storagePath?: string;
};

type StoryOfUsMediaSection =
  "opening" | "memory_prompt" | "gallery" | "timeline" | "letter" | "puzzle" | "voice_note";

type SubmitPuzzleSourceType = "gallery" | "separate";

type SubmitVoiceNoteMetadata = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  mediaId?: string;
  storagePath?: string;
  semanticKey?: string;
  sectionItemId?: string;
};

type SubmitPayload = {
  setupToken: string;
  orderReference: string;
  contactCouple: {
    customerName: string;
    customerEmail: string;
    contactPhone: string;
    partnerName: string;
    coupleDisplayName: string;
    relationshipStartDate: string;
    specialDateLabel: string;
    recipientNickname: string;
    relationshipStory: string;
  };
  media: {
    openingPhotos?: {
      firstPerson: SubmitPhotoMetadata | null;
      secondPerson: SubmitPhotoMetadata | null;
    };
    promptPhotos?: Array<{
      id: string;
      title: string;
      helperText: string;
      sortOrder: number;
      photo: SubmitPhotoMetadata | null;
    }>;
    photos: SubmitPhotoMetadata[];
    puzzle: {
      selectedPhotoId: string | null;
      puzzlePhoto: SubmitPhotoMetadata | null;
      sourceType: SubmitPuzzleSourceType | null;
      confirmedNoPuzzle: boolean;
    };
    loveLetterPhoto?: SubmitPhotoMetadata | null;
  };
  musicVoice: {
    music: {
      spotifyUrl: string;
      spotifyTrackId: string;
      songTitle: string;
      artistName: string;
      startAtSeconds: number;
    };
    voiceNote: SubmitVoiceNoteMetadata | null;
  };
  siteAccess: {
    passcode: string;
    confirmPasscode: string;
    passcodeHint: string;
    hasExistingPasscode?: boolean;
  };
  editableDefaultContent: StoryOfUsEditableDefaultContentState;
  confirmedSkips: ConfirmedSkips;
  legalConsents: {
    privacyNoticeAccepted: {
      accepted: boolean;
      acceptedAt?: string;
    };
    explicitConsentAccepted: {
      accepted: boolean;
      acceptedAt?: string;
    };
    contentResponsibilityAccepted: {
      accepted: boolean;
      acceptedAt?: string;
    };
    serviceStartConsentAccepted?: {
      accepted: boolean;
      acceptedAt?: string;
    };
  };
  timeline: Array<{
    id: string;
    title: string;
    eventDate: string;
    description: string;
    sortOrder: number;
    photo?: SubmitPhotoMetadata | null;
  }>;
  letters: Array<{
    id: string;
    type: "love_letter" | "open_when";
    title: string;
    body: string;
    sortOrder: number;
  }>;
};

type SubmissionResult = {
  submissionId: string;
  setupToken: string | null;
  status: "submitted";
  submissionKind: "first_submit" | "edit_submit";
  editableUntil: string | null;
};

export const submitStoryOfUsSetup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("StoryOfUs submission must be sent as FormData.");
    }

    return data;
  })
  .handler(async ({ data }) => {
    assertNoSubmitTimeMediaFiles(data);
    const payload = parseSubmissionPayload(data);
    return submitStoryOfUsSetupData(payload);
  });

async function submitStoryOfUsSetupData(payload: SubmitPayload): Promise<SubmissionResult> {
  const setupToken = payload.setupToken?.trim();

  if (!setupToken) {
    throw new Error("StoryOfUs setup token is required.");
  }

  const submittedAt = new Date().toISOString();
  const now = new Date(submittedAt);
  const submissionSnapshot = createSubmissionSnapshot(payload);

  const { data: submission, error: submissionError } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select(
      "id, setup_token, status, payment_status, refund_status, submitted_at, editable_until, site_passcode_hash, site_passcode_set_at",
    )
    .eq("setup_token", setupToken)
    .maybeSingle();

  if (submissionError) {
    throw new Error(`StoryOfUs submission could not be loaded: ${submissionError.message}`);
  }

  if (!submission) {
    throw new Error("StoryOfUs setup link is invalid or could not be found.");
  }

  if (submission.payment_status !== "paid") {
    throw new Error("StoryOfUs setup form is not active until payment is approved.");
  }

  if (
    isStoryOfUsActiveRefundStatus(
      typeof submission.refund_status === "string" ? submission.refund_status : null,
    )
  ) {
    throw new Error(
      "Bu siparişle ilgili iade talebiniz inceleniyor. Ayrıntılı bilgi için contact@leony.tech adresinden bize ulaşabilirsiniz.",
    );
  }

  const isFirstSubmit = submission.status === "draft";
  const effectiveEditableUntil = getEffectiveEditableUntil(
    typeof submission.editable_until === "string" ? submission.editable_until : null,
    typeof submission.submitted_at === "string" ? submission.submitted_at : null,
  );
  const isEditableResubmit =
    submission.status === "submitted" &&
    Boolean(effectiveEditableUntil) &&
    new Date(effectiveEditableUntil as string).getTime() >= now.getTime();

  if (!isFirstSubmit && !isEditableResubmit) {
    throw new Error("This setup form has already been submitted or is not editable.");
  }

  const submissionId = submission.id as string;
  const nextEditableUntil = isFirstSubmit
    ? new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString()
    : effectiveEditableUntil;

  if (isFirstSubmit && payload.legalConsents.serviceStartConsentAccepted?.accepted !== true) {
    throw new Error("3 saatlik düzenleme ve iade süresi bilgilendirmesi onayı zorunlu.");
  }

  const serviceStartConsent = isFirstSubmit
    ? getStoryOfUsServiceStartConsent({
        acceptedAt: submittedAt,
        serviceScheduledAt: nextEditableUntil,
      })
    : undefined;
  const hasExistingPasscode = typeof submission.site_passcode_hash === "string";
  const siteAccess = payload.siteAccess ?? {
    passcode: "",
    confirmPasscode: "",
    passcodeHint: "",
  };
  const passcodeValidation = validateSitePasscode({
    passcode: siteAccess.passcode,
    confirmPasscode: siteAccess.confirmPasscode,
    hint: siteAccess.passcodeHint,
    hasExistingPasscode,
  });

  if (!passcodeValidation.isValid) {
    throw new Error(passcodeValidation.errors[0] ?? "Website giriş şifresi geçersiz.");
  }

  const loveLetterPhotoError = getLoveLetterPhotoSubmitError(payload.media.loveLetterPhoto);

  if (loveLetterPhotoError) {
    throw new Error(loveLetterPhotoError);
  }

  const loveLetterDefaultContentError = getLoveLetterDefaultContentSubmitError(
    payload.letters,
    payload.editableDefaultContent ?? {},
  );

  if (loveLetterDefaultContentError) {
    throw new Error(loveLetterDefaultContentError);
  }

  await validateDurableMediaForSubmit(submissionId, payload);

  const nextPasscodeHash = passcodeValidation.shouldHashPasscode
    ? hashSitePasscode(siteAccess.passcode.trim())
    : submission.site_passcode_hash;
  const nextPasscodeSetAt = passcodeValidation.shouldHashPasscode
    ? submittedAt
    : submission.site_passcode_set_at;

  await deleteExistingTextDetails(submissionId);
  await prepareExistingMediaForSubmit(submissionId, payload, isFirstSubmit);
  await insertCoupleDetails(submissionId, payload);
  await insertMusicIfNeeded(submissionId, payload);
  await updateSubmittedMediaMetadata(submissionId, payload);
  await updatePuzzleSourceSelection(submissionId, payload);
  await insertTimelineIfNeeded(submissionId, payload);
  await insertLettersIfNeeded(submissionId, payload);

  const { data: updatedSubmission, error: updateError } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .update({
      order_reference: emptyToNull(payload.orderReference),
      customer_email: emptyToNull(payload.contactCouple.customerEmail),
      customer_name: emptyToNull(payload.contactCouple.customerName),
      contact_phone: emptyToNull(payload.contactCouple.contactPhone),
      status: "submitted",
      confirmed_skips: payload.confirmedSkips,
      legal_consents: payload.legalConsents,
      submission_snapshot: submissionSnapshot,
      submitted_at: isFirstSubmit ? submittedAt : submission.submitted_at,
      editable_until: nextEditableUntil,
      ...(serviceStartConsent ? { service_start_consent: serviceStartConsent } : {}),
      last_resubmitted_at: isFirstSubmit ? null : submittedAt,
      site_passcode_hash: nextPasscodeHash,
      site_passcode_hint: emptyToNull(passcodeValidation.normalizedHint),
      site_passcode_set_at: nextPasscodeSetAt,
    })
    .eq("id", submissionId)
    .select("id, setup_token, status")
    .single();

  if (updateError || !updatedSubmission) {
    throw new Error(`StoryOfUs submission could not be finalized: ${updateError?.message}`);
  }

  if (isFirstSubmit) {
    await enqueueSetupSubmittedEmailQuietly(submissionId);
  }

  return {
    submissionId,
    setupToken: (updatedSubmission.setup_token as string | null) ?? null,
    status: "submitted",
    submissionKind: isFirstSubmit ? "first_submit" : "edit_submit",
    editableUntil: nextEditableUntil,
  };
}

async function enqueueSetupSubmittedEmailQuietly(submissionId: string) {
  try {
    const result = await enqueueStoryOfUsEmail({
      submissionId,
      emailType: "setup_submitted",
    });

    if (!result.ok) {
      console.warn("[StoryOfUs setup]", {
        eventCode: "setup_submitted_email_enqueue_failed",
      });
    }
  } catch {
    console.warn("[StoryOfUs setup]", {
      eventCode: "setup_submitted_email_enqueue_failed",
    });
  }
}

async function deleteExistingTextDetails(submissionId: string) {
  const tables = [
    "storyofus_couple_details",
    "storyofus_music",
    "storyofus_timeline_items",
    "storyofus_letters",
  ];

  for (const table of tables) {
    const { error } = await storyOfUsSupabaseAdmin
      .from(table)
      .delete()
      .eq("submission_id", submissionId);

    if (error) {
      throw new Error(`StoryOfUs existing ${table} rows could not be cleared: ${error.message}`);
    }
  }
}

async function prepareExistingMediaForSubmit(
  submissionId: string,
  payload: SubmitPayload,
  isFirstSubmit: boolean,
) {
  if (isFirstSubmit) {
    return;
  }

  if (isConfirmedSkipped(payload.confirmedSkips, "photos")) {
    const { error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .delete()
      .eq("submission_id", submissionId)
      .eq("section", "gallery");

    if (error) {
      throw new Error(
        `StoryOfUs existing gallery media rows could not be cleared: ${error.message}`,
      );
    }
  }

  if (isConfirmedSkipped(payload.confirmedSkips, "puzzle")) {
    const { error: deleteError } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .delete()
      .eq("submission_id", submissionId)
      .eq("section", "puzzle");

    if (deleteError) {
      throw new Error(
        `StoryOfUs existing puzzle media rows could not be cleared: ${deleteError.message}`,
      );
    }

    const { error: updateError } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .update({ is_puzzle_source: false })
      .eq("submission_id", submissionId)
      .eq("is_puzzle_source", true);

    if (updateError) {
      throw new Error(
        `StoryOfUs existing puzzle source could not be cleared: ${updateError.message}`,
      );
    }
  }

  if (isConfirmedSkipped(payload.confirmedSkips, "voiceNote")) {
    const { error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .delete()
      .eq("submission_id", submissionId)
      .eq("section", "voice_note");

    if (error) {
      throw new Error(
        `StoryOfUs existing voice note media rows could not be cleared: ${error.message}`,
      );
    }
  }
}

async function insertCoupleDetails(submissionId: string, payload: SubmitPayload) {
  const { error } = await storyOfUsSupabaseAdmin.from("storyofus_couple_details").insert({
    submission_id: submissionId,
    customer_name: emptyToNull(payload.contactCouple.customerName),
    customer_email: emptyToNull(payload.contactCouple.customerEmail),
    contact_phone: emptyToNull(payload.contactCouple.contactPhone),
    partner_name: emptyToNull(payload.contactCouple.partnerName),
    couple_display_name: emptyToNull(payload.contactCouple.coupleDisplayName),
    relationship_start_date: emptyToNull(payload.contactCouple.relationshipStartDate),
    special_date_label: emptyToNull(payload.contactCouple.specialDateLabel),
    recipient_nickname: emptyToNull(payload.contactCouple.recipientNickname),
    relationship_story: emptyToNull(payload.contactCouple.relationshipStory),
  });

  if (error) {
    throw new Error(`StoryOfUs couple details could not be saved: ${error.message}`);
  }
}

async function insertMusicIfNeeded(submissionId: string, payload: SubmitPayload) {
  if (
    isConfirmedSkipped(payload.confirmedSkips, "music") ||
    isMusicEmpty(payload.musicVoice.music)
  ) {
    return;
  }

  const { error } = await storyOfUsSupabaseAdmin.from("storyofus_music").insert({
    submission_id: submissionId,
    spotify_url: emptyToNull(payload.musicVoice.music.spotifyUrl),
    spotify_track_id: emptyToNull(payload.musicVoice.music.spotifyTrackId),
    song_title: emptyToNull(payload.musicVoice.music.songTitle),
    artist_name: emptyToNull(payload.musicVoice.music.artistName),
    start_at_seconds: Math.max(0, Number(payload.musicVoice.music.startAtSeconds) || 0),
  });

  if (error) {
    throw new Error(`StoryOfUs music could not be saved: ${error.message}`);
  }
}

async function validateDurableMediaForSubmit(submissionId: string, payload: SubmitPayload) {
  const requirements = collectStoryOfUsSubmitMediaRequirements(payload);

  if (requirements.length === 0) {
    return;
  }

  const mediaIds = [...new Set(requirements.map((requirement) => requirement.mediaId))];

  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .select("id, media_type, section, semantic_key, section_item_id, storage_bucket, storage_path")
    .eq("submission_id", submissionId)
    .in("id", mediaIds);

  if (error) {
    throw new Error(STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE);
  }

  validateStoryOfUsSubmitMediaRows(
    requirements,
    (data ?? []).map((row) => ({
      id: String(row.id),
      mediaType: String(row.media_type),
      section: String(row.section),
      semanticKey: typeof row.semantic_key === "string" ? row.semantic_key : null,
      sectionItemId: typeof row.section_item_id === "string" ? row.section_item_id : null,
      storageBucket: typeof row.storage_bucket === "string" ? row.storage_bucket : null,
      storagePath: typeof row.storage_path === "string" ? row.storage_path : null,
    })),
  );
}

async function updateSubmittedMediaMetadata(submissionId: string, payload: SubmitPayload) {
  const shouldMarkPuzzle =
    !isConfirmedSkipped(payload.confirmedSkips, "puzzle") &&
    payload.media.puzzle.sourceType === "gallery" &&
    Boolean(payload.media.puzzle.selectedPhotoId);

  await updateSemanticSubmittedPhoto({
    submissionId,
    photo: payload.media.openingPhotos?.firstPerson ?? null,
    section: "opening",
    semanticKey: "hero_left",
    sectionItemId: "firstPerson",
    sortOrder: 0,
    isPuzzleSource: false,
  });
  await updateSemanticSubmittedPhoto({
    submissionId,
    photo: payload.media.openingPhotos?.secondPerson ?? null,
    section: "opening",
    semanticKey: "hero_right",
    sectionItemId: "secondPerson",
    sortOrder: 1,
    isPuzzleSource: false,
  });

  for (const prompt of payload.media.promptPhotos ?? []) {
    await updateSemanticSubmittedPhoto({
      submissionId,
      photo: prompt.photo,
      section: "memory_prompt",
      semanticKey: prompt.id,
      sectionItemId: prompt.id,
      sortOrder: prompt.sortOrder,
      isPuzzleSource: false,
    });
  }

  if (!isConfirmedSkipped(payload.confirmedSkips, "photos")) {
    for (const photo of payload.media.photos) {
      await updateExistingMediaMetadata({
        submissionId,
        photo,
        fallbackSection: "gallery",
        fallbackSemanticKey: photo.semanticKey || "gallery_photo",
        fallbackSectionItemId: photo.sectionItemId || photo.id,
        fallbackSortOrder: photo.sortOrder,
        isPuzzleSource: shouldMarkPuzzle && photo.id === payload.media.puzzle.selectedPhotoId,
      });
    }
  }

  await updateSemanticSubmittedPhoto({
    submissionId,
    photo: payload.media.loveLetterPhoto ?? null,
    section: "letter",
    semanticKey: STORYOFUS_LOVE_LETTER_PHOTO_SEMANTIC_KEY,
    sectionItemId: STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID,
    sortOrder: 0,
    isPuzzleSource: false,
  });

  for (const item of payload.timeline) {
    await updateSemanticSubmittedPhoto({
      submissionId,
      photo: item.photo ?? null,
      section: "timeline",
      semanticKey: "timeline_item",
      sectionItemId: item.id,
      sortOrder: item.sortOrder,
      isPuzzleSource: false,
    });
  }

  if (
    !isConfirmedSkipped(payload.confirmedSkips, "puzzle") &&
    payload.media.puzzle.sourceType === "separate" &&
    payload.media.puzzle.puzzlePhoto
  ) {
    await updateExistingMediaMetadata({
      submissionId,
      photo: payload.media.puzzle.puzzlePhoto,
      fallbackSection: "puzzle",
      fallbackSemanticKey: "puzzle_source",
      fallbackSectionItemId: "puzzlePhoto",
      fallbackSortOrder: 0,
      isPuzzleSource: true,
    });
  }
}

async function updateSemanticSubmittedPhoto({
  submissionId,
  photo,
  section,
  semanticKey,
  sectionItemId,
  sortOrder,
  isPuzzleSource,
}: {
  submissionId: string;
  photo: SubmitPhotoMetadata | null;
  section: StoryOfUsMediaSection;
  semanticKey: string;
  sectionItemId: string;
  sortOrder: number;
  isPuzzleSource: boolean;
}) {
  if (!photo) {
    return;
  }

  await updateExistingMediaMetadata({
    submissionId,
    photo,
    fallbackSection: section,
    fallbackSemanticKey: semanticKey,
    fallbackSectionItemId: sectionItemId,
    fallbackSortOrder: sortOrder,
    isPuzzleSource,
  });
}

async function updateExistingMediaMetadata({
  submissionId,
  photo,
  fallbackSection,
  fallbackSemanticKey,
  fallbackSectionItemId,
  fallbackSortOrder,
  isPuzzleSource,
}: {
  submissionId: string;
  photo: SubmitPhotoMetadata;
  fallbackSection: StoryOfUsMediaSection;
  fallbackSemanticKey: string;
  fallbackSectionItemId: string;
  fallbackSortOrder: number;
  isPuzzleSource: boolean;
}) {
  if (!photo.mediaId) {
    return;
  }

  const { error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .update({
      caption: emptyToNull(photo.caption),
      sort_order: photo.sortOrder ?? fallbackSortOrder,
      semantic_key: emptyToNull(photo.semanticKey || fallbackSemanticKey),
      section_item_id: emptyToNull(photo.sectionItemId || fallbackSectionItemId),
      is_puzzle_source: isPuzzleSource,
    })
    .eq("id", photo.mediaId)
    .eq("submission_id", submissionId)
    .eq("section", fallbackSection);

  if (error) {
    throw new Error(`StoryOfUs uploaded media metadata could not be updated: ${error.message}`);
  }
}

async function updatePuzzleSourceSelection(submissionId: string, payload: SubmitPayload) {
  const { error: resetError } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .update({ is_puzzle_source: false })
    .eq("submission_id", submissionId)
    .eq("is_puzzle_source", true);

  if (resetError) {
    throw new Error(`StoryOfUs puzzle source could not be reset: ${resetError.message}`);
  }

  if (isConfirmedSkipped(payload.confirmedSkips, "puzzle")) {
    return;
  }

  if (payload.media.puzzle.sourceType === "separate") {
    const { error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .update({ is_puzzle_source: true })
      .eq("submission_id", submissionId)
      .eq("section", "puzzle")
      .eq("semantic_key", "puzzle_source")
      .eq("section_item_id", "puzzlePhoto");

    if (error) {
      throw new Error(`StoryOfUs separate puzzle source could not be marked: ${error.message}`);
    }

    return;
  }

  if (payload.media.puzzle.sourceType === "gallery" && payload.media.puzzle.selectedPhotoId) {
    const { data, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .update({ is_puzzle_source: true })
      .eq("submission_id", submissionId)
      .eq("section", "gallery")
      .eq("semantic_key", "gallery_photo")
      .eq("section_item_id", payload.media.puzzle.selectedPhotoId)
      .eq("media_type", "photo")
      .select("id");

    if (error) {
      throw new Error(`StoryOfUs gallery puzzle source could not be marked: ${error.message}`);
    }

    if ((data ?? []).length !== 1) {
      throw new Error(STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE);
    }
  }
}

async function insertTimelineIfNeeded(submissionId: string, payload: SubmitPayload) {
  if (isConfirmedSkipped(payload.confirmedSkips, "timeline") || payload.timeline.length === 0) {
    return;
  }

  const rows = payload.timeline.map((item, index) => ({
    submission_id: submissionId,
    title: item.title,
    event_date: emptyToNull(item.eventDate),
    description: emptyToNull(item.description),
    sort_order: item.sortOrder ?? index,
  }));

  const { error } = await storyOfUsSupabaseAdmin.from("storyofus_timeline_items").insert(rows);

  if (error) {
    throw new Error(`StoryOfUs timeline items could not be saved: ${error.message}`);
  }
}

async function insertLettersIfNeeded(submissionId: string, payload: SubmitPayload) {
  if (payload.letters.length === 0) {
    return;
  }

  const rows = payload.letters.map((letter, index) => ({
    submission_id: submissionId,
    letter_type: letter.type,
    title: letter.title,
    body: letter.body,
    sort_order: letter.sortOrder ?? index,
  }));

  const { error } = await storyOfUsSupabaseAdmin.from("storyofus_letters").insert(rows);

  if (error) {
    throw new Error(`StoryOfUs letters could not be saved: ${error.message}`);
  }
}

function parseSubmissionPayload(formData: FormData): SubmitPayload {
  const rawPayload = formData.get("payload");

  if (typeof rawPayload !== "string") {
    throw new Error("StoryOfUs submission payload is missing.");
  }

  try {
    return JSON.parse(rawPayload) as SubmitPayload;
  } catch {
    throw new Error("StoryOfUs submission payload is invalid JSON.");
  }
}

function createSubmissionSnapshot(payload: SubmitPayload) {
  return {
    orderReference: payload.orderReference,
    contactCouple: payload.contactCouple,
    media: {
      openingPhotos: payload.media.openingPhotos,
      promptPhotos: payload.media.promptPhotos,
      photos: payload.media.photos,
      puzzle: payload.media.puzzle,
      loveLetterPhoto: payload.media.loveLetterPhoto,
    },
    musicVoice: {
      music: payload.musicVoice.music,
      voiceNote: payload.musicVoice.voiceNote,
    },
    siteAccess: {
      passcodeConfigured: true,
      passcodeHint: payload.siteAccess?.passcodeHint ?? "",
    },
    editableDefaultContent: payload.editableDefaultContent ?? {},
    confirmedSkips: payload.confirmedSkips,
    legalConsents: payload.legalConsents,
    timeline: payload.timeline,
    letters: payload.letters,
  };
}

function isConfirmedSkipped(confirmedSkips: ConfirmedSkips, sectionId: keyof ConfirmedSkips) {
  return confirmedSkips[sectionId]?.confirmed === true;
}

function isMusicEmpty(music: SubmitPayload["musicVoice"]["music"]) {
  return !music.spotifyUrl.trim() && !music.songTitle.trim() && !music.artistName.trim();
}

function getEffectiveEditableUntil(editableUntil: string | null, submittedAt: string | null) {
  if (editableUntil) {
    return editableUntil;
  }

  if (!submittedAt) {
    return null;
  }

  const submittedAtTime = new Date(submittedAt).getTime();

  if (!Number.isFinite(submittedAtTime)) {
    return null;
  }

  return new Date(submittedAtTime + 3 * 60 * 60 * 1000).toISOString();
}

function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}
