import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dashboardSource = readFileSync(
  join(process.cwd(), "src", "components", "storyofus", "StoryOfUsAdminDashboard.tsx"),
  "utf8",
);

test("optional missing content opens a dedicated confirmation dialog", () => {
  assert.match(dashboardSource, /Optional content is missing/);
  assert.match(dashboardSource, /The following optional content is missing:/);
  assert.match(dashboardSource, /Have you confirmed this with the customer/);
  assert.match(dashboardSource, /Yes, queue delivery/);
});

test("optional missing content cancel does not queue delivery", () => {
  const dialogSource = extractComponent("OptionalMissingContentDialog");

  assert.match(dialogSource, /onClick=\{onCancel\}/);
  assert.doesNotMatch(dialogSource, /onClick=\{onCancel\}[\s\S]{0,240}executeQueueDelivery/);
  assert.match(dialogSource, />\s*Cancel\s*</);
});

test("optional missing content confirm queues exactly once through the guarded path", () => {
  assert.match(
    dashboardSource,
    /onConfirm=\{\(\) => executeQueueDelivery\(pendingOptionalQueue\.orderId\)\}/,
  );
  assert.match(dashboardSource, /if \(queueing\) \{\s*return;\s*\}/);
});

test("queue buttons stay unavailable for blocking technical issues or active requests", () => {
  assert.match(dashboardSource, /deliveryBlockers:\s*order\.deliveryBlockers/);
  assert.match(dashboardSource, /isProcessing:\s*queueing === order\.id/);
  assert.match(dashboardSource, /decision\.action === "disabled"/);
});

test("optional missing content dialog buttons cannot submit a form", () => {
  const dialogSource = extractComponent("OptionalMissingContentDialog");

  assert.equal((dialogSource.match(/type="button"/g) ?? []).length, 2);
});

function extractComponent(componentName: string) {
  const start = dashboardSource.indexOf(`function ${componentName}`);
  const end = dashboardSource.indexOf("\nfunction Panel", start);

  assert.notEqual(start, -1, `${componentName} must exist.`);
  assert.notEqual(end, -1, `${componentName} boundary must exist.`);

  return dashboardSource.slice(start, end);
}
