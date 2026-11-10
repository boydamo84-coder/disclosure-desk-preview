'use strict';
// M63: execute ONLY against a disposable GitHub Actions PostgreSQL fixture.
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
assert.equal(process.env.PGDATABASE,'dd_fence_fixture','Refuse to touch non-test databases');
const psql=(sql,expectFailure=false)=>{
 const result=cp.spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-At','-c',sql],{env:process.env,encoding:'utf8'});
 if(expectFailure){
  assert.notEqual(result.status,0,'Unsafe operation unexpectedly permitted');
  return String(result.stderr||'');
 }
 assert.equal(result.status,0,'PostgreSQL error: '+result.stderr+' | '+sql.slice(0,250));
 return String(result.stdout||'').trim();
};
const psqlFile=path=>{
 assert(fs.existsSync(path),'Missing isolated test file '+path);
 const result=cp.spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-f',path],{env:process.env,encoding:'utf8'});
 assert.equal(result.status,0,'Fixture or migration failed: '+result.stderr);
};
const migration='supabase/migrations/20261110150000_profile_reactions_received_m63.sql';
const source=fs.readFileSync(migration,'utf8');
assert.match(source,/security definer set search_path = ''/);
assert.match(source,/auth\.uid\(\)/);
assert.match(source,/is_anonymous/);
assert.match(source,/v\.voter_id<>v_actor/g);
assert.match(source,/revoke all on function public\.dd_profile_received_reactions\(\) from public,anon,authenticated;/);
assert.doesNotMatch(source,/p_user_id|p_author_id|select\s+v\.voter_id/i);
psqlFile('scripts/m63_profile_reactions_fixture.sql');
psqlFile(migration);
assert.equal(psql("select has_function_privilege('anon','public.dd_profile_received_reactions()','EXECUTE')"),'f');
assert.equal(psql("select has_function_privilege('authenticated','public.dd_profile_received_reactions()','EXECUTE')"),'t');
assert.equal(psql("select has_table_privilege('authenticated','public.dd_forum_votes','SELECT')"),'f');
assert.equal(psql("select has_table_privilege('authenticated','public.dd_content_votes','SELECT')"),'f');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
function received(who,anonymous=false,role='authenticated',expectFailure=false){
 const query=[
  'BEGIN;',
  'SET LOCAL ROLE '+role+';',
  "SET LOCAL request.jwt.claim.sub = '"+who+"';",
  "SET LOCAL request.jwt.claim.is_anonymous = '"+String(anonymous)+"';",
  'SELECT post_likes,post_dislikes,comment_likes,comment_dislikes FROM public.dd_profile_received_reactions();',
  'ROLLBACK;'
 ].join('\n');
 const out=psql(query,expectFailure);
 if(expectFailure)return out;
 const match=out.match(/^\d+\|\d+\|\d+\|\d+$/m);
 assert(match,'Expected a four-column own-account aggregate: '+out);
 return match[0];
}
assert.equal(received(A),'2|1|2|2',
 'Own post+comment likes/dislikes include only published content and other voters');
assert.equal(received(B),'1|0|0|0','Other account cannot see author A totals');
assert.equal(received(C),'0|0|0|0','A registered account with no authored items has true zeros');
assert.match(received(A,false,'anon',true),/permission denied/,'Guest cannot call owner-only totals');
assert.match(received(A,true,'authenticated',true),/Registered account required/,
 'Anonymous Supabase account cannot see member totals');
assert.match(psql([
 'BEGIN;','SET LOCAL ROLE authenticated;',
 "SET LOCAL request.jwt.claim.sub = '"+A+"';",
 'SELECT voter_id,value FROM public.dd_forum_votes;',
 'ROLLBACK;'
].join('\n'),true),/permission denied/,'Voter identities remain inaccessible');
psql("UPDATE public.dd_forum_votes SET value=-1 WHERE target_kind='thread' AND target_id=md5('thread-live')::uuid AND voter_id='"+B+"'");
assert.equal(received(A),'1|2|2|2','Switching a like to dislike changes both totals');
psql("DELETE FROM public.dd_forum_votes WHERE target_kind='thread' AND target_id=md5('thread-live')::uuid AND voter_id='"+C+"'");
assert.equal(received(A),'1|1|2|2','Undo/removing a vote decrements the counter');
psql("UPDATE public.dd_forum_replies SET status='removed' WHERE id=md5('reply-live')::uuid");
assert.equal(received(A),'1|1|1|1','Removing a reply removes reactions from its author total');
psql("UPDATE public.dd_forum_threads SET status='removed' WHERE id=md5('thread-live')::uuid");
assert.equal(received(A),'1|0|1|1','Removing a thread hides the thread and child replies');
console.log('PASS M63: isolated PostgreSQL owner-only counts, four target kinds, content visibility, self-vote exclusion, account isolation, anon denial, raw-voter denial, like/dislike switches, undo, removal');
