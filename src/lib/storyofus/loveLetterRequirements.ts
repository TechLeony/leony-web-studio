export const STORYOFUS_LOVE_LETTER_PHOTO_SECTION = "letter";
export const STORYOFUS_LOVE_LETTER_PHOTO_SEMANTIC_KEY = "love_letter_side_photo";
export const STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID = "loveLetterPhoto";

type DurableMediaMetadata = {
  mediaId?: string | null;
  storagePath?: string | null;
};

type LoveLetterMediaRow = {
  section?: string | null;
  semanticKey?: string | null;
  sectionItemId?: string | null;
  storagePath?: string | null;
};

export function hasDurableLoveLetterPhotoMetadata(photo: DurableMediaMetadata | null | undefined) {
  return Boolean(photo?.mediaId?.trim() && photo.storagePath?.trim());
}

export function isRequiredLoveLetterPhotoMediaRow(row: LoveLetterMediaRow | null | undefined) {
  return Boolean(
    row &&
    row.section === STORYOFUS_LOVE_LETTER_PHOTO_SECTION &&
    row.semanticKey === STORYOFUS_LOVE_LETTER_PHOTO_SEMANTIC_KEY &&
    row.sectionItemId === STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID &&
    row.storagePath?.trim(),
  );
}

export function getLoveLetterPhotoSubmitError(photo: DurableMediaMetadata | null | undefined) {
  return hasDurableLoveLetterPhotoMetadata(photo)
    ? null
    : "Kalbimden sana bölümünde kullanılacak fotoğraf zorunlu.";
}

export function getLoveLetterPhotoPublishError(hasRequiredLoveLetterPhoto: boolean) {
  return hasRequiredLoveLetterPhoto
    ? null
    : "Bu sipariş final site için gerekli mektup fotoğrafı tamamlanmadan yayınlanamaz.";
}
