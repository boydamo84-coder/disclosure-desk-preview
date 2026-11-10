'use strict';
// Isolated PostgreSQL only: no real accounts, API calls or hosting changes.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const previous=require('./test_media_submissions_pg.cjs');
const extra=fs.readdirSync('supabase/migrations').filter(n=>/_media_auto_publish_five_reports\.sql$/.test(n));assert.equal(extra.length,1);
const migration=fs.readFileSync('supabase/migrations/'+extra[0],'utf8');
const ids=Array.from({length:7},(_,i)=>'33333333-3333-4333-8333-'+String(i+1).padStart(12,'0'));
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',ADMIN='99999999-9999-4999-8999-999999999999';
const setup=previous.setup+"\ninsert into auth.users(id) values"+ids.map(x=>"('"+x+"')").join(',')+';';
const as=(id,sql,anonymous=false)=>`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);select set_config('request.jwt.claims','{"is_anonymous":${anonymous}}',false);${sql}`;
const nominate="select public.dd_media_suggest('books','https://example.org/auto-book','Auto shared book','Private QA note');";
const title="(select id from public.dd_media_titles where title='Auto shared book')";
const key="'member-'||(select id::text from public.dd_media_suggestions where title='Auto shared book')";
const steps=[
 ['a valid link is published immediately',as(A,nominate),null],
 ['anonymous role has no destructive vote-table privilege',"reset role;select has_table_privilege('anon','public.dd_media_votes','truncate');",/\bf\b|\bfalse\b/],
 ['member can rate the automatically published title',as(A,`insert into public.dd_media_votes(title_id,user_id,score,recommended) values(${title},'${A}',8,true);`),null],
 ['guest sees the title and link without notes or member identity',"reset role;set role anon;select title,public_url from public.dd_media_catalogue() where title='Auto shared book';",/https:\/\/example.org\/auto-book/],
 ['guest cannot read submitter UUID',"reset role;set role anon;select submitted_by from public.dd_media_titles;",null,/permission denied/],
 ['guest cannot read private suggestion notes',"reset role;set role anon;select notes from public.dd_media_suggestions;",null,/permission denied/],
 ['member cannot directly publish a catalogue row',as(B,"insert into public.dd_media_titles(id,category,title) values('spoof','books','Spoofed title');"),null,/permission denied/],
 ['same URL cannot be re-added by another account',as(B,"select public.dd_media_suggest('movies','https://www.example.org/auto-book/?utm_source=qa#anchor','Different title','');"),null,/already added/],
 ['same title with changed punctuation cannot be re-added',as(B,"select public.dd_media_suggest('books','https://example.org/different','AUTO shared book!!!','');"),null,/already added/],
 ['existing editorial title cannot be nominated again',as(B,"select public.dd_media_suggest('movies','https://example.org/arrival','Arrival','');"),null,/already added/],
 ['podcasts publish and can be rated through the existing catalogue',as(A,"select public.dd_media_suggest('podcasts','https://youtu.be/abcdefghijk','Synthetic podcast episode','');"),null],
 ['YouTube URL aliases are duplicates',as(B,"select public.dd_media_suggest('podcasts','https://www.youtube.com/watch?v=abcdefghijk&utm_campaign=qa','Another title','');"),null,/already added/],
 ['anonymous auth accounts cannot nominate',as(B,"select public.dd_media_suggest('books','https://example.org/anonymous','Anonymous title','');",true),null,/Registered account/],
 ['anonymous role cannot report',`reset role;set role anon;select public.dd_media_report(${title},'spam');`,null,/permission denied/],
 ['anonymous auth account cannot report',as(B,`select public.dd_media_report(${title},'spam');`,true),null,/Registered account/],
 ['submitter cannot report own item',as(A,`select public.dd_media_report(${key},'spam');`),null,/own suggestion/],
 ['first distinct report succeeds',as(ids[0],`select public.dd_media_report(${title},'spam');`),/"reported":true|"reported": true/],
 ['same account report counts only once',as(ids[0],`select public.dd_media_report(${title},'other');`),/"already_reported":true|"already_reported": true/],
 ['second report',as(ids[1],`select public.dd_media_report(${title},'spam');`),null],
 ['third report',as(ids[2],`select public.dd_media_report(${title},'spam');`),null],
 ['fourth report',as(ids[3],`select public.dd_media_report(${title},'spam');`),null],
 ['four reports leave it public',"reset role;set role anon;select count(*) from public.dd_media_catalogue() where title='Auto shared book';",/\b1\b/],
 ['fifth distinct report hides immediately',as(ids[4],`select public.dd_media_report(${title},'spam');`),/"hidden":true|"hidden": true/],
 ['hidden title disappears from public ranking',"reset role;set role anon;select count(*) from public.dd_media_ranking() r where not exists(select 1 from public.dd_media_catalogue() c where c.id=r.title_id);",/\b0\b/],
 ['hidden title vanishes from public catalogue',"reset role;set role anon;select count(*) from public.dd_media_catalogue() where title='Auto shared book';",/\b0\b/],
 ['hidden record cannot be re-added to bypass review',as(B,"select public.dd_media_suggest('books','https://example.org/auto-book','Another title','');"),null,/already added/],
 ['member cannot inspect owner moderation queue',as(B,'select * from public.dd_media_review_queue();'),null,/Site owner/],
 ['member cannot restore content',as(B,"select public.dd_media_review((select 'member-'||id::text from public.dd_media_suggestions where title='Auto shared book'),'restore');"),null,/Site owner/],
 ['owner sees exactly five active reports',as(ADMIN,"select report_count from public.dd_media_review_queue() where title='Auto shared book';"),/\b5\b/],
 ['owner can restore',as(ADMIN,"select public.dd_media_review((select id from public.dd_media_review_queue() where title='Auto shared book'),'restore');"),/\bt\b|\btrue\b/],
 ['restored title returns to the public catalogue',"reset role;set role anon;select count(*) from public.dd_media_catalogue() where title='Auto shared book';",/\b1\b/],
 ['restoration starts a fresh report round',as(ids[0],`select public.dd_media_report(${title},'spam');`),/"hidden":false|"hidden": false/],
 ['old flags do not immediately hide the restored title',"reset role;set role anon;select count(*) from public.dd_media_catalogue() where title='Auto shared book';",/\b1\b/],
 ['member cannot read other reporter identities',as(ids[1],"select count(*) from public.dd_media_reports where reporter_id<>auth.uid();"),/\b0\b/],
 ['direct spoofed report insert is denied',as(ids[1],`insert into public.dd_media_reports(title_id,reporter_id,report_round,reason) values(${title},'${ids[2]}',1,'spam');`),null,/permission denied/],
 ['private review audit is inaccessible to members',as(B,'select * from dd_media_private.review_actions;'),null,/permission denied/]
];
for(const id of ids.slice(1,5))steps.push(['new round report '+id,as(id,`select public.dd_media_report(${title},'spam');`),null]);
steps.push(['owner removes flagged title',as(ADMIN,"select public.dd_media_review((select id from public.dd_media_review_queue() where title='Auto shared book'),'remove');"),/\bt\b|\btrue\b/]);
steps.push(['removed title stays absent',"reset role;set role anon;select count(*) from public.dd_media_catalogue() where title='Auto shared book';",/\b0\b/]);
steps.push(['both owner decisions were audited',"reset role;select count(*) from dd_media_private.review_actions;",/\b2\b/]);
steps.push(['ten fresh nominations allowed',as(B,"select public.dd_media_suggest('books','https://example.org/rate/'||n,'Limit book '||n,'') from generate_series(1,10) n;"),null]);
steps.push(['eleventh fresh nomination rejected',as(B,"select public.dd_media_suggest('books','https://example.org/rate/11','Eleventh book','');"),null,/limit reached/]);
module.exports={setup,migration,steps,foundation:fs.readFileSync('supabase/migrations/20261031_watch_read_ratings.sql','utf8'),previous:previous.migration};
if(require.main===module){(async()=>{
 if(process.env.PGDATABASE!=='dd_fence_fixture'||process.env.PGHOST!=='127.0.0.1')throw Error('Disposable loopback CI only');
 cp.execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-d','postgres','-c','create database dd_media_auto_fixture;']);
 const env={...process.env,PGDATABASE:'dd_media_auto_fixture'};
 const sql=q=>cp.execFileSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8',env,stdio:['pipe','pipe','pipe']});
 try{sql(setup);sql(module.exports.foundation);sql(previous.migration);sql(migration);
  for(const [label,query,match,error] of steps){if(error)assert.throws(()=>sql(query),e=>error.test(String(e.stderr||e.message)),label);else{const output=sql(query);if(match)assert.match(output,match,label)}console.log('PASS media auto '+label)}
  sql(as(A,"select public.dd_media_suggest('movies','https://example.org/concurrent','Concurrent synthetic title','');"));
  const target=sql("reset role;select id from public.dd_media_titles where title='Concurrent synthetic title';").trim();
  assert.match(target,/^member-[a-f0-9-]{36}$/);
  const results=await Promise.all(ids.slice(0,5).map(id=>new Promise((resolve,reject)=>{
   const child=cp.execFile('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{env,encoding:'utf8'},(error,stdout,stderr)=>error?reject(Error(stderr||error.message)):resolve(stdout));
   child.stdin.end(as(id,"select public.dd_media_report('"+target+"','spam');"));
  })));
  assert.equal(results.filter(output=>/"hidden": true/.test(output)).length,1,'Exactly the fifth concurrent report hides');
  assert.match(sql("reset role;select t.status||':'||count(r.reporter_id) from public.dd_media_titles t join public.dd_media_reports r on r.title_id=t.id where t.id='"+target+"' group by t.id;"),/pending:5/);
  console.log('PASS media auto concurrent five-account threshold under real row locks');
 }finally{cp.execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-d','postgres','-c','drop database dd_media_auto_fixture;']);}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});}
