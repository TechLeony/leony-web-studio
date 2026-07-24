import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationSql = readFileSync(
  join(process.cwd(), "supabase", "storyofus", "delivery-queue.sql"),
  "utf8",
);

test("delivery queue migration stores a durable queued state before publishing", () => {
  assert.match(
    migrationSql,
    /add column if not exists delivery_queued_at timestamptz/i,
    "Queued orders must have a durable queued timestamp.",
  );
  assert.match(
    migrationSql,
    /'queued_for_delivery'/i,
    "Submission status constraint must allow the queued delivery state.",
  );
  assert.match(
    migrationSql,
    /create or replace function public\.storyofus_queue_final_site_delivery\(\s*p_submission_id uuid\s*\)/i,
    "Queue RPC must exist.",
  );

  const queueSql = extractFunctionSql("storyofus_queue_final_site_delivery");
  assert.match(queueSql, /security definer/i);
  assert.match(queueSql, /set search_path = pg_catalog/i);
  assert.match(queueSql, /for update/i, "Queue RPC must lock the target submission.");
  assert.match(
    queueSql,
    /v_submission\.status = 'queued_for_delivery'/i,
    "Duplicate queue clicks must safely return the existing queued state.",
  );
  assert.match(
    queueSql,
    /v_submission\.status <> 'in_review'/i,
    "Only review-ready orders may be queued.",
  );
  assert.match(
    queueSql,
    /v_submission\.review_ready_at is null/i,
    "Queue RPC must require the durable review-ready timestamp.",
  );
  assert.match(queueSql, /status = 'queued_for_delivery'/i);
  assert.match(queueSql, /delivery_queued_at = coalesce\(submission\.delivery_queued_at, v_now\)/i);
  assert.doesNotMatch(
    queueSql,
    /\bdelivered_at\s*=/i,
    "Queue RPC must not mark delivery complete.",
  );
  assert.doesNotMatch(
    queueSql,
    /set[\s\S]{0,160}status = 'published'/i,
    "Queue RPC must not publish the final site.",
  );
});

test("publish RPC only publishes orders already queued for delivery", () => {
  const publishSql = extractFunctionSql("storyofus_publish_final_site");

  assert.match(
    publishSql,
    /p_expected_status text default 'queued_for_delivery'/i,
    "Publish RPC must default to the queued expected state.",
  );
  assert.match(publishSql, /p_expected_status is distinct from 'queued_for_delivery'/i);
  assert.match(publishSql, /v_submission\.status <> 'queued_for_delivery'/i);
  assert.match(publishSql, /v_submission\.delivery_queued_at is null/i);
  assert.match(publishSql, /submission\.status = 'queued_for_delivery'/i);
  assert.match(publishSql, /submission\.delivery_queued_at is not null/i);
  assert.match(publishSql, /'storyofus:final_site_ready:' \|\| v_submission\.id::text/i);
});

test("delivery queue RPCs are service-role only", () => {
  assert.match(
    migrationSql,
    /revoke all privileges on function public\.storyofus_queue_final_site_delivery\(uuid\)\s+from public, anon, authenticated;/i,
  );
  assert.match(
    migrationSql,
    /grant execute on function public\.storyofus_queue_final_site_delivery\(uuid\)\s+to service_role;/i,
  );
  assert.match(
    migrationSql,
    /revoke all privileges on function public\.storyofus_publish_final_site\(uuid, text, text, text\)\s+from public, anon, authenticated;/i,
  );
  assert.match(
    migrationSql,
    /grant execute on function public\.storyofus_publish_final_site\(uuid, text, text, text\)\s+to service_role;/i,
  );
});

function extractFunctionSql(functionName: string) {
  const pattern = new RegExp(
    `create or replace function public\\.${functionName}[\\s\\S]+?\\n\\$\\$;`,
    "i",
  );
  const match = migrationSql.match(pattern);

  assert.ok(match, `Expected ${functionName} function to exist in delivery queue migration.`);

  return match[0];
}
