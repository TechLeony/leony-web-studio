import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

function readSource(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

test("Leony Admin root keeps the existing authenticated shell and login gate", () => {
  const source = readSource("src/routes/admin.tsx");

  assert.match(source, /if \(!session\) return <AdminLogin \/>/);
  assert.match(source, /session\.email\?\.toLowerCase\(\) === SITE\.adminEmail\.toLowerCase\(\)/);
  assert.match(source, /<Outlet \/>/);
  assert.match(source, /to="\/admin\/storyofus-orders"/);
  assert.match(source, /label="Story of Us"/);
  assert.doesNotMatch(source, /StoryOfUsAdminDashboard/);
  assert.doesNotMatch(source, /placeholder=/);
});

test("StoryOfUs admin shell is isolated under the StoryOfUs route tree", () => {
  const source = readSource("src/routes/admin.storyofus-orders.tsx");

  assert.match(source, /createFileRoute\("\/admin\/storyofus-orders"\)/);
  assert.match(source, /StoryOfUsAdminDashboard view="overview"/);
  assert.match(source, /<Outlet \/>/);
  assert.match(source, /to="\/admin"/);
  assert.match(source, /Back to Admin/);
  assert.match(source, /w-\[clamp\(132px,10vw,172px\)\]/);
  assert.match(source, /lg:pl-\[clamp\(132px,10vw,172px\)\]/);
});

test("StoryOfUs sidebar links target the route-specific pages and preserve active state", () => {
  const source = readSource("src/routes/admin.storyofus-orders.tsx");

  for (const route of [
    "/admin/storyofus-orders",
    "/admin/storyofus-orders/orders",
    "/admin/storyofus-orders/previews",
    "/admin/storyofus-orders/refunds",
    "/admin/storyofus-orders/analytics",
    "/admin/storyofus-orders/settings",
  ]) {
    assert.match(source, new RegExp(`to="${route.replaceAll("/", "\\/")}"`));
  }

  assert.match(source, /activeProps=\{\{ className: "bg-blue-50 text-blue-700" \}\}/);
  assert.match(source, /onClick=\{onNavigate\}/);
});

test("orders parent route renders order detail children through an outlet", () => {
  const source = readSource("src/routes/admin.storyofus-orders.orders.tsx");

  assert.match(source, /createFileRoute\("\/admin\/storyofus-orders\/orders"\)/);
  assert.match(source, /StoryOfUsAdminDashboard view="orders"/);
  assert.match(source, /<Outlet \/>/);
  assert.match(source, /\/admin\/storyofus-orders\/orders/);
});

test("order detail route receives the orderId parameter and renders the detail view", () => {
  const detailRoute = readSource("src/routes/admin.storyofus-orders.orders.$orderId.tsx");
  const dashboard = readSource("src/components/storyofus/StoryOfUsAdminDashboard.tsx");

  assert.match(detailRoute, /createFileRoute\("\/admin\/storyofus-orders\/orders\/\$orderId"\)/);
  assert.match(detailRoute, /const \{ orderId \} = Route\.useParams\(\)/);
  assert.match(detailRoute, /StoryOfUsAdminDashboard view="detail" orderId=\{orderId\}/);
  assert.match(dashboard, /to="\/admin\/storyofus-orders\/orders\/\$orderId"/);
  assert.match(dashboard, /params=\{\{ orderId: order\.id \}\}/);
  assert.match(dashboard, /Order not found\./);
});

test("admin site preview route uses final-site slug without a public bypass token", () => {
  const previewRoute = readSource("src/routes/admin.storyofus-orders.site-preview.$siteSlug.tsx");
  const dashboard = readSource("src/components/storyofus/StoryOfUsAdminDashboard.tsx");
  const serverSource = readSource("src/lib/storyofus/finalSite.server.ts");

  assert.match(
    previewRoute,
    /createFileRoute\("\/admin\/storyofus-orders\/site-preview\/\$siteSlug"\)/,
  );
  assert.match(previewRoute, /getStoryOfUsAdminFinalSitePreviewBySlug/);
  assert.match(previewRoute, /<StoryOfUsFinalSiteRenderer site=\{previewState\.site\} \/>/);
  assert.doesNotMatch(previewRoute, /search|query|token|passcode/i);
  assert.match(
    dashboard,
    /href=\{`\/admin\/storyofus-orders\/site-preview\/\$\{encodeURIComponent\(order\.finalSiteSlug\)\}`\}/,
  );
  assert.match(dashboard, /target="_blank"/);
  assert.match(dashboard, /function AdminPreviewLink/);
  assert.match(dashboard, /Preview unavailable: final site slug is missing\./);
  assert.doesNotMatch(dashboard, /onOpenPreview|setPreviewSite|verifyAccessPin/);
  assert.doesNotMatch(dashboard, /finalSiteUrl\}[\s\S]{0,220}Preview site/);
  assert.match(serverSource, /getStoryOfUsAdminFinalSitePreviewBySlug/);
  assert.match(serverSource, /middleware\(\[requireSupabaseAuth\]\)/);
  assert.match(serverSource, /await assertStoryOfUsAdmin\(context as AdminContext\)/);
  assert.match(serverSource, /eq\("final_site_slug", slug\)/);
});

test("StoryOfUs admin dashboard preserves final_site_slug for preview links", () => {
  const serverSource = readSource("src/lib/storyofus/storyOfUsAdminDashboard.server.ts");
  const reviewWorkerSource = readSource("src/lib/storyofus/reviewReady.server.ts");

  assert.match(serverSource, /"final_site_slug"/);
  assert.match(serverSource, /finalSiteSlug: stringValue\(row\.final_site_slug\)/);
  assert.match(serverSource, /ensureStoryOfUsAdminPreviewSlug/);
  assert.match(serverSource, /row\.final_site_slug = finalSiteSlug/);
  assert.match(reviewWorkerSource, /ensureMissingReviewReadyPreviewSlugs/);
  assert.match(reviewWorkerSource, /ensureStoryOfUsAdminPreviewSlug/);
  assert.match(reviewWorkerSource, /\.is\("final_site_slug", null\)/);
});

test("public final-site route keeps the customer passcode gate", () => {
  const publicRoute = readSource("src/routes/storyofus.site.$siteSlug.tsx");

  assert.match(publicRoute, /getStoryOfUsFinalSiteAccess/);
  assert.match(publicRoute, /verifyStoryOfUsFinalSitePasscode/);
  assert.match(publicRoute, /<LockKeyhole className="h-7 w-7" \/>/);
  assert.match(publicRoute, /<form onSubmit=\{handleUnlock\}/);
});

test("StoryOfUs admin server functions keep admin authorization on private data and actions", () => {
  const source = readSource("src/lib/storyofus/storyOfUsAdminDashboard.server.ts");

  assert.match(source, /middleware\(\[requireSupabaseAuth\]\)/);
  assert.match(source, /assertStoryOfUsAdmin/);
  assert.match(source, /queueStoryOfUsFinalSiteDelivery/);
  assert.match(source, /storyofus_queue_final_site_delivery/);
});
