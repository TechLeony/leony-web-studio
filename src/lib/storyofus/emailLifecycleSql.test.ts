import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();

test("customer lifecycle outbox migration only allows the four customer email types", () => {
  const sql = readMigration("email-outbox-customer-lifecycle.sql");

  assert.match(sql, /conrelid = 'public\.storyofus_email_outbox'::regclass/);
  assert.match(sql, /'checkout_created'/);
  assert.match(sql, /'order_created'/);
  assert.match(sql, /'setup_submitted'/);
  assert.match(sql, /'final_site_ready'/);
  assert.doesNotMatch(sql, /admin/i);
  assert.doesNotMatch(sql, /grant\s+/i);
  assert.doesNotMatch(sql, /alter table public\.storyofus_email_outbox enable row level security/i);
});

test("final publish migration keeps publish durable when final email enqueue fails", () => {
  const sql = readMigration("final-site-publishing-email-best-effort.sql");
  const normalizedSql = normalizeSql(sql);

  assert.match(sql, /update public\.storyofus_submissions/);
  assert.match(sql, /insert into public\.storyofus_email_outbox/);
  assert.match(sql, /on conflict \(submission_id, email_type\) do nothing/);
  assert.match(sql, /exception\s+when others then\s+v_email_inserted_count := 0;/i);
  assert.match(
    normalizedSql,
    /if v_email_inserted_count > 0 then email_queued := true; else email_queued := exists \( select 1 from public\.storyofus_email_outbox where submission_id = v_submission\.id and email_type = 'final_site_ready' \); end if;/,
  );
  assert.doesNotMatch(sql, /email_queued := v_email_inserted_count > 0;/);
});

function readMigration(filename: string) {
  return readFileSync(join(workspaceRoot, "supabase", "storyofus", filename), "utf8");
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}
