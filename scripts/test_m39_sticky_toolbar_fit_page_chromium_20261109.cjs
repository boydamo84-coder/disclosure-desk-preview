'use strict';
// Milestone 39: real W.NE HTML, real Chrome, synthetic account only.
// Checks sticky toolbar/submenu at mid-document and Fit Page with a wide
// comparison table at 393px (Samsung), 820px and 1280px. NO DEPLOY/CLOUD.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const html=fs.readFileSync('research/wne.html','utf8');
const css=fs.readFileSync('research/wne-view-m39.css','utf8');
const js=fs.readFileSync('research/wne-view-m39.js','utf8');
assert.match(html,/src="\.\/wne-view-m39\.js"/);
assert.match(html,/href="\.\/wne-view-m39\.css"/);
assert.match(css,/position:sticky/);
assert.match(css,/zoom:var\(--wne-m39-fit-ratio,1\)/);
assert.doesNotMatch(js,/(?:\.innerHTML\s*=|\.insertAdjacentHTML\()/,'view controls cannot replace editable HTML');
const BASE='http://127.0.0.1:4173';
const DOC='11111111-1111-4111-8111-111111111111';
const fakeSupabase='(()=>{const doc='+JSON.stringify({version:2,bookTitle:'QA only',
 active:'qa-1',chapters:[{id:'qa-1',title:'Test section',html:'<p>Unmodified saved chapter</p>'}],
 font:'Georgia',size:12})+';const state={rev:1,saves:0};window.__m39Cloud=state;'+
 'window.supabase={createClient:()=>({'+
 'auth:{getUser:async()=>({data:{user:{id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}},error:null}),'+
 'getSession:async()=>({data:{session:null},error:null}),'+
 'onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},'+
 'from:()=>({select(){return this},eq(){return this},single:async()=>({data:{'+
 'id:"'+DOC+'",title:"QA only",content:doc,revision:state.rev},error:null})}),'+
 'rpc:async(name,args)=>{if(name!=="research_save_document")throw Error("Unexpected RPC");'+
 'state.rev++;state.saves++;return {data:[{saved_revision:state.rev}],error:null}}'+
 '})};})();';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 let passed=0;
 for(const width of [393,820,1280]){
  const context=await browser.newContext({viewport:{width,height:width===393?852:850},
   hasTouch:width===393,isMobile:width===393,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('/@supabase/'))
    return route.fulfill({status:200,contentType:'application/javascript',body:fakeSupabase});
   return u.origin===BASE?route.continue():route.abort('blockedbyclient');
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto(BASE+'/research/wne.html?id='+DOC,{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForSelector('#wne-m39-sticky-controls #dd-word-ribbon-v1');
  await page.waitForFunction(()=>typeof window.DDWNEPageView?.setFit==='function'&&
   document.querySelector('#editor')?.getAttribute('contenteditable')==='true',null,{timeout:8500});
  // Test content is NEVER sent to live Supabase.
  await page.evaluate(()=>{
   const editor=document.getElementById('editor');
   editor.innerHTML='<p>Beginning</p>'+Array.from({length:100},(_,i)=>
    '<p>Long synthetic paragraph '+i+'. Lorem ipsum dolor sit amet, adipiscing elit.</p>').join('')+
    '<div class="dd-comparison-block"><table><thead><tr><th>Evidence</th><th>Source</th><th>Interpretation</th></tr></thead>'+
    '<tbody><tr><td>One</td><td>Two</td><td>Three</td></tr></tbody></table></div>'+
    '<p>End of synthetic document</p>';
   document.body.dataset.m39TestMarkup=String(editor.innerHTML.length);
  });
  await page.evaluate(()=>window.scrollTo({top:1550,behavior:'instant'}));
  const mid=await page.evaluate(()=>{
   const rail=document.getElementById('wne-m39-sticky-controls').getBoundingClientRect();
   const ribbon=document.getElementById('dd-word-ribbon-v1').getBoundingClientRect();
   const bar=document.querySelector('.formatbar').getBoundingClientRect();
   return {scroll:scrollY,railTop:rail.top,ribbonTop:ribbon.top,barTop:bar.top,barBottom:bar.bottom};
  });
  assert.ok(mid.scroll>900,'Long document did not scroll '+JSON.stringify(mid));
  assert.ok(mid.railTop>=-2&&mid.railTop<=2,'Whole ribbon stays at top while mid document '+JSON.stringify(mid));
  assert.ok(mid.ribbonTop>=0&&mid.barBottom<=850,'Home formatting controls stay visible '+JSON.stringify(mid));
  await page.locator('#dd-word-ribbon-v1 [data-ribbon="insert"]').click();
  assert.equal(await page.locator('#dd-word-context-v1 [data-action="compare"]').isVisible(),true,
   'Insert submenu should be available without returning to top');
  const insertMenu=await page.locator('#dd-word-context-v1').boundingBox();
  assert.ok(insertMenu&&insertMenu.y>=0&&insertMenu.y+insertMenu.height<=850,
   'Insert submenu should remain in viewport '+JSON.stringify(insertMenu));
  await page.locator('#dd-word-ribbon-v1 [data-ribbon="home"]').click();
  const homeVisibility=await page.evaluate(()=>{
   const bar=document.querySelector('.formatbar'),button=document.getElementById('wne-m39-fit-toggle');
   const parent=bar?.parentElement;
   return {mode:document.body.dataset.ddRibbonView,
    bodyClass:document.body.className,
    barDisplay:getComputedStyle(bar).display,barHeight:bar.getBoundingClientRect().height,
    buttonDisplay:getComputedStyle(button).display,buttonHeight:button.getBoundingClientRect().height,
    barBox:bar.getBoundingClientRect().toJSON(),buttonBox:button.getBoundingClientRect().toJSON(),
    barScrollLeft:bar.scrollLeft,barScrollWidth:bar.scrollWidth,barClientWidth:bar.clientWidth,
    buttonVisibility:getComputedStyle(button).visibility,
    barVisibility:getComputedStyle(bar).visibility,
    hitTest:document.elementFromPoint(button.getBoundingClientRect().left+15,
      button.getBoundingClientRect().top+15)?.outerHTML?.slice(0,200),
    innerHeight:window.innerHeight,
    stickyBox:parent.getBoundingClientRect().toJSON(),
    stickyParent:parent?.id,scroll:scrollY};
  });
  console.log('M39 HOME BAR DIAGNOSTICS '+width+'px',JSON.stringify(homeVisibility));
  assert.equal(homeVisibility.mode,'home','Home tab must restore formatting controls');
  assert.notEqual(homeVisibility.barDisplay,'none','Home formatting bar must be visible mid-document');
  const initial=await page.locator('#editor').evaluate(el=>el.innerHTML);
  const horizontalBefore=await page.locator('.dd-comparison-block').evaluate(el=>el.scrollWidth-el.clientWidth);
  const fitCenter=await page.locator('#wne-m39-fit-toggle').evaluate(el=>{
   const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
   return {x,y,visible:getComputedStyle(el).visibility,
    hit:document.elementFromPoint(x,y)?.closest('button')?.id||'NO_BUTTON'};
  });
  assert.equal(fitCenter.hit,'wne-m39-fit-toggle',
   'Fit Page must be pointer-reachable, not clipped under header '+JSON.stringify(fitCenter));
  await page.mouse.click(fitCenter.x,fitCenter.y);
  const result=await page.evaluate(()=>{
   const work=document.querySelector('.workarea'),page=document.querySelector('.paper'),
    table=document.querySelector('.dd-comparison-block'),
    r=page.getBoundingClientRect(),w=work.getBoundingClientRect();
   return {mode:window.DDWNEPageView.mode,zoom:parseFloat(getComputedStyle(page).zoom),
    pageWidth:r.width,workWidth:w.width,overflow:table.scrollWidth-table.clientWidth,
    documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  assert.equal(result.mode,'fit');
  assert.ok(result.zoom>=.15&&result.zoom<=1);
  assert.ok(result.pageWidth<=result.workWidth+1,'Fit Page must scale into available writer panel '+JSON.stringify(result));
  assert.ok(result.overflow<=2,'Comparison table should not require horizontal scrolling '+JSON.stringify(result));
  assert.ok(result.documentOverflow<=2,'Fit Page must not create page horizontal scrolling '+JSON.stringify(result));
  assert.equal(await page.locator('#editor').evaluate(el=>el.innerHTML),initial,
   'Switching view cannot rewrite table or chapter HTML');
  await page.locator('#dd-word-ribbon-v1 [data-ribbon="view"]').click();
  const fit=page.locator('#dd-word-context-v1 [data-action="fitpage"]');
  assert.equal(await fit.isVisible(),true,'Fit Page toggle must appear in View submenu');
  assert.equal(await fit.getAttribute('aria-pressed'),'true');
  await fit.click();
  assert.equal(await page.evaluate(()=>window.DDWNEPageView.mode),'readable');
  const refit=await page.locator('#wne-m39-fit-toggle').evaluate(el=>{
   const rect=el.getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  });await page.mouse.click(refit.x,refit.y);
  assert.equal(await page.evaluate(()=>window.DDWNEPageView.mode),'fit');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.DDWNEPageView?.mode==='fit');
  assert.equal(await page.locator('#wne-m39-fit-toggle').getAttribute('aria-pressed'),'true');
  assert.deepEqual(errors.filter(x=>/wne-view-m39|TypeError|ReferenceError/.test(x)),[],
   'No view-mode exceptions expected: '+JSON.stringify(errors));
  console.log('PASS M39 real Chrome '+width+'px: sticky Home/Insert, Fit Page, table, toggle, persistence (initial table overflow '+horizontalBefore+'px)');
  passed++;
  await context.close();
 }
 console.log('PASS M39 total '+passed+' widths; fixture only, NO Netlify/Supabase');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M39 real Chrome',e.stack||e);process.exitCode=1});
