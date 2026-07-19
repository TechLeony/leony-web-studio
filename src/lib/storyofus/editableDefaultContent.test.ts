import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
  STORYOFUS_DEFAULT_LOVE_LETTER_TITLE,
} from "./stableContentDefaults.ts";
import {
  createDefaultLoveLetterItem,
  ensureLoveLetterDefaults,
  getLoveLetterDefaultContentSubmitError,
  getNextEditableDefaultContentState,
  getPendingEditableDefaultConfirmation,
  recordDefaultContentAccepted,
  removeEditableDefaultContentState,
  restoreEditableDefaultContent,
} from "./editableDefaultContent.ts";
import type { StoryOfUsEditableDefaultContentState, StoryOfUsLetterItem } from "./setupTypes.ts";

function loveLetter(overrides: Partial<StoryOfUsLetterItem> = {}): StoryOfUsLetterItem {
  return {
    id: "love-letter",
    type: "love_letter",
    title: STORYOFUS_DEFAULT_LOVE_LETTER_TITLE,
    body: STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
    sortOrder: 0,
    ...overrides,
  };
}

describe("editable default content helpers", () => {
  it("loads stable default love-letter text into the editable item", () => {
    const [letter] = ensureLoveLetterDefaults([], () => "generated-love-letter");

    assert.equal(letter?.id, "generated-love-letter");
    assert.equal(letter?.type, "love_letter");
    assert.equal(letter?.title, STORYOFUS_DEFAULT_LOVE_LETTER_TITLE);
    assert.equal(letter?.body, STORYOFUS_DEFAULT_LOVE_LETTER_BODY);
  });

  it("shows a default-content confirmation when unchanged text has not been accepted", () => {
    const confirmation = getPendingEditableDefaultConfirmation("letters", [loveLetter()], {});

    assert.equal(confirmation?.contentId, "loveLetterBody");
    assert.match(confirmation?.preview ?? "", /^Bazen sana baktığımda/);
  });

  it("records default acceptance and does not warn repeatedly after confirmation", () => {
    const state = recordDefaultContentAccepted({}, "loveLetterBody", "2026-07-20T10:00:00.000Z");

    assert.deepEqual(state, {
      loveLetterBody: {
        outcome: "default_accepted",
        confirmedAt: "2026-07-20T10:00:00.000Z",
      },
    });
    assert.equal(getPendingEditableDefaultConfirmation("letters", [loveLetter()], state), null);
    assert.equal(getLoveLetterDefaultContentSubmitError([loveLetter()], state), null);
  });

  it("marks customized content and does not show the unchanged-default warning", () => {
    const state = getNextEditableDefaultContentState(
      {},
      "loveLetterBody",
      "Benim yazdığım özel mektup.",
      STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
    );
    const letters = [loveLetter({ body: "Benim yazdığım özel mektup." })];

    assert.deepEqual(state, {
      loveLetterBody: {
        outcome: "customized",
      },
    });
    assert.equal(getPendingEditableDefaultConfirmation("letters", letters, state), null);
    assert.equal(getLoveLetterDefaultContentSubmitError(letters, state), null);
  });

  it("blocks cleared love-letter text and allows restoring the default state", () => {
    const clearedLetters = [loveLetter({ body: "  " })];

    assert.equal(
      getLoveLetterDefaultContentSubmitError(clearedLetters, {}),
      "Kalbimden sana metni boş bırakılamaz.",
    );

    const restoredLetters = [createDefaultLoveLetterItem("restored-love-letter")];
    assert.ok(getPendingEditableDefaultConfirmation("letters", restoredLetters, {}));
    assert.equal(
      getLoveLetterDefaultContentSubmitError(restoredLetters, {}),
      "Varsayılan aşk mektubu metni için onay gerekiyor.",
    );
  });

  it("changing text after default confirmation resets the accepted outcome", () => {
    const accepted = recordDefaultContentAccepted({}, "loveLetterBody", "2026-07-20T10:00:00.000Z");
    const customized = getNextEditableDefaultContentState(
      accepted,
      "loveLetterBody",
      "Yeni özel metin.",
      STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
    );
    const resetToDefault = getNextEditableDefaultContentState(
      customized,
      "loveLetterBody",
      STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
      STORYOFUS_DEFAULT_LOVE_LETTER_BODY,
    );

    assert.deepEqual(customized, {
      loveLetterBody: {
        outcome: "customized",
      },
    });
    assert.deepEqual(resetToDefault, {});
    assert.ok(getPendingEditableDefaultConfirmation("letters", [loveLetter()], resetToDefault));
  });

  it("restores default-accepted versus customized outcomes from saved draft data", () => {
    const defaultAccepted = restoreEditableDefaultContent(
      {
        loveLetterBody: {
          outcome: "default_accepted",
          confirmedAt: "2026-07-20T10:00:00.000Z",
        },
      },
      [loveLetter()],
    );
    const customized = restoreEditableDefaultContent(
      {
        loveLetterBody: {
          outcome: "customized",
        },
      },
      [loveLetter({ body: "Müşterinin kendi mektubu." })],
    );

    assert.equal(defaultAccepted.loveLetterBody?.outcome, "default_accepted");
    assert.equal(defaultAccepted.loveLetterBody?.confirmedAt, "2026-07-20T10:00:00.000Z");
    assert.equal(customized.loveLetterBody?.outcome, "customized");
  });

  it("does not infer default acceptance only because text equals the default", () => {
    const restored = restoreEditableDefaultContent(undefined, [
      loveLetter({ body: STORYOFUS_DEFAULT_LOVE_LETTER_BODY }),
    ]);

    assert.deepEqual(restored, {});
    assert.equal(
      getLoveLetterDefaultContentSubmitError([loveLetter()], restored),
      "Varsayılan aşk mektubu metni için onay gerekiyor.",
    );
  });

  it("keeps required photo enforcement independent from text outcome state", () => {
    const state: StoryOfUsEditableDefaultContentState = recordDefaultContentAccepted(
      {},
      "loveLetterBody",
      "2026-07-20T10:00:00.000Z",
    );

    assert.equal(getLoveLetterDefaultContentSubmitError([loveLetter()], state), null);
    assert.deepEqual(removeEditableDefaultContentState(state, "loveLetterBody"), {});
  });
});
