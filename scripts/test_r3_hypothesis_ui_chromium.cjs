'use strict';
// Only local 127.0.0.1; fictional data; never authenticates to the live site.
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const BASE='http://127.0.0.1:4175';
(async()=>{
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
 });
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({
    viewport:{width,height:850},locale:'en-GB',acceptDownloads:true,serviceWorkers:'block'
   });
   const requests=[];
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE)return route.continue();
    requests.push(u.href);return route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
   assert.match(await page.title(),/Hypothesis Lab/);
   assert.match(await page.locator('#privacyWarning').innerText(),/do not enter sensitive research/i);
   assert.equal(await page.locator('#setupPanel').isVisible(),true);
   assert.equal(await page.locator('#previewDock .dock-tab').count(),14);
   assert.equal(await page.locator('#previewDock .dock-tab:not([disabled])').count(),0,
    'Isolated UI may not activate live-site tabs');
   await page.locator('#sampleBtn').click();
   await page.locator('#workPanel').waitFor({state:'visible'});
   assert.match(await page.locator('#notebookHeading').textContent(),/Fictional case/);
   assert.equal(await page.locator('#hypothesisList .hypothesis-item').count(),2);
   assert.equal(await page.locator('#compareView').isVisible(),false);
   await page.locator('#compareTab').click();
   assert.equal(await page.locator('#compareTab').getAttribute('aria-selected'),'true');
   await page.locator('#buildCompareBtn').click();
   assert.equal(await page.locator('#comparisonResult .compare-column').count(),2);
   assert.match(await page.locator('#comparisonResult').innerText(),/Disconfirming evidence/i);
   assert(!(/probability score|winner:/i).test(await page.locator('#comparisonResult').innerText()));
   await page.locator('#writeTab').click();
   await page.locator('#editSelectedBtn').click();
   await page.locator('#editorForm').waitFor({state:'visible'});
   await page.locator('#hypothesisExplanation').fill('A revised fictional explanation, without concluding a cause.');
   await page.locator('#predictionEntries [data-field="predictedObservation"]').first()
    .fill('A new testable fictional observation would be recorded.');
   await page.locator('#saveHypothesisBtn').click();
   await page.locator('#selectedPreview').waitFor({state:'visible'});
   assert.match(await page.locator('#currentVersion').textContent(),/Revision 2/);
   await page.locator('#historyTab').click();
   assert.equal(await page.locator('#revisionList button').count(),2);
   await page.locator('#revisionList button[data-revision="1"]').click();
   assert.match(await page.locator('#historySnapshot').innerText(),/Repeatable environmental readings/);
   assert.doesNotMatch(await page.locator('#historySnapshot').innerText(),/new testable fictional observation/);
   await page.locator('#revisionList button[data-revision="2"]').click();
   assert.match(await page.locator('#historySnapshot').innerText(),/new testable fictional observation/);
   if(width===393){
    await page.locator('#writeTab').click();
    await page.locator('#newHypothesisBtn').click();
    await page.locator('#hypothesisTitle').fill('Third synthetic idea');
    await page.locator('#hypothesisExplanation').fill('A third imaginary mechanism without a factual claim.');
    await page.locator('#assumptionsInput').fill('The fictional source is descriptive, not verified.');
    await page.locator('#alternativesInput').fill('A competing synthetic account');
    const pred=page.locator('#predictionEntries');
    await pred.locator('[data-field="predictedObservation"]').fill('An original fictional record would show a pattern');
    await pred.locator('[data-field="ifObserved"]').fill('A reason to compare the record');
    await pred.locator('[data-field="ifNotObserved"]').fill('A reason to revise this theory');
    await pred.locator('[data-field="howToTest"]').fill('Read and compare fictional primary sources');
    const dis=page.locator('#disconfirmEntries');
    await dis.locator('[data-field="potentiallyDisconfirmingObservation"]')
     .fill('A conflicting synthetic measurement');
    await dis.locator('[data-field="howToCheck"]').fill('Check the imaginary raw record');
    await page.locator('#addSourceBtn').click();
    const source=page.locator('#sourceEntries');
    await source.locator('[data-field="label"]').fill('Synthetic archive');
    await source.locator('[data-field="url"]').fill('javascript:alert(1)');
    await page.locator('#saveHypothesisBtn').click();
    assert.match(await page.locator('#notice').innerText(),/public HTTPS/);
    assert.equal(await page.locator('#hypothesisList .hypothesis-item').count(),2,
     'Unsafe URL input must not be stored');
    await source.locator('[data-field="url"]').fill('https://example.org/fictional-reference');
    await source.locator('[data-field="locator"]').fill('Fictional page 2');
    await page.locator('#saveHypothesisBtn').click();
    assert.equal(await page.locator('#hypothesisList .hypothesis-item').count(),3);
    assert.match(await page.locator('#selectedSections').innerText(),/Synthetic archive/);
    assert.equal(await page.locator('#selectedSections a').first().getAttribute('href'),
     'https://example.org/fictional-reference');
    assert.equal(await page.locator('#selectedSections a').first().getAttribute('rel'),
     'noopener noreferrer');
    const ready=page.waitForEvent('download');
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#exportBtn').click();
    const download=await ready;
    assert.match(download.suggestedFilename(),/disclosure-desk-r3-demo-workspace/);
    const snapshot=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(snapshot.visibility,'private');
    assert.equal(snapshot.hypotheses.length,3);
    assert.equal(snapshot.hypotheses[0].revisions.length,2);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#resetBtn').click();
    await page.locator('#setupPanel').waitFor({state:'visible'});
    assert.equal(await page.locator('#workPanel').isVisible(),false);
   }
   const dimensions=await page.evaluate(()=>({
    body:document.documentElement.scrollWidth,viewport:window.innerWidth
   }));
   assert(dimensions.body<=dimensions.viewport+3,
    'No horizontal overflow at '+width+'px; actual='+JSON.stringify(dimensions));
   assert.deepEqual(requests,[],'Offline prototype must not request any external services');
   assert.deepEqual(errors,[],'No browser JS errors at '+width+'px');
   console.log('PASS R3 UI '+width+'px: fictional in-memory demo, unranked comparison, version history, original 14-tab visual contract and privacy');
   await context.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL R3 browser UI prototype:',e.stack||e);process.exitCode=1});
