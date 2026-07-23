import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getStoryOfUsEmailQaPreviews,
  getStoryOfUsEmailQaTemplateInputs,
  isStoryOfUsEmailQaAllowed,
  STORYOFUS_EMAIL_QA_PATH,
} from "./storyOfUsEmailQaPreview.ts";
import { createStoryOfUsEmailTemplate } from "./storyOfUsEmailTemplates.server.ts";

test("all four StoryOfUs customer email stages are available in QA", () => {
  const previews = getStoryOfUsEmailQaPreviews();

  assert.deepEqual(
    previews.map((preview) => preview.id),
    ["checkout_created", "order_created", "setup_submitted", "final_site_ready"],
  );
});

test("StoryOfUs email QA reuses the actual committed template functions", () => {
  const previews = getStoryOfUsEmailQaPreviews();
  const inputs = getStoryOfUsEmailQaTemplateInputs();

  for (const preview of previews) {
    const input = inputs.find((candidate) => candidate.id === preview.id)?.templateInput;
    assert.ok(input);

    const template = createStoryOfUsEmailTemplate(input);
    assert.equal(preview.subject, template.subject);
    assert.equal(preview.html, template.html);
    assert.equal(preview.text, template.text);
  }
});

test("checkout email QA includes tracking and continue-payment CTA", () => {
  const preview = findPreview("checkout_created");

  assert.match(preview.html, /QA-TRACK-2026/);
  assert.match(preview.html, /preview\.local\/storyofus\/track-order\?code=QA-TRACK-2026/);
  assert.match(preview.html, /Shopier&#39;de ödemeye devam et/);
  assert.doesNotMatch(preview.html, /Kurulum bilgilerini doldur/);
});

test("payment-confirmed email QA includes setup and tracking CTAs", () => {
  const preview = findPreview("order_created");

  assert.match(preview.html, /ödemeniz başarıyla onaylandı/);
  assert.match(preview.html, /Kurulum bilgilerini doldur/);
  assert.match(preview.html, /preview\.local\/storyofus\/qa\/inert-setup/);
  assert.match(preview.html, /Siparişimi takip et/);
  assert.match(preview.html, /QA-TRACK-2026/);
});

test("setup submitted email QA includes edit count, deadlines, and non-consuming upload copy", () => {
  const preview = findPreview("setup_submitted");

  assert.match(preview.html, /0\/2/);
  assert.match(preview.html, /en fazla 2 kez/);
  assert.match(preview.html, /3 saat/);
  assert.match(preview.html, /Düzenleme sonu/);
  assert.match(preview.html, /İade talebi sonu/);
  assert.match(preview.html, /fotoğraf yüklemek düzenleme hakkı kullanmaz/);
});

test("final-site-ready email QA includes the final website CTA", () => {
  const preview = findPreview("final_site_ready");

  assert.match(preview.html, /StoryOfUs sayfamı aç/);
  assert.match(preview.html, /preview\.local\/storyofus\/site\/qa-final-site/);
  assert.match(preview.html, /Sayfanız, güvenliğiniz için şifrelenmiştir/);
  assert.doesNotMatch(preview.html, /Şifre ipucunuz|Tanıştığımız yıl/);
  assert.doesNotMatch(preview.html, /worker|RPC|in_review|published/);
});

test("StoryOfUs email QA does not use transport, outbox, Supabase, or production links", () => {
  const helperSource = readFileSync(
    new URL("./storyOfUsEmailQaPreview.ts", import.meta.url),
    "utf8",
  );
  const previews = getStoryOfUsEmailQaPreviews();
  const serialized = JSON.stringify(previews);

  assert.doesNotMatch(helperSource, /sendStoryOfUsEmail|enqueueStoryOfUsEmail|supabase/i);
  assert.doesNotMatch(serialized, /api\.resend\.com|shopier\.com|leony\.tech\/storyofus\/setup/);
  assert.match(serialized, /preview\.local/);
});

test("StoryOfUs email QA remains inaccessible in production", () => {
  assert.equal(isStoryOfUsEmailQaAllowed(null), false);
  assert.equal(
    isStoryOfUsEmailQaAllowed({ VERCEL_ENV: "production", NODE_ENV: "production" }),
    false,
  );
  assert.equal(isStoryOfUsEmailQaAllowed({ VERCEL_ENV: "preview", NODE_ENV: "production" }), true);
  assert.equal(
    isStoryOfUsEmailQaAllowed({ VERCEL_ENV: "development", NODE_ENV: "development" }),
    true,
  );
  assert.equal(isStoryOfUsEmailQaAllowed({ NODE_ENV: "development" }), true);
  assert.equal(STORYOFUS_EMAIL_QA_PATH, "/storyofus/internal/email-qa");
});

function findPreview(id: ReturnType<typeof getStoryOfUsEmailQaPreviews>[number]["id"]) {
  const preview = getStoryOfUsEmailQaPreviews().find((candidate) => candidate.id === id);
  assert.ok(preview);
  return preview;
}
