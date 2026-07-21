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
  "opening" | "memory_prompt" | "gallery" | "timeline" | "letter" | "puzzle" | "voice_note";

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

    let committedMedia: CommittedMediaUploadRow;

    try {
      committedMedia = await commitUploadedMediaWithLockedRpc({
        setupToken,
        mediaType,
        section,
        semanticKey,
        sectionItemId,
        storagePath,
        originalFilename: file.name,
        mimeType: normalizeStoredMimeType(mediaType, file.type),
        sizeBytes: file.size,
        caption,
        sortOrder,
      });
    } catch {
      await cleanupNewlyUploadedObject(storagePath, "uploaded_object_cleanup_failed_after_rpc");
      throw new Error("Medya yükleme tamamlanamadı. Lütfen tekrar deneyin.");
    }

    if (committedMedia.result !== "committed") {
      await cleanupNewlyUploadedObject(
        storagePath,
        "uploaded_object_cleanup_failed_after_closed_edit",
      );
      throw new Error("Bu kurulum formu artık düzenlenemez.");
    }

    await Promise.all(committedMedia.replacedStoragePaths.map((path) => removeStorageObject(path)));

    const previewUrl = await createMediaSignedUrl(committedMedia.storagePath);

    return {
      mediaId: committedMedia.mediaId,
      previewUrl,
      storagePath: committedMedia.storagePath,
      originalFilename: committedMedia.originalFilename || file.name,
      mimeType: committedMedia.mimeType || file.type,
      sizeBytes: committedMedia.sizeBytes || file.size,
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
    await loadEditableSubmission(data.setupToken);
    const removal = await removeMediaWithLockedRpc({
      setupToken: data.setupToken,
      section,
      semanticKey,
      sectionItemId,
    });

    if (removal.result !== "removed") {
      throw new Error("Bu kurulum formu artık düzenlenemez.");
    }

    await Promise.all(removal.removedStoragePaths.map((path) => removeStorageObject(path)));

    return {
      removed: removal.removedCount > 0,
    };
  });

type CommittedMediaUploadRow = {
  result: "committed" | "edit_closed";
  mediaId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  replacedStoragePaths: string[];
};

type RemovedMediaRow = {
  result: "removed" | "edit_closed";
  removedCount: number;
  removedStoragePaths: string[];
};

async function loadEditableSubmission(setupToken: string) {
  if (!setupToken) {
    throw new Error("Kurulum bağlantısı doğrulanamadı.");
  }

  const { data: submission, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select(
      "id, status, payment_status, refund_status, submitted_at, editable_until, edits_used, edit_limit, editing_closed_at",
    )
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

  if (
    isStoryOfUsActiveRefundStatus(
      typeof submission.refund_status === "string" ? submission.refund_status : null,
    )
  ) {
    throw new Error("Bu sipariş için kurulum formu geçici olarak kapalıdır.");
  }

  const status = typeof submission.status === "string" ? submission.status : "draft";
  const editableUntil = getEffectiveEditableUntil(
    typeof submission.editable_until === "string" ? submission.editable_until : null,
    typeof submission.submitted_at === "string" ? submission.submitted_at : null,
  );
  const editsUsed = numberValue(submission.edits_used);
  const editLimit = Math.max(numberValue(submission.edit_limit), 1);
  const editingClosedAt =
    typeof submission.editing_closed_at === "string" ? submission.editing_closed_at : null;
  const canEdit =
    status === "draft" ||
    (status === "submitted" &&
      Boolean(editableUntil) &&
      new Date(editableUntil as string).getTime() > Date.now() &&
      editsUsed < editLimit &&
      !editingClosedAt);

  if (!canEdit) {
    throw new Error("Bu kurulum formu artık düzenlenemez.");
  }

  return {
    id: String(submission.id),
  };
}

async function commitUploadedMediaWithLockedRpc({
  setupToken,
  mediaType,
  section,
  semanticKey,
  sectionItemId,
  storagePath,
  originalFilename,
  mimeType,
  sizeBytes,
  caption,
  sortOrder,
}: {
  setupToken: string;
  mediaType: "photo" | "puzzle_photo" | "voice_note";
  section: StoryOfUsMediaSection;
  semanticKey: string;
  sectionItemId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  caption: string;
  sortOrder: number;
}): Promise<CommittedMediaUploadRow> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .rpc("storyofus_commit_setup_media_upload", {
      p_setup_token: setupToken,
      p_media_type: mediaType,
      p_section: section,
      p_semantic_key: semanticKey,
      p_section_item_id: sectionItemId,
      p_storage_bucket: STORYOFUS_MEDIA_BUCKET,
      p_storage_path: storagePath,
      p_original_filename: originalFilename,
      p_mime_type: mimeType,
      p_size_bytes: sizeBytes,
      p_caption: caption,
      p_sort_order: sortOrder,
    })
    .single();

  if (error) {
    throw new Error("Medya yükleme tamamlanamadı. Lütfen tekrar deneyin.");
  }

  return normalizeCommittedMediaUploadRow(data);
}

async function removeMediaWithLockedRpc({
  setupToken,
  section,
  semanticKey,
  sectionItemId,
}: {
  setupToken: string;
  section: StoryOfUsMediaSection;
  semanticKey: string;
  sectionItemId: string;
}): Promise<RemovedMediaRow> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .rpc("storyofus_remove_setup_media", {
      p_setup_token: setupToken,
      p_section: section,
      p_semantic_key: semanticKey,
      p_section_item_id: sectionItemId,
    })
    .single();

  if (error) {
    throw new Error("Medya kaldırma işlemi tamamlanamadı. Lütfen tekrar deneyin.");
  }

  return normalizeRemovedMediaRow(data);
}

function normalizeCommittedMediaUploadRow(data: unknown): CommittedMediaUploadRow {
  const row = normalizeRpcRow(data);
  const result = row.result === "committed" ? "committed" : "edit_closed";

  return {
    result,
    mediaId: String(row.media_id ?? ""),
    storagePath: String(row.storage_path ?? ""),
    originalFilename: String(row.original_filename ?? ""),
    mimeType: String(row.mime_type ?? ""),
    sizeBytes: Number(row.size_bytes ?? 0),
    replacedStoragePaths: normalizeStoragePathArray(row.replaced_storage_paths),
  };
}

function normalizeRemovedMediaRow(data: unknown): RemovedMediaRow {
  const row = normalizeRpcRow(data);
  const result = row.result === "removed" ? "removed" : "edit_closed";

  return {
    result,
    removedCount: Number(row.removed_count ?? 0),
    removedStoragePaths: normalizeStoragePathArray(row.removed_storage_paths),
  };
}

function normalizeRpcRow(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return {};
  }

  return data as Record<string, unknown>;
}

function normalizeStoragePathArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((path): path is string => typeof path === "string" && path.length > 0)
    : [];
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

async function cleanupNewlyUploadedObject(storagePath: string, failureCode: string) {
  if (!storagePath) {
    return;
  }

  const { error } = await storyOfUsSupabaseAdmin.storage
    .from(STORYOFUS_MEDIA_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("[StoryOfUs media cleanup]", { code: failureCode });
    throw new Error("Medya yükleme tamamlanamadı. Lütfen tekrar deneyin.");
  }
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

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
