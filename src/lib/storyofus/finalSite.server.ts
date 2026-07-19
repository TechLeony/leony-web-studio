import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SITE } from "@/lib/site";

import {
  createStoryOfUsFinalSiteSlug,
  createStoryOfUsFinalSiteSlugBase,
  createStoryOfUsFinalSiteUrl,
  normalizeStoryOfUsFinalSiteSlug,
} from "./finalSiteUtils";
import {
  assertStoryOfUsFinalSitePasscodeAttemptAllowed,
  clearStoryOfUsFinalSitePasscodeFailures,
  recordStoryOfUsFinalSitePasscodeFailure,
} from "./finalSitePasscodeRateLimit.server";
import { verifySitePasscode } from "./passcode.server";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

const STORYOFUS_MEDIA_BUCKET = "storyofus-media";

type AdminContext = {
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string,
        ) => {
          eq: (
            column: string,
            value: string,
          ) => {
            maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
          };
          maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
        };
      };
    };
  };
  userId: string;
  claims: {
    email?: unknown;
  };
};

export type StoryOfUsFinalSiteData = {
  coupleDisplayName: string;
  partnerName: string;
  recipientNickname: string;
  relationshipStartDate: string | null;
  specialDateLabel: string;
  relationshipStory: string;
  passcodeHint: string;
  finalSiteUrl: string | null;
  orderReference: string;
  heroPhotos: {
    left: StoryOfUsFinalSiteMedia | null;
    right: StoryOfUsFinalSiteMedia | null;
  };
  memoryPrompts: StoryOfUsFinalSiteMedia[];
  gallery: StoryOfUsFinalSiteMedia[];
  puzzlePhoto: StoryOfUsFinalSiteMedia | null;
  loveLetterPhoto: StoryOfUsFinalSiteMedia | null;
  voiceNote: StoryOfUsFinalSiteMedia | null;
  timeline: StoryOfUsFinalSiteTimelineItem[];
  letters: StoryOfUsFinalSiteLetter[];
  music: {
    spotifyUrl: string;
    songTitle: string;
    artistName: string;
    startAtSeconds: number;
  } | null;
};

export type StoryOfUsFinalSiteMedia = {
  id: string;
  mediaType: "photo" | "puzzle_photo" | "voice_note";
  section: string;
  semanticKey: string | null;
  sectionItemId: string | null;
  previewUrl: string;
  originalFilename: string;
  caption: string;
  sortOrder: number;
  isPuzzleSource: boolean;
};

export type StoryOfUsFinalSiteTimelineItem = {
  id: string;
  title: string;
  eventDate: string | null;
  description: string;
  sortOrder: number;
  photo: StoryOfUsFinalSiteMedia | null;
};

export type StoryOfUsFinalSiteLetter = {
  id: string;
  type: "love_letter" | "open_when";
  title: string;
  body: string;
  sortOrder: number;
};

type FinalSiteAccessResult =
  | {
      status: "found";
      coupleDisplayName: string;
      passcodeHint: string;
    }
  | {
      status: "not_found";
    };

type FinalSiteVerifyResult =
  | {
      status: "unlocked";
      site: StoryOfUsFinalSiteData;
    }
  | {
      status: "invalid_passcode";
      message: string;
    }
  | {
      status: "not_found";
    };

type PublishResult =
  | {
      status: "published" | "already_published";
      finalSiteSlug: string;
      finalSiteUrl: string;
      emailQueued: boolean;
    }
  | {
      status: "not_publishable" | "not_found";
      message: string;
    };

export const getStoryOfUsFinalSiteAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ({
    siteSlug:
      data &&
      typeof data === "object" &&
      typeof (data as { siteSlug?: unknown }).siteSlug === "string"
        ? (data as { siteSlug: string }).siteSlug
        : "",
  }))
  .handler(async ({ data }): Promise<FinalSiteAccessResult> => {
    const published = await loadPublishedGateDataBySlug(data.siteSlug);

    if (!published) {
      return {
        status: "not_found",
      };
    }

    return {
      status: "found",
      coupleDisplayName: published.coupleDisplayName,
      passcodeHint: published.passcodeHint,
    };
  });

