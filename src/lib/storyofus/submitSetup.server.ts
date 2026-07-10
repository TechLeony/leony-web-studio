import { createServerFn } from "@tanstack/react-start";

import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

const STORYOFUS_MEDIA_BUCKET = "storyofus-media";

type SkipState = {
  warned: boolean;
  confirmed: boolean;
  confirmedAt?: string;
};

type ConfirmedSkips = Partial<
  Record<"photos" | "puzzle" | "music" | "voiceNote" | "timeline" | "letters", SkipState>
>;

type SubmitPhotoMetadata = {
  id: string;
  caption: string;
  sortOrder: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

type SubmitVoiceNoteMetadata = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

type SubmitPayload = {
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
  const submittedAt = new Date().toISOString();
  const submissionSnapshot = createSubmissionSnapshot(payload);

  const { data: submission, error: submissionError } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .insert({
      order_reference: emptyToNull(payload.orderReference),
      customer_email: emptyToNull(payload.contactCouple.customerEmail),
      customer_name: emptyToNull(payload.contactCouple.customerName),
      contact_phone: emptyToNull(payload.contactCouple.contactPhone),
      status: "submitted",
      confirmed_skips: payload.confirmedSkips,
      legal_consents: payload.legalConsents,
      submission_snapshot: submissionSnapshot,
      submitted_at: submittedAt,
    })
    .select("id, setup_token, status")
    .single();

  if (submissionError || !submission) {
    throw new Error(`StoryOfUs submission could not be created: ${submissionError?.message}`);
  }

  const submissionId = submission.id as string;

  await insertCoupleDetails(submissionId, payload);
  await insertMusicIfNeeded(submissionId, payload);
  await uploadPhotosIfNeeded(submissionId, payload, formData);
  await uploadVoiceNoteIfNeeded(submissionId, payload, formData);
  await insertTimelineIfNeeded(submissionId, payload);
  await insertLettersIfNeeded(submissionId, payload);

  return {
    submissionId,
    setupToken: (submission.setup_token as string | null) ?? null,
    status: "submitted",
  };
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
  if (isConfirmedSkipped(payload.confirmedSkips, "photos")) {
    return;
  }

  const shouldMarkPuzzle =
    !isConfirmedSkipped(payload.confirmedSkips, "puzzle") && Boolean(payload.media.puzzle.selectedPhotoId);

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

function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}
