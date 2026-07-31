begin;

do $$
declare
  v_existing_job_id bigint;
begin
  if pg_catalog.to_regclass('cron.job') is null then
    raise exception 'pg_cron is not available. Enable pg_cron before scheduling StoryOfUs review-ready worker.';
  end if;

  if pg_catalog.to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    raise exception 'pg_net http_post is not available. Enable pg_net before scheduling StoryOfUs review-ready worker.';
  end if;

  if pg_catalog.to_regclass('vault.decrypted_secrets') is null then
    raise exception 'Supabase Vault decrypted_secrets is not available. Store the worker secret before scheduling StoryOfUs review-ready worker.';
  end if;

  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'storyofus_review_ready_worker_secret'
      and decrypted_secret is not null
      and pg_catalog.length(decrypted_secret) >= 32
  ) then
    raise exception 'Missing Vault secret storyofus_review_ready_worker_secret.';
  end if;

  select jobid
  into v_existing_job_id
  from cron.job
  where jobname = 'storyofus-review-ready-worker-every-5-minutes'
  limit 1;

  if v_existing_job_id is not null then
    return;
  end if;

  perform cron.schedule(
    'storyofus-review-ready-worker-every-5-minutes',
    '*/5 * * * *',
    $cron$
    select net.http_post(
      url := 'https://leony.tech/api/internal/storyofus/review-ready-worker',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'storyofus_review_ready_worker_secret'
          limit 1
        ),
        'Content-Type',
        'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
end $$;

commit;
