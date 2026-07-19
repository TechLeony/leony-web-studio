import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SITE } from "@/lib/site";

import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

const STORYOFUS_MEDIA_BUCKET = "storyofus-media";

type AdminContext = {
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
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

type ReviewReadyPromotionSummary = {
  eligible: number;
  promoted: number;
  skipped: number;
  failed: number;
};

export type StoryOfUsAdminReviewOrder = {
  id: string;
  orderReference: string;
  trackingCode: string;
  customerName: string;
  customerEmailMasked: string;
  status: "submitted" | "in_review" | "published" | "archived" | string;
  statusLabel: string;
  submittedAt: string | null;
  editableUntil: string | null;
  reviewReadyAt: string | null;
  mediaCount: number;
};

export type StoryOfUsAdminReviewDetail = StoryOfUsAdminReviewOrder & {
  contactPhoneMasked: string;
  paymentStatusLabel: string;
  refundStatusLabel: string;
  coupleDetails: {
    partnerName: string;
    coupleDisplayName: string;
    relationshipStartDate: string | null;
    specialDateLabel: string;
    recipientNickname: string;
    relationshipStory: string;
  } | null;
  music: {
    spotifyUrl: string;
    songTitle: string;
    artistName: string;
    startAtSeconds: number;
  } | null;
  media: Array<{
    id: string;
    mediaType: string;
    section: string;
    semanticKey: string | null;
    sectionItemId: string | null;
    originalFilename: string;
    caption: string;
    sortOrder: number;
    isPuzzleSource: boolean;
    signedUrl: string;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    eventDate: string | null;
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

type StoryOfUsAdminReviewQueueResult = {
  inReviewOrders: StoryOfUsAdminReviewOrder[];
  activeSubmittedOrders: StoryOfUsAdminReviewOrder[];
};

type StoryOfUsAdminReviewDetailResult =
  | {
      status: "found";
      order: StoryOfUsAdminReviewDetail;
    }
  | {
      status: "not_found";
    };

export async function promoteStoryOfUsReviewReadyOrders(
  batchLimit = 50,
  dryRun = false,
): Promise<ReviewReadyPromotionSummary> {
  const { data, error } = await storyOfUsSupabaseAdmin.rpc(
    "storyofus_promote_review_ready_orders",
    {
      p_batch_limit: batchLimit,
      p_dry_run: dryRun,
    },
  );

  if (error) {
    throw new Error(`StoryOfUs review-ready promotion failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : null;
  const eligible = numberValue(row?.eligible_count);
  const promoted = numberValue(row?.promoted_count);

  return {
    eligible,
    promoted,
    skipped: Math.max(eligible - promoted, 0),
    failed: 0,
  };
}

export const listStoryOfUsAdminReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StoryOfUsAdminReviewQueueResult> => {
    await assertStoryOfUsAdmin(context as AdminContext);

    const { data, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .select(
        [
          "id",
          "order_reference",
          "tracking_code",
          "customer_name",
          "customer_email",
          "status",
          "submitted_at",
          "editable_until",
          "review_ready_at",
          "storyofus_media(id)",
        ].join(", "),
      )
      .in("status", ["submitted", "in_review"])
      .eq("payment_status", "paid")
      .in("refund_status", ["none", "rejected"])
      .order("editable_until", { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(`StoryOfUs admin queue could not be loaded: ${error.message}`);
    }

    const now = Date.now();
    const orders = (data ?? []).map(mapAdminReviewOrder);

    return {
      inReviewOrders: orders.filter((order) => order.status === "in_review"),
      activeSubmittedOrders: orders.filter(
        (order) =>
          order.status === "submitted" &&
          Boolean(order.editableUntil) &&
          new Date(order.editableUntil as string).getTime() > now,
      ),
    };
  });

export const getStoryOfUsAdminReviewDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") {
      return {
        submissionId: "",
      };
    }

    const input = data as Record<string, unknown>;

    return {
      submissionId: typeof input.submissionId === "string" ? input.submissionId : "",
    };
  })
  .handler(async ({ data, context }): Promise<StoryOfUsAdminReviewDetailResult> => {
    await assertStoryOfUsAdmin(context as AdminContext);

    if (!isUuid(data.submissionId)) {
      return {
        status: "not_found",
      };
    }

    const { data: submission, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .select(
        [
          "id",
          "order_reference",
          "tracking_code",
          "customer_name",
          "customer_email",
          "contact_phone",
          "status",
          "payment_status",
          "refund_status",
          "submitted_at",
          "editable_until",
          "review_ready_at",
          "storyofus_media(id)",
        ].join(", "),
      )
      .eq("id", data.submissionId)
      .maybeSingle();

    if (error) {
      throw new Error(`StoryOfUs admin detail could not be loaded: ${error.message}`);
    }

    if (!submission || !["submitted", "in_review"].includes(stringValue(submission.status))) {
      return {
        status: "not_found",
      };
    }

    const [coupleDetails, music, media, timeline, letters] = await Promise.all([
      loadCoupleDetails(data.submissionId),
      loadMusic(data.submissionId),
      loadMedia(data.submissionId),
      loadTimeline(data.submissionId),
      loadLetters(data.submissionId),
    ]);

    return {
      status: "found",
      order: {
        ...mapAdminReviewOrder(submission),
        contactPhoneMasked: maskPhone(stringValue(submission.contact_phone)),
        paymentStatusLabel: getPaymentStatusLabel(stringValue(submission.payment_status)),
        refundStatusLabel: getRefundStatusLabel(stringValue(submission.refund_status)),
        coupleDetails,
        music,
        media,
        timeline,
        letters,
      },
    };
  });

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

function mapAdminReviewOrder(row: Record<string, unknown>): StoryOfUsAdminReviewOrder {
  const status = stringValue(row.status) || "submitted";

  return {
    id: stringValue(row.id),
    orderReference: stringValue(row.order_reference),
    trackingCode: stringValue(row.tracking_code),
    customerName: stringValue(row.customer_name) || "İsimsiz müşteri",
    customerEmailMasked: maskEmail(stringValue(row.customer_email)),
    status,
    statusLabel: getStatusLabel(status),
    submittedAt: nullableString(row.submitted_at),
    editableUntil: nullableString(row.editable_until),
    reviewReadyAt: nullableString(row.review_ready_at),
    mediaCount: Array.isArray(row.storyofus_media) ? row.storyofus_media.length : 0,
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
    throw new Error(`StoryOfUs couple detail could not be loaded: ${error.message}`);
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

async function loadMusic(submissionId: string) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_music")
    .select("spotify_url, song_title, artist_name, start_at_seconds")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error(`StoryOfUs music could not be loaded: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    spotifyUrl: stringValue(data.spotify_url),
    songTitle: stringValue(data.song_title),
    artistName: stringValue(data.artist_name),
    startAtSeconds: numberValue(data.start_at_seconds),
  };
}

async function loadMedia(submissionId: string): Promise<StoryOfUsAdminReviewDetail["media"]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .select(
      "id, media_type, section, semantic_key, section_item_id, storage_path, original_filename, caption, sort_order, is_puzzle_source",
    )
    .eq("submission_id", submissionId)
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`StoryOfUs media could not be loaded: ${error.message}`);
  }

  return Promise.all(
    (data ?? []).map(async (media) => ({
      id: stringValue(media.id),
      mediaType: stringValue(media.media_type),
      section: stringValue(media.section),
      semanticKey: nullableString(media.semantic_key),
      sectionItemId: nullableString(media.section_item_id),
      originalFilename: stringValue(media.original_filename),
      caption: stringValue(media.caption),
      sortOrder: numberValue(media.sort_order),
      isPuzzleSource: media.is_puzzle_source === true,
      signedUrl: await createMediaSignedUrl(stringValue(media.storage_path)),
    })),
  );
}

async function loadTimeline(submissionId: string): Promise<StoryOfUsAdminReviewDetail["timeline"]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_timeline_items")
    .select("id, title, event_date, description, sort_order")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`StoryOfUs timeline could not be loaded: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: stringValue(item.id),
    title: stringValue(item.title),
    eventDate: nullableString(item.event_date),
    description: stringValue(item.description),
    sortOrder: numberValue(item.sort_order),
  }));
}

async function loadLetters(submissionId: string): Promise<StoryOfUsAdminReviewDetail["letters"]> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_letters")
    .select("id, letter_type, title, body, sort_order")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`StoryOfUs letters could not be loaded: ${error.message}`);
  }

  return (data ?? []).map((letter) => ({
    id: stringValue(letter.id),
    type: letter.letter_type === "love_letter" ? "love_letter" : "open_when",
    title: stringValue(letter.title),
    body: stringValue(letter.body),
    sortOrder: numberValue(letter.sort_order),
  }));
}

async function createMediaSignedUrl(storagePath: string) {
  if (!storagePath) {
    return "";
  }

  const { data, error } = await storyOfUsSupabaseAdmin.storage
    .from(STORYOFUS_MEDIA_BUCKET)
    .createSignedUrl(storagePath, 15 * 60);

  if (error) {
    return "";
  }

  return data.signedUrl ?? "";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Düzenleme süresi devam ediyor";
    case "in_review":
      return "İnceleme sırasında";
    case "published":
      return "Yayında";
    case "archived":
      return "Arşivlendi";
    default:
      return "Kontrol ediliyor";
  }
}

function getPaymentStatusLabel(paymentStatus: string) {
  return paymentStatus === "paid" ? "Ödeme onaylandı" : "Ödeme kontrol ediliyor";
}

function getRefundStatusLabel(refundStatus: string) {
  switch (refundStatus) {
    case "rejected":
      return "İade reddedildi";
    case "none":
    case "":
      return "İade yok";
    default:
      return "İade süreci var";
  }
}

function maskEmail(value: string) {
  const [name, domain] = value.split("@");

  if (!name || !domain) {
    return "";
  }

  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length < 4) {
    return "";
  }

  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
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
