import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();
const migrationSql = readMigration("setup-finalization-edit-limit.sql");
const normalizedSql = normalizeSql(migrationSql);

test("Phase 2A migration adds edit counters, edit closure, and refund deadline fields safely", () => {
  assert.match(migrationSql, /add column if not exists edit_limit integer not null default 2/i);
  assert.match(migrationSql, /add column if not exists edits_used integer not null default 0/i);
  assert.match(migrationSql, /add column if not exists editing_closed_at timestamptz/i);
  assert.match(migrationSql, /add column if not exists editing_closed_reason text/i);
  assert.match(migrationSql, /add column if not exists refund_request_until timestamptz/i);
  assert.match(migrationSql, /check \(edit_limit > 0\)/i);
  assert.match(migrationSql, /check \(edits_used >= 0\)/i);
  assert.match(migrationSql, /check \(edits_used <= edit_limit\)/i);
  assert.match(migrationSql, /'edit_limit_reached'/);
  assert.match(migrationSql, /'deadline_expired'/);
  assert.match(migrationSql, /'admin_locked'/);
});

test("Phase 2A backfill preserves deadlines and does not invent edit usage", () => {
  assert.match(
    normalizedSql,
    /update public\.storyofus_submissions set refund_request_until = editable_until where refund_request_until is null and editable_until is not null;/i,
  );
  assert.match(migrationSql, /Historical edit usage is not invented/i);
  assert.doesNotMatch(migrationSql, /set\s+edits_used\s*=\s*edit_limit/i);
  assert.doesNotMatch(migrationSql, /editable_until\s*=\s*pg_catalog\.now\(\)\s*\+\s*interval/i);
});

test("atomic setup finalization RPC locks the order and owns final persistence", () => {
  assert.match(
    migrationSql,
    /create or replace function public\.storyofus_finalize_setup_submission/i,
  );
  assert.match(migrationSql, /security definer/i);
  assert.match(migrationSql, /set search_path = pg_catalog/i);
  assert.match(
    normalizedSql,
    /where setup_token = pg_catalog\.btrim\(p_setup_token\)::uuid for update;/i,
  );
  assert.match(migrationSql, /delete from public\.storyofus_couple_details/i);
  assert.match(migrationSql, /delete from public\.storyofus_music/i);
  assert.match(migrationSql, /delete from public\.storyofus_timeline_items/i);
  assert.match(migrationSql, /delete from public\.storyofus_letters/i);
  assert.match(migrationSql, /insert into public\.storyofus_couple_details/i);
  assert.match(migrationSql, /insert into public\.storyofus_music/i);
  assert.match(migrationSql, /insert into public\.storyofus_timeline_items/i);
  assert.match(migrationSql, /insert into public\.storyofus_letters/i);
  assert.match(migrationSql, /perform public\.storyofus_validate_finalization_media/i);
  assert.match(migrationSql, /perform public\.storyofus_apply_media_metadata/i);
});

test("atomic setup finalization RPC implements first submit and two edit transitions", () => {
  assert.match(
    normalizedSql,
    /v_submission_kind := 'first_submit'; v_next_editable_until := v_now \+ interval '3 hours'; v_next_refund_until := v_next_editable_until; v_next_edits_used := 0; v_next_status := 'submitted';/i,
  );
  assert.match(normalizedSql, /v_next_edits_used := v_submission\.edits_used \+ 1;/i);
  assert.match(
    normalizedSql,
    /if v_next_edits_used >= v_submission\.edit_limit then v_submission_kind := 'edit_limit_reached'; v_next_status := 'in_review';/i,
  );
  assert.match(
    normalizedSql,
    /v_next_review_ready_at := pg_catalog\.coalesce\(v_submission\.review_ready_at, v_now\);/i,
  );
  assert.match(normalizedSql, /v_next_editing_closed_reason := 'edit_limit_reached';/i);
  assert.match(
    normalizedSql,
    /else v_submission_kind := 'edit_submit'; v_next_status := 'submitted';/i,
  );
  assert.match(
    normalizedSql,
    /if v_submission\.edits_used >= v_submission\.edit_limit then raise exception 'This setup form has reached its edit limit\.';/i,
  );
  assert.match(
    normalizedSql,
    /v_effective_editable_until is null or v_effective_editable_until <= v_now or v_submission\.editing_closed_at is not null/i,
  );
  assert.match(normalizedSql, /refund_request_until = v_next_refund_until/i);
  assert.match(
    normalizedSql,
    /last_resubmitted_at = case when v_submission\.status = 'draft' then null else v_now end/i,
  );
});

test("RPC validates durable media ownership and exact destinations inside SQL", () => {
  assert.match(migrationSql, /create or replace function public\.storyofus_require_media_row/i);
  assert.match(migrationSql, /submission_id = p_submission_id/i);
  assert.match(migrationSql, /section = p_section/i);
  assert.match(migrationSql, /semantic_key = p_semantic_key/i);
  assert.match(migrationSql, /section_item_id = p_section_item_id/i);
  assert.match(migrationSql, /media_type = p_media_type/i);
  assert.match(migrationSql, /storage_bucket = 'storyofus-media'/i);
  assert.match(migrationSql, /storage_path not like 'blob:%'/i);
  assert.match(migrationSql, /storage_path not like 'https:\/\/%'/i);
  assert.match(migrationSql, /'gallery_photo'/);
  assert.match(migrationSql, /'love_letter_side_photo'/);
  assert.match(migrationSql, /'timeline_item'/);
  assert.match(migrationSql, /'voice_note'/);
});