export const verifyStoryOfUsFinalSitePasscode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") {
      return {
        siteSlug: "",
        passcode: "",
      };
    }

    const input = data as Record<string, unknown>;

    return {
      siteSlug: typeof input.siteSlug === "string" ? input.siteSlug : "",
      passcode: typeof input.passcode === "string" ? input.passcode : "",
    };
  })
  .handler(async ({ data }): Promise<FinalSiteVerifyResult> => {
    let bucketKeyHash: string;

    try {
      bucketKeyHash = await assertStoryOfUsFinalSitePasscodeAttemptAllowed(data.siteSlug);
    } catch {
      return invalidPasscodeResult();
    }

    const published = await loadPublishedSubmissionBySlug(data.siteSlug);

    if (!published) {
      await recordPasscodeFailureQuietly(bucketKeyHash);
      return invalidPasscodeResult();
    }

    if (!/^\d{4}$/.test(data.passcode.trim())) {
      await recordPasscodeFailureQuietly(bucketKeyHash);
      return invalidPasscodeResult();
    }

    if (!verifySitePasscode(data.passcode.trim(), published.sitePasscodeHash)) {
      await recordPasscodeFailureQuietly(bucketKeyHash);
      return invalidPasscodeResult();
    }

    await clearPasscodeFailuresQuietly(bucketKeyHash);

    return {
      status: "unlocked",
      site: await loadStoryOfUsFinalSiteData(published.id),
    };
  });

export const getStoryOfUsAdminFinalSitePreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    submissionId:
      data &&
      typeof data === "object" &&
      typeof (data as { submissionId?: unknown }).submissionId === "string"
        ? (data as { submissionId: string }).submissionId
        : "",
  }))
  .handler(async ({ data, context }) => {
    await assertStoryOfUsAdmin(context as AdminContext);

    if (!isUuid(data.submissionId)) {
      return {
        status: "not_found" as const,
      };
    }

    const submission = await loadAdminPreviewSubmission(data.submissionId);

    if (!submission) {
      return {
        status: "not_found" as const,
      };
    }

    return {
      status: "found" as const,
      site: await loadStoryOfUsFinalSiteData(submission.id),
    };
  });

export const verifyStoryOfUsAdminPreviewPasscode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") {
      return {
        submissionId: "",
        passcode: "",
      };
    }

    const input = data as Record<string, unknown>;

    return {
      submissionId: typeof input.submissionId === "string" ? input.submissionId : "",
      passcode: typeof input.passcode === "string" ? input.passcode : "",
    };
  })
  .handler(async ({ data, context }) => {
    await assertStoryOfUsAdmin(context as AdminContext);

    if (!isUuid(data.submissionId) || !/^\d{4}$/.test(data.passcode.trim())) {
      return {
        status: "invalid_passcode" as const,
        message: "Şifre yanlış, tekrar dene aşkım 💌",
      };
    }

    const submission = await loadAdminPreviewPasscodeSubmission(data.submissionId);

    if (!submission || !verifySitePasscode(data.passcode.trim(), submission.sitePasscodeHash)) {
      return {
        status: "invalid_passcode" as const,
        message: "Şifre yanlış, tekrar dene aşkım 💌",
      };
    }

    return {
      status: "unlocked" as const,
    };
  });

export const publishStoryOfUsFinalSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    submissionId:
      data &&
      typeof data === "object" &&
      typeof (data as { submissionId?: unknown }).submissionId === "string"
        ? (data as { submissionId: string }).submissionId
        : "",
  }))
  .handler(async ({ data, context }): Promise<PublishResult> => {
    await assertStoryOfUsAdmin(context as AdminContext);

    if (!isUuid(data.submissionId)) {
      return {
        status: "not_found",
        message: "Sipariş bulunamadı.",
      };
    }

    const submission = await loadAdminPreviewSubmission(data.submissionId);

    if (!submission) {
      return {
        status: "not_found",
        message: "Sipariş bulunamadı.",
      };
    }

    if (submission.status === "published" && submission.finalSiteSlug && submission.finalSiteUrl) {
      return {
        status: "already_published",
        finalSiteSlug: submission.finalSiteSlug,
        finalSiteUrl: submission.finalSiteUrl,
        emailQueued: true,
      };
    }

    const coupleDetails = await loadCoupleDetails(data.submissionId);
    const slugBase = createStoryOfUsFinalSiteSlugBase(
      coupleDetails?.coupleDisplayName ?? "",
      coupleDetails?.partnerName ?? "",
    );

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const finalSiteSlug = createStoryOfUsFinalSiteSlug(slugBase);
      const finalSiteUrl = createStoryOfUsFinalSiteUrl(finalSiteSlug);
      const publishResult = await callPublishRpc(data.submissionId, finalSiteSlug, finalSiteUrl);

      if (publishResult.status === "slug_conflict") {
        continue;
      }

      if (publishResult.status === "published" || publishResult.status === "already_published") {
        return {
          status: publishResult.status,
          finalSiteSlug: publishResult.finalSiteSlug,
          finalSiteUrl: publishResult.finalSiteUrl,
          emailQueued: publishResult.emailQueued,
        };
      }

      return {
        status: "not_publishable",
        message: getPublishErrorMessage(publishResult.status),
      };
    }

    return {
      status: "not_publishable",
      message: "Benzersiz final bağlantısı oluşturulamadı. Lütfen tekrar deneyin.",
    };
  });

async function callPublishRpc(
  submissionId: string,
  finalSiteSlug: string,
  finalSiteUrl: string,
): Promise<
  | {
      status: "published" | "already_published";
      finalSiteSlug: string;
      finalSiteUrl: string;
      emailQueued: boolean;
    }
  | {
      status: "not_found" | "not_publishable" | "missing_setup_data" | "slug_conflict";
    }
> {
  const { data, error } = await storyOfUsSupabaseAdmin.rpc("storyofus_publish_final_site", {
    p_submission_id: submissionId,
    p_final_site_slug: finalSiteSlug,
    p_final_site_url: finalSiteUrl,
    p_expected_status: "in_review",
  });

  if (error) {
    throw new Error("StoryOfUs final site could not be published.");
  }

  const row = Array.isArray(data) ? data[0] : null;
  const result = stringValue(row?.result);

  if (result === "published" || result === "already_published") {
    return {
      status: result,
      finalSiteSlug: stringValue(row?.final_site_slug),
      finalSiteUrl: stringValue(row?.final_site_url),
      emailQueued: row?.email_queued === true,
    };
  }

  if (result === "not_found" || result === "missing_setup_data" || result === "slug_conflict") {
    return {
      status: result,
    };
  }

  return {
    status: "not_publishable",
  };
}

async function loadPublishedSubmissionBySlug(siteSlug: string) {
  const slug = normalizeStoryOfUsFinalSiteSlug(siteSlug);

  if (!slug) {
    return null;
  }

  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select("id, site_passcode_hash")
    .eq("final_site_slug", slug)
    .eq("status", "published")
    .not("final_site_url", "is", null)
    .not("delivered_at", "is", null)
    .maybeSingle();

  if (error) {
    throw new Error("StoryOfUs final site could not be loaded.");
  }

  if (!data || !stringValue(data.site_passcode_hash)) {
    return null;
  }

  return {
    id: stringValue(data.id),
    sitePasscodeHash: stringValue(data.site_passcode_hash),
  };
}

async function loadPublishedGateDataBySlug(siteSlug: string) {
  const slug = normalizeStoryOfUsFinalSiteSlug(siteSlug);

  if (!slug) {
    return null;
  }

  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select("id, site_passcode_hint")
    .eq("final_site_slug", slug)
    .eq("status", "published")
    .not("final_site_url", "is", null)
    .not("delivered_at", "is", null)
    .maybeSingle();

  if (error) {
    throw new Error("StoryOfUs final site gate could not be loaded.");
  }

  if (!data) {
    return null;
  }

  const coupleDetails = await loadCoupleDetails(stringValue(data.id));

  return {
    coupleDisplayName: coupleDetails?.coupleDisplayName || "StoryOfUs",
    passcodeHint: stringValue(data.site_passcode_hint),
  };
}

