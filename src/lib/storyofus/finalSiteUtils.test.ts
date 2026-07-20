import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createStoryOfUsFinalSiteSlug,
  createStoryOfUsFinalSiteSlugBase,
  createStoryOfUsFinalSiteUrl,
  findStoryOfUsTimelinePhotoForItem,
  formatStoryOfUsExperienceSinceLabel,
  getStoryOfUsFinalSiteMaxSlugLength,
  isValidStoryOfUsFinalSiteUrl,
  normalizeStoryOfUsFinalSiteSlug,
} from "./finalSiteUtils.ts";

test("normalizes Turkish characters for StoryOfUs final site slugs", () => {
  assert.equal(
    createStoryOfUsFinalSiteSlugBase("Çağıl & Ümit Şımarık Öç", ""),
    "cagil-umit-simarik-oc",
  );
});

test("normalizes punctuation and whitespace for StoryOfUs final site slugs", () => {
  assert.equal(createStoryOfUsFinalSiteSlugBase("  Elif !!! Mert  💌  ", ""), "elif-mert");
});

test("falls back to a neutral slug base when names are missing", () => {
  assert.equal(createStoryOfUsFinalSiteSlugBase("", ""), "storyofus");
});

test("creates lowercase ASCII slugs with bounded length", () => {
  const longPrefix = "Çok Uzun İsim ".repeat(20);
  const slug = createStoryOfUsFinalSiteSlug(longPrefix, "abc123");

  assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(slug.length <= getStoryOfUsFinalSiteMaxSlugLength());
  assert.ok(slug.endsWith("-abc123"));
});

test("creates cryptographic-looking random suffixes without customer identifiers", () => {
  const slugs = new Set(
    Array.from({ length: 64 }, () => createStoryOfUsFinalSiteSlug("Elif & Mert")),
  );

  assert.equal(slugs.size, 64);

  for (const slug of slugs) {
    assert.match(slug, /^elif-mert-[a-z0-9]{6}$/);
  }
});

test("validates only canonical StoryOfUs final site URLs", () => {
  assert.equal(
    createStoryOfUsFinalSiteUrl("elif-mert-k8f3qw"),
    "https://leony.tech/storyofus/site/elif-mert-k8f3qw",
  );
  assert.equal(
    isValidStoryOfUsFinalSiteUrl("https://leony.tech/storyofus/site/elif-mert-k8f3qw"),
    true,
  );
  assert.equal(
    isValidStoryOfUsFinalSiteUrl("https://leony.tech/storyofus/site/elif-mert-k8f3qw?code=x"),
    false,
  );
  assert.equal(
    isValidStoryOfUsFinalSiteUrl("https://leony.tech/storyofus/site/elif-mert-k8f3qw#x"),
    false,
  );
  assert.equal(
    isValidStoryOfUsFinalSiteUrl("https://preview.example/storyofus/site/elif-mert-k8f3qw"),
    false,
  );
  assert.equal(
    isValidStoryOfUsFinalSiteUrl("https://leony.tech/storyofus/site/elif%2fmert"),
    false,
  );
});

test("rejects invalid or overlong public slugs", () => {
  assert.equal(normalizeStoryOfUsFinalSiteSlug("Elif-Mert"), "elif-mert");
  assert.equal(normalizeStoryOfUsFinalSiteSlug("elif_mert"), null);
  assert.equal(
    normalizeStoryOfUsFinalSiteSlug("a".repeat(getStoryOfUsFinalSiteMaxSlugLength() + 1)),
    null,
  );
});

test("formats StoryOfUs relationship dates with the shared since wording", () => {
  assert.equal(formatStoryOfUsExperienceSinceLabel("2025-05-15"), "15 Mayıs 2025'ten beri");
});

test("matches timeline photos by current timeline item id", () => {
  const matchingPhoto = {
    section: "timeline",
    sectionItemId: "db-timeline-item",
    previewUrl: "https://signed.example/current",
  };

  assert.equal(
    findStoryOfUsTimelinePhotoForItem({
      timelineItem: { id: "db-timeline-item" },
      itemIndex: 0,
      timelineMedia: [matchingPhoto],
      snapshotTimeline: [],
    }),
    matchingPhoto,
  );
});

test("matches legacy timeline photos by original setup snapshot id at the same position", () => {
  const legacyPhoto = {
    section: "timeline",
    sectionItemId: "setup-local-timeline-id",
    previewUrl: "https://signed.example/legacy",
  };

  assert.equal(
    findStoryOfUsTimelinePhotoForItem({
      timelineItem: { id: "db-generated-timeline-id" },
      itemIndex: 0,
      timelineMedia: [legacyPhoto],
      snapshotTimeline: [{ id: "setup-local-timeline-id" }],
    }),
    legacyPhoto,
  );
});

test("does not attach unmatched timeline media to another timeline item", () => {
  assert.equal(
    findStoryOfUsTimelinePhotoForItem({
      timelineItem: { id: "db-timeline-item" },
      itemIndex: 0,
      timelineMedia: [
        {
          section: "timeline",
          sectionItemId: "different-timeline-item",
          previewUrl: "https://signed.example/wrong",
        },
      ],
      snapshotTimeline: [{ id: "different-setup-item-at-another-position" }],
    }),
    null,
  );
});

test("does not attach timeline media when the signed preview URL is missing", () => {
  assert.equal(
    findStoryOfUsTimelinePhotoForItem({
      timelineItem: { id: "db-timeline-item" },
      itemIndex: 0,
      timelineMedia: [
        {
          section: "timeline",
          sectionItemId: "db-timeline-item",
          previewUrl: "",
        },
      ],
      snapshotTimeline: [],
    }),
    null,
  );
});
