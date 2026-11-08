'use strict';
// Offline real Chromium smoke against the STAGED full Research Library HTML.
// All Supabase operations are synthetic and blocked from the network.
// No live cloud writes, no original user data, no deploy.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const ORIGIN='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let passes=0;
  async function pass(message,check){await check();passes++;console.log('PASS LIBRARY CHROME '+message)}
  for(const viewport of [{width:393,height:852},{width:852,height:393}]){
   const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:2});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===ORIGIN)return route.continue();
    return route.abort('blockedbyclient');
   });
   await context.addInitScript(()=>{
    window.__libraryCloudFailure=false;
    window.__libraryCloudWrites=0;
    const rows=[{id:'10000000-0000-4000-8000-000000000001',name:'Synthetic Cloud Board',updated_at:'2026-11-08T00:00:00Z',
      content:{name:'Synthetic Cloud Board',links:[{title:'Cloud reference',url:'https://example.org/cloud'}]}}];
    const client={
     auth:{getUser:async()=>({data:{user:{id:'synthetic-library-test-only'}},error:null}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
     from(table){
      if(table!=='investigation_boards'&&table!=='research_reference_backups')
       throw Error('Unexpected table: '+table);
      let selected='',filtered='';
      const q={
       select(value){selected=value;return q},
       order(){return q},limit(){return q},eq(field,value){if(field==='id')filtered=value;return q},
       insert(){window.__libraryCloudWrites++;throw Error('Cloud writes forbidden in offline QA')},
       then(done){const result=window.__libraryCloudFailure?{data:null,error:{message:'Synthetic offline cloud outage'}}:
        {data:rows.filter(row=>!filtered||row.id===filtered)
         .map(row=>selected.includes('content')?{id:row.id,name:row.name,content:row.content}:{
          id:row.id,name:row.name,updated_at:row.updated_at}),error:null};
        return Promise.resolve(done(result))}
      };
      return q;
     }
    };
    window.supabase={createClient:()=>client};
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(String(err)));
   await page.goto(ORIGIN+'/research/research-bible.html',{waitUntil:'domcontentloaded',timeout:30000});
   try{await page.locator('#easyBoardList option[value^="cloud:"]').waitFor({timeout:10000})}
   catch(error){
    console.log('LIBRARY DIAGNOSTIC '+JSON.stringify({url:page.url(),errors,
      summary:await page.evaluate(()=>({access:document.documentElement.dataset.researchAccess,
       ready:document.readyState,boards:document.getElementById('easyBoardList')?.innerHTML,
       easyStatus:document.getElementById('easyStatus')?.textContent,
       body:document.body?.innerText?.slice(0,350)}))}));
    throw error;
   }
   await pass(viewport.width+'px clear storage labels and separate read-only cloud Board',async()=>{
    assert.match(await page.locator('.notice').innerText(),/browser profile/);
    assert.match(await page.locator('#my-boards .small').first().innerText(),/not synced/);
    assert.equal(await page.locator('#easyBoardList option[value^="cloud:"]').count(),1);
    assert.equal(await page.locator('#easyBoardList option[value^="device:"]').count(),0);
    assert.equal(await page.locator('#cloudSync').isVisible(),false);
   });
   const board={format:'disclosure-desk-board',version:1,board:{name:'Synthetic Field Board',
    links:[{title:'Official observation',url:'https://example.org/official'}],notes:['Disposable observation']}};
   await page.locator('#easyBoardFile').setInputFiles({
    name:'synthetic-board.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(board))
   });
   await page.locator('#easyBoardList option[value^="device:"]').waitFor({timeout:10000});
   await pass(viewport.width+'px device import succeeds without cloud writes',async()=>{
    assert.equal(await page.locator('#easyBoardList option[value^="device:"]').count(),1);
    assert.match(await page.locator('#easyStatus').innerText(),/this browser only/);
    assert.equal(await page.evaluate(()=>window.__libraryCloudWrites),0);
    const saved=await page.evaluate(()=>localStorage.getItem('wne_research_saved_boards_v1'));
    assert(saved&&saved.includes('Synthetic Field Board'));
   });
   await page.locator('#easyBoardList').selectOption({label:'On this device · Synthetic Field Board'});
   await page.locator('#easyOpenBoard').click();
   await pass(viewport.width+'px imported Board opens read-only',async()=>{
    await page.locator('#boardPane').getByText('Official observation').waitFor();
    assert.match(await page.locator('#easyStatus').innerText(),/read-only device copy/);
    assert.equal(await page.evaluate(()=>window.__libraryCloudWrites),0);
   });
   await page.locator('#easyBoardList').selectOption({label:'Cloud (read only) · Synthetic Cloud Board'});
   await page.locator('#easyOpenBoard').click();
   await pass(viewport.width+'px cloud Board still opens read-only',async()=>{
    await page.locator('#boardPane').getByText('Cloud reference').waitFor();
    assert.match(await page.locator('#easyStatus').innerText(),/read-only account cloud Board/);
   });
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#easyBoardList option[value^="device:"]').waitFor({timeout:10000});
   await pass(viewport.width+'px imported copy persists after browser reload',async()=>{
    assert.equal(await page.locator('#easyBoardList option[value^="device:"]').count(),1);
    assert.equal(await page.locator('#easyBoardList option[value^="cloud:"]').count(),1);
   });
   await page.evaluate(()=>{window.__libraryCloudFailure=true});
   await page.locator('#easyRefresh').click();
   await pass(viewport.width+'px cloud outage leaves device Board available',async()=>{
    await page.getByText(/Cloud list unavailable:/).waitFor();
    assert.equal(await page.locator('#easyBoardList option[value^="device:"]').count(),1);
   });
   await page.locator('#title').fill('Rendlesham sample observation');
   await page.locator('#note').fill('Disposable first-hand note for search acceptance.');
   await page.locator('#add').click();
   await page.locator('#dd-research-note-search').fill('Rendlesham');
   await pass(viewport.width+'px local research note search works',async()=>{
    assert.match(await page.locator('#count').innerText(),/1 of 1/);
    assert.match(await page.locator('#entries').innerText(),/Rendlesham sample observation/);
    await page.locator('#dd-research-note-search').fill('does-not-exist');
    assert.match(await page.locator('#entries').innerText(),/No notes match/);
    assert.match(await page.locator('#count').innerText(),/0 of 1/);
    await page.locator('#dd-research-note-search').fill('');
    assert.match(await page.locator('#count').innerText(),/1 of 1/);
    assert.equal(await page.evaluate(()=>window.__libraryCloudWrites),0);
   });
   await pass(viewport.width+'px no unexpected browser runtime errors',async()=>{
    assert.deepEqual(errors,[]);
   });
   await context.close();
  }
  console.log('PASS LIBRARY CHROME TOTAL '+passes+' isolated browser assertions; never real account testing');
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL LIBRARY CHROME:',error.stack||error);process.exitCode=1});
