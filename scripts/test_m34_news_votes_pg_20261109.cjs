'use strict';
// M34 article voting: isolated disposable PostgreSQL ONLY, no Supabase, no Netlify.
const cp=require('node:child_process');
const assert=require('node:assert/strict'),fs=require('node:fs');
const db=process.env.PGDATABASE||'';
assert(db==='dd_fence_fixture','Refuse to run against any non-disposable database');
const psql=(sql,fail=false)=>{
 const res=cp.spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-At','-c',sql],{encoding:'utf8',env:process.env});
 if(fail){assert.notEqual(res.status,0,'Expected PostgreSQL to deny unsafe operation');return (res.stderr||'').trim()}
 if(res.status!==0)throw Error('PostgreSQL fixture failure: '+res.stderr+'\nSQL: '+sql.slice(0,350));
 return (res.stdout||'').trim();
};
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const key='a'.repeat(64),alt='b'.repeat(64);
psql(`CREATE TABLE IF NOT EXISTS auth.users (id uuid primary key);
INSERT INTO auth.users(id) VALUES ('${owner}'),('${other}') ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION auth.jwt() returns jsonb language sql stable as
$$ SELECT jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('request.jwt.claim.is_anonymous',true),''),'false')::boolean) $$;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon,authenticated;`);
const migration=fs.readFileSync('supabase/NEWS_ARTICLE_VOTING_REVIEW_NOT_APPLIED.sql','utf8');
assert(migration.includes('enable row level security'));
assert(migration.includes('grant execute on function public.dd_news_article_vote_set'));
const applied=cp.spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-f','supabase/NEWS_ARTICLE_VOTING_REVIEW_NOT_APPLIED.sql'],{encoding:'utf8',env:process.env});
if(applied.status!==0)throw Error('M34 migration SQL failed to compile: '+applied.stderr);
assert.equal(psql(`select relrowsecurity::text from pg_class where oid='public.dd_news_article_votes'::regclass;`),'true');
assert.equal(psql(`select has_table_privilege('authenticated','public.dd_news_article_votes','INSERT')::text;`),'false');
assert.equal(psql(`select has_function_privilege('anon','public.dd_news_article_vote_set(text,smallint)','EXECUTE')::text;`),'false');
assert.equal(psql(`select has_function_privilege('authenticated','public.dd_news_article_vote_set(text,smallint)','EXECUTE')::text;`),'true');
function vote(actor,value,story=key,anonymous=false,shouldFail=false){
 const script=`BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '${actor}';
SET LOCAL request.jwt.claim.is_anonymous = '${anonymous}';
SELECT upvotes,downvotes,my_vote FROM public.dd_news_article_vote_set('${story}',${value}::smallint);
COMMIT;`;
 const output=psql(script,shouldFail);
 return shouldFail?output:output.split('\n').find(line=>/^\d+\|\d+\|-?[01]$/.test(line));
}
assert.equal(vote(owner,1),'1|0|1','first upvote saved');
assert.equal(vote(other,-1),'1|1|-1','another registered account can downvote');
assert.equal(vote(owner,-1),'0|2|-1','vote switches instead of duplicating');
assert.equal(vote(owner,0),'0|1|0','clicking same direction can remove vote');
assert.equal(vote(owner,1,alt),'1|0|1','different article independent');
assert.match(vote(owner,1,'invalid-key',false,true),/Invalid news article vote/);
assert.match(vote(owner,2,key,false,true),/Invalid news article vote/);
assert.match(vote(owner,1,key,true,true),/Registered account required/);
const summary=psql(`BEGIN; SET LOCAL ROLE anon;
SELECT story_key,upvotes,downvotes,my_vote FROM public.dd_news_article_vote_summary(ARRAY['${key}','${alt}']::text[]) ORDER BY story_key;
COMMIT;`);
assert(summary.includes(key+'|0|1|0'),'anonymous reads aggregate only');
assert(summary.includes(alt+'|1|0|0'),'anonymous cannot see private voter identity');
assert.match(psql(`BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='${owner}';
INSERT INTO public.dd_news_article_votes(story_key,voter_id,value) VALUES('${key}','${owner}',1);
COMMIT;`,true),/permission denied/,'client cannot bypass voting RPC');
assert.equal(psql('select count(*) from public.dd_news_article_votes;'),'2','failed writes and resets did not mutate test data');
console.log('PASS M34: isolated PostgreSQL compiled, registered-only RPC, ▲/▼/undo counts, anonymous summary, invalid input and direct-write denial');
