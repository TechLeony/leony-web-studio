import { createServerFn } from "@tanstack/react-start";

import { hashSitePasscode, validateSitePasscode } from "./passcode.server";
import { getStoryOfUsServiceStartConsent, isStoryOfUsActiveRefundStatus } from "./refundEligibility.server";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

const STORYOFUS_MEDIA_BUCKET = "storyofus-media";

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
};

type SubmitPuzzleSourceType = "gallery" | "separate";

type SubmitVoiceNoteMetadata = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
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
    photos: SubmitPhotoMetadata[];
    puzzle: {
      selectedPhotoId: string | null;
      puzzlePhoto: SubmitPhotoMetadata | null;
      sourceType: SubmitPuzzleSourceType | null;
      confirmedNoPuzzle: boolean;
    };
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
    const payload = parseSubmissionPayload(data);
    return submitStoryOfUsSetupData(payload, data);
  });

async function submitStoryOfUsSetupData(
  payload: SubmitPayload,
  formData: FormData,
): Promise<SubmissionResult> {
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

  if (isStoryOfUsActiveRefundStatus(typeof submission.refund_status === "string" ? submission.refund_status : null)) {
    throw new Error("Bu siparişle ilgili iade talebiniz inceleniyor. Ayrıntılı bilgi için contact@leony.tech adresinden bize ulaşabilirsiniz.");
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

  const nextPasscodeHash = passcodeValidation.shouldHashPasscode
    ? hashSitePasscode(siteAccess.passcode.trim())
    : submission.site_passcode_hash;
  const nextPasscodeSetAt = passcodeValidation.shouldHashPasscode
    ? submittedAt
    : submission.site_passcode_set_at;

  await deleteExistingTextDetails(submissionId);
  await prepareExistingMediaForSubmit(submissionId, payload, isFirstSubmit);

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
    throw new Error(`StoryOfUs submission could not be updated: ${updateError?.message}`);
  }

  await insertCoupleDetails(submissionId, payload);
  await insertMusicIfNeeded(submissionId, payload);
  await uploadPhotosIfNeeded(submissionId, payload, formData);
  await uploadVoiceNoteIfNeeded(submissionId, payload, formData);
  await insertTimelineIfNeeded(submissionId, payload);
  await insertLettersIfNeeded(submissionId, payload);

  return {
    submissionId,
    setupToken: (updatedSubmission.setup_token as string | null) ?? null,
    status: "submitted",
    editableUntil: nextEditableUntil,
  };
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
    const { error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .delete()
      .eq("submission_id", submissionId);

    if (error) {
      throw new Error(`StoryOfUs existing media rows could not be cleared: ${error.message}`);
    }

    return;
  }

  if (isConfirmedSkipped(payload.confirmedSkips, "photos")) {
    const { error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .delete()
      .eq("submission_id", submissionId)
      .eq("section", "gallery");

    if (error) {
      throw new Error(`StoryOfUs existing gallery media rows could not be cleared: ${error.message}`);
    }
  }

  if (isConfirmedSkipped(payload.confirmedSkips, "puzzle")) {
    const { error: deleteError } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .delete()
      .eq("submission_id", submissionId)
      .eq("section", "puzzle");

    if (deleteError) {
      throw new Error(`StoryOfUs existing puzzle media rows could not be cleared: ${deleteError.message}`);
    }

    const { error: updateError } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .update({ is_puzzle_source: false })
      .eq("submission_id", submissionId)
      .eq("is_puzzle_source", true);

    if (updateError) {
      throw new Error(`StoryOfUs existing puzzle source could not be cleared: ${updateError.message}`);
    }
  }

  if (isConfirmedSkipped(payload.confirmedSkips, "voiceNote")) {
    const { error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .delete()
      .eq("submission_id", submissionId)
      .eq("section", "voice_note");

    if (error) {
      throw new Error(`StoryOfUs existing voice note media rows could not be cleared: ${error.message}`);
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
  if (isConfirmedSkipped(payload.confirmedSkips, "music") || isMusicEmpty(payload.musicVoice.music)) {
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

async function uploadPhotosIfNeeded(submissionId: string, payload: SubmitPayload, formData: FormData) {
  const shouldMarkPuzzle =
    !isConfirmedSkipped(payload.confirmedSkips, "puzzle") &&
    payload.media.puzzle.sourceType === "gallery" &&
    Boolean(payload.media.puzzle.selectedPhotoId);

  if (!isConfirmedSkipped(payload.confirmedSkips, "photos")) {
    for (const photo of payload.media.photos) {
      const file = getFileFromFormData(formData, `photoFile:${photo.id}`);

      if (!file) {
        continue;
      }

      const storagePath = `submissions/${submissionId}/photos/${createSafeStorageFileName(
        photo.originalFilename || file.name,
      )}`;

      await uploadFileToStorage(storagePath, file);

      const { error } = await storyOfUsSupabaseAdmin.from("storyofus_media").insert({
        submission_id: submissionId,
        media_type: "photo",
        section: "gallery",
        storage_bucket: STORYOFUS_MEDIA_BUCKET,
        storage_path: storagePath,
        original_filename: emptyToNull(photo.originalFilename || file.name),
        mime_type: emptyToNull(photo.mimeType || file.type),
        size_bytes: photo.sizeBytes || file.size,
        caption: emptyToNull(photo.caption),
        sort_order: photo.sortOrder,
        is_puzzle_source: shouldMarkPuzzle && photo.id === payload.media.puzzle.selectedPhotoId,
      });

      if (error) {
        throw new Error(`StoryOfUs photo metadata could not be saved: ${error.message}`);
      }
    }
  }

  await uploadSeparatePuzzlePhotoIfNeeded(submissionId, payload, formData);
}

async function uploadSeparatePuzzlePhotoIfNeeded(
  submissionId: string,
  payload: SubmitPayload,
  formData: FormData,
) {
  if (
    isConfirmedSkipped(payload.confirmedSkips, "puzzle") ||
    payload.media.puzzle.sourceType !== "separate" ||
    !payload.media.puzzle.puzzlePhoto
  ) {
    return;
  }

  const file = getFileFromFormData(formData, "puzzlePhotoFile");

  if (!file) {
    return;
  }

  const puzzlePhoto = payload.media.puzzle.puzzlePhoto;
  const storagePath = `submissions/${submissionId}/puzzle/${createSafeStorageFileName(
    puzzlePhoto.originalFilename || file.name,
  )}`;

  await uploadFileToStorage(storagePath, file);

  const { error } = await storyOfUsSupabaseAdmin.from("storyofus_media").insert({
    submission_id: submissionId,
    media_type: "puzzle_photo",
    section: "puzzle",
    storage_bucket: STORYOFUS_MEDIA_BUCKET,
    storage_path: storagePath,
    original_filename: emptyToNull(puzzlePhoto.originalFilename || file.name),
    mime_type: emptyToNull(puzzlePhoto.mimeType || file.type),
    size_bytes: puzzlePhoto.sizeBytes || file.size,
    caption: emptyToNull(puzzlePhoto.caption),
    sort_order: 0,
    is_puzzle_source: true,
  });

  if (error) {
    throw new Error(`StoryOfUs puzzle photo metadata could not be saved: ${error.message}`);
  }
}

async function uploadVoiceNoteIfNeeded(
  submissionId: string,
  payload: SubmitPayload,
  formData: FormData,
) {
  if (isConfirmedSkipped(payload.confirmedSkips, "voiceNote") || !payload.musicVoice.voiceNote) {
    return;
  }

  const file = getFileFromFormData(formData, "voiceNoteFile");

  if (!file) {
    return;
  }

  const storagePath = `submissions/${submissionId}/voice-note/${createSafeStorageFileName(
    payload.musicVoice.voiceNote.originalFilename || file.name,
  )}`;

  await uploadFileToStorage(storagePath, file);

  const { error } = await storyOfUsSupabaseAdmin.from("storyofus_media").insert({
    submission_id: submissionId,
    media_type: "voice_note",
    section: "voice_note",
    storage_bucket: STORYOFUS_MEDIA_BUCKET,
    storage_path: storagePath,
    original_filename: emptyToNull(payload.musicVoice.voiceNote.originalFilename || file.name),
    mime_type: emptyToNull(payload.musicVoice.voiceNote.mimeType || file.type),
    size_bytes: payload.musicVoice.voiceNote.sizeBytes || file.size,
    caption: null,
    sort_order: 0,
    is_puzzle_source: false,
  });

  if (error) {
    throw new Error(`StoryOfUs voice note metadata could not be saved: ${error.message}`);
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
  if (isConfirmedSkipped(payload.confirmedSkips, "letters") || payload.letters.length === 0) {
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

async function uploadFileToStorage(storagePath: string, file: File) {
  const { error } = await storyOfUsSupabaseAdmin.storage
    .from(STORYOFUS_MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) {
    throw new Error(`StoryOfUs media upload failed: ${error.message}`);
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
      photos: payload.media.photos,
      puzzle: payload.media.puzzle,
    },
    musicVoice: {
      music: payload.musicVoice.music,
      voiceNote: payload.musicVoice.voiceNote,
    },
    siteAccess: {
      passcodeConfigured: true,
      passcodeHint: payload.siteAccess?.passcodeHint ?? "",
    },
    confirmedSkips: payload.confirmedSkips,
    legalConsents: payload.legalConsents,
    timeline: payload.timeline,
    letters: payload.letters,
  };
}

function getFileFromFormData(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (!value || typeof value === "string" || typeof (value as File).arrayBuffer !== "function") {
    return null;
  }

  return value as File;
}

function createSafeStorageFileName(originalFilename: string) {
  const extensionMatch = originalFilename.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : "";
  const baseName = originalFilename
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const randomId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${randomId}-${baseName || "file"}${extension}`;
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