async function loadAdminPreviewSubmission(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select("id, status, final_site_slug, final_site_url")
    .eq("id", submissionId)
    .in("status", ["in_review", "published"])
    .maybeSingle();

  if (error) {
    throw new Error("StoryOfUs admin preview data could not be loaded.");
  }

  if (!data) {
    return null;
  }

  return {
    id: stringValue(data.id),
    status: stringValue(data.status),
    finalSiteSlug: nullableString(data.final_site_slug),
    finalSiteUrl: nullableString(data.final_site_url),
  };
}

async function loadAdminPreviewPasscodeSubmission(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select("id, site_passcode_hash")
    .eq("id", submissionId)
    .in("status", ["in_review", "published"])
    .maybeSingle();

  if (error) {
    throw new Error("StoryOfUs admin preview passcode could not be loaded.");
  }

  if (!data || !stringValue(data.site_passcode_hash)) {
    return null;
  }

  return {
    id: stringValue(data.id),
    sitePasscodeHash: stringValue(data.site_passcode_hash),
  };
}

async function loadStoryOfUsFinalSiteData(submissionId: string): Promise<StoryOfUsFinalSiteData> {
  const [submission, coupleDetails, music, media, timeline, letters] = await Promise.all([
    loadSubmissionBase(submissionId),
    loadCoupleDetails(submissionId),
    loadMusic(submissionId),
    loadMedia(submissionId),
    loadTimeline(submissionId),
    loadLetters(submissionId),
  ]);
  const mediaBySectionItem = new Map(
    media.map((item) => [`${item.section}:${item.sectionItemId}`, item]),
  );

  return {
    coupleDisplayName: coupleDetails?.coupleDisplayName || "StoryOfUs",
    partnerName: coupleDetails?.partnerName || "",
    recipientNickname: coupleDetails?.recipientNickname || "",
    relationshipStartDate: coupleDetails?.relationshipStartDate ?? null,
    specialDateLabel: coupleDetails?.specialDateLabel || "",
    relationshipStory: coupleDetails?.relationshipStory || "",
    passcodeHint: submission.passcodeHint,
    finalSiteUrl: submission.finalSiteUrl,
    orderReference: submission.orderReference,
    heroPhotos: {
      left: mediaBySectionItem.get("opening:firstPerson") ?? null,
      right: mediaBySectionItem.get("opening:secondPerson") ?? null,
    },
    memoryPrompts: media.filter((item) => item.section === "memory_prompt"),
    gallery: media.filter((item) => item.section === "gallery"),
    puzzlePhoto: media.find((item) => item.isPuzzleSource) ?? null,
    loveLetterPhoto: mediaBySectionItem.get("letter:loveLetterPhoto") ?? null,
    voiceNote: mediaBySectionItem.get("voice_note:voiceNote") ?? null,
    timeline: timeline.map((item) => ({
      ...item,
      photo: mediaBySectionItem.get(`timeline:${item.id}`) ?? null,
    })),
    letters,
    music,
  };
}

async function loadSubmissionBase(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select("order_reference, final_site_url, site_passcode_hint")
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("StoryOfUs final site base data could not be loaded.");
  }

  return {
    orderReference: stringValue(data.order_reference),
    finalSiteUrl: nullableString(data.final_site_url),
    passcodeHint: stringValue(data.site_passcode_hint),
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
    throw new Error("StoryOfUs couple details could not be loaded.");
  }

  if (!data) {
    return null;
  }

  return {
    partnerName: stringValue(data.partner_name),
    coupleDisplayName: stringValue(data.couple_display_name),
    relationshipStartDate: nullableString(data.relationship_start_date),
    specialDateLabel: stringValue(data.special_date_label),
    recipientNickname: stringValue(data.recipient_nickname),
    relationshipStory: stringValue(data.relationship_story),
  };
}

