import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  StoryOfUsFinalSiteData,
  StoryOfUsFinalSiteMedia,
} from "@/lib/storyofus/finalSite.server";

import { createStoryOfUsExperienceDataFromFinalSite } from "./storyOfUsExperienceAdapter.ts";

function media(overrides: Partial<StoryOfUsFinalSiteMedia>): StoryOfUsFinalSiteMedia {
  return {
    id: "internal-media-id",
    mediaType: "photo",
    section: "gallery",
    semanticKey: null,
    sectionItemId: null,
    previewUrl: "https://signed.example/default",
    originalFilename: "photo.jpg",
    caption: "",
    sortOrder: 0,
    isPuzzleSource: false,
    ...overrides,
  };
}

function site(overrides: Partial<StoryOfUsFinalSiteData> = {}): StoryOfUsFinalSiteData {
  return {
    coupleDisplayName: "Elif & Mert",
    partnerName: "Mert",
    recipientNickname: "Elif",
    relationshipStartDate: "2024-06-12",
    specialDateLabel: "Yıl dönümümüz",
    relationshipStory: "Internal story text used only for normalization.",
    passcodeHint: "Tanıştığımız yıl",
    finalSiteUrl: "https://leony.tech/storyofus/site/elif-mert-test",
    orderReference: "SOT-TEST",
    heroPhotos: {
      left: null,
      right: null,
    },
    memoryPrompts: [],
    gallery: [],
    puzzlePhoto: null,
    loveLetterPhoto: null,
    voiceNote: null,
    timeline: [],
    letters: [],
    music: null,
    ...overrides,
  };
}

