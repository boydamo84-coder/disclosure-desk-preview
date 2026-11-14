'use strict';
// M12.2: Android Back and website Back both land at the source Who's Who card.
// Real browser acceptance without user accounts, live site or publishing.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const tolerance=45;
async function localOnly(context){
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin===BASE)return route.continue();
  return route.abort('blockedbyclient');
 });
}
async function visible(page,selector){
 await page.locator(selector).waitFor({state:'visible',timeout:15000});
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB',serviceWorkers:'block'});
   await localOnly(ctx);
   const page=await ctx.newPage();
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
   await visible(page,'#peopleCards [data-person-id="james-fox"] button');
   const card=page.locator('#peopleCards [data-person-id="james-fox"]');
   await card.scrollIntoViewIfNeeded();
   const start=await page.evaluate(()=>Math.round(window.scrollY));
   assert(start>150,'Source card must be well below the introductory screen');
   await card.locator('button').click();
   await page.waitForURL('**/who-is-who.html?person=james-fox');
   await visible(page,'#personProfile');
   await page.waitForFunction(()=>{const t=document.getElementById('personProfile').getBoundingClientRect().top;return t>=-25&&t<=45});
   assert.equal(await page.locator('#profileName').textContent(),'James Fox');
   // Equivalent to native Android system swipe: MainActivity invokes DDPeopleDirectoryBack.
   assert.equal(await page.evaluate(()=>window.DDPeopleDirectoryBack()),true);
   await page.waitForURL(url=>!url.searchParams.has('person'));
   await visible(page,'#directoryPage');
   await page.waitForFunction(target=>Math.abs(window.scrollY-target)<45,start);
   const returned=await page.evaluate(()=>Math.round(window.scrollY));
   assert(Math.abs(start-returned)<tolerance,'Back restores same scroll position: '+start+' vs '+returned);
   assert.equal(await card.evaluate(e=>e.classList.contains('dd-returned-card')),true,
    'The card we just came from receives a temporary gold return cue');
   assert.equal(await page.locator('#peopleSearch').inputValue(),'','Search state is preserved');
   await page.locator('#peopleSearch').fill('Mick West');
   await visible(page,'#peopleCards [data-person-id="mick-west"] button');
   await page.locator('#peopleCards [data-person-id="mick-west"] button').click();
   await visible(page,'#personProfile');
   await page.locator('#directoryBack').click();
   await visible(page,'#directoryPage');
   assert.equal(await page.locator('#peopleSearch').inputValue(),'Mick West','Search filter survives the full detail/Back roundtrip');
   await page.close();
   const direct=await ctx.newPage();
   await direct.goto(BASE+'/who-is-who.html?person=anna-paulina-luna',{waitUntil:'domcontentloaded'});
   await visible(direct,'#personProfile');
   await direct.waitForFunction(()=>{const t=document.getElementById('personProfile').getBoundingClientRect().top;return t>=-25&&t<=45});
   await direct.locator('#directoryBack').click();
   await visible(direct,'#directoryPage');
   assert.equal(new URL(direct.url()).searchParams.has('person'),false,'Direct URL back clears profile query');
   await direct.waitForFunction(()=>{
    const e=document.getElementById('peopleCards');
    const top=e.getBoundingClientRect().top;
    return top>=80 && top<190;
   });
   await direct.close();
   if(width===393){
    const casePage=await ctx.newPage();
    await casePage.goto(BASE+'/who-is-who.html?person=david-fravor',{waitUntil:'domcontentloaded'});
    await visible(casePage,'#profileRelatedCases a[href*="dd_archive_case=featured-nimitz-2004"]');
    const link=casePage.locator('#profileRelatedCases a[href*="dd_archive_case=featured-nimitz-2004"]');
    await link.scrollIntoViewIfNeeded();
    const caseY=await casePage.evaluate(()=>Math.round(window.scrollY));
    assert(caseY>300,'Case source is sufficiently far into the person profile');
    await link.click();
    await casePage.waitForURL('**/?dd_tab=archivePage*',{timeout:15000});
    await visible(casePage,'#archiveCaseDialog[open]');
    await casePage.goBack({waitUntil:'domcontentloaded'});
    await visible(casePage,'#personProfile');
    await casePage.waitForFunction(target=>Math.abs(window.scrollY-target)<70,caseY);
    assert(Math.abs(await casePage.evaluate(()=>Math.round(window.scrollY))-caseY)<70,
     'Back from linked Archive case restores the profile section that opened it');
    await casePage.close();
   }
   console.log('PASS M12.2 '+width+'px: profile starts at detail, Android/system Back returns to exact directory card with highlight; direct-link and filters preserved');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M12.2 browser scroll navigation:',e.stack||e);process.exitCode=1});