async function loadMusic(submissionId: string): Promise<StoryOfUsFinalSiteData["music"]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_music")
    .select("spotify_url, song_title, artist_name, start_at_seconds")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error("StoryOfUs music could not be loaded.");
  }

  if (!data) {
    return null;
  }

  return {
    spotifyUrl: stringValue(data.spotify_url),
    songTitle: stringValue(data.song_title) || "Şarkımız",
    artistName: stringValue(data.artist_name) || "Bize özel",
    startAtSeconds: numberValue(data.start_at_seconds),
  };
}

async function loadMedia(submissionId: string): Promise<StoryOfUsFinalSiteMedia[]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .select(
      "id, media_type, section, semantic_key, section_item_id, storage_path, original_filename, caption, sort_order, is_puzzle_source",
    )
    .eq("submission_id", submissionId)
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error("StoryOfUs media could not be loaded.");
  }

  return Promise.all(
    (data ?? []).map(async (item) => ({
      id: stringValue(item.id),
      mediaType:
        item.media_type === "puzzle_photo" || item.media_type === "voice_note"
          ? item.media_type
          : "photo",
      section: stringValue(item.section),
      semanticKey: nullableString(item.semantic_key),
      sectionItemId: nullableString(item.section_item_id),
      previewUrl: await createSignedUrl(stringValue(item.storage_path)),
      originalFilename: stringValue(item.original_filename),
      caption: stringValue(item.caption),
      sortOrder: numberValue(item.sort_order),
      isPuzzleSource: item.is_puzzle_source === true,
    })),
  );
}

async function loadTimeline(submissionId: string): Promise<StoryOfUsFinalSiteTimelineItem[]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_timeline_items")
    .select("id, title, event_date, description, sort_order")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error("StoryOfUs timeline could not be loaded.");
  }

  return (data ?? []).map((item) => ({
    id: stringValue(item.id),
    title: stringValue(item.title),
    eventDate: nullableString(item.event_date),
    description: stringValue(item.description),
    sortOrder: numberValue(item.sort_order),
    photo: null,
  }));
}

async function loadLetters(submissionId: string): Promise<StoryOfUsFinalSiteLetter[]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_letters")
    .select("id, letter_type, title, body, sort_order")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error("StoryOfUs letters could not be loaded.");
  }

  return (data ?? []).map((letter) => ({
    id: stringValue(letter.id),
    type: letter.letter_type === "love_letter" ? "love_letter" : "open_when",
    title: stringValue(letter.title),
    body: stringValue(letter.body),
    sortOrder: numberValue(letter.sort_order),
  }));
}

async function createSignedUrl(storagePath: string) {
  if (!storagePath) {
    return "";
  }

  const { data, error } = await storyOfUsSupabaseAdmin.storage
    .from(STORYOFUS_MEDIA_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    return "";
  }

  return data.signedUrl ?? "";
}

async function assertStoryOfUsAdmin(context: AdminContext) {
  const email = typeof context.claims?.email === "string" ? context.claims.email : "";
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify admin role.");
  }

  if (!data && email.toLowerCase() !== SITE.adminEmail.toLowerCase()) {
    throw new Error("Forbidden: admin access required.");
  }
}

function getPublishErrorMessage(status: string) {
  switch (status) {
    case "missing_setup_data":
      return "Final site için gerekli kurulum bilgileri eksik.";
    case "not_found":
      return "Sipariş bulunamadı.";
    default:
      return "Bu sipariş şu anda yayınlanamaz.";
  }
}

async function recordPasscodeFailureQuietly(bucketKeyHash: string) {
  try {
    await recordStoryOfUsFinalSitePasscodeFailure(bucketKeyHash);
  } catch {
    // Keep customer-facing passcode responses generic even if limiter persistence fails.
  }
}

async function clearPasscodeFailuresQuietly(bucketKeyHash: string) {
  try {
    await clearStoryOfUsFinalSitePasscodeFailures(bucketKeyHash);
  } catch {
    // A successful unlock should not fail solely because cleanup could not run.
  }
}

function invalidPasscodeResult(): FinalSiteVerifyResult {
  return {
    status: "invalid_passcode",
    message: "Şifre yanlış, tekrar dene aşkım 💌",
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
