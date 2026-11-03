'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql','utf8');
const js=fs.readFileSync('assets/community-discussions.js','utf8');
const config=fs.readFileSync('assets/community-test-config.js','utf8');
assert.match(sql,/UNAPPLIED DISCUSSIONS \/ SECTION STEWARDSHIP REVIEW/);
const tables=['dd_forum_sections','dd_forum_threads','dd_forum_replies','dd_forum_flags',
 'dd_forum_votes','dd_forum_escalations','dd_forum_owner_admins','dd_forum_audit'];
for(const table of tables){
 assert.ok(sql.includes('create table if not exists public.'+table+'('),'Missing table '+table);
 assert.ok(sql.includes('alter table public.'+table+' enable row level security;'),'RLS missing '+table);
}
assert.match(sql,/revoke all on table[\s\S]*from PUBLIC,anon,authenticated/,'No direct public table access');
assert.match(sql,/create table if not exists public.dd_forum_owner_admins/);
assert.match(sql,/steward_id uuid references auth.users/,'Steward scoped to section');
assert.doesNotMatch(sql,/ban_member|ban_user|kick_member|require_approval|shadow_ban|grant (?:select|update|delete|insert) on table public\.dd_forum/i,'No gatekeeper powers');
assert.match(sql,/primary key\(target_kind,target_id,reporter_id\)/,'Distinct registered flaggers');
assert.match(sql,/if flags>=5 then/,'Five separate flags trigger temporary hide');
assert.match(sql,/original_author=actor/,'Cannot flag own post');
assert.match(sql,/for update of t/,'Concurrent thread flags serialised');
assert.match(sql,/for update of r/,'Concurrent reply flags serialised');
assert.match(sql,/actor is distinct from steward and not public\.dd_discussions_is_owner\(\)/,'Pin and escalation limited to steward / owner');
assert.match(sql,/Maximum three pinned topics per section/);
assert.match(sql,/select 1 from public.dd_forum_owner_admins a where a.user_id=auth.uid\(\)/,'Owner permission server-side');
assert.match(sql,/where t.section_id=p_section_id and t.status='published' and s.status='published'/);
assert.match(sql,/case when n.is_public then n.display_name else 'Community member' end/,'Alias-only public read');
assert.match(sql,/New accounts must be at least 24 hours old to create sections/);
assert.match(sql,/Maximum two new sections per account in 24 hours/);
assert.match(sql,/Daily topic limit reached/);
assert.match(sql,/Reply rate limit reached/);
assert.match(sql,/Daily report limit reached/);
assert.match(sql,/Daily escalation limit reached/);
for(const name of ['dd_discussions_sections','dd_discussions_threads','dd_discussions_replies',
 'dd_discussions_create_section','dd_discussions_create_thread','dd_discussions_reply',
 'dd_discussions_vote','dd_discussions_flag','dd_discussions_pin','dd_discussions_escalate',
 'dd_discussions_update_section','dd_discussions_edit_own','dd_discussions_withdraw_own',
 'dd_discussions_owner_review','dd_discussions_owner_set_steward','dd_discussions_owner_queue']){
 assert.ok(sql.includes('create or replace function public.'+name+'('),'Missing RPC '+name);
 assert.ok(sql.includes('revoke all on function public.'+name+'('),'Missing revoke '+name);
 assert.ok(sql.includes('grant execute on function public.'+name+'('),'Missing grants '+name);
}
for(const n of ['dd_discussions_sections','dd_discussions_threads','dd_discussions_replies']){
 assert.match(sql,new RegExp('grant execute on function public\\.'+n+'\\([^;]+?\\) to anon,authenticated;'),'Guest read '+n);
}
assert.match(sql,/creator_id uuid references auth.users\(id\) on delete set null/,'Founder account removal must not delete community section');
assert.match(sql,/author_id uuid references auth.users\(id\) on delete set null/,'Post author removal can be anonymised');
assert.match(sql,/submitted_by uuid references auth.users\(id\) on delete set null/,'Escalation author's account can be deleted');
assert.match(sql,/body='\[Removed by author\]'/,'Author withdraw must preserve body check while clearing original text');
assert.match(sql,/or char_length\(btrim\(p_body\)\)>case when p_kind='thread' then 5000 else 2000 end/,'Thread author edits retain 5000-character limit');
assert.match(sql,/select 'thread'::text as kind/,'Owner queue includes threads');
assert.match(sql,/select 'reply'::text as kind/,'Owner queue includes replies');
assert.match(sql,/if not found then raise exception 'Discussion unavailable';end if;/,'Anonymised former authors must not disable flags');
assert.doesNotMatch(sql,/insert into public.dd_forum_owner_admins/,'No owner accounts from Git');
assert.match(config,/discussions:false/,'Not activated');
assert.match(js,/flags\.discussions===true/,'Browser stays gated');
assert.doesNotMatch(sql,/create policy .*dd_forum_/i,'No implicit browser table read policies');
console.log('PASS: unapplied Discussions candidate guards section stewardship, owner override, flags, distinct votes, guest read and privileged RPCs. Database execution and synthetic role tests are still required.');
