import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STORYOFUS_LOVE_LETTER_PHOTO_SECTION,
  STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID,
  STORYOFUS_LOVE_LETTER_PHOTO_SEMANTIC_KEY,
  getLoveLetterPhotoPublishError,
  getLoveLetterPhotoSubmitError,
  hasDurableLoveLetterPhotoMetadata,
  isRequiredLoveLetterPhotoMediaRow,
} from "./loveLetterRequirements.ts";

describe("StoryOfUs love-letter photo requirements", () => {
  it("requires durable uploaded media metadata before setup submission", () => {
    assert.equal(hasDurableLoveLetterPhotoMetadata(null), false);
    assert.equal(
      getLoveLetterPhotoSubmitError(null),
      "Kalbimden sana bölümünde kullanılacak fotoğraf zorunlu.",
    );
    assert.equal(
      getLoveLetterPhotoSubmitError({
        mediaId: "media-id",
        storagePath: "submissions/test/letter/photo.webp",
      }),
      null,
    );
  });

  it("rejects incomplete love-letter photo metadata", () => {
    assert.equal(hasDurableLoveLetterPhotoMetadata({ mediaId: "media-id" }), false);
    assert.equal(hasDurableLoveLetterPhotoMetadata({ storagePath: "path/photo.webp" }), false);
    assert.equal(
      hasDurableLoveLetterPhotoMetadata({ mediaId: " ", storagePath: "path/photo.webp" }),
      false,
    );
  });

  it("recognizes only the required love-letter semantic media row", () => {
    assert.equal(
      isRequiredLoveLetterPhotoMediaRow({
        section: STORYOFUS_LOVE_LETTER_PHOTO_SECTION,
        semanticKey: STORYOFUS_LOVE_LETTER_PHOTO_SEMANTIC_KEY,
        sectionItemId: STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID,
        storagePath: "submissions/test/letter/photo.webp",
      }),
      true,
    );
    assert.equal(
      isRequiredLoveLetterPhotoMediaRow({
        section: STORYOFUS_LOVE_LETTER_PHOTO_SECTION,
        semanticKey: "demo_fixture_photo",
        sectionItemId: STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID,
        storagePath: "submissions/test/letter/photo.webp",
      }),
      false,
    );
    assert.equal(
      isRequiredLoveLetterPhotoMediaRow({
        section: STORYOFUS_LOVE_LETTER_PHOTO_SECTION,
        semanticKey: STORYOFUS_LOVE_LETTER_PHOTO_SEMANTIC_KEY,
        sectionItemId: STORYOFUS_LOVE_LETTER_PHOTO_SECTION_ITEM_ID,
        storagePath: "",
      }),
      false,
    );
  });

  it("blocks publishing without the required love-letter photo", () => {
    assert.equal(
      getLoveLetterPhotoPublishError(false),
      "Bu sipariş final site için gerekli mektup fotoğrafı tamamlanmadan yayınlanamaz.",
    );
    assert.equal(getLoveLetterPhotoPublishError(true), null);
  });
});
