-- Security hardening for public leads, profiles and affiliate tracking.
revoke all on table public.bookings, public.profiles, public.payments, public.affiliates, public.commissions, public.referrals from anon;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role_change_forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_before_update on public.profiles;
create trigger protect_profile_role_before_update
before update on public.profiles
for each row execute function public.protect_profile_role();

alter table public.inquiry_leads
  add constraint inquiry_leads_full_name_len check (char_length(full_name) between 1 and 120) not valid,
  add constraint inquiry_leads_email_len check (email is null or char_length(email) <= 254) not valid,
  add constraint inquiry_leads_phone_len check (phone is null or char_length(phone) <= 40) not valid,
  add constraint inquiry_leads_company_len check (company_name is null or char_length(company_name) <= 160) not valid,
  add constraint inquiry_leads_subject_len check (subject is null or char_length(subject) <= 200) not valid,
  add constraint inquiry_leads_message_len check (message is null or char_length(message) <= 4000) not valid,
  add constraint inquiry_leads_details_size check (octet_length(details::text) <= 12000) not valid;

create or replace function public.rate_limit_inquiry_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.inquiry_leads l
    where l.created_at > now() - interval '45 seconds'
      and (
        (new.email is not null and l.email is not null and lower(l.email) = lower(new.email))
        or
        (new.phone is not null and l.phone is not null and l.phone = new.phone)
      )
  ) then
    raise exception 'lead_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists rate_limit_inquiry_lead_before_insert on public.inquiry_leads;
create trigger rate_limit_inquiry_lead_before_insert
before insert on public.inquiry_leads
for each row execute function public.rate_limit_inquiry_lead();

create or replace function public.track_affiliate_referral(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id uuid;
  v_referral_id uuid;
begin
  if p_code is null or p_code !~ '^[A-Za-z0-9_-]{3,64}$' then
    return null;
  end if;

  select id into v_affiliate_id
  from public.affiliates
  where upper(code) = upper(p_code)
  limit 1;

  if v_affiliate_id is null then
    return null;
  end if;

  insert into public.referrals(affiliate_id, status)
  values (v_affiliate_id, 'tracked')
  returning id into v_referral_id;

  return v_referral_id;
end;
$$;

revoke all on function public.track_affiliate_referral(text) from public;
grant execute on function public.track_affiliate_referral(text) to anon, authenticated;
