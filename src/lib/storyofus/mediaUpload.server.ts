import { createServerFn } from "@tanstack/react-start";

import { isStoryOfUsActiveRefundStatus } from "./refundEligibility.server";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

const STORYOFUS_MEDIA_BUCKET = "storyofus-media";
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = 30 * 1024 * 1024;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/aac",
  "audio/m4a",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-aac",
  "audio/x-m4a",
]);

type StoryOfUsMediaSection =
  | "opening"
  | "memory_prompt"
  | "gallery"
  | "timeline"
  | "letter"
  | "puzzle"
  | "voice_note";

type UploadMediaResult = {
  mediaId: string;
  previewUrl: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

type RemoveMediaResult = {
  removed: boolean;
};

export const uploadStoryOfUsSetupMedia = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("StoryOfUs media upload must be sent as FormData.");
    }

    return data;
  })
  .handler(async ({ data }): Promise<UploadMediaResult> => {
    const setupToken = getString(data, "setupToken");
    const section = normalizeSection(getString(data, "section"));
    const mediaType = normalizeMediaType(getString(data, "mediaType"));
    const semanticKey = normalizeSemanticValue(getString(data, "semanticKey"), "media");
    const sectionItemId = normalizeSemanticValue(getString(data, "sectionItemId"), "item");
    const caption = getString(data, "caption");
    const sortOrder = normalizeSortOrder(getString(data, "sortOrder"));
    const file = getFileFromFormData(data, "file");

    if (!file) {
      throw new Error("Yüklenecek dosya bulunamadı.");
    }

    validateFileForMedia(mediaType, file);

    const submission = await loadEditableSubmission(setupToken);
    const storagePath = `submissions/${submission.id}/${getStorageFolder(section)}/${createSafeStorageFileName(
      file.name,
    )}`;

    await uploadFileToStorage(storagePath, file);

    const previousRows = await loadExistingSemanticRows(
      submission.id,
      section,
      semanticKey,
      sectionItemId,
    );

    const { data: insertedMedia, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_media")
      .insert({
        submission_id: submission.id,
        media_type: mediaType,
        section,
        semantic_key: semanticKey,
        section_item_id: sectionItemId,
        storage_bucket: STORYOFUS_MEDIA_BUCKET,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: normalizeStoredMimeType(mediaType, file.type),
        size_bytes: file.size,
        caption: caption.trim() || null,
        sort_order: sortOrder,
        is_puzzle_source: section === "puzzle" || (section === "gallery" && semanticKey === "puzzle_source"),
      })
      .select("id, storage_path, original_filename, mime_type, size_bytes")
      .single();

    if (error || !insertedMedia) {
      await removeStorageObject(storagePath);
      throw new Error(`StoryOfUs media metadata could not be saved: ${error?.message}`);
    }

    await deleteMediaRowsByIds(previousRows.map((row) => row.id));
    await Promise.all(previousRows.map((row) => removeStorageObject(row.storage_path)));

    const previewUrl = await createMediaSignedUrl(String(insertedMedia.storage_path));

    return {
      mediaId: String(insertedMedia.id),
      previewUrl,
      storagePath: String(insertedMedia.storage_path),
      originalFilename: String(insertedMedia.original_filename ?? file.name),
      mimeType: String(insertedMedia.mime_type ?? file.type),
      sizeBytes: Number(insertedMedia.size_bytes ?? file.size),
    };
  });

export const removeStoryOfUsSetupMedia = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") {
      return {
        setupToken: "",
        section: "",
        semanticKey: "",
        sectionItemId: "",
      };
    }

    const input = data as Record<string, unknown>;

    return {
      setupToken: typeof input.setupToken === "string" ? input.setupToken.trim() : "",
      section: typeof input.section === "string" ? input.section.trim() : "",
      semanticKey: typeof input.semanticKey === "string" ? input.semanticKey.trim() : "",
      sectionItemId: typeof input.sectionItemId === "string" ? input.sectionItemId.trim() : "",
    };
  })
  .handler(async ({ data }): Promise<RemoveMediaResult> => {
    const section = normalizeSection(data.section);
    const semanticKey = normalizeSemanticValue(data.semanticKey, "media");
    const sectionItemId = normalizeSemanticValue(data.sectionItemId, "item");
    const submission = await loadEditableSubmission(data.setupToken);
    const previousRows = await loadExistingSemanticRows(
      submission.id,
      section,
      semanticKey,
      sectionItemId,
    );

    await deleteMediaRowsByIds(previousRows.map((row) => row.id));
    await Promise.all(previousRows.map((row) => removeStorageObject(row.storage_path)));

    return {
      removed: previousRows.length > 0,
    };
  });

