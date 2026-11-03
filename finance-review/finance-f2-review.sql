-- BDS FINANCE CENTRE F2: UNAPPLIED review candidate, TEST DATA ONLY.
-- Intended for a SEPARATE private BDS finance Supabase project, NOT the
-- live Disclosure Desk project. Do not apply to production or use real user IDs.
-- IMPORTANT: Authorisation uses an operator-seeded, private owner allowlist,
-- the signed-in Supabase auth.uid and AAL2 MFA. Never expose a client service key.
-- Prototype table is append-only: owner SELECT + INSERT only, no UPDATE/DELETE.
-- Do not install this file under supabase/migrations.

begin;

create schema if not exists bds_finance_private;
revoke all on schema bds_finance_private from public, anon, authenticated;
-- Usage allows evaluating is_owner_mfa() from RLS; schema is NOT in API exposed schemas.
grant usage on schema bds_finance_private to authenticated;

create table if not exists bds_finance_private.owner_accounts (
 user_id uuid primary key references auth.users(id) on delete restrict,
 enabled boolean not null default false,
 approved_at timestamptz not null default now()
);
alter table bds_finance_private.owner_accounts enable row level security;
revoke all on bds_finance_private.owner_accounts from public, anon, authenticated;
-- NO public policy or owner provisioning RPC. Provision and revoke server-side only.
-- Do not put any real owner's UUID in source or test fixtures.

create or replace function bds_finance_private.is_owner_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
 select
   (select auth.uid()) is not null
   and coalesce(auth.jwt()->>'aal','') = 'aal2'
   and coalesce(auth.jwt()->>'is_anonymous','true') = 'false'
   and exists (
     select 1 from bds_finance_private.owner_accounts ao
     where ao.user_id=(select auth.uid()) and ao.enabled=true
   );
$fn$;
revoke all on function bds_finance_private.is_owner_mfa() from public, anon, authenticated;
grant execute on function bds_finance_private.is_owner_mfa() to authenticated;

-- This review candidate exposes no other private tables or policy helpers.
-- Deploy only in a new dedicated finance project after review.
create table if not exists public.bds_finance_entries (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete restrict,
 source_date date not null,
 product text not null check (product in ('Disclosure Desk','Our Cinema','W.NE','BDS shared')),
 provider text not null check (provider in ('Ko-fi','AdSense','Google Play','Hosting','Other')),
 provider_ref text not null check (length(provider_ref) between 1 and 120),
 kind text not null check (kind in ('income','fee','refund','expense','estimate','payout')),
 amount_gbp_pence bigint not null check (amount_gbp_pence between 1 and 99999999999),
 currency text not null default 'GBP' check (currency='GBP'),
 description text not null check (length(description) between 1 and 160),
 created_at timestamptz not null default now(),
 unique(owner_id,provider,provider_ref,kind)
);

alter table public.bds_finance_entries enable row level security;
alter table public.bds_finance_entries force row level security;
revoke all on public.bds_finance_entries from public, anon, authenticated;
grant select,insert on public.bds_finance_entries to authenticated;

drop policy if exists bds_finance_read on public.bds_finance_entries;
create policy bds_finance_read on public.bds_finance_entries
for select to authenticated
using (
 owner_id=(select auth.uid()) and
 (select bds_finance_private.is_owner_mfa())
);

drop policy if exists bds_finance_append on public.bds_finance_entries;
create policy bds_finance_append on public.bds_finance_entries
for insert to authenticated
with check (
 owner_id=(select auth.uid()) and
 (select bds_finance_private.is_owner_mfa())
);

-- Absence of UPDATE/DELETE permissions is intentional: corrections as new
-- ledger events, with append-only audit trail. No service-role grants here.
-- Server application must also enforce owner session and MFA before finance API.
commit;
