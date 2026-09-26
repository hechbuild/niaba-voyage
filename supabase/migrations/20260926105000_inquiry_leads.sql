-- Niaba Voyage CRM leads for SAIntellect recommendations
-- Applied to Supabase on 2026-09-26 and committed here for reproducibility.

create table if not exists public.inquiry_leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('NVL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  user_id uuid null references auth.users(id) on delete set null,
  lead_type text not null check (lead_type in ('flight','hotel','car','visa','corporate','custom')),
  customer_type text not null default 'individual' check (customer_type in ('individual','company','organization')),
  full_name text not null,
  email text,
  phone text,
  company_name text,
  subject text,
  message text,
  details jsonb not null default '{}'::jsonb,
  source text not null default 'website' check (source in ('website','flight_search','booking_flow','visa_form','corporate_form','contact_form')),
  status text not null default 'new' check (status in ('new','contacted','qualified','quoted','converted','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_team text generated always as (
    case
      when lead_type = 'flight' then 'ticketing'
      when lead_type = 'visa' then 'visa'
      when lead_type = 'corporate' then 'corporate'
      when lead_type in ('hotel','car') then 'travel'
      else 'sales'
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coalesce(nullif(trim(email),''), nullif(trim(phone),'')) is not null)
);

create index if not exists inquiry_leads_status_created_idx on public.inquiry_leads(status, created_at desc);
create index if not exists inquiry_leads_type_created_idx on public.inquiry_leads(lead_type, created_at desc);
create index if not exists inquiry_leads_user_idx on public.inquiry_leads(user_id) where user_id is not null;

alter table public.inquiry_leads enable row level security;

revoke all on table public.inquiry_leads from anon, authenticated;
grant insert on table public.inquiry_leads to anon, authenticated;
grant select, update, delete on table public.inquiry_leads to authenticated;

drop policy if exists inquiry_leads_insert_public on public.inquiry_leads;
create policy inquiry_leads_insert_public
on public.inquiry_leads
for insert
to anon, authenticated
with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists inquiry_leads_select_own_or_admin on public.inquiry_leads;
create policy inquiry_leads_select_own_or_admin
on public.inquiry_leads
for select
to authenticated
using (user_id = (select auth.uid()) or is_admin());

drop policy if exists inquiry_leads_update_admin on public.inquiry_leads;
create policy inquiry_leads_update_admin
on public.inquiry_leads
for update
to authenticated
using (is_admin())
with check (is_admin());

drop policy if exists inquiry_leads_delete_admin on public.inquiry_leads;
create policy inquiry_leads_delete_admin
on public.inquiry_leads
for delete
to authenticated
using (is_admin());
