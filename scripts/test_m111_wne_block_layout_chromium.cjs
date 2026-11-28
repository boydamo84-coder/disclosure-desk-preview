'use strict';
// M111 real Writer regression: table/figure boundaries and image relocation.
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
 'single:async()=>{const item=find()[0];return item?{data:JSON.parse(JSON.stringify(item)),error:null}:{data:null,error:{message:"Not found"}}}};'+
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
 for(const width of [393,1280]){
  const ctx=await browser.newContext({viewport:{width,height:852},isMobile:width===393,hasTouch:width===393,serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('/@supabase/'))return route.fulfill({status:200,contentType:'application/javascript',body:fakeJs});
   return url.origin===BASE?route.continue():route.abort('blockedbyclient');
  });
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.goto(BASE+'/research/wne.html?id='+SOURCE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('editor')?.contentEditable==='true'&&document.querySelector('#status')?.textContent.includes('Saved to cloud'),null,{timeout:15000});
  const tables=()=>page.locator('#editor table').evaluateAll(els=>els.map(el=>el.outerHTML));
  const originals=await tables();assert.equal(originals.length,5);
  const figure=page.locator('#editor > figure').first();
  const imageProperties=()=>figure.evaluate(el=>({src:el.querySelector('img').src,caption:el.querySelector('figcaption').textContent,width:el.getAttribute('width'),align:el.getAttribute('align')}));
  const original=await imageProperties();
  const order=()=>page.locator('#editor').evaluate(el=>[...el.children].filter(n=>n.matches('.dd-comparison-block,table,figure')).map(n=>n.matches('figure')?'IMAGE':n.querySelector('th,td').textContent==='Field'?n.querySelector('p').textContent:n.querySelector('td').textContent));
  const checkGap=async(a,b)=>{
   await page.waitForFunction(([a,b])=>{
    const ed=document.getElementById('editor');
    const nodes=[...ed.children];
    const left=nodes.find(n=>n.matches('.dd-comparison-block,table')&&n.textContent.includes(a)),right=nodes.find(n=>n.matches('.dd-comparison-block,table')&&n.textContent.includes(b));
    const between=nodes.slice(nodes.indexOf(left)+1,nodes.indexOf(right));
    return left&&right&&between.some(n=>n.matches('p[data-wne-block-gap],div[data-wne-block-gap]')&&n.getBoundingClientRect().height>=30);
   },[a,b]);
  };
  await checkGap('Record D','Record E');
  assert.equal(await figure.locator('img').count(),1);
  await figure.locator('img').click();
  await page.locator('#dd-image-edit[open]').waitFor();
  await page.locator('#dd-image-move-up').click();
  assert.equal((await order())[0],'IMAGE');
  assert.equal(await page.locator('#dd-image-move-up').isDisabled(),true);
  await page.locator('#dd-image-move-down').click();
  assert.deepEqual((await order()).slice(0,3),['CASE COMPARISON A','IMAGE','CASE COMPARISON B']);
  await page.locator('#dd-image-move-down').click();
  assert.deepEqual((await order()).slice(0,3),['CASE COMPARISON A','CASE COMPARISON B','IMAGE']);
  await page.locator('#dd-image-move-up').click();
  assert.deepEqual((await order()).slice(0,3),['CASE COMPARISON A','IMAGE','CASE COMPARISON B']);
  await page.locator('#dd-close-img').click();
  assert.deepEqual(await imageProperties(),original);
  assert.deepEqual(await tables(),originals);
  assert.equal(await page.evaluate(()=>window.wneSaveBeforeNavigation('M111 move regression')),true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('editor')?.contentEditable==='true',null,{timeout:15000});
  assert.deepEqual(await imageProperties(),original);
  assert.deepEqual((await order()).slice(0,3),['CASE COMPARISON A','IMAGE','CASE COMPARISON B']);
  assert.deepEqual(await tables(),originals);
  console.log('PASS M111 '+width+'px: deliberate image movement, document limits, table/source integrity and save/reopen');
  // Explicit removal must leave an editable top-level paragraph.
  await figure.locator('img').click();
  await page.locator('#dd-image-edit[open]').waitFor();
  await page.locator('#dd-remove-img').click();
  await page.locator('#dd-remove-img').click();
  assert.equal(await page.locator('#editor figure img').count(),1);
  await checkGap('Record A','Record B');
  const gap=page.locator('#editor > .dd-comparison-block').first().locator('xpath=following-sibling::*[self::p or self::div][@data-wne-block-gap][1]');
  // Tap/click real blank line, type, then Enter. Text cannot land in any table.
  if(width===393)await gap.tap();else await gap.click();
  await page.keyboard.type('Typed outside the comparison.');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second paragraph outside.');
  assert.equal(await page.locator('#editor > .dd-comparison-block').first().evaluate(el=>el.textContent.includes('Typed outside')),false);
  assert.equal(await page.locator('#editor > .dd-comparison-block').nth(1).evaluate(el=>el.textContent.includes('Second paragraph')),false);
  assert.match(await page.locator('#editor').innerText(),/Typed outside the comparison\./);
  assert.match(await page.locator('#editor').innerText(),/Second paragraph outside\./);
  assert.deepEqual(await tables(),originals);
  console.log('PASS M111 '+width+'px: confirmed removal, real tappable gap, typing and Enter between comparisons');
  // Reproduce selection of the actual bitmap and Backspace using browser editing.
  await page.locator('#editor figure img').evaluate(img=>{
   const ed=document.getElementById('editor');ed.focus();const range=document.createRange();range.selectNode(img);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);
  });
  await page.keyboard.press('Backspace');
  assert.equal(await page.locator('#editor figure img').count(),0);
  await checkGap('Record C','Record D');
  assert.deepEqual(await tables(),originals);
  // A selected cell can explicitly request a paragraph after its whole table.
  await page.locator('#editor > table').last().locator('td').first().click();
  await page.waitForFunction(()=>document.getElementById('editor').contains(getSelection().anchorNode));
  await page.locator('#dd-word-ribbon-v1 [data-ribbon="insert"]').click();
  await page.locator('#dd-word-context-v1 [data-action="paragraph-after"]').click();
  await page.keyboard.type('Outside final table.');
  assert.equal(await page.locator('#editor > table').last().evaluate(el=>el.textContent.includes('Outside final table.')),false);
  assert.match(await page.locator('#editor').innerText(),/Outside final table\./);
  assert.deepEqual(await tables(),originals);
  assert.equal(await page.evaluate(()=>window.wneSaveBeforeNavigation('M111 layout regression')),true);
  const saved=await page.evaluate(()=>window.__m111Fixture.rows[0].content);
  assert.match(saved.chapters[0].html,/Typed outside the comparison/);
  assert.match(saved.chapters[0].html,/Outside final table/);
  assert(!saved.chapters[0].html.includes('data-wne-block-gap'));
  assert.equal(saved.chapters[1].html,documentData.chapters[1].html);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('editor').contentEditable==='true',null,{timeout:15000});
  assert.deepEqual(await tables(),originals);
  assert.match(await page.locator('#editor').innerText(),/Second paragraph outside/);
  assert.equal(await page.locator('#editor img').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS M111 '+width+'px: keyboard image deletion, adjacent ordinary table gap, explicit paragraph after table, save and reload');
  await ctx.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M111 WNE layout',e.stack||e);process.exitCode=1});