describe("createStoryOfUsExperienceDataFromFinalSite", () => {
  it("maps final-site media into the shared demo presentation destinations", () => {
    const experience = createStoryOfUsExperienceDataFromFinalSite(
      site({
        heroPhotos: {
          left: media({
            id: "hero-left-internal",
            section: "opening",
            semanticKey: "hero_left",
            sectionItemId: "hero-left",
            previewUrl: "https://signed.example/hero-left",
            caption: "Hero left alt",
          }),
          right: media({
            id: "hero-right-internal",
            section: "opening",
            semanticKey: "hero_right",
            sectionItemId: "hero-right",
            previewUrl: "https://signed.example/hero-right",
          }),
        },
        memoryPrompts: [
          media({
            id: "sweetest-internal",
            section: "memory_prompt",
            semanticKey: "sweetest",
            sectionItemId: "sweetest",
            previewUrl: "https://signed.example/sweetest",
            caption: "Tatlı caption",
            sortOrder: 1,
          }),
          media({
            id: "smile-internal",
            section: "memory_prompt",
            semanticKey: "best-smile",
            sectionItemId: "best-smile",
            previewUrl: "https://signed.example/smile",
            sortOrder: 5,
          }),
        ],
        gallery: [
          media({
            id: "gallery-second-internal",
            section: "gallery",
            previewUrl: "https://signed.example/gallery-second",
            caption: "Galeri ikinci",
            sortOrder: 2,
          }),
          media({
            id: "gallery-first-internal",
            section: "gallery",
            previewUrl: "https://signed.example/gallery-first",
            caption: "Galeri birinci",
            sortOrder: 1,
          }),
        ],
        puzzlePhoto: media({
          id: "puzzle-internal",
          mediaType: "puzzle_photo",
          section: "puzzle",
          semanticKey: "puzzle_photo",
          previewUrl: "https://signed.example/puzzle",
          isPuzzleSource: true,
        }),
        loveLetterPhoto: media({
          id: "letter-photo-internal",
          section: "letter",
          semanticKey: "love_letter_photo",
          previewUrl: "https://signed.example/letter-photo",
        }),
        voiceNote: media({
          id: "voice-internal",
          mediaType: "voice_note",
          section: "voice_note",
          semanticKey: "voice_note",
          previewUrl: "https://signed.example/voice-note",
        }),
        timeline: [
          {
            id: "timeline-late",
            title: "İkinci anı",
            eventDate: "2024-07-01",
            description: "İkinci açıklama",
            sortOrder: 2,
            photo: media({
              id: "timeline-late-photo",
              section: "timeline",
              sectionItemId: "timeline-late",
              previewUrl: "https://signed.example/timeline-late",
            }),
          },
          {
            id: "timeline-early",
            title: "İlk anı",
            eventDate: "2024-06-01",
            description: "İlk açıklama",
            sortOrder: 1,
            photo: media({
              id: "timeline-early-photo",
              section: "timeline",
              sectionItemId: "timeline-early",
              previewUrl: "https://signed.example/timeline-early",
            }),
          },
        ],
        letters: [
          {
            id: "open-when-internal",
            type: "open_when",
            title: "Beni özlediğinde aç",
            body: "Yanındaymışım gibi düşün.",
            sortOrder: 2,
          },
          {
            id: "love-letter-internal",
            type: "love_letter",
            title: "Kalbimden sana",
            body: "Tek parça aşk mektubu.",
            sortOrder: 1,
          },
        ],
        music: {
          spotifyUrl: "https://open.spotify.com/track/abc123",
          songTitle: "Bizim şarkımız",
          artistName: "Bize özel sanatçı",
          startAtSeconds: 0,
        },
      }),
    );

    assert.equal(experience.relationship.heroLeftPhoto.src, "https://signed.example/hero-left");
    assert.equal(experience.relationship.heroRightPhoto.src, "https://signed.example/hero-right");
    assert.equal(experience.memories.items[0]?.title, "En tatlış fotiğin");
    assert.equal(experience.memories.items[0]?.photoSrc, "https://signed.example/sweetest");
    assert.equal(experience.memories.items[1]?.title, "En güzel gülüşün");
    assert.equal(experience.memories.items[1]?.photoSrc, "https://signed.example/smile");
    assert.equal(experience.memories.items[2]?.photoSrc, "https://signed.example/gallery-first");
    assert.equal(experience.memories.items[3]?.photoSrc, "https://signed.example/gallery-second");
    assert.equal(experience.timeline.items[0]?.title, "İlk anı");
    assert.equal(experience.timeline.items[0]?.photoSrc, "https://signed.example/timeline-early");
    assert.equal(experience.timeline.items[1]?.title, "İkinci anı");
    assert.equal(experience.timeline.items[1]?.photoSrc, "https://signed.example/timeline-late");
    assert.equal(experience.photoPuzzle.imageUrl, "https://signed.example/puzzle");
    assert.equal(experience.letter.letterSidePhoto.photoSrc, "https://signed.example/letter-photo");
    assert.equal(experience.voiceNote.audioUrl, "https://signed.example/voice-note");
    assert.equal(experience.letter.letterBody, "Tek parça aşk mektubu.");
    assert.equal(experience.openWhenLetters.items[0]?.title, "Beni özlediğinde aç");
    assert.equal(experience.spotify.songTitle, "Bizim şarkımız");
    assert.equal(experience.spotify.artist, "Bize özel sanatçı");
  });

  it("exposes signed preview URLs but not media internals", () => {
    const experience = createStoryOfUsExperienceDataFromFinalSite(
      site({
        heroPhotos: {
          left: media({
            id: "secret-media-id",
            section: "opening",
            semanticKey: "secret-semantic-key",
            sectionItemId: "secret-section-item-id",
            previewUrl: "https://signed.example/safe-preview",
          }),
          right: null,
        },
        memoryPrompts: [
          media({
            id: "private-memory-id",
            section: "memory_prompt",
            semanticKey: "private-memory-key",
            sectionItemId: "sweetest",
            previewUrl: "https://signed.example/memory-preview",
          }),
        ],
      }),
    );
    const serialized = JSON.stringify(experience);

    assert.match(serialized, /https:\/\/signed\.example\/safe-preview/);
    assert.match(serialized, /https:\/\/signed\.example\/memory-preview/);
    assert.doesNotMatch(serialized, /secret-media-id/);
    assert.doesNotMatch(serialized, /secret-semantic-key/);
    assert.doesNotMatch(serialized, /secret-section-item-id/);
    assert.doesNotMatch(serialized, /private-memory-id/);
    assert.doesNotMatch(serialized, /private-memory-key/);
    assert.doesNotMatch(serialized, /sweetest/);
  });

  it("omits unsupported or missing optional sections instead of fabricating content", () => {
    const experience = createStoryOfUsExperienceDataFromFinalSite(site());

    assert.deepEqual(experience.memories.items, []);
    assert.deepEqual(experience.timeline.items, []);
    assert.equal(experience.photoPuzzle.imageUrl, "");
    assert.equal(experience.voiceNote.audioUrl, "");
    assert.deepEqual(experience.reasons.items, []);
    assert.deepEqual(experience.couponQuiz.questions, []);
    assert.deepEqual(experience.coupleWrapped.stats, []);
    assert.equal(experience.finalSurprise.finalSecretNote, "");
  });
});