test("setup media upload commit RPC locks edit access before mutating media", () => {
  assert.match(
    migrationSql,
    /create or replace function public\.storyofus_commit_setup_media_upload/i,
  );
  assert.match(
    normalizedSql,
    /where setup_token = pg_catalog\.btrim\(p_setup_token\)::uuid for update;/i,
  );
  assert.match(normalizedSql, /if v_submission\.status = 'draft' then null;/i);
  assert.match(
    normalizedSql,
    /elsif v_submission\.status = 'submitted' then v_effective_editable_until := v_submission\.editable_until;/i,
  );
  assert.match(
    normalizedSql,
    /v_effective_editable_until is null or v_effective_editable_until <= v_now or v_submission\.editing_closed_at is not null or v_submission\.edits_used >= v_submission\.edit_limit/i,
  );
  assert.match(normalizedSql, /result := 'edit_closed';/i);
  assert.match(normalizedSql, /insert into public\.storyofus_media/i);
  assert.match(
    normalizedSql,
    /delete from public\.storyofus_media where submission_id = v_submission\.id/i,
  );
  assert.match(normalizedSql, /result := 'committed';/i);
});

test("setup media remove RPC locks edit access before deleting media", () => {
  assert.match(migrationSql, /create or replace function public\.storyofus_remove_setup_media/i);
  assert.match(
    normalizedSql,
    /where setup_token = pg_catalog\.btrim\(p_setup_token\)::uuid for update;/i,
  );
  assert.match(
    normalizedSql,
    /delete from public\.storyofus_media where submission_id = v_submission\.id and section = p_section and semantic_key = p_semantic_key and section_item_id = p_section_item_id;/i,
  );
  assert.match(normalizedSql, /get diagnostics v_removed_count = row_count;/i);
  assert.match(normalizedSql, /result := 'removed';/i);
});

test("review-ready worker replacement closes editing without regressing second-edit in_review orders", () => {
  assert.match(
    migrationSql,
    /create or replace function public\.storyofus_promote_review_ready_orders/i,
  );
  assert.match(migrationSql, /and status = 'submitted'/i);
  assert.match(migrationSql, /and editing_closed_at is null/i);
  assert.match(
    migrationSql,
    /editing_closed_at = coalesce\(submission\.editing_closed_at, submission\.editable_until, v_now\)/i,
  );
  assert.match(
    migrationSql,
    /editing_closed_reason = coalesce\(submission\.editing_closed_reason, 'deadline_expired'\)/i,
  );
});

test("publishing remains blocked until refund request window closes", () => {
  assert.match(migrationSql, /create or replace function public\.storyofus_publish_final_site/i);
  assert.match(
    normalizedSql,
    /or coalesce\(v_submission\.refund_request_until, v_submission\.editable_until\) is null or coalesce\(v_submission\.refund_request_until, v_submission\.editable_until\) > v_now/i,
  );
  assert.match(
    normalizedSql,
    /and coalesce\(refund_request_until, editable_until\) is not null and coalesce\(refund_request_until, editable_until\) <= v_now/i,
  );
  assert.match(
    migrationSql,
    /pg_catalog\.coalesce\(v_submission\.refund_status, 'none'\) not in \('none', 'rejected'\)/i,
  );
});

test("Phase 2A functions are not executable by browser roles", () => {
  assert.match(
    migrationSql,
    /revoke all privileges on function public\.storyofus_finalize_setup_submission\(text, jsonb, text, text, timestamptz, jsonb\)\s+from public, anon, authenticated;/i,
  );
  assert.match(
    migrationSql,
    /revoke all privileges on function public\.storyofus_commit_setup_media_upload\(text, text, text, text, text, text, text, text, text, bigint, text, integer\)\s+from public, anon, authenticated;/i,
  );
  assert.match(
    migrationSql,
    /revoke all privileges on function public\.storyofus_remove_setup_media\(text, text, text, text\)\s+from public, anon, authenticated;/i,
  );
  assert.match(
    migrationSql,
    /grant execute on function public\.storyofus_finalize_setup_submission\(text, jsonb, text, text, timestamptz, jsonb\)\s+to service_role;/i,
  );
  assert.match(
    migrationSql,
    /grant execute on function public\.storyofus_commit_setup_media_upload\(text, text, text, text, text, text, text, text, text, bigint, text, integer\)\s+to service_role;/i,
  );
  assert.match(
    migrationSql,
    /grant execute on function public\.storyofus_remove_setup_media\(text, text, text, text\)\s+to service_role;/i,
  );
  assert.match(
    migrationSql,
    /grant execute on function public\.storyofus_promote_review_ready_orders\(integer, boolean\)\s+to service_role;/i,
  );
  assert.match(
    migrationSql,
    /grant execute on function public\.storyofus_publish_final_site\(uuid, text, text, text\)\s+to service_role;/i,
  );
});

function readMigration(filename: string) {
  return readFileSync(join(workspaceRoot, "supabase", "storyofus", filename), "utf8");
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}
