begin;

do $$
declare
  v_existing_job_id bigint;
begin
  if pg_catalog.to_regclass('cron.job') is null then
    raise exception 'pg_cron is not available. Enable pg_cron before scheduling StoryOfUs email worker.';
  end if;

  if pg_catalog.to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    raise exception 'pg_net http_post is not available. Enable pg_net before scheduling StoryOfUs email worker.';
  end if;

  if pg_catalog.to_regprocedure('cron.unschedule(bigint)') is null then
    raise exception 'pg_cron unschedule is not available. Enable pg_cron before scheduling StoryOfUs email worker.';
  end if;

  if pg_catalog.to_regclass('vault.decrypted_secrets') is null then
    raise exception 'Supabase Vault decrypted_secrets is not available. Store the worker secret before scheduling StoryOfUs email worker.';
  end if;

  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'storyofus_email_worker_secret'
      and decrypted_secret is not null
      and pg_catalog.length(decrypted_secret) >= 32
  ) then
    raise exception 'Missing Vault secret storyofus_email_worker_secret.';
  end if;

  for v_existing_job_id in
    select jobid
    from cron.job
    where jobname in (
      'storyofus-email-worker-every-minute',
      'storyofus-email-worker-every-5-minutes'
    )
      or command ilike '%/api/internal/storyofus/email-worker%'
  loop
    perform cron.unschedule(v_existing_job_id);
  end loop;

  perform cron.schedule(
    'storyofus-email-worker-every-minute',
    '* * * * *',
    $cron$
    select net.http_post(
      url := 'https://leony.tech/api/internal/storyofus/email-worker',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'storyofus_email_worker_secret'
          limit 1
        ),
        'Content-Type',
        'application/json'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
    $cron$
  );
end $$;

commit;
