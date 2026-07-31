import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();
const consistencySql = readStoryOfUsSql("review-ready-state-consistency.sql");
const cronSql = readStoryOfUsSql("review-ready-worker-cron.sql");
const normalizedConsistencySql = normalizeSql(consistencySql);

test("review-ready consistency migration repairs only safe half-closed submitted orders", () => {
  assert.match(consistencySql, /begin;/i);
  assert.match(consistencySql, /commit;/i);
  assert.match(
    normalizedConsistencySql,
    /update public\.storyofus_submissions as submission set status = 'in_review'/i,
  );
  assert.match(normalizedConsistencySql, /submission\.payment_status = 'paid'/i);
  assert.match(normalizedConsistencySql, /submission\.status = 'submitted'/i);
  assert.match(normalizedConsistencySql, /submission\.editing_closed_at is not null/i);
  assert.match(normalizedConsistencySql, /submission\.review_ready_at is null/i);
  assert.match(
    normalizedConsistencySql,
    /coalesce\(submission\.refund_status, 'none'\) in \('none', 'rejected'\)/i,
  );
  assert.match(
    normalizedConsistencySql,
    /review_ready_at = coalesce\(submission\.review_ready_at, submission\.editing_closed_at, now\(\)\)/i,
  );
  assert.match(
    normalizedConsistencySql,
    /editing_closed_reason = coalesce\(submission\.editing_closed_reason, 'deadline_expired'\)/i,
  );
});

test("review-ready promotion updates status, review timestamp, and edit closure atomically", () => {
  const promoteSql = extractFunctionSql(consistencySql, "storyofus_promote_review_ready_orders");

  assert.match(promoteSql, /security definer/i);
  assert.match(promoteSql, /set search_path = pg_catalog/i);
  assert.match(promoteSql, /for update skip locked/i);
  assert.match(promoteSql, /submission\.payment_status = 'paid'/i);
  assert.match(promoteSql, /submission\.status = 'submitted'/i);
  assert.match(promoteSql, /submission\.editable_until <= v_now/i);
  assert.match(
    promoteSql,
    /coalesce\(submission\.refund_status, 'none'\) in \('none', 'rejected'\)/i,
  );
  assert.match(promoteSql, /submission\.review_ready_at is null/i);
  assert.doesNotMatch(promoteSql, /editing_closed_at is null/i);
  assert.match(promoteSql, /status = 'in_review'/i);
  assert.match(promoteSql, /review_ready_at = coalesce\(submission\.review_ready_at, v_now\)/i);
  assert.match(
    promoteSql,
    /editing_closed_at = coalesce\(submission\.editing_closed_at, submission\.editable_until, v_now\)/i,
  );
  assert.match(
    promoteSql,
    /editing_closed_reason = coalesce\(submission\.editing_closed_reason, 'deadline_expired'\)/i,
  );
});

test("review-ready promotion is idempotent and excludes refund or active edit rows", () => {
  const promoteSql = extractFunctionSql(consistencySql, "storyofus_promote_review_ready_orders");

  assert.match(promoteSql, /submission\.review_ready_at is null/i);
  assert.match(
    promoteSql,
    /coalesce\(submission\.refund_status, 'none'\) in \('none', 'rejected'\)/i,
  );
  assert.doesNotMatch(promoteSql, /refund_status[^;]+requested/i);
  assert.match(promoteSql, /submission\.editable_until <= v_now/i);
});

test("review-ready worker cron migration is idempotent and requires existing secure infrastructure", () => {
  assert.match(cronSql, /begin;/i);
  assert.match(cronSql, /commit;/i);
  assert.match(cronSql, /pg_catalog\.to_regclass\('cron\.job'\)/i);
  assert.match(
    cronSql,
    /pg_catalog\.to_regprocedure\('net\.http_post\(text,jsonb,jsonb,jsonb,integer\)'\)/i,
  );
  assert.match(cronSql, /pg_catalog\.to_regclass\('vault\.decrypted_secrets'\)/i);
  assert.match(cronSql, /storyofus_review_ready_worker_secret/i);
  assert.match(
    cronSql,
    /from cron\.job\s+where jobname = 'storyofus-review-ready-worker-every-5-minutes'/i,
  );
  assert.match(cronSql, /if v_existing_job_id is not null then\s+return;/i);
  assert.match(cronSql, /cron\.schedule\(/i);
  assert.match(cronSql, /https:\/\/leony\.tech\/api\/internal\/storyofus\/review-ready-worker/i);
  assert.doesNotMatch(cronSql, /STORYOFUS_EMAIL_WORKER_SECRET value/);
});

function readStoryOfUsSql(filename: string) {
  return readFileSync(join(workspaceRoot, "supabase", "storyofus", filename), "utf8");
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

function extractFunctionSql(sql: string, functionName: string) {
  const pattern = new RegExp(
    `create or replace function public\\.${functionName}[\\s\\S]+?\\n\\$\\$;`,
    "i",
  );
  const match = sql.match(pattern);

  assert.ok(match, `Expected ${functionName} function to exist.`);

  return match[0];
}
