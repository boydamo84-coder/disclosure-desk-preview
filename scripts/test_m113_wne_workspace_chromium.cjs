'use strict';
// M113: real workspace/iframe, dock clearance, image modal and trailing comparison.
// Uses a fictional account and a mock Supabase JS library, never real Supabase.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core'),zlib=require('node:zlib');
const BASE='http://127.0.0.1:4173',SOURCE='11111111-1111-4111-8111-111111111111',
 REV='22222222-2222-4222-8222-222222222222',
 COPY='33333333-3333-4333-8333-333333333333',
 OWNER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function crc(data){let n=0xffffffff;for(const byte of data){n^=byte;for(let j=0;j<8;j++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([len,name,data,sum]);}
function png(){
 const w=120,h=90,raw=Buffer.alloc(h*(1+4*w));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const o=y*(1+4*w)+1+x*4;raw[o]=(x*2)%255;raw[o+1]=(y*2)%255;raw[o+2]=120;raw[o+3]=255;}
 const head=Buffer.alloc(13);head.writeUInt32BE(w,0);head.writeUInt32BE(h,4);head[8]=8;head[9]=6;
 return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}
const IMG=png();
const comparison=name=>'<div class="dd-comparison-block"><p>CASE COMPARISON '+name+'</p><table><tbody><tr><th>Field</th><th>Record '+name+'</th></tr><tr><td>Source</td><td>Archive '+name+'</td></tr></tbody></table><p>Sources: <a href="https://example.org/'+name+'">Reference '+name+'</a></p></div>';
const table=name=>'<table><tbody><tr><td>Record '+name+'</td><td>Keep '+name+'</td></tr></tbody></table>';
const fig=(caption,width=60)=>'<figure width="'+width+'" align="right"><img src="'+IMG+'" width="100%" alt="Synthetic evidence photograph">'+(caption?'<figcaption>'+caption+'</figcaption>':'')+'</figure>';
const documentData={version:2,bookTitle:'M111 Synthetic Layout Notebook',active:'a',
 chapters:[{id:'a',title:'Layout regression',html:comparison('A')+fig('Evidence photo — Source: test archive')+comparison('B')+'<p>Separate existing prose.</p>'+table('C')+fig('',50)+table('D')+table('E')},
 {id:'b',title:'Unrelated section',html:'<p>Keep unrelated section untouched.</p>'}],font:'Georgia',size:12};
const fakeJs='(()=>{'+
 'const OWNER='+JSON.stringify(OWNER)+',SOURCE='+JSON.stringify(SOURCE)+',REV='+JSON.stringify(REV)+',COPY='+JSON.stringify(COPY)+';'+
 'const doc='+JSON.stringify(documentData)+';'+
 'let state;try{state=JSON.parse(sessionStorage.getItem("m111-safe-writer-fixture")||"null")}catch(_){};'+
 'if(!state)state={rows:[{id:SOURCE,user_id:OWNER,title:doc.bookTitle,content:doc,revision:1,updated_at:"2026-11-09T01:00:00Z"}],'+
 'snapshots:[{id:REV,document_id:SOURCE,user_id:OWNER,title:doc.bookTitle,content:JSON.parse(JSON.stringify(doc)),revision:1,saved_at:"2026-11-09T00:00:00Z"}],writes:0};'+
 'const persist=()=>{sessionStorage.setItem("m111-safe-writer-fixture",JSON.stringify(state))};persist();window.__m111Fixture=state;'+
 'const db={auth:{getUser:async()=>({data:{user:{id:OWNER,is_anonymous:false}},error:null}),'+
 'getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},'+
 'from(table){const filters={};const data=table==="research_documents"?state.rows:table==="research_document_revisions"?state.snapshots:null;'+
 'if(!data)throw Error("Forbidden fake table "+table);'+
 'const find=()=>data.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));'+
 'const query={select(){return this},eq(k,v){filters[k]=v;return this},order(){return this},limit(n){return Promise.resolve({data:find().slice(0,n),error:null})},'+
 'range(a,b){return Promise.resolve({data:find().slice(a,b+1),error:null})},'+
 'maybeSingle(){return this.single()},single:async()=>{const item=find()[0];return item?{data:JSON.parse(JSON.stringify(item)),error:null}:{data:null,error:{message:"Not found"}}}};'+
 'return {...query,insert(row){if(table!=="research_documents")throw Error("Forbidden insert");const item={...JSON.parse(JSON.stringify(row)),id:COPY,revision:1,updated_at:"2026-11-09T02:00:00Z"};state.rows.push(item);persist();'+
 'return {select(){return {single:async()=>({data:{id:item.id,title:item.title},error:null})}}}}};},'+
 'rpc:async(name,args)=>{if(name!=="research_save_document")return {data:null,error:{message:"Forbidden RPC"}};'+
 'const item=state.rows.find(x=>x.id===args.p_id);if(!item||item.revision!==args.p_expected_revision)return {data:null,error:{message:"Revision mismatch"}};'+
 'item.content=JSON.parse(JSON.stringify(args.p_content));item.title=args.p_title;item.revision++;state.writes++;persist();'+
 'return {data:[{saved_revision:item.revision}],error:null}}};'+
 'window.supabase={createClient:()=>db};})();';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const [width,height] of [[320,780],[393,852]]){
   const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 Android DisclosureDeskAndroid'});
   const fixture={...documentData,chapters:[{...documentData.chapters[0],html:documentData.chapters[0].html+comparison('Final')},documentData.chapters[1]]};
   const workspaceJs=fakeJs.replace(JSON.stringify(documentData),JSON.stringify(fixture));
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('/@supabase/'))return route.fulfill({status:200,contentType:'application/javascript',body:workspaceJs});
    return url.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   await ctx.addInitScript(()=>{
    try{localStorage.setItem('dd-research-studio-view-choice-v1','writer');localStorage.setItem('dd-research-nav-hidden-v1','0')}catch(_){}
   });
   const page=await ctx.newPage();page.on('dialog',d=>d.dismiss());
   await page.goto(BASE+'/research/research-workspace.html?id='+SOURCE,{waitUntil:'domcontentloaded'});
   const dock=page.locator('#ddResearchSiteDock'),writer=page.frameLocator('#writer');
   await dock.waitFor();
   await writer.locator('#editor[contenteditable="true"]').waitFor({timeout:15000});
   const visibleClear=()=>page.evaluate(()=>{
    const iframe=document.getElementById('writer'),nav=document.getElementById('ddResearchSiteDock');
    return !nav.classList.contains('is-hidden')&&iframe.getBoundingClientRect().bottom<=nav.getBoundingClientRect().top+1;
   });
   await page.waitForFunction(()=>document.getElementById('writer').getBoundingClientRect().bottom<=document.getElementById('ddResearchSiteDock').getBoundingClientRect().top+1);
   const menuToggle=dock.locator('.dd-site-dock-toggle');
   await menuToggle.click();assert.equal(await dock.evaluate(el=>el.classList.contains('is-hidden')),true);
   await menuToggle.click();await page.waitForFunction(()=>document.getElementById('writer').getBoundingClientRect().bottom<=document.getElementById('ddResearchSiteDock').getBoundingClientRect().top+1);
   await writer.locator('#wne-splash').waitFor({state:'hidden'});
   const img=writer.locator('#editor > figure img').first();
   // Open the actual editor via its image handler; the preceding M111 test
   // already checks real image clicks. This fixture specifically hit-tests the
   // dialog through the parent dock, not the sticky editor toolbar.
   await img.evaluate(el=>el.click());
   await writer.locator('#dd-image-edit[open]').waitFor();
   await writer.locator('#dd-image-edit summary').click();
   // The real crop dialog must fit above the parent dock; its fixed action row
   // remains tappable even when the crop controls themselves need scrolling.
   const doneClear=()=>page.evaluate(()=>{
    const frame=document.getElementById('writer'),doc=frame.contentDocument,nav=document.getElementById('ddResearchSiteDock');
    const button=doc.getElementById('dd-close-img'),rect=button.getBoundingClientRect(),top=frame.getBoundingClientRect();
    const x=top.x+frame.clientLeft+rect.x+rect.width/2,y=top.y+frame.clientTop+rect.y+rect.height/2;
    return rect.height>=40&&rect.top>=0&&rect.bottom<=frame.clientHeight+1&&y<nav.getBoundingClientRect().top&&document.elementFromPoint(x,y)===frame&&doc.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)===button;
   });
   assert.ok(await visibleClear(),'Writer lies entirely above visible dock');
   assert.ok(await doneClear(),'Done is directly reachable with Crop expanded');
   await writer.locator('#dd-crop-left').evaluate(el=>{el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}))});
   const original=await img.getAttribute('src');
   await writer.locator('#dd-apply-crop').click();
   await writer.locator('#dd-img-edit-feedback').filter({hasText:'Crop applied.'}).waitFor();
   assert.notEqual(await img.getAttribute('src'),original);
   assert.ok(await doneClear(),'Done remains visible after applying crop and scrolling');
   await writer.locator('#dd-close-img').click();
   assert.equal(await writer.locator('#dd-image-edit[open]').count(),0);
   assert.equal(await dock.evaluate(el=>el.classList.contains('is-hidden')),false);
   // Reopen at smaller keyboard-like height and verify the pinned action again.
   await img.evaluate(el=>el.click());await writer.locator('#dd-image-edit[open]').waitFor();
   await page.setViewportSize({width,height:Math.max(520,height-220)});
   await page.waitForFunction(()=>document.getElementById('writer').getBoundingClientRect().bottom<=document.getElementById('ddResearchSiteDock').getBoundingClientRect().top+1);
   assert.ok(await doneClear(),'Done stays above dock at reduced height');
   await writer.locator('#dd-close-img').click();
   await page.setViewportSize({width,height});
   // Final comparison's touch target must be a top-level paragraph, not the
   // source-note paragraph inside the comparison or a decorative margin.
   const last=writer.locator('#editor > .dd-comparison-block').last();
   const originalText=await last.innerText();
   const gap=last.locator('xpath=following-sibling::*[1]');
   await gap.waitFor();
   assert.ok(await gap.evaluate(el=>el.matches('p[data-wne-block-gap],div[data-wne-block-gap]')&&el.getBoundingClientRect().height>=28));
   await page.locator('#editorHeaderTools').click();
   await gap.evaluate(el=>el.scrollIntoView({block:'center'}));
   await gap.tap();await page.keyboard.type('Outside the final comparison.');
   await page.keyboard.press('Enter');await page.keyboard.type('Second outside paragraph.');
   assert.equal(await last.innerText(),originalText);
   assert.match(await writer.locator('#editor').innerText(),/Outside the final comparison/);
   assert.match(await writer.locator('#editor').innerText(),/Second outside paragraph/);
   const save=await writer.locator('#editor').evaluate(()=>window.wneSaveBeforeNavigation('M113 workspace regression'));
   assert.equal(save,true);
   // Full screen must still have its original expanded writing space.
   await page.locator('#dd-writing-focus-enter').click();
   assert.equal(await dock.isVisible(),false);
   assert.equal(await page.locator('body').evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom)),0);
   await page.locator('#dd-writing-focus-exit').click();
   assert.ok(await visibleClear());
   console.log('PASS M113 '+width+'px: visible dock clearance, pinned image actions, real crop, reduced viewport, final comparison typing and full-screen restore');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M113 WNE workspace',e.stack||e);process.exitCode=1});
