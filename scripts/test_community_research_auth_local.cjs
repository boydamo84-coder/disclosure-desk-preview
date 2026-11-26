'use strict';
// Acceptance smoke for a brand-new disposable runner-local Supabase instance.
// No hosted project, production endpoints, secrets, or publication write API.
// Authentication is real; report rows are synthetic fixtures seeded locally.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const settings=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const origin='http://127.0.0.1:54321';
assert.ok([origin,'http://localhost:54321'].includes(settings.API_URL),'Only the runner-local API is permitted');
assert.ok(['postgresql://postgres:postgres@127.0.0.1:54322/postgres','postgresql://postgres:postgres@localhost:54322/postgres'].includes(settings.DB_URL),'Only the disposable default database is permitted');
const key=settings.ANON_KEY||settings.PUBLISHABLE_KEY;
assert.ok(typeof key==='string'&&key.length>20,'Local guest key missing');
const emailName=label=>label+'-'+randomUUID()+'@example.com';
async function call(path,{token,method='GET',body,headers={}}={}){
 assert.ok(path.startsWith('/auth/v1/')||(path.startsWith('/rest/v1/')&&method==='GET'),'Local auth/read path only');
 const auth=token||(!key.startsWith('sb_')?key:null);
 const res=await fetch(origin+path,{
  method,redirect:'error',headers:{apikey:key,...(auth?{Authorization:'Bearer '+auth}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},
  ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)
 });
 let data;try{data=await res.json()}catch{data=null}
 return {ok:res.ok,status:res.status,data};
}
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
async function identity(label,anonymous=false){
 const signup=await call('/auth/v1/signup',{method:'POST',body:anonymous?{data:{}}:{email:emailName(label),password:'Local-only-'+randomUUID()}});
 assert.ok(signup.ok,'Local sign-up failed: '+signup.status);
 const token=signup.data?.access_token;
 assert.ok(typeof token==='string'&&token.length>30,'Local Auth session missing');
 const me=await call('/auth/v1/user',{token});
 assert.ok(me.ok&&idPattern.test(me.data?.id),'Local Auth did not validate user');
 assert.equal(me.data.is_anonymous,anonymous,'Unexpected anonymous-session type');
 return {id:me.data.id,token};
}
function sql(input){
 const r=spawnSync('psql',['-X','-q','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres'],{
  input,encoding:'utf8',env:{PATH:process.env.PATH,HOME:process.env.HOME,PGPASSWORD:'postgres',PGCONNECT_TIMEOUT:'5'},maxBuffer:1024*1024
 });
 if(r.status!==0)throw Error('Disposable local SQL fixture failed: '+String(r.stderr||r.error||'').slice(0,1200));
}
async function read(token,fields='id,title,status',headers={}){
 return call('/rest/v1/dd_cr_submissions?select='+encodeURIComponent(fields)+'&order=title.asc',{token,headers});
}
function rows(response,expected,label){
 assert.ok(response.ok,label+' read failed: '+response.status);
 assert.ok(Array.isArray(response.data),label+' must return rows');
 assert.deepEqual(response.data.map(r=>[r.title,r.status]),expected,label+' visibility');
}
(async()=>{
 const owner=await identity('author'),reader=await identity('reader'),anonymous=await identity('anon',true);
 assert.equal(new Set([owner.id,reader.id,anonymous.id]).size,3);
 sql(`create table public.dd_forum_owner_admins(user_id uuid primary key);
 alter table public.dd_forum_owner_admins enable row level security;
 revoke all on public.dd_forum_owner_admins from public,anon,authenticated;
 create table public.dd_public_names(user_id uuid primary key, display_name text not null, is_public boolean not null);
 alter table public.dd_public_names enable row level security;
 revoke all on public.dd_public_names from public,anon,authenticated;
 insert into public.dd_public_names values ('${owner.id}','FixtureAuthor',true),('${reader.id}','FixtureReader',true);
 `+fs.readFileSync('docs/community-research/SCHEMA_DRAFT_NOT_APPLIED.sql','utf8'));
 // The local SQL admin seeds only synthetic test rows under the fixture identity.
 // The actual API below authenticates with real Auth-issued JWTs, not fixture claims.
 sql(`begin;
 select set_config('request.jwt.claims',jsonb_build_object('sub','${owner.id}','role','authenticated','is_anonymous',false)::text,true);
 set local role authenticated;
 insert into public.dd_cr_submissions(title,abstract,category,body_text,consent)
 values ('Fixture published','Summary','Case analysis','Fictional text',true),('Fixture withdrawn','Summary','Case analysis','Fictional text',true);
 reset role;
 update public.dd_cr_submissions set status='withdrawn' where title='Fixture withdrawn';
 commit;
 notify pgrst,'reload schema';
 `);
 const published=[['Fixture published','published']];
 const own=[...published,['Fixture withdrawn','withdrawn']];
 let ready;
 for(let i=0;i<20;i++){
  ready=await read();
  if(ready.ok&&Array.isArray(ready.data)&&ready.data.length===1)break;
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 rows(ready,published,'Guest');
 rows(await read(owner.token),own,'Author');
 rows(await read(reader.token),published,'Different member');
 rows(await read(anonymous.token),published,'Anonymous Auth session');
 const invalid=await read('invalid-fixture-token');
 assert.equal(invalid.ok,false,'Invalid credentials must fail');
 for(const token of [undefined,owner.token,reader.token,anonymous.token]){
  for(const field of ['author_id','request_token','expected_account']){
   assert.equal((await read(token,field)).ok,false,'Private column must be denied: '+field);
  }
  assert.equal((await read(token,'id',{'Accept-Profile':'dd_cr_private'})).ok,false,'Private schema must remain outside the API');
 }
 console.log('PASS genuine local Auth users, guest/member/author/anonymous visibility, invalid credentials, private column and schema denial');
})().catch(e=>{console.error(e.message);process.exitCode=1});
