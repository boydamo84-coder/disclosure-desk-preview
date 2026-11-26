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
    assert.ok(await page.locator('#discover').isVisible());
    await page.close();
    await ctx.route('**/assets/community-test-config.js?*',r=>r.fulfill({contentType:'application/javascript',body:'window.DD_COMMUNITY_TEST_CONFIG={environment:"test",url:"https://fixture.invalid",publishableKey:"test-only"};window.DD_COMMUNITY_FEATURES={researchPublishing:true};'}));
    await ctx.addInitScript(({row,other})=>{
     window.DDNativeRows=[row,{...row,id:other,title:'Second archive note',category:'Historical research'}];
     window.DDNativeReactions=[{report_id:row.id,reaction:1},{report_id:row.id,reaction:1},{report_id:row.id,reaction:-1},{report_id:other,reaction:1}];
     window.DDNativeComments=Array.from({length:21},(_,i)=>({
      id:'00000000-0000-4000-8000-'+String(100+i).padStart(12,'0'),report_id:row.id,status:'visible',
      author_label:'Fictional commenter',body_text:i===0?'<img src=x onerror=alert(1)>':'Public comment '+(i+1),
      created_at:'2026-01-01T00:00:00Z',member_id:'PRIVATE MEMBER ID'
     }));
     window.DDNativeComments.push({id:'00000000-0000-4000-8000-000000000999',report_id:row.id,status:'removed',author_label:'Removed author',body_text:'REMOVED COMMENT'});
     window.supabase={createClient:()=>({
      from(name){
       const tables={dd_cr_submissions:window.DDNativeRows,dd_cr_reactions:window.DDNativeReactions,dd_cr_comments:window.DDNativeComments};
       if(!tables[name])throw Error('Unexpected table');
       let data=tables[name].slice(),count=false;
       const chain={
        select(cols,options){count=options?.count==='exact';return chain},eq(k,v){data=data.filter(x=>x[k]===v);return chain},
        order(){return chain},ilike(k,v){data=data.filter(x=>String(x[k]).toLowerCase().includes(v.slice(1,-1).toLowerCase()));return chain},
        range(a,b){return Promise.resolve({data:data.slice(a,b+1),error:null})},
        maybeSingle(){return Promise.resolve({data:data[0]||null,error:null})},
        then(resolve,reject){return Promise.resolve({data:count?null:data,count:count?data.length:null,error:null}).then(resolve,reject)}
       };return chain;
      },
      auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}
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
    console.log('PASS gated native tab, exact route, search, citation, public reaction totals, comment pagination/plain text and removed report handling at '+width+'px');
   }finally{await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
