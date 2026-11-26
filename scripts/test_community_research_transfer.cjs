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
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
