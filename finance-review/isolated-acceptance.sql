-- F2 DISPOSABLE isolated security assertions for synthetic owner/attacker.
-- This file MUST NOT be run on any real Supabase project.
\set ON_ERROR_STOP on

-- Admin provisioning in disposable DB. No real owner identity in the repo.
insert into bds_finance_private.owner_accounts(user_id,enabled)
values ('00000000-0000-0000-0000-000000000001',true);

-- No table access was granted to PUBLIC/anon, and private allowlist must
-- have no authenticated/anon raw read privileges.
do $test$
begin
 if has_table_privilege('anon','public.bds_finance_entries','SELECT')
    or has_table_privilege('anon','public.bds_finance_entries','INSERT')
    or has_table_privilege('authenticated','bds_finance_private.owner_accounts','SELECT')
    or has_table_privilege('authenticated','public.bds_finance_entries','UPDATE')
    or has_table_privilege('authenticated','public.bds_finance_entries','DELETE')
 then raise exception 'Unsafe table privilege';end if;
 if not (select relrowsecurity from pg_class where oid='public.bds_finance_entries'::regclass)
 then raise exception 'Ledger RLS disabled';end if;
end $test$;

-- Owner with MFA can add and view exactly one own ledger event.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set local request.jwt.claims = '{"aal":"aal2","is_anonymous":false}';
do $test$
declare n integer;
begin
 if not bds_finance_private.is_owner_mfa() then raise exception 'MFA owner denied';end if;
 insert into public.bds_finance_entries(owner_id,source_date,product,provider,provider_ref,kind,amount_gbp_pence,description)
 values ('00000000-0000-0000-0000-000000000001','2026-11-03','Disclosure Desk','Ko-fi','fictional-kofi-1','income',2500,'Synthetic test donation');
 select count(*) into n from public.bds_finance_entries;
 if n<>1 then raise exception 'Owner SELECT count %, expected 1',n;end if;
end $test$;
commit;

-- A different authenticated user, even with AAL2, sees no owner data,
-- and cannot forge the owner's owner_id on INSERT.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
set local request.jwt.claims = '{"aal":"aal2","is_anonymous":false}';
do $test$
declare n integer;denied boolean:=false;
begin
 if bds_finance_private.is_owner_mfa() then raise exception 'Attacker marked owner';end if;
 select count(*) into n from public.bds_finance_entries;
 if n<>0 then raise exception 'Attacker saw owner ledger';end if;
 begin
  insert into public.bds_finance_entries(owner_id,source_date,product,provider,provider_ref,kind,amount_gbp_pence,description)
  values ('00000000-0000-0000-0000-000000000001','2026-11-03','Disclosure Desk','Ko-fi','forged','income',100,'Fake');
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Attacker forged owner insert';end if;
end $test$;
rollback;

-- Owner who has not passed second-factor AAL2 sees no records.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set local request.jwt.claims = '{"aal":"aal1","is_anonymous":false}';
do $test$
declare n integer;
begin
 if bds_finance_private.is_owner_mfa() then raise exception 'AAL1 passed owner gate';end if;
 select count(*) into n from public.bds_finance_entries;
 if n<>0 then raise exception 'AAL1 saw ledger';end if;
end $test$;
rollback;

-- An anonymous Auth user is mapped to 'authenticated' but must be denied.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set local request.jwt.claims = '{"aal":"aal2","is_anonymous":true}';
do $test$
declare n integer;
begin
 if bds_finance_private.is_owner_mfa() then raise exception 'Anonymous auth passed owner gate';end if;
 select count(*) into n from public.bds_finance_entries;
 if n<>0 then raise exception 'Anonymous auth saw ledger';end if;
end $test$;
rollback;

-- Logged-out role has no SELECT grant and cannot call private owner helper.
begin;
set local role anon;
do $test$
declare denied boolean:=false;
begin
 begin
  perform count(*) from public.bds_finance_entries;
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Guest can read ledger';end if;
end $test$;
rollback;

-- The real owner cannot update or delete previously booked transactions,
-- and cannot re-use a provider+kind+reference (import idempotency).
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set local request.jwt.claims = '{"aal":"aal2","is_anonymous":false}';
do $test$
declare denied boolean:=false;duplicate boolean:=false;
begin
 begin
  update public.bds_finance_entries set amount_gbp_pence=1 where provider_ref='fictional-kofi-1';
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Unauthorised UPDATE allowed';end if;
 denied:=false;
 begin
  delete from public.bds_finance_entries where provider_ref='fictional-kofi-1';
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Unauthorised DELETE allowed';end if;
 begin
  insert into public.bds_finance_entries(owner_id,source_date,product,provider,provider_ref,kind,amount_gbp_pence,description)
  values ('00000000-0000-0000-0000-000000000001','2026-11-03','Disclosure Desk','Ko-fi','fictional-kofi-1','income',2500,'Duplicate');
 exception when unique_violation then duplicate:=true;end;
 if not duplicate then raise exception 'Duplicate provider receipt accepted';end if;
end $test$;
rollback;

-- Immediately revoking allowlist denies existing synthetic owner's access.
update bds_finance_private.owner_accounts set enabled=false where user_id='00000000-0000-0000-0000-000000000001';
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set local request.jwt.claims = '{"aal":"aal2","is_anonymous":false}';
do $test$
declare n integer;
begin
 if bds_finance_private.is_owner_mfa() then raise exception 'Revoked owner still authorised';end if;
 select count(*) into n from public.bds_finance_entries;
 if n<>0 then raise exception 'Revoked owner saw ledger';end if;
end $test$;
rollback;

select 'PASS: Finance F2 synthetic owner, MFA, non-owner, anonymous Auth, unauthenticated, append-only, duplicate and revoke guards' as result;
