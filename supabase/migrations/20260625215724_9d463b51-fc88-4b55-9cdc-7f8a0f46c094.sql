
-- Drop existing/legacy policies
drop policy if exists "Anyone can submit a lead" on public.leads;
drop policy if exists "Allow public read access" on public.leads;
drop policy if exists "Allow all access" on public.leads;
drop policy if exists "RLS Policy Always True" on public.leads;
drop policy if exists "Allow public insert" on public.leads;
drop policy if exists "Allow public lead submissions" on public.leads;

-- Ensure RLS is enabled and enforced
alter table public.leads enable row level security;
alter table public.leads force row level security;

-- Tighten table privileges: only inserts exposed to public API roles
revoke all on public.leads from anon, authenticated;
grant insert on public.leads to anon, authenticated;
grant all on public.leads to service_role;

-- Insert policy with a meaningful CHECK (not "true") to satisfy linter
-- and provide basic server-side validation of contact submissions.
create policy "Public can submit leads"
on public.leads
for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 120
  and char_length(trim(email)) between 3 and 255
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  and char_length(trim(message)) between 1 and 2000
  and char_length(coalesce(business_category, '')) <= 80
  and char_length(coalesce(custom_business_category, '')) <= 120
  and char_length(coalesce(phone, '')) <= 40
  and preferred_contact_method in ('WhatsApp', 'Mail')
);

-- No SELECT / UPDATE / DELETE policies => fully blocked for anon & authenticated.
-- service_role bypasses RLS for backend/admin access.