async function loadEditableSubmission(setupToken: string) {
  if (!setupToken) {
    throw new Error("Kurulum bağlantısı doğrulanamadı.");
  }

  const { data: submission, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select("id, status, payment_status, refund_status, submitted_at, editable_until")
    .eq("setup_token", setupToken)
    .maybeSingle();

  if (error) {
    throw new Error(`StoryOfUs setup access could not be checked: ${error.message}`);
  }

  if (!submission) {
    throw new Error("Kurulum bağlantısı bulunamadı.");
  }

  if (submission.payment_status !== "paid") {
    throw new Error("Kurulum formu ödeme onayından sonra aktiftir.");
  }

  if (isStoryOfUsActiveRefundStatus(typeof submission.refund_status === "string" ? submission.refund_status : null)) {
    throw new Error("Bu sipariş için kurulum formu geçici olarak kapalıdır.");
  }

  const status = typeof submission.status === "string" ? submission.status : "draft";
  const editableUntil = getEffectiveEditableUntil(
    typeof submission.editable_until === "string" ? submission.editable_until : null,
    typeof submission.submitted_at === "string" ? submission.submitted_at : null,
  );
  const canEdit =
    status === "draft" ||
    (status === "submitted" &&
      Boolean(editableUntil) &&
      new Date(editableUntil as string).getTime() > Date.now());

  if (!canEdit) {
    throw new Error("Bu kurulum formu artık düzenlenemez.");
  }

  return {
    id: String(submission.id),
  };
}

async function loadExistingSemanticRows(
  submissionId: string,
  section: StoryOfUsMediaSection,
  semanticKey: string,
  sectionItemId: string,
) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_media")
    .select("id, storage_path")
    .eq("submission_id", submissionId)
    .eq("section", section)
    .eq("semantic_key", semanticKey)
    .eq("section_item_id", sectionItemId);

  if (error) {
    throw new Error(`StoryOfUs existing media could not be checked: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    storage_path: String(row.storage_path ?? ""),
  }));
}

async function deleteMediaRowsByIds(ids: string[]) {
  if (ids.length === 0) {
    return;
  }

  const { error } = await storyOfUsSupabaseAdmin.from("storyofus_media").delete().in("id", ids);

  if (error) {
    throw new Error(`StoryOfUs media metadata could not be removed: ${error.message}`);
  }
}

async function uploadFileToStorage(storagePath: string, file: File) {
  const { error } = await storyOfUsSupabaseAdmin.storage
    .from(STORYOFUS_MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: normalizeStoredMimeTypeFromFile(file) || undefined,
      upsert: false,
    });

  if (error) {
    throw new Error(`StoryOfUs media upload failed: ${error.message}`);
  }
}

async function removeStorageObject(storagePath: string) {
  if (!storagePath) {
    return;
  }

  await storyOfUsSupabaseAdmin.storage.from(STORYOFUS_MEDIA_BUCKET).remove([storagePath]);
}

async function createMediaSignedUrl(storagePath: string) {
  const { data, error } = await storyOfUsSupabaseAdmin.storage
    .from(STORYOFUS_MEDIA_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    return "";
  }

  return data.signedUrl ?? "";
}

function validateFileForMedia(mediaType: "photo" | "puzzle_photo" | "voice_note", file: File) {
  if ((mediaType === "photo" || mediaType === "puzzle_photo") && !isAllowedImageType(file.type)) {
    throw new Error("Yalnızca JPG, PNG, WebP, HEIC veya HEIF fotoğraf yükleyebilirsiniz.");
  }

  if (mediaType === "voice_note" && !isAllowedAudioType(file.type)) {
    throw new Error("Yalnızca geçerli bir ses dosyası yükleyebilirsiniz.");
  }

  const maxSize = mediaType === "voice_note" ? MAX_AUDIO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  if (file.size > maxSize) {
    throw new Error(
      mediaType === "voice_note"
        ? "Ses dosyası en fazla 30 MB olabilir."
        : "Fotoğraf en fazla 15 MB olabilir.",
    );
  }
}

function isAllowedImageType(mimeType: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(mimeType);
}

function isAllowedAudioType(mimeType: string) {
  return ALLOWED_AUDIO_MIME_TYPES.has(mimeType.toLowerCase());
}

function normalizeStoredMimeType(
  mediaType: "photo" | "puzzle_photo" | "voice_note",
  mimeType: string,
) {
  if (mediaType !== "voice_note") {
    return mimeType;
  }

  return normalizeAudioMimeType(mimeType);
}

function normalizeStoredMimeTypeFromFile(file: File) {
  return normalizeAudioMimeType(file.type) || file.type;
}

function normalizeAudioMimeType(mimeType: string) {
  const normalized = mimeType.toLowerCase();

  if (
    normalized === "audio/x-m4a" ||
    normalized === "audio/m4a" ||
    normalized === "audio/aac" ||
    normalized === "audio/x-aac"
  ) {
    return "audio/mp4";
  }

  return normalized;
}

function normalizeSection(value: string): StoryOfUsMediaSection {
  const allowed = [
    "opening",
    "memory_prompt",
    "gallery",
    "timeline",
    "letter",
    "puzzle",
    "voice_note",
  ] as const;

  if ((allowed as readonly string[]).includes(value)) {
    return value as StoryOfUsMediaSection;
  }

  throw new Error("Geçersiz medya bölümü.");
}

function normalizeMediaType(value: string): "photo" | "puzzle_photo" | "voice_note" {
  if (value === "photo" || value === "puzzle_photo" || value === "voice_note") {
    return value;
  }

  throw new Error("Geçersiz medya tipi.");
}

function normalizeSemanticValue(value: string, fallback: string) {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || fallback;
}

function normalizeSortOrder(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1000, Math.trunc(parsed))) : 0;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getFileFromFormData(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (!value || typeof value === "string" || typeof (value as File).arrayBuffer !== "function") {
    return null;
  }

  return value as File;
}

function getStorageFolder(section: StoryOfUsMediaSection) {
  switch (section) {
    case "opening":
      return "opening";
    case "memory_prompt":
      return "memory-prompts";
    case "timeline":
      return "timeline";
    case "letter":
      return "letter";
    case "puzzle":
      return "puzzle";
    case "voice_note":
      return "voice-note";
    case "gallery":
    default:
      return "photos";
  }
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
