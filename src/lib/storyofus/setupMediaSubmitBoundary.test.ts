import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import {
  STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE,
  StoryOfUsDurableMediaSubmitError,
  assertNoSubmitTimeMediaFiles,
  collectStoryOfUsSubmitMediaRequirements,
  validateStoryOfUsSubmitMediaRows,
  type StoryOfUsSubmitMediaRow,
} from "./setupMediaSubmitBoundary.ts";

const durableRowDefaults = {
  storageBucket: "storyofus-media",
  storagePath: "submissions/submission-id/gallery/photo.webp",
};

describe("StoryOfUs durable media submit boundary", () => {
  it("rejects non-empty files in final submission FormData", () => {
    const formData = new FormData();
    formData.append("payload", "{}");
    formData.append("photoFile:local", new File(["image"], "photo.png", { type: "image/png" }));

    assert.throws(() => assertNoSubmitTimeMediaFiles(formData), {
      message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE,
      name: "StoryOfUsDurableMediaSubmitError",
    });
  });

  it("allows JSON-only final submissions and ignores empty browser file placeholders", () => {
    const formData = new FormData();
    formData.append("payload", "{}");
    formData.append("emptyFile", new File([], "", { type: "application/octet-stream" }));

    assert.doesNotThrow(() => assertNoSubmitTimeMediaFiles(formData));
  });

  it("collects durable media requirements for every supported final-site destination", () => {
    const requirements = collectStoryOfUsSubmitMediaRequirements({
      media: {
        openingPhotos: {
          firstPerson: { mediaId: "hero-left" },
          secondPerson: { mediaId: "hero-right" },
        },
        promptPhotos: [{ id: "prompt-cute", photo: { mediaId: "prompt-photo" } }],
        photos: [
          {
            id: "gallery-one",
            mediaId: "gallery-photo",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
          },
        ],
        puzzle: {
          sourceType: "separate",
          puzzlePhoto: { mediaId: "puzzle-photo" },
        },
        loveLetterPhoto: { mediaId: "love-letter-photo" },
      },
      musicVoice: {
        voiceNote: { mediaId: "voice-note" },
      },
      timeline: [{ id: "timeline-one", photo: { mediaId: "timeline-photo" } }],
      confirmedSkips: {},
    });

    assert.deepEqual(
      requirements.map((requirement) => ({
        mediaId: requirement.mediaId,
        section: requirement.section,
        semanticKey: requirement.semanticKey,
        sectionItemId: requirement.sectionItemId,
        mediaType: requirement.mediaType,
      })),
      [
        {
          mediaId: "hero-left",
          section: "opening",
          semanticKey: "hero_left",
          sectionItemId: "firstPerson",
          mediaType: "photo",
        },
        {
          mediaId: "hero-right",
          section: "opening",
          semanticKey: "hero_right",
          sectionItemId: "secondPerson",
          mediaType: "photo",
        },
        {
          mediaId: "prompt-photo",
          section: "memory_prompt",
          semanticKey: "prompt-cute",
          sectionItemId: "prompt-cute",
          mediaType: "photo",
        },
        {
          mediaId: "gallery-photo",
          section: "gallery",
          semanticKey: "gallery_photo",
          sectionItemId: "gallery-one",
          mediaType: "photo",
        },
        {
          mediaId: "puzzle-photo",
          section: "puzzle",
          semanticKey: "puzzle_source",
          sectionItemId: "puzzlePhoto",
          mediaType: "puzzle_photo",
        },
        {
          mediaId: "love-letter-photo",
          section: "letter",
          semanticKey: "love_letter_side_photo",
          sectionItemId: "loveLetterPhoto",
          mediaType: "photo",
        },
        {
          mediaId: "timeline-photo",
          section: "timeline",
          semanticKey: "timeline_item",
          sectionItemId: "timeline-one",
          mediaType: "photo",
        },
        {
          mediaId: "voice-note",
          section: "voice_note",
          semanticKey: "voice_note",
          sectionItemId: "voiceNote",
          mediaType: "voice_note",
        },
      ],
    );
  });

  it("accepts a valid submitted gallery photo selected as the puzzle source", () => {
    const requirements = collectStoryOfUsSubmitMediaRequirements({
      media: {
        photos: [
          {
            id: "gallery-one",
            mediaId: "gallery-media-id",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
          },
        ],
        puzzle: {
          sourceType: "gallery",
          selectedPhotoId: "gallery-one",
        },
      },
    });

    assert.deepEqual(
      requirements.map((requirement) => ({
        mediaId: requirement.mediaId,
        section: requirement.section,
        semanticKey: requirement.semanticKey,
        sectionItemId: requirement.sectionItemId,
        mediaType: requirement.mediaType,
      })),
      [
        {
          mediaId: "gallery-media-id",
          section: "gallery",
          semanticKey: "gallery_photo",
          sectionItemId: "gallery-one",
          mediaType: "photo",
        },
      ],
    );

    assert.doesNotThrow(() =>
      validateStoryOfUsSubmitMediaRows(requirements, [
        createMediaRow({
          id: "gallery-media-id",
          section: "gallery",
          semanticKey: "gallery_photo",
          sectionItemId: "gallery-one",
          mediaType: "photo",
        }),
      ]),
    );
  });

  it("rejects gallery puzzle mode without a selected gallery photo id", () => {
    assert.throws(
      () =>
        collectStoryOfUsSubmitMediaRequirements({
          media: {
            photos: [
              {
                id: "gallery-one",
                mediaId: "gallery-media-id",
                semanticKey: "gallery_photo",
                sectionItemId: "gallery-one",
              },
            ],
            puzzle: {
              sourceType: "gallery",
              selectedPhotoId: "",
            },
          },
        }),
      StoryOfUsDurableMediaSubmitError,
    );
  });

  it("rejects nonexistent or removed gallery puzzle selections before DB validation", () => {
    assert.throws(
      () =>
        collectStoryOfUsSubmitMediaRequirements({
          media: {
            photos: [
              {
                id: "gallery-one",
                mediaId: "gallery-media-id",
                semanticKey: "gallery_photo",
                sectionItemId: "gallery-one",
              },
            ],
            puzzle: {
              sourceType: "gallery",
              selectedPhotoId: "removed-gallery-photo",
            },
          },
        }),
      StoryOfUsDurableMediaSubmitError,
    );

    assert.throws(
      () =>
        collectStoryOfUsSubmitMediaRequirements({
          media: {
            photos: [],
            puzzle: {
              sourceType: "gallery",
              selectedPhotoId: "gallery-one",
            },
          },
        }),
      StoryOfUsDurableMediaSubmitError,
    );
  });

  it("rejects a gallery puzzle row that is missing, cross-submission, wrong-section, or wrong-type", () => {
    const requirements = collectStoryOfUsSubmitMediaRequirements({
      media: {
        photos: [
          {
            id: "gallery-one",
            mediaId: "gallery-media-id",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
          },
        ],
        puzzle: {
          sourceType: "gallery",
          selectedPhotoId: "gallery-one",
        },
      },
    });

    assert.throws(() => validateStoryOfUsSubmitMediaRows(requirements, []), {
      message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE,
    });

    assert.throws(
      () =>
        validateStoryOfUsSubmitMediaRows(requirements, [
          createMediaRow({
            id: "other-submission-media-id",
            section: "gallery",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
            mediaType: "photo",
          }),
        ]),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );

    assert.throws(
      () =>
        validateStoryOfUsSubmitMediaRows(requirements, [
          createMediaRow({
            id: "gallery-media-id",
            section: "timeline",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
            mediaType: "photo",
          }),
        ]),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );

    assert.throws(
      () =>
        validateStoryOfUsSubmitMediaRows(requirements, [
          createMediaRow({
            id: "gallery-media-id",
            section: "gallery",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
            mediaType: "puzzle_photo",
          }),
        ]),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );
  });

  it("rejects a DB gallery row that was not included in the submitted gallery payload", () => {
    assert.throws(
      () =>
        collectStoryOfUsSubmitMediaRequirements({
          media: {
            photos: [
              {
                id: "gallery-one",
                mediaId: "gallery-one-media-id",
                semanticKey: "gallery_photo",
                sectionItemId: "gallery-one",
              },
            ],
            puzzle: {
              sourceType: "gallery",
              selectedPhotoId: "gallery-two",
            },
          },
        }),
      StoryOfUsDurableMediaSubmitError,
    );
  });

  it("does not require media for confirmed skipped optional sections", () => {
    const requirements = collectStoryOfUsSubmitMediaRequirements({
      media: {
        photos: [{ id: "gallery-one", mediaId: "gallery-photo" }],
        puzzle: {
          sourceType: "separate",
          puzzlePhoto: { mediaId: "puzzle-photo" },
        },
      },
      musicVoice: {
        voiceNote: { mediaId: "voice-note" },
      },
      confirmedSkips: {
        photos: { confirmed: true },
        puzzle: { confirmed: true },
        voiceNote: { confirmed: true },
      },
    });

    assert.deepEqual(requirements, []);
  });

  it("rejects local-only or unsafe client media metadata", () => {
    assert.throws(
      () =>
        collectStoryOfUsSubmitMediaRequirements({
          media: {
            loveLetterPhoto: { storagePath: "blob:http://localhost/photo" },
          },
        }),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );

    assert.throws(
      () =>
        collectStoryOfUsSubmitMediaRequirements({
          media: {
            loveLetterPhoto: { storagePath: "submissions/test/letter/photo.webp" },
          },
        }),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );
  });

  it("accepts only rows that match the exact expected durable destination", () => {
    const requirements = collectStoryOfUsSubmitMediaRequirements({
      media: {
        loveLetterPhoto: { mediaId: "love-letter-photo" },
      },
    });
    const rows: StoryOfUsSubmitMediaRow[] = [
      createMediaRow({
        id: "love-letter-photo",
        section: "letter",
        semanticKey: "love_letter_side_photo",
        sectionItemId: "loveLetterPhoto",
        mediaType: "photo",
      }),
    ];

    assert.doesNotThrow(() => validateStoryOfUsSubmitMediaRows(requirements, rows));

    assert.throws(
      () =>
        validateStoryOfUsSubmitMediaRows(requirements, [
          { ...rows[0], sectionItemId: "otherLetterPhoto" },
        ]),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );

    assert.throws(() => validateStoryOfUsSubmitMediaRows(requirements, []), {
      message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE,
    });
  });

  it("rejects durable rows without completed storage metadata", () => {
    const requirements = collectStoryOfUsSubmitMediaRequirements({
      media: {
        photos: [
          {
            id: "gallery-one",
            mediaId: "gallery-photo",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
          },
        ],
      },
    });

    assert.throws(
      () =>
        validateStoryOfUsSubmitMediaRows(requirements, [
          createMediaRow({
            id: "gallery-photo",
            section: "gallery",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
            mediaType: "photo",
            storagePath: null,
          }),
        ]),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );

    assert.throws(
      () =>
        validateStoryOfUsSubmitMediaRows(requirements, [
          createMediaRow({
            id: "gallery-photo",
            section: "gallery",
            semanticKey: "gallery_photo",
            sectionItemId: "gallery-one",
            mediaType: "photo",
            storagePath: "https://example.com/photo.webp",
          }),
        ]),
      { message: STORYOFUS_DURABLE_MEDIA_REQUIRED_MESSAGE },
    );
  });

  it("keeps final setup submission free of Supabase Storage upload calls", async () => {
    const submitServerSource = await readFile(
      new URL("./submitSetup.server.ts", import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(submitServerSource, /\.storage\s*\./);
    assert.doesNotMatch(submitServerSource, /\.upload\s*\(/);
    assert.doesNotMatch(submitServerSource, /getFileFromFormData/);
  });

  it("keeps immediate setup media mutations behind the locked RPC boundary", async () => {
    const mediaUploadSource = await readFile(
      new URL("./mediaUpload.server.ts", import.meta.url),
      "utf8",
    );
    const uploadIndex = mediaUploadSource.indexOf("await uploadFileToStorage");
    const commitRpcIndex = mediaUploadSource.indexOf("await commitUploadedMediaWithLockedRpc");
    const cleanupIndex = mediaUploadSource.indexOf("await cleanupNewlyUploadedObject");
    const removeRpcIndex = mediaUploadSource.indexOf("await removeMediaWithLockedRpc");
    const removeStorageIndex = mediaUploadSource.indexOf(
      "removal.removedStoragePaths.map((path) => removeStorageObject(path))",
    );

    assert.ok(uploadIndex > 0);
    assert.ok(commitRpcIndex > uploadIndex);
    assert.ok(cleanupIndex > commitRpcIndex);
    assert.ok(removeRpcIndex > 0);
    assert.ok(removeStorageIndex > removeRpcIndex);
    assert.match(mediaUploadSource, /storyofus_commit_setup_media_upload/);
    assert.match(mediaUploadSource, /storyofus_remove_setup_media/);
    assert.doesNotMatch(mediaUploadSource, /\.from\("storyofus_media"\)/);
    assert.doesNotMatch(mediaUploadSource, /\.insert\(\{\s*submission_id/s);
    assert.doesNotMatch(mediaUploadSource, /\.delete\(\)\.in\("id"/);
  });

  it("validates durable media before the atomic finalization RPC and first-submit email enqueue", async () => {
    const submitServerSource = await readFile(
      new URL("./submitSetup.server.ts", import.meta.url),
      "utf8",
    );
    const validationIndex = submitServerSource.indexOf("await validateDurableMediaForSubmit");
    const rpcIndex = submitServerSource.indexOf("await finalizeSetupSubmissionWithRpc");

    assert.ok(validationIndex > 0);
    assert.ok(rpcIndex > 0);
    assert.ok(validationIndex < rpcIndex);
    assert.ok(
      validationIndex < submitServerSource.indexOf("await enqueueSetupSubmittedEmailQuietly"),
    );
    assert.doesNotMatch(submitServerSource, /deleteExistingTextDetails/);
    assert.doesNotMatch(submitServerSource, /insertCoupleDetails/);
    assert.doesNotMatch(submitServerSource, /insertMusicIfNeeded/);
    assert.doesNotMatch(submitServerSource, /insertTimelineIfNeeded/);
    assert.doesNotMatch(submitServerSource, /insertLettersIfNeeded/);
    assert.doesNotMatch(submitServerSource, /\.from\("storyofus_couple_details"\)\.insert/);
    assert.doesNotMatch(submitServerSource, /\.from\("storyofus_submissions"\)\.update/);
  });

  it("enqueues setup_submitted only when the atomic RPC reports first_submit", async () => {
    const submitServerSource = await readFile(
      new URL("./submitSetup.server.ts", import.meta.url),
      "utf8",
    );

    assert.match(
      submitServerSource,
      /if \(finalizedSubmission\.submissionKind === "first_submit"\) \{\s+await enqueueSetupSubmittedEmailQuietly\(finalizedSubmission\.submissionId\);/s,
    );
    assert.doesNotMatch(
      submitServerSource,
      /isFirstSubmit\)\s*\{\s*await enqueueSetupSubmittedEmailQuietly/,
    );
  });
});

function createMediaRow(overrides: Partial<StoryOfUsSubmitMediaRow>): StoryOfUsSubmitMediaRow {
  return {
    id: "media-id",
    section: "gallery",
    semanticKey: "gallery_photo",
    sectionItemId: "gallery-one",
    mediaType: "photo",
    ...durableRowDefaults,
    ...overrides,
  };
}
