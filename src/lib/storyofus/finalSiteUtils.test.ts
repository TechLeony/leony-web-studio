import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createStoryOfUsFinalSiteSlug,
  createStoryOfUsFinalSiteSlugBase,
  createStoryOfUsFinalSiteUrl,
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
