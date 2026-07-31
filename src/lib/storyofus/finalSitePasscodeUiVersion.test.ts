import assert from "node:assert/strict";
import test from "node:test";

import {
  STORYOFUS_DEMO_PASSCODE_UI_VERSION,
  resolveStoryOfUsFinalSitePasscodeUiVersion,
} from "./finalSitePasscodeUiVersion.ts";

test("resolves explicit demo final-site passcode UI version", () => {
  assert.equal(
    resolveStoryOfUsFinalSitePasscodeUiVersion(STORYOFUS_DEMO_PASSCODE_UI_VERSION),
    "demo_v1",
  );
});

test("falls back to legacy final-site passcode UI for missing or unknown values", () => {
  assert.equal(resolveStoryOfUsFinalSitePasscodeUiVersion(null), "legacy");
  assert.equal(resolveStoryOfUsFinalSitePasscodeUiVersion(undefined), "legacy");
  assert.equal(resolveStoryOfUsFinalSitePasscodeUiVersion(""), "legacy");
  assert.equal(resolveStoryOfUsFinalSitePasscodeUiVersion("future_v2"), "legacy");
});
