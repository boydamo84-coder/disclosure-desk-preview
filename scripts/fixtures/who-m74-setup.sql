\set ON_ERROR_STOP on
-- DISPOSABLE GITHUB ACTIONS DATABASE ONLY. All identities and claims are fictional.
create role m65_reviewer_a login;
create role m65_reviewer_b login;
grant dd_who_m65_reviewer to m65_reviewer_a, m65_reviewer_b;
insert into public.dd_who_m63_claim_versions
(claim_id,claim_version,statement,original_source_url,eligible,enabled,reviewed_at)
values
('m74-publish-first-claim',1,'Fictional allegation for the publish-first lock race; not a real UAP account.','https://example.org/m74-publication',true,true,now()),
('m74-member-first-claim',1,'Fictional allegation for the member-first lock race; not a real UAP account.','https://example.org/m74-member',true,true,now());
alter table public.dd_who_m63_member_ballots disable trigger dd_who_m63_ballot_guard_trigger;
insert into public.dd_who_m63_member_ballots
(user_id,claim_id,claim_version,original_points,independent_points,updated_at)
select ('00000000-0000-4000-8000-'||lpad((5000+i)::text,12,'0'))::uuid,
'm74-publish-first-claim',1,0,0,clock_timestamp()-interval '20 minutes'
from generate_series(1,12) i;
insert into public.dd_who_m63_member_ballots
(user_id,claim_id,claim_version,original_points,independent_points,updated_at)
select ('00000000-0000-4000-8000-'||lpad((6000+i)::text,12,'0'))::uuid,
'm74-member-first-claim',1,0,0,clock_timestamp()-interval '20 minutes'
from generate_series(1,12) i;
alter table public.dd_who_m63_member_ballots enable trigger dd_who_m63_ballot_guard_trigger;
select dd_who_m65_private.prepare_result('m74-publish-first-claim',1);
select dd_who_m65_private.prepare_result('m74-member-first-claim',1);
set session authorization m65_reviewer_a;
insert into dd_who_m65_private.reviews(claim_id,claim_version,digest)
select claim_id,claim_version,digest from dd_who_m65_private.drafts;
reset session authorization;
set session authorization m65_reviewer_b;
insert into dd_who_m65_private.reviews(claim_id,claim_version,digest)
select claim_id,claim_version,digest from dd_who_m65_private.drafts;
reset session authorization;
do $m74$
begin
 if (select count(*) from dd_who_m65_private.drafts)<>2
   or (select count(*) from dd_who_m65_private.reviews)<>4
   or (select count(*) from public.dd_who_m63_member_ballots)<>24
   or (select count(*) from public.dd_who_m63_public_snapshots)<>0
 then raise exception 'Incorrect fictional setup or premature public aggregate'; end if;
end$m74$;
set role anon;
do $m74$
begin
 begin
  perform 1 from public.dd_who_m63_member_ballots;
  raise exception 'Anonymous guest gained private ballot SELECT';
 exception when insufficient_privilege then null;end;
end$m74$;
reset role;
select 'M74 SETUP PASS: two unpublished claims, 24 fictional ballots, two distinct reviewer roles' as result;
