import test from "node:test";
import assert from "node:assert/strict";

import { createStoryOfUsEmailEventKey, storyOfUsEmailTypeValues } from "./emailOutboxTypes.ts";
import { createStoryOfUsEmailTemplate } from "./storyOfUsEmailTemplates.server.ts";

const ORDER_REFERENCE = "SOU-20260720-ABC234";
const TRACKING_CODE = "SOT-20260720-DEF567";
const TRACK_ORDER_URL = `https://leony.tech/storyofus/track-order?code=${TRACKING_CODE}`;
const SETUP_URL = "https://leony.tech/storyofus/setup?token=123e4567-e89b-12d3-a456-426614174000";
const PAYMENT_URL = "https://www.shopier.com/ShowProductNew/products.php?id=123456";
const FINAL_URL = "https://leony.tech/storyofus/site/elif-mert";

test("outbox event types and event keys cover the full customer lifecycle", () => {
  assert.deepEqual(
    [...storyOfUsEmailTypeValues],
    ["checkout_created", "order_created", "setup_submitted", "final_site_ready"],
  );
  assert.equal(
    createStoryOfUsEmailEventKey("123e4567-e89b-12d3-a456-426614174000", "checkout_created"),
    "storyofus:checkout_created:123e4567-e89b-12d3-a456-426614174000",
  );
  assert.equal(
    createStoryOfUsEmailEventKey("123e4567-e89b-12d3-a456-426614174000", "final_site_ready"),
    "storyofus:final_site_ready:123e4567-e89b-12d3-a456-426614174000",
  );
});

test("checkout_created email includes payment and prefilled tracking URLs", () => {
  const template = createStoryOfUsEmailTemplate({
    emailType: "checkout_created",
    customerName: "Elif",
    orderReference: ORDER_REFERENCE,
    trackingCode: TRACKING_CODE,
    shopierPaymentUrl: PAYMENT_URL,
    trackOrderUrl: TRACK_ORDER_URL,
  });

  assert.match(template.subject, /ödeme adımınız hazır/);
  assert.match(template.html, /Shopier&#39;de ödemeye devam et/);
  assert.match(template.html, new RegExp(escapeRegExp(PAYMENT_URL)));
  assert.match(template.html, new RegExp(escapeRegExp(TRACK_ORDER_URL)));
  assert.match(template.text, new RegExp(escapeRegExp(TRACKING_CODE)));
});

test("order_created email includes private setup URL and prefilled tracking URL", () => {
  const template = createStoryOfUsEmailTemplate({
    emailType: "order_created",
    customerName: "Elif",
    orderReference: ORDER_REFERENCE,
    trackingCode: TRACKING_CODE,
    setupUrl: SETUP_URL,
    trackOrderUrl: TRACK_ORDER_URL,
  });

  assert.match(template.subject, /ödemeniz onaylandı/);
  assert.match(template.html, /Kurulum bağlantısı size özeldir/);
  assert.match(template.html, new RegExp(escapeRegExp(SETUP_URL)));
  assert.match(template.html, new RegExp(escapeRegExp(TRACK_ORDER_URL)));
});

test("setup_submitted email includes 0/2 edit usage, edit deadline, and refund deadline", () => {
  const template = createStoryOfUsEmailTemplate({
    emailType: "setup_submitted",
    customerName: "Elif",
    orderReference: ORDER_REFERENCE,
    trackingCode: TRACKING_CODE,
    setupUrl: SETUP_URL,
    trackOrderUrl: TRACK_ORDER_URL,
    editableUntil: "2026-07-20T08:25:00.000Z",
    editableUntilLabel: "20 Temmuz 2026 11:25",
    refundRequestUntil: "2026-07-20T09:25:00.000Z",
    refundRequestUntilLabel: "20 Temmuz 2026 12:25",
  });

  assert.match(template.subject, /bilgileriniz alındı/);
  assert.match(template.html, /0\/2/);
  assert.match(template.html, /en fazla 2 kez/);
  assert.match(template.html, /otomatik taslak kaydı/);
  assert.match(template.html, /20 Temmuz 2026 11:25/);
  assert.match(template.html, /20 Temmuz 2026 12:25/);
  assert.match(template.html, /24 saat içinde/);
  assert.match(template.html, new RegExp(escapeRegExp(SETUP_URL)));
  assert.match(template.html, new RegExp(escapeRegExp(TRACK_ORDER_URL)));
  assert.match(template.text, /Şu an kullandığınız düzenleme hakkı: 0\/2/);
});

test("final_site_ready email includes final URL and encrypted-page copy but never passcode details", () => {
  const template = createStoryOfUsEmailTemplate({
    emailType: "final_site_ready",
    customerName: "Elif",
    orderReference: ORDER_REFERENCE,
    finalSiteUrl: FINAL_URL,
    passcodeHint: "Tanıştığımız yıl",
    passcode: "2022",
  } as Parameters<typeof createStoryOfUsEmailTemplate>[0] & { passcode: string });

  assert.match(template.html, new RegExp(escapeRegExp(FINAL_URL)));
  assert.match(template.html, /StoryOfUs sayfamı aç/);
  assert.match(
    template.html,
    /Sayfanız, güvenliğiniz için şifrelenmiştir\. Açmak için kurulum sırasında belirlediğiniz dört haneli şifreyi kullanın\./,
  );
  assert.match(
    template.text,
    /Sayfanız, güvenliğiniz için şifrelenmiştir\. Açmak için kurulum sırasında belirlediğiniz dört haneli şifreyi kullanın\./,
  );
  assert.doesNotMatch(template.html, /Tanıştığımız yıl|Şifre ipucunuz/);
  assert.doesNotMatch(template.text, /Tanıştığımız yıl|Şifre ipucunuz/);
  assert.doesNotMatch(template.html, /2022/);
  assert.doesNotMatch(template.text, /2022/);
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
