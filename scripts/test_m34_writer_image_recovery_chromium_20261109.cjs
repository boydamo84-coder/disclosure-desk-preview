'use strict';
// M34 actual Writer HTML regression: recover multi-section text + embedded photo,
// crop safely, save/reopen and verify separate restored copy through real bridge.
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
const documentData={version:2,bookTitle:'M34 Synthetic Image Notebook',active:'a',
 chapters:[
  {id:'a',title:'Evidence photo',html:'<p>BEGIN KEEP EXACTLY ONE</p><figure width="100" style="width:100%" align="center"><img src="'+IMG+'" width="100%" alt="Synthetic red-blue grid"><figcaption>Synthetic image sample</figcaption></figure><p>END KEEP EXACTLY ONE</p>'},
  {id:'b',title:'Second evidence',html:'<p>SECOND SECTION PRESERVED without repeating or scrambling.</p>'}
 ],font:'Georgia',size:12};
const fakeJs='(()=>{'+
 'const OWNER='+JSON.stringify(OWNER)+',SOURCE='+JSON.stringify(SOURCE)+',REV='+JSON.stringify(REV)+',COPY='+JSON.stringify(COPY)+';'+
 'const doc='+JSON.stringify(documentData)+';'+
 'let state;try{state=JSON.parse(sessionStorage.getItem("m34-safe-writer-fixture")||"null")}catch(_){};'+
 'if(!state)state={rows:[{id:SOURCE,user_id:OWNER,title:doc.bookTitle,content:doc,revision:1,updated_at:"2026-11-09T01:00:00Z"}],'+
 'snapshots:[{id:REV,document_id:SOURCE,user_id:OWNER,title:doc.bookTitle,content:JSON.parse(JSON.stringify(doc)),revision:1,saved_at:"2026-11-09T00:00:00Z"}],writes:0};'+
 'const persist=()=>{sessionStorage.setItem("m34-safe-writer-fixture",JSON.stringify(state))};persist();window.__m34Fixture=state;'+
 'const db={auth:{getUser:async()=>({data:{user:{id:OWNER,is_anonymous:false}},error:null}),'+
 'getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},'+
 'from(table){const filters={};const data=table==="research_documents"?state.rows:table==="research_document_revisions"?state.snapshots:null;'+
 'if(!data)throw Error("Forbidden fake table "+table);'+
 'const find=()=>data.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));'+
 'const query={select(){return this},eq(k,v){filters[k]=v;return this},order(){return this},limit(n){return Promise.resolve({data:find().slice(0,n),error:null})},'+
 'range(a,b){return Promise.resolve({data:find().slice(a,b+1),error:null})},'+
 'single:async()=>{const item=find()[0];return item?{data:JSON.parse(JSON.stringify(item)),error:null}:{data:null,error:{message:"Not found"}}}};'+
 'return {...query,insert(row){if(table!=="research_documents")throw Error("Forbidden insert");const item={...JSON.parse(JSON.stringify(row)),id:COPY,revision:1,updated_at:"2026-11-09T02:00:00Z"};state.rows.push(item);persist();'+
 'return {select(){return {single:async()=>({data:{id:item.id,title:item.title},error:null})}}}}};},'+
 'rpc:async(name,args)=>{if(name!=="research_save_document")return {data:null,error:{message:"Forbidden RPC"}};'+
 'const item=state.rows.find(x=>x.id===args.p_id);if(!item||item.revision!==args.p_expected_revision)return {data:null,error:{message:"Revision mismatch"}};'+
 'item.content=JSON.parse(JSON.stringify(args.p_content));item.title=args.p_title;item.revision++;state.writes++;persist();'+
 'return {data:[{saved_revision:item.revision}],error:null}}};'+
 'window.supabase={createClient:()=>db};})();';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let total=0;const pass=s=>{total++;console.log('PASS M34 REAL WRITER '+s)};
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===393?852:800},isMobile:width===393,hasTouch:width===393,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('/@supabase/'))
     return route.fulfill({status:200,contentType:'application/javascript',body:fakeJs});
    return url.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.dismiss());
   const srcUrl=BASE+'/research/wne.html?id='+SOURCE;
   await page.goto(srcUrl,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('editor')?.contentEditable==='true'&&
     document.querySelector('#status')?.textContent?.includes('Saved to cloud'),null,{timeout:12000});
   assert.equal(await page.locator('#editor img').count(),1,'source photo must be visible once');
   assert.match(await page.locator('#editor').innerText(),/BEGIN KEEP EXACTLY ONE/);
   assert.match(await page.locator('#editor').innerText(),/END KEEP EXACTLY ONE/);
   assert.equal(await page.locator('#editor').evaluate(el=>(el.innerText.match(/BEGIN KEEP EXACTLY ONE/g)||[]).length),1);
   pass(width+'px: original report renders full text + single image without duplication');
   const nav=await page.locator('#dd-word-ribbon-v1').boundingBox();
   assert(nav&&nav.y>=0&&nav.y+nav.height<=Math.max(width===393?852:800,nav.y+nav.height));
   assert.equal(await page.locator('#dd-word-ribbon-v1 [role=tab]').count(),5);
   const image=page.locator('#editor figure img').first();
   await image.click();
   await page.locator('#dd-image-edit[open]').waitFor();
   const dialogInfo=await page.locator('#dd-image-edit').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,viewport:innerHeight,scroll:getComputedStyle(el).overflowY,stage:!!el.querySelector('#dd-crop-stage')};
   });
   assert(dialogInfo.top>=-1&&dialogInfo.bottom<=dialogInfo.viewport+1,'Image editor must fit the visible viewport');
   assert.equal(dialogInfo.scroll,'auto','Image controls must be scrollable');
   await page.locator('#dd-image-edit details summary').click();
   await page.locator('#dd-crop-left').evaluate(el=>{el.value='12';el.dispatchEvent(new Event('input',{bubbles:true}))});
   await page.locator('#dd-crop-top').evaluate(el=>{el.value='8';el.dispatchEvent(new Event('input',{bubbles:true}))});
   assert.match(await page.locator('#dd-crop-readout').textContent(),/Keeping 88% width/);
   const cropArea=await page.locator('#dd-crop-preview').evaluate(img=>({complete:img.complete,width:img.naturalWidth,height:img.naturalHeight}));
   assert(cropArea.complete&&cropArea.width===120&&cropArea.height===90,'Crop preview contains original image');
   await page.locator('#dd-apply-crop').click();
   await page.waitForFunction(()=>document.getElementById('dd-img-edit-feedback')?.textContent?.includes('Crop applied'),null,{timeout:5000});
   const cropSize=await page.locator('#editor figure img').evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight,src:img.src}));
   assert(cropSize.w<120&&cropSize.h<90,'Crop changed real image dimensions');
   await page.locator('#dd-close-img').click();
   assert.match(await page.locator('#editor').innerText(),/BEGIN KEEP EXACTLY ONE/);
   assert.match(await page.locator('#editor').innerText(),/END KEEP EXACTLY ONE/);
   assert.equal(await page.locator('#editor img').count(),1);
   pass(width+'px: crop applies without losing text or multiplying images');
   assert.equal(await page.evaluate(()=>window.wneSaveBeforeNavigation('synthetic crop regression')),true);
   assert.equal(await page.evaluate(()=>window.__m34Fixture.writes>=1),true);
   const saved=await page.evaluate(()=>window.__m34Fixture.rows[0].content.chapters[0].html);
   assert(saved.includes('BEGIN KEEP EXACTLY ONE')&&saved.includes('END KEEP EXACTLY ONE'));
   assert.equal((saved.match(/<img\b/g)||[]).length,1);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('editor')?.contentEditable==='true',null,{timeout:12000});
   assert.equal(await page.locator('#editor img').count(),1);
   assert.match(await page.locator('#editor').innerText(),/BEGIN KEEP EXACTLY ONE/);
   assert.match(await page.locator('#editor').innerText(),/END KEEP EXACTLY ONE/);
   pass(width+'px: cropped photograph, caption and full text survive cloud save and reopen');

   // Existing source checkpoint predates the crop. Its recovered copy must
   // retain original (uncropped) photo and two sections, and never update source.
   const res=await page.evaluate(async id=>window.WNECloudIntegration.recoveryCopy(id),REV);
   assert(res.verified_copy===true&&res.id===COPY&&res.sections===2);
   const snapshot=await page.evaluate(()=>window.__m34Fixture);
   assert.equal(snapshot.rows.length,2,'New copy INSERT only');
   assert.equal(snapshot.rows[0].id,SOURCE);
   assert.equal(snapshot.rows[1].content.chapters.length,2);
   assert.equal(snapshot.rows[1].content.chapters[0].html,documentData.chapters[0].html);
   assert.equal(snapshot.rows[1].content.chapters[1].html,documentData.chapters[1].html);
   assert.equal(snapshot.rows[0].content.chapters[0].html,saved,'original cropped report left unchanged');
   pass(width+'px: recovery read-back verifies two sections and original image, source untouched');
   await page.goto(BASE+'/research/wne.html?id='+COPY,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('editor')?.contentEditable==='true',null,{timeout:12000});
   assert.equal(await page.locator('#editor img').count(),1);
   assert.match(await page.locator('#editor').innerText(),/BEGIN KEEP EXACTLY ONE/);
   assert.match(await page.locator('#editor').innerText(),/END KEEP EXACTLY ONE/);
   const sec=await page.evaluate(()=>window.WNECloudIntegration.readSavedDocument());
   assert.equal(sec.chapters.length,2);
   assert.equal(sec.chapters[1].html,documentData.chapters[1].html);
   assert.deepEqual(errors,[],'No JS errors in actual Writer recovery/crop journey');
   pass(width+'px: actual recovered copy opens and renders photograph + full text');
   await ctx.close();
  }
  console.log('PASS M34 WRITER FULL JOURNEY: '+total+' fictional mobile/desktop browser checks; no live accounts, Netlify or writes.');
 }finally{await browser.close();}
})().catch(e=>{console.error('FAIL M34 WRITER FULL JOURNEY',e.stack||e);process.exitCode=1});
