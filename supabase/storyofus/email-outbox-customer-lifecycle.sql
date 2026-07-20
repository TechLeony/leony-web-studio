begin;

do $$
declare
  v_constraint_name text;
begin
  select conname
  into v_constraint_name
  from pg_catalog.pg_constraint
  where conrelid = 'public.storyofus_email_outbox'::regclass
    and contype = 'c'
    and pg_catalog.pg_get_constraintdef(oid) like '%email_type%'
  limit 1;

  if v_constraint_name is not null then
    execute pg_catalog.format(
      'alter table public.storyofus_email_outbox drop constraint %I',
      v_constraint_name
    );
  end if;
end $$;

alter table public.storyofus_email_outbox
add constraint storyofus_email_outbox_email_type_check
check (
  email_type in (
    'checkout_created',
    'order_created',
    'setup_submitted',
    'final_site_ready'
  )
);

commit;
