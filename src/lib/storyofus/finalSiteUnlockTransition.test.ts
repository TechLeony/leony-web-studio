import assert from "node:assert/strict";
import { test } from "node:test";

import type { StoryOfUsFinalSiteData } from "./finalSite.server.ts";
import {
  getStoryOfUsFinalSiteCriticalPreloadUrls,
  getStoryOfUsUnlockTransitionTiming,
} from "./finalSiteUnlockTransition.ts";

test("uses only unique final-site hero images as critical preload media", () => {
  const site = createSite({
    left: " https://signed.example/hero-left ",
    right: "https://signed.example/hero-right",
  });

  assert.deepEqual(getStoryOfUsFinalSiteCriticalPreloadUrls(site), [
    "https://signed.example/hero-left",
    "https://signed.example/hero-right",
  ]);
});

test("deduplicates missing or repeated final-site critical preload media", () => {
  const site = createSite({
    left: "https://signed.example/hero",
    right: "https://signed.example/hero",
  });

  assert.deepEqual(getStoryOfUsFinalSiteCriticalPreloadUrls(site), ["https://signed.example/hero"]);
});

test("shortens decorative unlock transition timing for reduced motion", () => {
  assert.deepEqual(getStoryOfUsUnlockTransitionTiming(false), {
    minimumDurationMs: 2300,
    preloadTimeoutMs: 3500,
  });
  assert.deepEqual(getStoryOfUsUnlockTransitionTiming(true), {
    minimumDurationMs: 250,
    preloadTimeoutMs: 1200,
  });
});

function createSite({ left, right }: { left?: string; right?: string }): StoryOfUsFinalSiteData {
  return {
    coupleDisplayName: "Elif & Mert",
    partnerName: "Mert",
    recipientNickname: "Aşkım",
    relationshipStartDate: null,
    specialDateLabel: "",
    relationshipStory: "",
    passcodeHint: "",
    finalSiteUrl: null,
    orderReference: "SOU-20260101-ABC234",
    heroPhotos: {
      left: left ? createMedia(left) : null,
      right: right ? createMedia(right) : null,
    },
    memoryPrompts: [],
    gallery: [],
    puzzlePhoto: null,
    loveLetterPhoto: null,
    voiceNote: null,
    timeline: [],
    letters: [],
    editableDefaultContent: {},
    music: null,
  };
}

function createMedia(previewUrl: string) {
  return {
    id: crypto.randomUUID(),
    mediaType: "photo" as const,
    section: "opening",
    semanticKey: "opening",
    sectionItemId: "firstPerson",
    previewUrl,
    originalFilename: "hero.webp",
    caption: "",
    sortOrder: 0,
    isPuzzleSource: false,
  };
}
