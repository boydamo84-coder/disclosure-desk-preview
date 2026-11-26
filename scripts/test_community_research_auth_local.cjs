'use strict';
// Acceptance smoke for a brand-new disposable runner-local Supabase instance.
// No hosted project, production endpoints, secrets or new publishing API.
// Authentication is real; all report rows and submissions are fictional local tests.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {publicTextPayload}=require('../research/community-publication-preview.js');
const settings=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const origin='http://127.0.0.1:54321';
assert.ok([origin,'http://localhost:54321'].includes(settings.API_URL),'Only the runner-local API is permitted');
assert.ok(['postgresql://postgres:postgres@127.0.0.1:54322/postgres','postgresql://postgres:postgres@localhost:54322/postgres'].includes(settings.DB_URL),'Only the disposable default database is permitted');
const key=settings.ANON_KEY||settings.PUBLISHABLE_KEY;
assert.ok(typeof key==='string'&&key.length>20,'Local guest key missing');
const emailName=label=>label+'-'+randomUUID()+'@example.com';
async function call(path,{token,method='GET',body,headers={}}={}){
 // Strict loopback integration-test routes. Never accept an arbitrary service URL.
 const restRead=method==='GET'&&path.startsWith('/rest/v1/dd_cr_submissions?');
 const draftTest=method==='POST'&&(path==='/rest/v1/dd_cr_submissions?select=id,title,status,author_label,version_no'||path==='/rest/v1/rpc/dd_cr_withdraw');
 const engagementTest=['GET','HEAD','POST','PATCH','DELETE'].includes(method)&&
  (path.startsWith('/rest/v1/dd_cr_reactions?')||path.startsWith('/rest/v1/dd_cr_comments?'));
 assert.ok(path.startsWith('/auth/v1/')||restRead||draftTest||engagementTest,'Unexpected local fixture route');
 const auth=token||(!key.startsWith('sb_')?key:null);
 const res=await fetch(origin+path,{
  method,redirect:'error',headers:{apikey:key,...(auth?{Authorization:'Bearer '+auth}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},
  ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)
 });
 let data;try{data=await res.json()}catch{data=null}
 return {ok:res.ok,status:res.status,data,contentRange:res.headers.get('content-range')};
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
 const owner=await identity('author'),reader=await identity('reader'),anonymous=await identity('anon',true),privateMember=await identity('private');
 assert.equal(new Set([owner.id,reader.id,anonymous.id,privateMember.id]).size,4);
 sql(`create table public.dd_forum_owner_admins(user_id uuid primary key);
 alter table public.dd_forum_owner_admins enable row level security;
 revoke all on public.dd_forum_owner_admins from public,anon,authenticated;
 create table public.dd_public_names(user_id uuid primary key, display_name text not null, is_public boolean not null);
 alter table public.dd_public_names enable row level security;
 revoke all on public.dd_public_names from public,anon,authenticated;
 insert into public.dd_public_names values ('${owner.id}','FixtureAuthor',true),('${reader.id}','FixtureReader',true),('${privateMember.id}','FixturePrivate',false);
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
 // Use the actual six-field W.NE projection, but only with fictional text and
 // against the already-existing unapplied schema on this disposable runner.
 const reviewed=publicTextPayload({
  title:'Fixture API report',abstract:'Fictional research summary',category:'Case analysis',
  sections:[{title:'Public example',text:'Fictional reviewed report text',privateNote:'EXCLUDED_PRIVATE_FIELD'}],
  citations:[{title:'Example source',url:'https://example.org/record'}],
  privateBoard:'EXCLUDED_PRIVATE_BOARD'
 },true);
 assert.deepEqual(Object.keys(reviewed),['title','abstract','category','body_text','references_text','consent']);
 assert.ok(!JSON.stringify(reviewed).includes('EXCLUDED_PRIVATE'));
 const testAttempt={...reviewed,request_token:randomUUID(),expected_account:owner.id};
 const submit=(actor,body)=>call('/rest/v1/dd_cr_submissions?select=id,title,status,author_label,version_no',{
  token:actor?.token,method:'POST',body,headers:{Prefer:'return=representation'}
 });
 const denied=async(actor,body,label)=>{
  const result=await submit(actor,body);
  assert.ok(!result.ok,label+' unexpectedly accepted');
  assert.ok(result.status>=400&&result.status<500,label+' must be a client/permission rejection, got '+result.status);
 };
 // Guests and anonymous Auth sessions are different, but neither may submit.
 await denied(null,testAttempt,'Guest');
 await denied(anonymous,{...testAttempt,expected_account:anonymous.id},'Anonymous Auth');
 await denied(privateMember,{...testAttempt,expected_account:privateMember.id},'Opted-out public profile');
 await denied(reader,testAttempt,'Stale expected account');
 await denied(owner,{...testAttempt,consent:false},'No consent');
 await denied(owner,{...testAttempt,title:'x'.repeat(161)},'Over-limit title');
 await denied(owner,{...testAttempt,category:'Invalid category'},'Invalid category');
 await denied(owner,{...testAttempt,author_label:'FixtureReader'},'Client-supplied author label');
 await denied(owner,{...testAttempt,author_id:reader.id},'Client-supplied author ID');
 await denied(owner,{...testAttempt,status:'published'},'Client-supplied status');
 const accepted=await submit(owner,testAttempt);
 assert.ok(accepted.ok,'Valid local submission failed: '+accepted.status);
 assert.ok(Array.isArray(accepted.data)&&accepted.data.length===1,'Expected one local report');
 const report=accepted.data[0];
 assert.ok(idPattern.test(report.id),'Invalid local report ID');
 assert.deepEqual(report,{id:report.id,title:reviewed.title,status:'published',author_label:'FixtureAuthor',version_no:1});
 await denied(owner,testAttempt,'Duplicate request token');
 await denied(owner,{...testAttempt,body_text:'Changed copy'},'Modified duplicate request');
 await denied(reader,{...testAttempt,expected_account:reader.id},'Different account reusing token');
 const raced={...testAttempt,title:'Fixture concurrent report',request_token:randomUUID()};
 const race=await Promise.all([submit(owner,raced),submit(owner,raced)]);
 assert.equal(race.filter(x=>x.ok).length,1,'Concurrent identical token must create exactly one row');
 assert.ok(race.some(x=>!x.ok&&x.status>=400&&x.status<500),'Second concurrent request must be rejected');
 const list=await read();
 assert.ok(list.ok&&Array.isArray(list.data),'Post-submission read failed');
 assert.equal(list.data.filter(x=>x.title===reviewed.title).length,1);
 assert.equal(list.data.filter(x=>x.title===raced.title).length,1);
 const withdraw=actor=>call('/rest/v1/rpc/dd_cr_withdraw',{token:actor?.token,method:'POST',body:{p_id:report.id,p_reason:'Fictional acceptance test withdrawal'}});
 assert.equal((await withdraw(null)).ok,false,'Guest withdrawal denied');
 assert.equal((await withdraw(reader)).ok,false,'Other member withdrawal denied');
 const removed=await withdraw(owner);
 assert.ok(removed.ok&&removed.data===1,'Owner withdrawal must affect one version');
 const after=await read();
 assert.ok(after.ok&&!after.data.some(x=>x.id===report.id),'Withdrawn report must disappear from guest reads');
 const afterOwner=await read(owner.token);
 assert.ok(afterOwner.ok&&afterOwner.data.some(x=>x.id===report.id&&x.status==='withdrawn'),'Owner sees withdrawn status');
 await denied(owner,testAttempt,'Replay after withdrawal');
 console.log('PASS actual W.NE text projection, real local API submission/grants/consent, server-derived labels, duplicate/concurrent token rejection, genuine owner withdrawal and hidden public version');
 // Exercise the actual localhost preview DOM in a small fictional W.NE fixture.
 // The browser never receives the local API key or the test member's JWT.
 // Playwright's dedicated binding forwards exactly the fixed fictional payload
 // through the Node-only loopback test helper above; no public client is installed.
 const fixtureUrl='http://127.0.0.1:8765/__dd-cr-auth-test__/';
 const sample={title:'Fixture W.NE acceptance report',abstract:'Fictional QA abstract',category:'Case analysis',body_text:'Public QA section\nFictional public QA prose',references_text:'Example source | https://example.org/record',consent:true};
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const staleAccount of [false,true]){
   const page=await browser.newPage({viewport:{width:393,height:900}});
   let invokes=0;
   try{
    await page.route('**/*',r=>r.request().url()===fixtureUrl?r.fulfill({contentType:'text/html',body:'<div id="wne-file-menu"></div>'}):r.abort());
    await page.exposeFunction('ddCRLocalAcceptanceTest',async copy=>{
     invokes++;
     assert.deepEqual(copy,sample,'Actual browser projection must match fixed fictional sample');
     assert.equal(invokes,1,'One explicit QA action per dialog');
     const result=await submit(reader,{...copy,request_token:randomUUID(),expected_account:staleAccount?owner.id:reader.id});
     if(staleAccount){assert.ok(!result.ok&&result.status>=400&&result.status<500,'Stale account must be rejected');return 'rejected';}
     assert.ok(result.ok&&Array.isArray(result.data)&&result.data.length===1,'Local QA submission not accepted');
     assert.equal(result.data[0].author_label,'FixtureReader');
     return 'accepted';
    });
    await page.goto(fixtureUrl);
    await page.evaluate(()=>{
     window.DDCommunityLocalAcceptanceFixture=true;
     window.wneCaptureDocument=()=>({bookTitle:'Fixture W.NE acceptance report',chapters:[
      {title:'Public QA section',html:'<p>Fictional public QA prose</p><p hidden>DO NOT EXPORT HIDDEN</p>'},
      {title:'Private QA section',html:'DO NOT EXPORT PRIVATE'}
     ],privateBoard:'DO NOT EXPORT BOARD'});
    });
    await page.addScriptTag({path:path.resolve('research/community-publication-preview.js')});
    await page.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
    const qa=page.getByRole('button',{name:'Submit fictional report to local QA'});
    const confirmation=page.getByRole('button',{name:'Confirm reviewed public copy'});
    const summary=page.getByLabel('Abstract / summary');
    assert.equal(await qa.isVisible(),false);
    await summary.fill(sample.abstract);
    await page.getByLabel('Public QA section',{exact:true}).check();
    await page.getByLabel('Public references (one title | HTTPS URL per line)').fill(sample.references_text);
    await page.getByRole('button',{name:'Generate public preview'}).click();
    assert.equal(await confirmation.isEnabled(),false);
    assert.equal(await qa.isVisible(),false);
    await page.getByText('I have permission to publish',{exact:false}).click();
    await confirmation.click();
    assert.equal(await qa.isEnabled(),true);
    assert.equal(invokes,0,'Review alone never submits');
    await summary.fill('Edited draft');
    assert.equal(await qa.isVisible(),false);
    assert.equal(invokes,0,'Stale confirmed copy cannot submit');
    await summary.fill(sample.abstract);
    await page.getByRole('button',{name:'Generate public preview'}).click();
    await page.getByText('I have permission to publish',{exact:false}).click();
    await confirmation.click();
    await qa.click();
    await page.getByText(staleAccount?'Local QA database rejected the fictional report.':'Local QA database accepted the fictional report.',{exact:false}).waitFor();
    assert.equal(invokes,1);
    assert.equal(await qa.isEnabled(),false);
    assert.equal(await summary.isEnabled(),false);
    assert.equal(await page.getByText('DO NOT EXPORT HIDDEN',{exact:true}).count(),0);
    assert.equal(await page.getByText('DO NOT EXPORT PRIVATE',{exact:true}).count(),0);
   }finally{await page.close()}
  }
 }finally{await browser.close()}
 const browserRows=await read(undefined,'id,title,status,author_label,body_text,references_text');
 assert.ok(browserRows.ok&&Array.isArray(browserRows.data));
 const fromBrowser=browserRows.data.filter(r=>r.title===sample.title);
 assert.equal(fromBrowser.length,1,'One fictional browser report only');
 assert.equal(fromBrowser[0].author_label,'FixtureReader');
 assert.equal(fromBrowser[0].body_text,sample.body_text);
 assert.equal(fromBrowser[0].references_text,sample.references_text);
 console.log('PASS actual W.NE preview UI through loopback-only test binding, explicit consent, stale copy, genuine local success/rejection, private text exclusion and one-time click');
 // Real Auth acceptance of the existing reaction/comment RLS. These are local
 // fixture requests only; no production member-action client is installed.
 const sharedId=race.find(x=>x.ok).data[0].id;
 assert.ok(idPattern.test(sharedId),'Invalid local shared report ID');
 const reactionPath='/rest/v1/dd_cr_reactions?report_id=eq.'+sharedId+'&select=report_id,reaction';
 const commentPath='/rest/v1/dd_cr_comments?report_id=eq.'+sharedId+'&select=id,author_label,body_text,status';
 // Use minimal mutation responses: a public re-read proves the visible result
 // without requiring privileges on internal/defaulted columns to return rows.
 const addReaction=(actor,reaction)=>call('/rest/v1/dd_cr_reactions?select=report_id,reaction',{token:actor?.token,method:'POST',headers:{Prefer:'return=minimal'},body:{report_id:sharedId,reaction}});
 const reactionRead=()=>call(reactionPath);
 const addComment=(actor,body)=>call('/rest/v1/dd_cr_comments?select=id,author_label,body_text,status',{token:actor?.token,method:'POST',headers:{Prefer:'return=minimal'},body:{report_id:sharedId,...body}});
 const okEngagement=(result,label)=>assert.ok(result.ok,label+' (HTTP '+result.status+'; '+String(result.data?.code||'')+' '+String(result.data?.message||'').slice(0,180)+')');
 for(const actor of [null,anonymous]){
  assert.equal((await addReaction(actor,1)).ok,false,'Guest/anonymous reaction denied');
  assert.equal((await addComment(actor,{body_text:'Fictional denied comment'})).ok,false,'Guest/anonymous comment denied');
 }
 assert.equal((await addComment(privateMember,{body_text:'Fictional private profile comment'})).ok,false,'Private profile comment denied');
 assert.equal((await addComment(reader,{body_text:'Fictional impersonation',author_label:'FixtureAuthor'})).ok,false,'Client comment label denied');
 const firstReact=await addReaction(reader,1);
 okEngagement(firstReact,'Genuine member reaction must succeed');
 assert.equal((await addReaction(reader,-1)).ok,false,'Duplicate reaction must fail');
 okEngagement(await addReaction(owner,1),'Second account reaction must succeed');
 const changed=await call(reactionPath,{token:reader.token,method:'PATCH',headers:{Prefer:'return=minimal'},body:{reaction:-1}});
 okEngagement(changed,'Genuine member reaction change must succeed');
 const reactions=await reactionRead();
 assert.ok(reactions.ok);
 assert.deepEqual(reactions.data.map(x=>x.reaction).sort(),[-1,1]);
 const count=await call(reactionPath+'&reaction=eq.1',{method:'HEAD',headers:{Prefer:'count=exact'}});
 assert.ok(count.ok&&count.contentRange?.endsWith('/1'),'Public exact like total must be one');
 assert.equal((await call('/rest/v1/dd_cr_reactions?select=member_id&report_id=eq.'+sharedId)).ok,false,'Private voter identity denied');
 const comment=await addComment(reader,{body_text:'Fictional visible comment <b>literal</b>'});
 okEngagement(comment,'Valid member comment must succeed');
 const comments=await call(commentPath);
 assert.ok(comments.ok&&comments.data?.length===1);
 assert.equal(comments.data[0].author_label,'FixtureReader');
 assert.equal(comments.data[0].body_text,'Fictional visible comment <b>literal</b>');
 assert.equal((await call('/rest/v1/dd_cr_comments?select=member_id&report_id=eq.'+sharedId)).ok,false,'Private commenter identity denied');
 const cleared=await call(reactionPath,{token:reader.token,method:'DELETE',headers:{Prefer:'return=minimal'}});
 okEngagement(cleared,'Genuine member reaction clear must succeed');
 assert.deepEqual((await reactionRead()).data.map(x=>x.reaction),[1]);
 const removal=await call('/rest/v1/rpc/dd_cr_withdraw',{token:owner.token,method:'POST',body:{p_id:sharedId,p_reason:'Fictional engagement visibility test'}});
 assert.ok(removal.ok&&removal.data===1,'Owner withdrawal must hide engagement target');
 assert.deepEqual((await reactionRead()).data,[]);
 assert.deepEqual((await call(commentPath)).data,[]);
 assert.equal((await addReaction(reader,1)).ok,false,'Hidden report reaction denied');
 assert.equal((await addComment(reader,{body_text:'Hidden target'})).ok,false,'Hidden report comment denied');
 console.log('PASS genuine local reaction/member uniqueness/change/clear, public total, comment identity, private member columns and hidden-report engagement denial');
})().catch(e=>{console.error(e.message);process.exitCode=1});
