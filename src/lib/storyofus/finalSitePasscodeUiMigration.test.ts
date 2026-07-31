import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationSql = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260731170000_storyofus_passcode_ui_version.sql"),
  "utf8",
);

test("passcode UI version migration is additive and does not backfill existing submissions", () => {
  assert.match(migrationSql, /add column if not exists passcode_ui_version text/i);
  assert.match(migrationSql, /passcode_ui_version in \('demo_v1'\)/i);
  assert.doesNotMatch(
    migrationSql,
    /update\s+public\.storyofus_submissions\s+set\s+passcode_ui_version/i,
    "Existing published submissions must keep null/legacy passcode UI.",
  );
});

test("publish RPC assigns demo passcode UI only when an order is newly published", () => {
  assert.match(migrationSql, /if v_submission\.status = 'published' then/i);
  assert.match(
    migrationSql,
    /passcode_ui_version = coalesce\(submission\.passcode_ui_version, 'demo_v1'\)/i,
  );
});
