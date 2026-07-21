import { createServerFn } from "@tanstack/react-start";

import { getLoveLetterPhotoSubmitError } from "./loveLetterRequirements";
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
  status: "submitted" | "in_review";
  submissionKind: "first_submit" | "edit_submit" | "edit_limit_reached";
  editableUntil: string | null;
  refundRequestUntil: string | null;
  editsUsed: number;
  editLimit: number;
  editingClosedAt: string | null;
  editingClosedReason: string | null;
  reviewReadyAt: string | null;
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
      "id, setup_token, status, payment_status, refund_status, submitted_at, editable_until, edits_used, edit_limit, editing_closed_at, site_passcode_hash, site_passcode_set_at",
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
  const editsUsed = numberValue(submission.edits_used);
  const editLimit = Math.max(numberValue(submission.edit_limit), 1);
  const editingClosedAt =
    typeof submission.editing_closed_at === "string" ? submission.editing_closed_at : null;
  const effectiveEditableUntil = getEffectiveEditableUntil(
    typeof submission.editable_until === "string" ? submission.editable_until : null,
    typeof submission.submitted_at === "string" ? submission.submitted_at : null,
  );
  const isEditableResubmit =
    submission.status === "submitted" &&
    Boolean(effectiveEditableUntil) &&
    new Date(effectiveEditableUntil as string).getTime() > now.getTime() &&
    editsUsed < editLimit &&
    !editingClosedAt;

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

  const finalizedSubmission = await finalizeSetupSubmissionWithRpc({
    setupToken,
    submissionSnapshot,
    sitePasscodeHash: String(nextPasscodeHash),
    sitePasscodeHint: passcodeValidation.normalizedHint,
    sitePasscodeSetAt: String(nextPasscodeSetAt),
    serviceStartConsent,
  });

  if (finalizedSubmission.submissionKind === "first_submit") {
    await enqueueSetupSubmittedEmailQuietly(finalizedSubmission.submissionId);
  }

  return finalizedSubmission;
}

type FinalizeSetupSubmissionInput = {
  setupToken: string;
  submissionSnapshot: ReturnType<typeof createSubmissionSnapshot>;
  sitePasscodeHash: string;
  sitePasscodeHint: string;
  sitePasscodeSetAt: string;
  serviceStartConsent: ReturnType<typeof getStoryOfUsServiceStartConsent> | undefined;
};

async function finalizeSetupSubmissionWithRpc({
  setupToken,
  submissionSnapshot,
  sitePasscodeHash,
  sitePasscodeHint,
  sitePasscodeSetAt,
  serviceStartConsent,
}: FinalizeSetupSubmissionInput): Promise<SubmissionResult> {
  const { data, error } = await storyOfUsSupabaseAdmin.rpc("storyofus_finalize_setup_submission", {
    p_setup_token: setupToken,
    p_submission_snapshot: submissionSnapshot,
    p_site_passcode_hash: sitePasscodeHash,
    p_site_passcode_hint: sitePasscodeHint,
    p_site_passcode_set_at: sitePasscodeSetAt,
    p_service_start_consent: serviceStartConsent ?? null,
  });

  if (error) {
    throw new Error(`StoryOfUs submission could not be finalized: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (!row) {
    throw new Error("StoryOfUs submission could not be finalized.");
  }

  return {
    submissionId: stringValue(row.submission_id),
    setupToken: nullableString(row.setup_token),
    status: normalizeSubmissionStatus(row.status),
    submissionKind: normalizeSubmissionKind(row.submission_kind),
    editableUntil: nullableString(row.editable_until),
    refundRequestUntil: nullableString(row.refund_request_until),
    editsUsed: numberValue(row.edits_used),
    editLimit: numberValue(row.edit_limit),
    editingClosedAt: nullableString(row.editing_closed_at),
    editingClosedReason: nullableString(row.editing_closed_reason),
    reviewReadyAt: nullableString(row.review_ready_at),
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

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeSubmissionStatus(value: unknown): SubmissionResult["status"] {
  return value === "in_review" ? "in_review" : "submitted";
}

function normalizeSubmissionKind(value: unknown): SubmissionResult["submissionKind"] {
  if (value === "edit_submit" || value === "edit_limit_reached") {
    return value;
  }

  return "first_submit";
}
