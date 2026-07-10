import { createServerFn } from "@tanstack/react-start";

import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

type SkipState = {
  warned: boolean;
  confirmed: boolean;
  confirmedAt?: string;
};

type ConfirmedSkips = Partial<
  Record<"photos" | "puzzle" | "music" | "voiceNote" | "timeline" | "letters", SkipState>
>;

type LegalConsentState = {
  accepted: boolean;
  acceptedAt?: string;
};

export type StoryOfUsSetupAccessExistingMediaItem = {
  id: string;
  mediaType: "photo" | "puzzle_photo" | "voice_note";
  section: "gallery" | "puzzle" | "voice_note";
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  caption: string;
  sortOrder: number;
  isPuzzleSource: boolean;
};

export type StoryOfUsSetupAccessInitialData = {
  orderReference: string;
  customerName: string;
  customerEmail: string;
  contactPhone: string;
  status: string;
  confirmedSkips: ConfirmedSkips;
  legalConsents: {
    privacyNoticeAccepted: LegalConsentState;
    explicitConsentAccepted: LegalConsentState;
    contentResponsibilityAccepted: LegalConsentState;
  } | null;
  contactCouple: {
    partnerName: string;
    coupleDisplayName: string;
    relationshipStartDate: string;
    specialDateLabel: string;
    recipientNickname: string;
    relationshipStory: string;
  };
  music: {
    spotifyUrl: string;
    spotifyTrackId: string;
    songTitle: string;
    artistName: string;
    startAtSeconds: number;
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
  existingMedia: StoryOfUsSetupAccessExistingMediaItem[];
};

export type StoryOfUsSetupAccessResult =
  | {
      status: "not_found";
    }
  | {
      status: "not_paid";
      paymentStatus: string | null;
    }
  | {
      status: "edit_locked";
      submissionStatus: string;
      editableUntil: string | null;
    }
  | {
      status: "ready";
      mode: "new" | "edit";
      setupToken: string;
      editableUntil: string | null;
      initialData: StoryOfUsSetupAccessInitialData;
    };

export const getStoryOfUsSetupAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object" || typeof (data as { token?: unknown }).token !== "string") {
      return {
        token: "",
      };
    }

    return {
      token: (data as { token: string }).token.trim(),
    };
  })
  .handler(async ({ data }): Promise<StoryOfUsSetupAccessResult> => {
    if (!data.token) {
      return {
        status: "not_found",
      };
    }

    const { data: submission, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .select(
        [
          "id",
          "setup_token",
          "order_reference",
          "customer_email",
          "customer_name",
          "contact_phone",
          "status",
          "payment_status",
          "confirmed_skips",
          "legal_consents",
          "submitted_at",
          "editable_until",
        ].join(", "),
      )
      .eq("setup_token", data.token)
      .maybeSingle();

    if (error) {
      throw new Error(`StoryOfUs setup access could not be checked: ${error.message}`);
    }

    if (!submission) {
      return {
        status: "not_found",
      };
    }

    const paymentStatus =
      typeof submission.payment_status === "string" ? submission.payment_status : null;

    if (paymentStatus !== "paid") {
      return {
        status: "not_paid",
        paymentStatus,
      };
    }

    const submissionStatus = typeof submission.status === "string" ? submission.status : "draft";
    const editableUntil = getEffectiveEditableUntil(
      typeof submission.editable_until === "string" ? submission.editable_until : null,
      typeof submission.submitted_at === "string" ? submission.submitted_at : null,
    );

    if (submissionStatus === "draft") {
      return {
        status: "ready",
        mode: "new",
        setupToken: String(submission.setup_token),
        editableUntil: null,
        initialData: await createInitialData(submission),
      };
    }

    if (submissionStatus === "submitted") {
      if (editableUntil && new Date(editableUntil).getTime() > Date.now()) {
        return {
          status: "ready",
          mode: "edit",
          setupToken: String(submission.setup_token),
          editableUntil,
          initialData: await createInitialData(submission),
        };
      }

      return {
        status: "edit_locked",
        submissionStatus,
        editableUntil,
      };
    }

    return {
      status: "edit_locked",
      submissionStatus,
      editableUntil,
    };
  });

async function createInitialData(submission: Record<string, unknown>) {
  const submissionId = String(submission.id);
  const [coupleDetails, musicDetails, timelineItems, letters, mediaItems] = await Promise.all([
    loadCoupleDetails(submissionId),
    loadMusicDetails(submissionId),
    loadTimelineItems(submissionId),
    loadLetters(submissionId),
    loadMediaItems(submissionId),
  ]);

  return {
    orderReference:
      typeof submission.order_reference === "string" ? submission.order_reference : "",
    customerName: typeof submission.customer_name === "string" ? submission.customer_name : "",
    customerEmail:
      typeof submission.customer_email === "string" ? submission.customer_email : "",
    contactPhone:
      typeof submission.contact_phone === "string" ? submission.contact_phone : "",
    status: typeof submission.status === "string" ? submission.status : "draft",
    confirmedSkips: isRecord(submission.confirmed_skips)
      ? (submission.confirmed_skips as ConfirmedSkips)
      : {},
    legalConsents: isRecord(submission.legal_consents)
      ? (submission.legal_consents as StoryOfUsSetupAccessInitialData["legalConsents"])
      : null,
    contactCouple: {
      partnerName: stringValue(coupleDetails?.partner_name),
      coupleDisplayName: stringValue(coupleDetails?.couple_display_name),
      relationshipStartDate: stringValue(coupleDetails?.relationship_start_date),
      specialDateLabel: stringValue(coupleDetails?.special_date_label),
      recipientNickname: stringValue(coupleDetails?.recipient_nickname),
      relationshipStory: stringValue(coupleDetails?.relationship_story),
    },
    music: {
      spotifyUrl: stringValue(musicDetails?.spotify_url),
      spotifyTrackId: stringValue(musicDetails?.spotify_track_id),
      songTitle: stringValue(musicDetails?.song_title),
      artistName: stringValue(musicDetails?.artist_name),
      startAtSeconds:
        typeof musicDetails?.start_at_seconds === "number" ? musicDetails.start_at_seconds : 0,
    },
    timeline: timelineItems.map((item, index) => ({
      id: stringValue(item.id) || `timeline-${index}`,
      title: stringValue(item.title),
      eventDate: stringValue(item.event_date),
      description: stringValue(item.description),
      sortOrder: typeof item.sort_order === "number" ? item.sort_order : index,
    })),
    letters: letters.map((letter, index) => ({
      id: stringValue(letter.id) || `letter-${index}`,
      type: letter.letter_type === "love_letter" ? "love_letter" : "open_when",
      title: stringValue(letter.title),
      body: stringValue(letter.body),
      sortOrder: typeof letter.sort_order === "number" ? letter.sort_order : index,
    })),
    existingMedia: mediaItems.map((media, index) => ({
      id: stringValue(media.id) || `media-${index}`,
      mediaType:
        media.media_type === "puzzle_photo" || media.media_type === "voice_note"
          ? media.media_type
          : "photo",
      section:
        media.section === "puzzle" || media.section === "voice_note" ? media.section : "gallery",
      storagePath: stringValue(media.storage_path),
      originalFilename: stringValue(media.original_filename),
      mimeType: stringValue(media.mime_type),
      sizeBytes: typeof media.size_bytes === "number" ? media.size_bytes : 0,
      caption: stringValue(media.caption),
      sortOrder: typeof media.sort_order === "number" ? media.sort_order : index,
      isPuzzleSource: media.is_puzzle_source === true,
    })),
  };
}

async function loadCoupleDetails(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_couple_details")
    .select(
      "partner_name, couple_display_name, relationship_start_date, special_date_label, recipient_nickname, relationship_story",
    )
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error(`StoryOfUs couple details could not be loaded: ${error.message}`);
  }

  return data;
}

async function loadMusicDetails(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_music")
    .select("spotify_url, spotify_track_id, song_title, artist_name, start_at_seconds")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error(`StoryOfUs music details could not be loaded: ${error.message}`);
  }

  return data;
}

async function loadTimelineItems(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_timeline_items")
    .select("id, title, event_date, description, sort_order")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`StoryOfUs timeline items could not be loaded: ${error.message}`);
  }

  return data ?? [];
}

async function loadLetters(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_letters")
    .select("id, letter_type, title, body, sort_order")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`StoryOfUs letters could not be loaded: ${error.message}`);
  }

  return data ?? [];
}

async function loadMediaItems(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .select(
      "id, media_type, section, storage_path, original_filename, mime_type, size_bytes, caption, sort_order, is_puzzle_source",
    )
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`StoryOfUs media metadata could not be loaded: ${error.message}`);
  }

  return data ?? [];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
