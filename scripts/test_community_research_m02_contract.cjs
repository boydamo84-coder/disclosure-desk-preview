'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sql=read('docs/COMMUNITY_RESEARCH_M02_SQL_DRAFT_ONLY.sql');
const tests=read('scripts/fixtures/community-research-m02-rls-test.sql');
const flags=read('assets/community-test-config.js');
const wne=read('research/wne-cloud-bridge.js');
const page=read('community-research.html');
const registry=['dd_cr_drafts','dd_cr_publications','dd_cr_editions','dd_cr_votes','dd_cr_comments','dd_cr_reports'];
for(const name of registry){
 assert(sql.includes('create table public.'+name),name+' table missing');
 assert(sql.includes('alter table public.'+name+' enable row level security'),name+' RLS missing');
 assert(sql.includes('revoke all on'+(name==='dd_cr_drafts'||name==='dd_cr_editions'||name==='dd_cr_publications'?' table':'')+' public.'+name)
 ||sql.includes('revoke all on table public.'+name),name+' privilege revocation missing');
}
assert(sql.includes('not null default auth.uid()'));
assert(sql.includes('auth.jwt()')&&sql.includes('is_anonymous'));
assert(sql.includes('on delete cascade'));
assert(sql.includes('grant insert (title,abstract,body,paper_type,source_urls)'));
assert(sql.includes('grant update (title,abstract,body,paper_type,source_urls)'));
assert(sql.includes('grant insert (paper_id,value)'));
assert(sql.includes('grant insert (paper_id,parent_id,category,body)'));
assert(sql.includes('dd_cr_edition_read_if_paper_visible'));
assert(sql.includes("status='published'"));
assert(sql.includes('create trigger dd_cr_comment_guard'));
assert(sql.includes('create trigger dd_cr_vote_guard'));
assert(sql.includes('create trigger dd_cr_draft_guard'));
assert(!/\bsecurity\s+definer\b/i.test(sql.replace(/--[^\n]*/g,'')),'Public definer function prohibited at M02');
assert(!/\bgrant\s+(?:insert|update|delete)\b[\s\S]{0,90}public\.dd_cr_(?:editions|publications)/i.test(sql),
  'Public paper mutation must remain unavailable');
assert(!/\bcreate\s+(?:or\s+replace\s+)?function\s+public\.dd_cr_publish\b/i.test(sql),
  'Publishing RPC is a later reviewed milestone');
assert(tests.includes('set role anon')&&tests.includes('set role authenticated'));
assert(tests.includes('Cross-user draft read leaked')&&tests.includes('Voter identities leaked'));
assert(tests.includes('Anonymous authenticated user voted')&&tests.includes('Cross-paper replies were allowed'));
assert(tests.includes('Account owner comment survived erasure'));
assert(flags.includes('researchPublishing:false'));
assert(flags.includes('communityResearchPreview:local||preview'));
assert(!flags.includes('researchPublishing:enabled'));
assert(!page.includes('dd_cr_drafts')&&!page.includes('dd_cr_publish'));
assert(wne.includes('readSavedDocument:async')&&wne.includes('verifiedOwner:async'));
assert(!read('scripts/build_public_release.cjs').includes('COMMUNITY_RESEARCH_M02_SQL_DRAFT_ONLY.sql'));
console.log('PASS M02 STATIC: isolated drafts + RLS public snapshots + private votes/comments/reports, anonymous and cross-account tests, publishing stays disabled');
