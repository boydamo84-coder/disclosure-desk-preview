'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const api=require('../docs/community-research/research-transfer.js');
const id='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const row={id,status:'published',version_no:2,title:'Sample community investigation',author_label:'Example researcher',abstract:'Fictional sample',body_text:'Sample published text',author_id:'PRIVATE ACCOUNT ID',private_note:'PRIVATE NOTE'};
const expected='https://uapdisclosuredesk.com/?dd_tab=communityResearchPage&dd_publication='+id;
const root=process.cwd(),mime={html:'text/html',js:'application/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',mp4:'video/mp4',jpg:'image/jpeg'};
const server=http.createServer((req,res)=>{
 let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!f.startsWith(root+path.sep))return res.writeHead(404).end();
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)&&!path.extname(f))f+='.html';
 if(!fs.existsSync(f)||!fs.statSync(f).isFile())return res.writeHead(404).end();
 res.writeHead(200,{'content-type':mime[path.extname(f).slice(1)]||'application/octet-stream'});
 fs.createReadStream(f).pipe(res);
});
(async()=>{
 const ref=api.source(row);
 assert.equal(ref.url,expected);assert.equal(ref.title,'Sample community investigation · v2');
 assert.ok(!JSON.stringify(ref).includes('PRIVATE'));
 assert.match(api.source({...row,title:'x'.repeat(160)}).boardTitle,/ · v2$/);
 for(const status of ['flagged','withdrawn','pending','rejected'])assert.throws(()=>api.source({...row,status}),/unavailable/);
 let calls=0;
 for(const invalid of [{...row,id:other},{...row,status:'flagged'},null]){
  await assert.rejects(api.transfer(id,'board',{fetchPublic:async()=>invalid,board:()=>{calls++}}));
 }
 assert.equal(calls,0);
 await assert.rejects(api.transfer(id,'citation',{fetchPublic:async()=>row,citation:()=>false}),/could not/);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
   try{
    await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort('blockedbyclient'));
    const page=await ctx.newPage();
    await page.goto(base+'/index.html?dd_tab=originalResearchPage');
    await page.evaluate(row=>{
     window.DDTestPublication=row;
     window.DDCommunityResearchTestMount={
      fetchPublic:async id=>window.DDTestPublication?.id===id&&window.DDTestPublication.status==='published'?structuredClone(window.DDTestPublication):null,
      listPublic:async()=>window.DDTestPublication.status==='published'?[structuredClone(window.DDTestPublication)]:[],
      previewShare:async url=>{window.DDTestShareURL=url;return true}
     };
    },row);
    await page.addScriptTag({path:path.join(root,'docs/community-research/research-transfer.js')});
    await page.addScriptTag({path:path.join(root,'docs/community-research/native-reader-fixture.js')});
    await page.getByRole('button',{name:'Community Research · development fixture',exact:true}).click();
    const reader=page.locator('#ddCommunityResearchDevelopment');
    await reader.getByRole('heading',{name:'Sample community investigation · v2'}).waitFor();
    assert.ok(await page.locator('.nav').isVisible());
    await reader.getByRole('button',{name:'Add to Investigation Board'}).click();
    await page.getByRole('button',{name:'Create a new collection'}).click();
    await page.locator('#pickerNewName').fill('Community research test board');
    await page.getByRole('button',{name:'Create and save'}).click();
    await reader.getByRole('button',{name:'Save to W.NE citations'}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('wne_research_references_v1')||'[]').length===1);
    await reader.getByRole('button',{name:'Save to W.NE citations'}).click();
    const refs=await page.evaluate(()=>JSON.parse(localStorage.getItem('wne_research_references_v1')||'[]'));
    assert.equal(refs.length,1);assert.equal(refs[0].url,expected);assert.match(refs[0].title,/v2$/);
    await reader.getByRole('button',{name:'Preview share link'}).click();
    await page.waitForFunction(()=>!!window.DDTestShareURL);
    assert.equal(await page.evaluate(()=>window.DDTestShareURL),expected);
    await page.evaluate(()=>window.DDTestPublication.status='flagged');
    await reader.getByRole('button',{name:'Add to Investigation Board'}).click();
    await reader.locator('[data-publication-id]').waitFor({state:'detached'});
    assert.equal(await page.locator('#collectionPicker').isVisible(),false);
    await reader.getByRole('button',{name:'Back to Research'}).click();
    await page.evaluate(()=>window.navigateTo('boards'));
    const collection=page.locator('#boardList article').filter({has:page.getByRole('heading',{name:'Community research test board',exact:true})});
    await collection.locator('details.connections > summary').first().click();
    const link=collection.locator('a').filter({hasText:'Sample community investigation · v2'}).first();
    await link.waitFor();assert.equal(await link.getAttribute('href'),expected);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    console.log('PASS actual private Board picker, W.NE saved references, version link and stale hidden report protection at '+width+'px');
   }finally{await ctx.close()}
  }

  // Native feature-gated candidate: blocked when off; injected isolated data when on.
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
   try{
    await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort('blockedbyclient'));
    const page=await ctx.newPage();
    await page.goto(base+'/index.html?dd_tab=communityResearchPage&dd_publication='+id);
    await page.waitForFunction(()=>document.readyState==='complete');
    assert.equal(await page.locator('[data-tab="communityResearchPage"]').isVisible(),false);
    assert.equal(await page.locator('#communityResearchPage').isVisible(),false);
    assert.equal(await page.locator('#ddCRModeration').count(),0);
    assert.equal(await page.locator('#ddCRAuthor').count(),0);
    assert.ok(await page.locator('#discover').isVisible());
    await page.close();
    await ctx.route('**/assets/community-test-config.js?*',r=>r.fulfill({contentType:'application/javascript',body:'window.DD_COMMUNITY_TEST_CONFIG={environment:"test",url:"https://fixture.invalid",publishableKey:"test-only"};window.DD_COMMUNITY_FEATURES={researchPublishing:true,researchEngagement:true,researchModeration:true,researchAuthorTools:true};'}));
    await ctx.addInitScript(({row,other})=>{
     window.DDNativeRows=[row,{...row,id:other,title:'Second archive note',category:'Historical research'}];
     window.DDNativeReactions=[{report_id:row.id,reaction:1},{report_id:row.id,reaction:1},{report_id:row.id,reaction:-1},{report_id:other,reaction:1}];
     window.DDNativeComments=Array.from({length:21},(_,i)=>({
      id:'00000000-0000-4000-8000-'+String(100+i).padStart(12,'0'),report_id:row.id,status:'visible',
      author_label:'Fictional commenter',body_text:i===0?'<img src=x onerror=alert(1)>':'Public comment '+(i+1),
      created_at:'2026-01-01T00:00:00Z',member_id:'PRIVATE MEMBER ID'
     }));
     window.DDNativeComments.push({id:'00000000-0000-4000-8000-000000000999',report_id:row.id,status:'removed',author_label:'Removed author',body_text:'REMOVED COMMENT'});
     window.DDNativeWrites=[];window.DDNativeFlags=[];window.DDNativeSession=null;
     const reviewOwner='00000000-0000-4000-8000-000000000012';
     const pending={id:'00000000-0000-4000-8000-000000000021',title:'Fictional hidden research',author_label:'Fixture researcher',category:'Case analysis',
      abstract:'Fictional abstract',body_text:'<img src=x onerror=alert(1)> Private reviewed text',references_text:'Fictional reference',
      version_no:2,created_at:'2026-11-26T00:00:00Z',revision_of:null,review_round:1,flag_count:5,
      flag_reasons:['Fictional reason 1','Fictional reason 2','Fictional reason 3','Fictional reason 4','Fictional reason 5'],author_id:'PRIVATE OWNER ID'};
     window.DDNativeQueue=[pending,{...pending,id:'00000000-0000-4000-8000-000000000022',title:'Second hidden research'}];
     window.DDNativeReviewWrites=[];
     window.DDNativeAuthorRows=[];window.DDNativeWithdrawWrites=[];
     Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.DDNativeRevisionClipboard=text;}}});
     const listeners=[];
     window.DDNativeSetIdentity=(id,anonymous=false,emit=true)=>{
      window.DDNativeSession=id?{user:{id,is_anonymous:anonymous},access_token:'fictional-token-'+id}:null;
      if(emit)listeners.forEach(fn=>fn(id?'SIGNED_IN':'SIGNED_OUT',window.DDNativeSession));
     };
     const realFetch=window.fetch.bind(window);
     window.fetch=async(input,options={})=>{
      const url=new URL(String(input),location.href);
      if(url.origin!=='https://fixture.invalid'||!url.pathname.startsWith('/rest/v1/'))return realFetch(input,options);
      const session=window.DDNativeSession,headers=new Headers(options.headers),method=options.method||'GET';
      const json=options.body?JSON.parse(options.body):null;
      const reply=(data,status=200)=>new Response(data===null?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
      if(!session||session.user.is_anonymous||headers.get('Authorization')!=='Bearer '+session.access_token)return reply({code:'42501'},403);
      const actor=session.user.id;
      if(url.pathname==='/rest/v1/rpc/dd_cr_my_publications'&&method==='POST'){
       if(json?.p_expected_account!==actor)return reply({code:'42501'},403);
       let mine=window.DDNativeAuthorRows.filter(x=>x.owner===actor).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));
       if(json.p_before_created&&json.p_before_id)mine=mine.filter(x=>x.created_at<json.p_before_created||(x.created_at===json.p_before_created&&x.id<json.p_before_id));
       const snapshot=JSON.parse(JSON.stringify(mine.slice(0,21).map(({owner,...rest})=>rest)));
       if(window.DDNativeHoldAuthor){await new Promise(resolve=>{window.DDNativeReleaseAuthor=resolve});}
       return reply(snapshot);
      }
      if(url.pathname==='/rest/v1/rpc/dd_cr_withdraw'&&method==='POST'){
       const chosen=window.DDNativeAuthorRows.find(x=>x.id===json?.p_id&&x.owner===actor);
       if(!chosen)return reply({code:'42501'},403);
       const rootId=chosen.revision_of||chosen.id;
       const chain=window.DDNativeAuthorRows.filter(x=>x.owner===actor&&(x.id===rootId||x.revision_of===rootId)&&['published','pending','flagged'].includes(x.status));
       chain.forEach(x=>{x.status='withdrawn';x.has_active_successor=false;});
       for(const x of window.DDNativeRows)if(chain.some(y=>y.id===x.id))x.status='withdrawn';
       window.DDNativeWithdrawWrites.push({actor,id:chosen.id,affected:chain.length});
       return reply(chain.length);
      }
      if(url.pathname==='/rest/v1/rpc/dd_cr_moderation_queue'&&method==='POST'){
       if(actor!==reviewOwner)return reply({code:'42501'},403);
       const snapshot=JSON.parse(JSON.stringify(window.DDNativeQueue));
       if(window.DDNativeHoldQueue){await new Promise(resolve=>{window.DDNativeReleaseQueue=resolve});}
       return reply(snapshot);
      }
      if(url.pathname==='/rest/v1/rpc/dd_cr_review'&&method==='POST'){
       if(actor!==reviewOwner||!['restore','reject'].includes(json?.p_action)||!json?.p_reason)return reply({code:'42501'},403);
       const current=window.DDNativeQueue.find(item=>item.id===json.p_id);
       if(window.DDNativeAdvanceRoundOnReview&&current){current.review_round++;window.DDNativeAdvanceRoundOnReview=false;}
       if(!current||current.review_round!==json.p_expected_round)return reply({code:'stale'},409);
       window.DDNativeReviewWrites.push({actor,action:json.p_action,id:json.p_id,round:json.p_expected_round});
       window.DDNativeQueue=window.DDNativeQueue.filter(item=>item.id!==json.p_id);
       return reply(true);
      }
      const target=json?.report_id||json?.p_id||url.searchParams.get('report_id')?.replace(/^eq\./,'');
      window.DDNativeWrites.push({method,path:url.pathname,actor,target});
      if(!window.DDNativeRows.some(r=>r.id===target&&r.status==='published'))return reply({code:'42501'},403);
      if(url.pathname==='/rest/v1/dd_cr_reactions'){
       const found=window.DDNativeReactions.find(r=>r.report_id===target&&r.member_id===actor);
       if(method==='POST'){
        if(found)return reply({code:'23505'},409);
        window.DDNativeReactions.push({report_id:target,reaction:json.reaction,member_id:actor});
       }else if(method==='PATCH'){if(found)found.reaction=json.reaction;}
       else if(method==='DELETE'){window.DDNativeReactions=window.DDNativeReactions.filter(r=>r!==found);}
       else return reply({code:'unexpected'},400);
       return reply(null,204);
      }
      if(url.pathname==='/rest/v1/dd_cr_comments'&&method==='POST'){
       window.DDNativeComments.push({id:crypto.randomUUID(),report_id:target,status:'visible',author_label:'Fixture signed member',body_text:json.body_text,created_at:'2026-01-02T00:00:00Z',member_id:actor});
       return reply(null,204);
      }
      if(url.pathname==='/rest/v1/rpc/dd_cr_flag'&&method==='POST'){
       if(window.DDNativeFlags.some(r=>r.target===target&&r.actor===actor))return reply({accepted:false,hidden:false});
       window.DDNativeFlags.push({target,actor});
       return reply({accepted:true,hidden:false});
      }
      return reply({code:'unexpected'},400);
     };
     window.supabase={createClient:()=>({
      from(name){
       const tables={dd_cr_submissions:window.DDNativeRows,dd_cr_reactions:window.DDNativeReactions,dd_cr_comments:window.DDNativeComments};
       const profileTables=['research_documents','investigation_boards','dd_witness_reports','dd_public_names','research_document_trash','dd_public_witness_reports'];
       if(!tables[name]&&!profileTables.includes(name))throw Error('Unexpected table');
       let data=(tables[name]||[]).slice(),count=false;
       const chain={
        select(cols,options){count=options?.count==='exact';return chain},eq(k,v){data=data.filter(x=>x[k]===v);return chain},
        order(){return chain},limit(n){data=data.slice(0,n);return chain},ilike(k,v){data=data.filter(x=>String(x[k]).toLowerCase().includes(v.slice(1,-1).toLowerCase()));return chain},
        range(a,b){return Promise.resolve({data:data.slice(a,b+1),error:null})},
        maybeSingle(){return Promise.resolve({data:data[0]||null,error:null})},
        then(resolve,reject){return Promise.resolve({data:count?null:data,count:count?data.length:null,error:null}).then(resolve,reject)}
       };return chain;
      },
      async rpc(name){
       if(name==='dd_is_comment_moderator')return {data:!!window.DDNativeSession&&!window.DDNativeSession.user.is_anonymous,error:null};
       if(name==='dd_profile_received_reactions')return {data:{post_likes:0,post_dislikes:0,comment_likes:0,comment_dislikes:0},error:null};
       if(['dd_my_comments','dd_case_comment_moderation_queue','dd_witness_moderation_queue','dd_live_chat_moderation_queue'].includes(name))return {data:[],error:null};
       return {data:null,error:{message:'Fixture unsupported RPC'}};
      },
      auth:{
       getSession:async()=>({data:{session:window.DDNativeSession},error:null}),
       getUser:async token=>({data:{user:(token===undefined||token===window.DDNativeSession?.access_token)?window.DDNativeSession?.user:null},error:null}),
       onAuthStateChange(fn){listeners.push(fn);fn('INITIAL_SESSION',window.DDNativeSession);return {data:{subscription:{unsubscribe(){}}}}}
      }
     })};
    },{row,other});
    const native=await ctx.newPage();
    await native.goto(base+'/index.html?dd_tab=communityResearchPage&dd_publication='+id);
    const pane=native.locator('#communityResearchPage');
    await pane.getByText('Sample published text',{exact:true}).waitFor();
    const feedback=pane.getByRole('region',{name:'Reader feedback'});
    await feedback.getByText('2 likes · 1 dislike',{exact:true}).waitFor();
    await feedback.getByText('20 visible comments shown.',{exact:true}).waitFor();
    assert.equal(await feedback.getByText('<img src=x onerror=alert(1)>',{exact:true}).count(),1);
    assert.equal(await feedback.locator('img').count(),0);
    assert.equal(await feedback.getByText('REMOVED COMMENT',{exact:true}).count(),0);
    assert.equal(await feedback.getByText('PRIVATE MEMBER ID',{exact:true}).count(),0);
    await feedback.getByRole('button',{name:'Load more comments'}).click();
    await feedback.getByText('21 visible comments shown.',{exact:true}).waitFor();
    assert.equal(await feedback.getByText('Public comment 21',{exact:true}).count(),1);
    assert.equal(await feedback.getByRole('button',{name:'Load more comments'}).isVisible(),false);
    await feedback.getByText('Sign in with a member account',{exact:false}).waitFor();
    assert.equal(await feedback.getByRole('button',{name:'Like',exact:true}).isVisible(),false);
    const memberA='00000000-0000-4000-8000-000000000011',memberB='00000000-0000-4000-8000-000000000012';
    await native.evaluate(id=>window.DDNativeSetIdentity(id,true),memberA);
    await feedback.getByText('Sign in with a member account',{exact:false}).waitFor();
    assert.equal(await feedback.getByRole('button',{name:'Like',exact:true}).isVisible(),false);
    await native.evaluate(id=>window.DDNativeSetIdentity(id,false),memberB);
    const like=feedback.getByRole('button',{name:'Like',exact:true});
    await like.waitFor();await like.click();
    await feedback.getByText('3 likes · 1 dislike',{exact:true}).waitFor();
    await feedback.getByRole('button',{name:'Dislike',exact:true}).click();
    await feedback.getByText('2 likes · 2 dislikes',{exact:true}).waitFor();
    await feedback.getByRole('button',{name:'Clear my reaction'}).click();
    await feedback.getByText('2 likes · 1 dislike',{exact:true}).waitFor();
    const comment=feedback.getByLabel('Your public comment');
    const post=feedback.getByRole('button',{name:'Post comment'});
    assert.equal(await post.isEnabled(),false);
    await comment.fill('Fictional member feedback');await post.click();
    await feedback.getByText('Comment submitted.',{exact:true}).waitFor();
    await feedback.getByText('20 visible comments shown.',{exact:true}).waitFor();
    assert.equal(await native.evaluate(()=>window.DDNativeComments.filter(x=>x.body_text==='Fictional member feedback').length),1);
    const report=feedback.getByRole('button',{name:'Report research'});
    const reason=feedback.getByLabel('Reason for reporting this research');
    await reason.fill('Fictional moderation concern');await report.click();
    await feedback.getByText('Report submitted for moderation.',{exact:true}).waitFor();
    await reason.fill('Same fictional concern');await report.click();
    await feedback.getByText('You have already reported this version',{exact:false}).waitFor();
    await feedback.getByText('20 visible comments shown.',{exact:true}).waitFor();
    // A silent account change between composing and clicking must not send.
    await comment.fill('Must not be sent by a different account');
    const before=await native.evaluate(()=>window.DDNativeWrites.length);
    await native.evaluate(id=>window.DDNativeSetIdentity(id,false,false),memberA);
    await post.click();
    await feedback.getByText('Action cancelled. Nothing was sent.',{exact:true}).waitFor();
    assert.equal(await native.evaluate(()=>window.DDNativeWrites.length),before);
    assert.equal(await post.isVisible(),false);
    await native.evaluate(()=>window.DDNativeSetIdentity(null));
    await feedback.getByText('Sign in with a member account',{exact:false}).waitFor();
    assert.equal(await native.locator('[data-tab="communityResearchPage"]').getAttribute('aria-current'),'page');
    assert.ok(await native.locator('.nav').isVisible());
    await pane.getByRole('button',{name:'Add to W.NE citations'}).click();
    await native.waitForFunction(()=>JSON.parse(localStorage.getItem('wne_research_references_v1')||'[]').some(r=>r.url.includes('dd_publication')));
    await pane.getByRole('button',{name:'Back to Community Research'}).click();
    await pane.getByRole('heading',{name:'Second archive note · v2'}).waitFor();
    await pane.locator('#ddCRSearch').fill('Second');await pane.locator('#ddCRSearchGo').click();
    await pane.getByRole('heading',{name:'Second archive note · v2'}).waitFor();
    assert.equal(await pane.locator('article').count(),1);
    await pane.getByRole('button',{name:'Read research'}).click();
    await pane.getByText('Sample published text',{exact:true}).waitFor();
    await pane.getByRole('region',{name:'Reader feedback'}).getByText('No visible comments yet.',{exact:true}).waitFor();
    assert.equal(new URL(native.url()).searchParams.get('dd_publication'),other);
    await native.evaluate(()=>{window.DDNativeRows[1].status='flagged';window.DDCommunityResearch.refresh()});
    await pane.getByText('This publication is unavailable.',{exact:true}).waitFor();
    assert.equal(await pane.locator('article').count(),0);
    await native.locator('[data-tab="originalResearchPage"]').click();
    assert.ok(await native.locator('#originalResearchPage').isVisible());
    assert.equal(new URL(native.url()).searchParams.has('dd_publication'),false);
    assert.equal(await native.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    console.log('PASS gated native tab, public reader feedback, member actions, report duplicate, account-switch cancellation and removed report handling at '+width+'px');
    // Profile's real admin UI consumes fictional comment-moderator permission.
    // The separate research-owner endpoint must deny an ordinary moderator.
    await native.evaluate(id=>{window.DDNativeSetIdentity(id);window.navigateTo('profilePage');},memberA);
    const mod=native.locator('#ddCRModeration');
    await mod.locator('summary').first().click();
    await mod.getByText('Owner review unavailable.',{exact:false}).waitFor();
    assert.equal(await mod.locator('[data-review-id]').count(),0);
    await native.evaluate(id=>window.DDNativeSetIdentity(id),memberB);
    await native.locator('#ddProfileAdmin').waitFor({state:'visible'});
    await mod.locator('summary').first().click();
    await mod.getByText('2 pending research version(s) shown.',{exact:true}).waitFor();
    const first=mod.locator('[data-review-id]').filter({hasText:'Fictional hidden research'});
    await first.getByText('Read full research and references',{exact:true}).click();
    assert.equal(await first.getByText('<img src=x onerror=alert(1)> Private reviewed text',{exact:true}).count(),1);
    assert.equal(await first.locator('img').count(),0);
    assert.equal(await mod.getByText('PRIVATE OWNER ID',{exact:true}).count(),0);
    await first.getByText('5 report reasons',{exact:true}).click();
    await first.getByText('Fictional reason 1',{exact:true}).waitFor();
    const decide=first.getByRole('button',{name:'Confirm review decision'});
    assert.equal(await decide.isEnabled(),false);
    await first.getByLabel('Review decision').selectOption('restore');
    await first.getByLabel('Decision reason').fill('Reviewed fictional evidence.');
    assert.equal(await decide.isEnabled(),false);
    await first.getByRole('checkbox').check();await decide.click();
    await mod.getByText('Version restored. 1 pending research version(s) shown.',{exact:true}).waitFor();
    const second=mod.locator('[data-review-id]').filter({hasText:'Second hidden research'});
    await second.getByLabel('Review decision').selectOption('reject');
    await second.getByLabel('Decision reason').fill('Fictional moderation decision.');
    await second.getByRole('checkbox').check();
    // A server-side change after opening the queue invalidates the review.
    await native.evaluate(()=>window.DDNativeQueue[0].review_round++);
    await second.getByRole('button',{name:'Confirm review decision'}).click();
    await mod.getByText('Case changed. Refresh and review',{exact:false}).waitFor();
    assert.equal(await native.evaluate(()=>window.DDNativeReviewWrites.length),1);
    await mod.getByRole('button',{name:'Refresh research review'}).click();
    await mod.getByText('1 pending research version(s) shown.',{exact:true}).waitFor();
    await second.getByLabel('Review decision').selectOption('reject');
    await second.getByLabel('Decision reason').fill('Fictional moderation decision.');
    await second.getByRole('checkbox').check();
    // Silent identity changes still cannot use a decision composed by the owner.
    await native.evaluate(id=>window.DDNativeSetIdentity(id,false,false),memberA);
    await second.getByRole('button',{name:'Confirm review decision'}).click();
    await mod.locator('[data-review-id]').first().waitFor({state:'detached'});
    assert.equal(await native.evaluate(()=>window.DDNativeReviewWrites.length),1);
    // Late private responses must not render after switching users.
    await native.evaluate(id=>{window.DDNativeSetIdentity(id);window.DDNativeHoldQueue=true;},memberB);
    await native.locator('#ddProfileAdmin').waitFor({state:'visible'});
    await mod.locator('summary').first().click();
    await native.waitForFunction(()=>typeof window.DDNativeReleaseQueue==='function');
    await native.evaluate(id=>{window.DDNativeSetIdentity(id);window.DDNativeHoldQueue=false;window.DDNativeReleaseQueue();},memberA);
    await native.waitForFunction(()=>!document.getElementById('ddCRModeration').open);
    assert.equal(await mod.locator('[data-review-id]').count(),0);
    await native.evaluate(id=>window.DDNativeSetIdentity(id),memberB);
    await mod.locator('summary').first().click();
    await mod.getByText('1 pending research version(s) shown.',{exact:true}).waitFor();
    await second.getByLabel('Review decision').selectOption('reject');
    await second.getByLabel('Decision reason').fill('Fictional reviewed concern.');
    await second.getByRole('checkbox').check();
    // Advance only after the preview's fresh queue read: the server must deny.
    await native.evaluate(()=>window.DDNativeAdvanceRoundOnReview=true);
    await second.getByRole('button',{name:'Confirm review decision'}).click();
    await mod.getByText('Decision not confirmed.',{exact:false}).waitFor();
    assert.equal(await native.evaluate(()=>window.DDNativeReviewWrites.length),1);
    await mod.getByRole('button',{name:'Refresh research review'}).click();
    await mod.getByText('1 pending research version(s) shown.',{exact:true}).waitFor();
    await second.getByLabel('Review decision').selectOption('reject');
    await second.getByLabel('Decision reason').fill('Fictional reviewed concern.');
    await second.getByRole('checkbox').check();
    await second.getByRole('button',{name:'Confirm review decision'}).click();
    await mod.getByText('Version rejected and kept hidden. No research awaiting review.',{exact:true}).waitFor();
    assert.deepEqual(await native.evaluate(()=>window.DDNativeReviewWrites.map(x=>[x.action,x.round])),[['restore',1],['reject',3]]);
    await native.evaluate(()=>window.navigateTo('originalResearchPage'));
    assert.equal(await mod.locator('[data-review-id]').count(),0);
    console.log('PASS owner queue, explicit reason/confirmation, restore/reject, stale case, silent account change and delayed private response clearing at '+width+'px');
    // Only fictional account-scoped metadata and a previously public snapshot.
    await native.evaluate(({memberA,memberB})=>{
     const mk=(n,title,owner,status='published',version_no=1,revision_of=null,successor=false,created_at='2026-10-01T00:00:00Z')=>({
      id:'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),title,owner,status,author_label:'Fixture author',category:'Case analysis',
      version_no,revision_of,created_at,has_active_successor:successor,private_token:'NEVER RENDER PRIVATE TOKEN'
     });
     const parent=mk(30,'Original fictional publication',memberB,'published',1,null,true,'2026-11-24T00:00:00Z');
     const latest=mk(31,'Latest fictional revision',memberB,'published',2,parent.id,false,'2026-11-25T00:00:00Z');
     const removed=mk(32,'Withdrawn fictional research',memberB,'withdrawn',1,null,false,'2026-11-23T00:00:00Z');
     window.DDNativeAuthorRows=[latest,parent,removed,mk(33,'Other private account title',memberA,'flagged'),...Array.from({length:19},(_,i)=>mk(40+i,'Older author fixture '+i,memberB,'withdrawn'))];
     for(const source of [latest,parent])window.DDNativeRows.push({...source,abstract:'Fictional public abstract',body_text:'Fictional public revision body',references_text:'Fictional reference'});
     window.DDNativeSetIdentity(memberB);window.navigateTo('profilePage');
    },{memberA,memberB});
    const author=native.locator('#ddCRAuthor');
    await author.locator('summary').first().click();
    await author.getByText('20 of your research version(s) shown.',{exact:true}).waitFor();
    assert.equal(await author.getByText('Other private account title',{exact:false}).count(),0);
    assert.equal(await author.getByText('NEVER RENDER PRIVATE TOKEN',{exact:false}).count(),0);
    const latest=author.locator('[data-author-publication-id]').filter({hasText:'Latest fictional revision'});
    const original=author.locator('[data-author-publication-id]').filter({hasText:'Original fictional publication'});
    assert.equal(await original.getByRole('button',{name:'Prepare revision draft'}).count(),0);
    assert.equal(await original.getByText('This version has a newer active revision.').count(),1);
    await latest.getByRole('button',{name:'Prepare revision draft'}).click();
    const draft=latest.getByLabel('Revision research text');
    assert.equal(await draft.inputValue(),'Fictional public revision body');
    await draft.fill('Updated fictional revision draft');
    await latest.getByRole('button',{name:'Copy revision draft text'}).click();
    await author.getByText('Revision text copied.',{exact:false}).waitFor();
    assert.match(await native.evaluate(()=>window.DDNativeRevisionClipboard),/Updated fictional revision draft/);
    assert.equal(await native.evaluate(()=>window.DDNativeWithdrawWrites.length),0);
    await author.getByRole('button',{name:'Older publications'}).click();
    await author.getByText('2 of your research version(s) shown.',{exact:true}).waitFor();
    assert.equal(await latest.count(),0);
    await author.getByRole('button',{name:'Refresh newest publications'}).click();
    await author.getByText('20 of your research version(s) shown.',{exact:true}).waitFor();
    assert.equal(await latest.getByLabel('Revision research text').count(),0);
    await latest.getByText('Withdraw all versions',{exact:true}).click();
    const doWithdraw=latest.getByRole('button',{name:'Confirm entire-chain withdrawal'});
    await latest.getByLabel('Withdrawal reason').fill('Fictional reason to withdraw.');
    assert.equal(await doWithdraw.isEnabled(),false);
    await latest.getByLabel('Type WITHDRAW to confirm').fill('WITHDRAW');
    await native.evaluate(id=>window.DDNativeSetIdentity(id,false,false),memberA);
    await doWithdraw.click();
    await author.locator('[data-author-publication-id]').first().waitFor({state:'detached'});
    assert.equal(await native.evaluate(()=>window.DDNativeWithdrawWrites.length),0);
    // A delayed owner list cannot paint after a real identity-change event.
    await native.evaluate(id=>{window.DDNativeSetIdentity(id);window.DDNativeHoldAuthor=true;},memberB);
    await author.locator('summary').first().click();
    await native.waitForFunction(()=>typeof window.DDNativeReleaseAuthor==='function');
    await native.evaluate(id=>{window.DDNativeSetIdentity(id);window.DDNativeHoldAuthor=false;window.DDNativeReleaseAuthor();},memberA);
    await native.waitForFunction(()=>!document.getElementById('ddCRAuthor').open);
    assert.equal(await author.locator('[data-author-publication-id]').count(),0);
    await author.locator('summary').first().click();
    await author.getByText('1 of your research version(s) shown.',{exact:true}).waitFor();
    assert.equal(await author.getByText('Other private account title',{exact:false}).count(),1);
    assert.equal(await latest.count(),0);
    await native.evaluate(id=>window.DDNativeSetIdentity(id),memberB);
    await author.locator('summary').first().click();
    await author.getByText('20 of your research version(s) shown.',{exact:true}).waitFor();
    await latest.getByText('Withdraw all versions',{exact:true}).click();
    await latest.getByLabel('Withdrawal reason').fill('Fictional reason to withdraw.');
    await latest.getByLabel('Type WITHDRAW to confirm').fill('WITHDRAW');
    await doWithdraw.click();
    await author.getByText('2 active version(s) withdrawn.',{exact:false}).waitFor();
    assert.ok(await latest.getByText('Withdrawn · Case analysis',{exact:false}).isVisible());
    assert.ok(await original.getByText('Withdrawn · Case analysis',{exact:false}).isVisible());
    assert.equal(await latest.getByRole('button',{name:'Prepare revision draft'}).count(),0);
    assert.equal(await native.evaluate(()=>window.DDNativeWithdrawWrites.length),1);
    await native.evaluate(()=>window.navigateTo('originalResearchPage'));
    assert.equal(await author.locator('[data-author-publication-id]').count(),0);
    assert.equal(await native.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    console.log('PASS author-only metadata and keyset pagination, local revision preview/copy, typed whole-chain withdrawal, switched-account and delayed private-list clearing at '+width+'px');


   }finally{await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
