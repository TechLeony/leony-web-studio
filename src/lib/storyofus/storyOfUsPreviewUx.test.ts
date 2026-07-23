import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const salesRouteSource = readFileSync(
  new URL("../../routes/storyofus.index.tsx", import.meta.url),
  "utf8",
);
const checkoutRouteSource = readFileSync(
  new URL("../../routes/storyofus.checkout.tsx", import.meta.url),
  "utf8",
);
const setupQaRouteSource = readFileSync(
  new URL("../../routes/storyofus.internal.setup-qa.tsx", import.meta.url),
  "utf8",
);

test("StoryOfUs sales page keeps final CTA and tracking link in a vertical centered stack", () => {
  const stackStart = salesRouteSource.indexOf(
    "mx-auto mt-8 flex w-full max-w-xs flex-col items-center gap-3 sm:max-w-sm",
  );
  const stackSnippet = salesRouteSource.slice(stackStart, stackStart + 1200);

  assert.notEqual(stackStart, -1);
  assert.match(
    stackSnippet,
    /mx-auto mt-8 flex w-full max-w-xs flex-col items-center gap-3 sm:max-w-sm/,
  );
  assert.match(stackSnippet, /Sipariş takip/);
  assert.doesNotMatch(stackSnippet, /absolute|-\w*mt-\d|-\w*right-\d|-\w*left-\d/);
});

test("StoryOfUs checkout demo action uses the shared Leony loading transition", () => {
  assert.match(checkoutRouteSource, /useStoryOfUsDemoNavigation/);
  assert.match(checkoutRouteSource, /isDemoLoading && <GlobalPending \/>/);
  assert.match(checkoutRouteSource, /onClick=\{navigateToDemo\}/);
  assert.match(checkoutRouteSource, /disabled=\{isDemoLoading\}/);
  assert.doesNotMatch(checkoutRouteSource, /to=\{storyOfUsDemoCtaConfig\.demoPath\}/);
});

test("StoryOfUs setup QA route has server-side production gating and no integration actions", () => {
  const importBlock = setupQaRouteSource.slice(0, setupQaRouteSource.indexOf("export const Route"));

  assert.match(setupQaRouteSource, /loader: \(\) =>/);
  assert.match(setupQaRouteSource, /throw notFound\(\)/);
  assert.doesNotMatch(importBlock, /useServerFn|Supabase|Shopier|outbox|Resend/i);
  assert.doesNotMatch(importBlock, /uploadStoryOfUs|submitStoryOfUs|publish|payment/i);
});
