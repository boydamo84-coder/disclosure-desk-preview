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
   const page=await context.newPage(),errors=[],nativeDialogs=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   page.on('dialog',async d=>{nativeDialogs.push(d.type());await d.dismiss()});
   await page.goto(BASE+'/?version=verify',{waitUntil:'domcontentloaded'});
   const info=fs.readFileSync('.r3-lab-preview/BUILD_INFO.txt','utf8');
   const match=info.match(/^Build: ([a-f0-9]{12})$/m);
   assert(match,'Build verification info must provide a single readable SHA fingerprint');
   const buildId=match[1],html=fs.readFileSync('.r3-lab-preview/index.html','utf8');
   assert.match(await page.locator('#r3BuildStamp').textContent(),
    new RegExp('R3 GAP FINDER / HYPOTHESIS . BUILD '+buildId));
   for(const asset of ['hypothesis-engine.js','research-gap-finder.js',
    'research-gap-bridge.js','curated-public-cases.js','hypothesis-vault.js',
    'hypothesis-ui.js','hypothesis-ui.css','editorial-dock.css']){
    assert(html.includes('./'+asset+'?v='+buildId),
     'Fingerprint asset URL prevents stale Chrome cache for '+asset);
   }
   assert(html.includes('id="ddConfirmDialog"'),
    'Correct standalone build must contain the polished native-dialog replacement');
   assert.match(await page.title(),/Hypothesis Lab/);
   assert.match(await page.locator('#privacyWarning').innerText(),/don.t enter sensitive information yet/i);
   assert.equal(await page.locator('#setupPanel').isVisible(),true);
   const dock=page.locator('#ddWebSecondaryNav');
   const expectedTabIds=[
    'discover','archivePage','peopleDirectory','researchStudio','mapPage',
    'clips','livePage','boards','witness','discussionsPage','watchRead',
    'chatPage','profilePage','hub'
   ];
   assert.deepEqual(await dock.locator('.tab').evaluateAll(nodes=>nodes.map(n=>n.dataset.tab)),
    expectedTabIds,'Standalone R3 must match exact original R2 14-tab order');
   assert.equal(await dock.locator('.tab:not([disabled])').count(),0,
    'Offline R3 preview may not link to live/real accounts');
   assert.equal(await dock.locator('.tab.active').getAttribute('data-tab'),'boards',
    'Hypothesis Lab is a Boards research tool, not a replacement nav tab');
   assert.equal(await dock.locator('.tab[data-tab="chatPage"] svg.dd-chat-nav-symbol').count(),1,
    'Use exact R2 outlined Chat icon, not a generic box');
   assert.equal(await dock.locator('.tab[data-tab="profilePage"] .ico').textContent(),'👤');
   assert.equal(fs.readFileSync('.r3-lab-preview/editorial-dock.css','utf8'),
    fs.readFileSync('assets/secondary-editorial-nav.css','utf8'),
    'Preview must ship the ACTUAL approved R2 nav CSS byte for byte');
   assert.equal(await page.locator('#dockNext').isVisible(),true,
    'Original dock right arrow must reveal other tabs');
   const firstScroll=await dock.locator('.nav-inner').evaluate(node=>node.scrollLeft);
   await page.locator('#dockNext').click();
   await page.waitForFunction(old=>document.querySelector('#dockScroll').scrollLeft>old+10,firstScroll);
   assert.equal(await dock.locator('.tab.active').getAttribute('data-tab'),'boards');
   await page.locator('#sampleBtn').click();
   await page.locator('#workPanel').waitFor({state:'visible'});
   assert.match(await page.locator('#notebookHeading').textContent(),/Fictional case/);
   assert.equal(await page.locator('#hypothesisList .hypothesis-item').count(),2);
   assert.equal(await page.locator('#compareView').isVisible(),false);
   // Owner-reported Chrome grey modal is replaced by a first-party,
   // explicitly cancellable navy/gold warning for UNSAVED notebooks.
   await page.locator('#resetBtn').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   assert.match(await page.locator('#ddDialogTitle').innerText(),/Discard unsaved notebook/);
   assert.match(await page.locator('#ddDialogDescription').innerText(),/not been encrypted or saved/);
   assert.equal(await page.locator('#ddDialogAccept').textContent(),'Discard notebook');
   fs.mkdirSync('.r3-lab-preview/screenshots',{recursive:true});
   await page.screenshot({
    path:'.r3-lab-preview/screenshots/fictional-branded-confirm-'+width+'px.png',
    fullPage:false
   });
   const modalBounds=await page.locator('#ddConfirmDialog').boundingBox();
   assert(modalBounds&&modalBounds.x>=-1&&modalBounds.x+modalBounds.width<=width+1,
    'Premium modal must fit the '+width+'px viewport');
   await page.locator('#ddDialogCancel').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'hidden'});
   assert.equal(await page.locator('#hypothesisList .hypothesis-item').count(),2,
    'Cancel retains the notebook and all research');
   assert.equal(await page.locator('#workPanel').isVisible(),true);
   await page.locator('#compareTab').click();
   assert.equal(await page.locator('#compareTab').getAttribute('aria-selected'),'true');
   await page.locator('#buildCompareBtn').click();
   assert.equal(await page.locator('#comparisonResult .compare-column').count(),2);
   assert.match(await page.locator('#comparisonResult').innerText(),/Disconfirming evidence/i);
   assert(!(/probability score|winner:/i).test(await page.locator('#comparisonResult').innerText()));
   // Public test artifact shows only invented examples, never user data.
   fs.mkdirSync('.r3-lab-preview/screenshots',{recursive:true});
   await page.screenshot({path:'.r3-lab-preview/screenshots/fictional-compare-'+width+'px.png',fullPage:true});
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
    // Regression: while the on-screen keyboard is in use, the premium
    // nav must not steal a pointerup/click after an editor field loses focus.
    assert.equal(await page.locator('#ddWebSecondaryNav').isVisible(),false,
     'Mobile editing must hide the fixed nav until the editor closes');
    await page.locator('#addSourceBtn').click();
    const source=page.locator('#sourceEntries');
    assert.equal(await source.locator('.entry-card').count(),1,
     'A tap after editing text must actually add a citation entry');
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
    // Storage is explicit opt-in; no cleartext automatic browser storage.
    assert.equal(await page.locator('#exportBtn').isDisabled(),true);
    const testPassphrase='R3-fixture-strong-passphrase-2026!never-share';
    await page.locator('#vaultNewPassphrase').fill(testPassphrase);
    await page.locator('#vaultConfirmPassphrase').fill(testPassphrase);
    await page.locator('#enableVaultBtn').click();
    await page.waitForFunction(()=>!document.getElementById('exportBtn').disabled,{timeout:30000});
    assert.match(await page.locator('#vaultSaveState').innerText(),/Encrypted autosave active/);
    const encryptedRecord=await page.evaluate(async()=>{
     const db=await new Promise((resolve,reject)=>{
      const req=indexedDB.open('dd-r3-hypothesis-vault-alpha-1',1);
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
     });
     const record=await new Promise((resolve,reject)=>{
      const tx=db.transaction('encrypted','readonly');
      const request=tx.objectStore('encrypted').get('local-vault');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
     });
     db.close();return record;
    });
    assert.equal(encryptedRecord.format,'dd-r3-private-aes256gcm-v1');
    assert.equal(encryptedRecord.kdf.iterations,310000);
    assert.equal(encryptedRecord.cipher,'AES-256-GCM');
    assert(!JSON.stringify(encryptedRecord).includes('Third synthetic idea'),
     'No plaintext research labels may appear inside persistent storage');
    // The next completed revision must be encrypted and survive tab reload.
    await page.locator('#editSelectedBtn').click();
    await page.locator('#hypothesisExplanation').fill('Third synthetic idea encrypted revision two.');
    await page.locator('#saveHypothesisBtn').click();
    await page.waitForFunction(()=>document.getElementById('currentVersion').textContent.includes('Revision 2'),
     undefined,{timeout:20000});
    // Branded encrypted-backup confirmation: dismissing must not download.
    let downloadCount=0;
    page.on('download',()=>{downloadCount++;});
    await page.locator('#exportBtn').click();
    await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
    assert.match(await page.locator('#ddDialogTitle').innerText(),/Download encrypted backup/);
    assert.match(await page.locator('#ddDialogDescription').innerText(),/Unfinished edits are not included/);
    assert.match(await page.locator('#ddDialogDescription').innerText(),/passphrase/i);
    assert.equal(await page.locator('#ddDialogAccept').textContent(),'Download backup');
    assert.equal(await page.locator('#ddDialogCancel').textContent(),'Not now');
    await page.locator('#ddDialogCancel').click();
    await page.locator('#ddConfirmDialog').waitFor({state:'hidden'});
    assert.equal(downloadCount,0,'Cancelling the backup must not start a download');
    const ready=page.waitForEvent('download');
    await page.locator('#exportBtn').click();
    await page.locator('#ddDialogAccept').click();
    const download=await ready;
    assert.equal(downloadCount,1,'Confirming downloads exactly once');
    assert.match(download.suggestedFilename(),/ENCRYPTED-backup/);
    const backupText=fs.readFileSync(await download.path(),'utf8');
    const backup=JSON.parse(backupText);
    assert.equal(backup.format,'dd-r3-private-aes256gcm-v1');
    assert(!backupText.includes('Third synthetic idea'));
    assert(!backupText.includes('fictional-reference'));
    assert(!backupText.includes('demo-workspace'));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#unlockVaultForm').waitFor({state:'visible'});
    assert.equal(await page.locator('#setupPanel').isVisible(),false,
     'Do not create a second notebook while saved encrypted research is locked');
    assert.equal(await page.locator('#workPanel').isVisible(),false,
     'No decrypted notebook should appear after refresh before unlock');
    await page.locator('#unlockPassphrase').fill('incorrect-passphrase-value');
    await page.locator('#unlockVaultBtn').click();
    await page.waitForFunction(()=>/Wrong passphrase|corrupted/.test(document.getElementById('notice').textContent),undefined,{timeout:15000});
    assert.equal(await page.locator('#workPanel').isVisible(),false);
    await page.locator('#unlockPassphrase').fill(testPassphrase);
    await page.locator('#unlockVaultBtn').click();
    await page.locator('#workPanel').waitFor({state:'visible'});
    assert.equal(await page.locator('#hypothesisList .hypothesis-item').count(),3);
    await page.locator('#hypothesisList .hypothesis-item').last().click();
    assert.match(await page.locator('#currentVersion').textContent(),/Revision 2/);
    assert.match(await page.locator('#selectedExplanation').textContent(),/encrypted revision two/);
    await page.locator('#historyTab').click();
    assert.equal(await page.locator('#revisionList button').count(),2);
    await page.locator('#revisionList button[data-revision="1"]').click();
    assert.doesNotMatch(await page.locator('#historySnapshot').innerText(),/encrypted revision two/);
    await page.locator('#revisionList button[data-revision="2"]').click();
    assert.match(await page.locator('#historySnapshot').innerText(),/encrypted revision two/);
    // Explicit lock, delete, tamper rejection, wrong passphrase, and restore.
    await page.locator('#lockVaultBtn').click();
    await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
    assert.match(await page.locator('#ddDialogTitle').innerText(),/Lock your private notebook/);
    await page.locator('#ddDialogCancel').click();
    assert.equal(await page.locator('#workPanel').isVisible(),true,'Cancel lock preserves notebook');
    await page.locator('#lockVaultBtn').click();
    await page.locator('#ddDialogAccept').click();
    await page.locator('#unlockVaultForm').waitFor({state:'visible'});
    await page.locator('#deleteVaultBtn').click();
    await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
    assert.match(await page.locator('#ddDialogTitle').innerText(),/Delete this encrypted notebook/);
    assert.equal(await page.locator('#ddDialogAccept').isDisabled(),true,
     'Destructive deletion requires the typed confirmation');
    await page.locator('#ddDialogVerify').fill('DELET');
    assert.equal(await page.locator('#ddDialogAccept').isDisabled(),true);
    await page.locator('#ddDialogCancel').click();
    await page.locator('#unlockVaultForm').waitFor({state:'visible'});
    await page.locator('#deleteVaultBtn').click();
    await page.locator('#ddDialogVerify').fill('DELETE');
    await page.locator('#ddDialogAccept').click();
    await page.locator('#importVaultForm').waitFor({state:'visible'});
    assert.equal(await page.locator('#setupPanel').isVisible(),true,
     'After explicit deletion, a fresh notebook is permitted');
    const setEncryptedFile=async text=>{
     await page.locator('#importVaultFile').setInputFiles({
      name:'r3-encrypted.json',mimeType:'application/json',buffer:Buffer.from(text,'utf8')
     });
    };
    const tampered={...backup,ciphertext:backup.ciphertext.slice(0,18)+
      (backup.ciphertext[18]==='A'?'B':'A')+backup.ciphertext.slice(19)};
    await setEncryptedFile(JSON.stringify(tampered));
    await page.locator('#importPassphrase').fill(testPassphrase);
    await page.locator('#importVaultBtn').click();
    await page.waitForFunction(()=>/Wrong passphrase|corrupted/.test(document.getElementById('notice').textContent),undefined,{timeout:15000});
    assert.equal(await page.locator('#workPanel').isVisible(),false);
    await setEncryptedFile(backupText);
    await page.locator('#importPassphrase').fill('incorrect-passphrase-value');
    await page.locator('#importVaultBtn').click();
    await page.waitForFunction(()=>/Wrong passphrase|corrupted/.test(document.getElementById('notice').textContent),undefined,{timeout:15000});
    await setEncryptedFile(backupText);
    await page.locator('#importPassphrase').fill(testPassphrase);
    await page.locator('#importVaultBtn').click();
    await page.locator('#workPanel').waitFor({state:'visible'});
    assert.equal(await page.locator('#hypothesisList .hypothesis-item').count(),3);
    assert.equal(await page.locator('#exportBtn').isEnabled(),true);
    // Import must not silently overwrite an existing local vault.
    assert.equal(await page.locator('#importVaultForm').isVisible(),false);
   }
   const dimensions=await page.evaluate(()=>({
    body:document.documentElement.scrollWidth,viewport:window.innerWidth
   }));
   if(dimensions.body>dimensions.viewport+3){
    console.log('R3 viewport overflow diagnostic',await page.evaluate(()=>(
     [...document.querySelectorAll('body *')].filter(el=>{
      const r=el.getBoundingClientRect(),style=getComputedStyle(el);
      return style.display!=='none'&&r.width>0&&r.right>innerWidth+3;
     }).sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right)
      .slice(0,15).map(el=>({tag:el.tagName,id:el.id,cl:el.className,
       right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)}))
    )));
   }
   assert(dimensions.body<=dimensions.viewport+3,
    'No horizontal overflow at '+width+'px; actual='+JSON.stringify(dimensions));
   assert.deepEqual(requests,[],'Offline prototype must not request any external services');
   assert.deepEqual(errors,[],'No browser JS errors at '+width+'px');
   assert.deepEqual(nativeDialogs,[],
    'No Chrome native prompt/confirm/alert dialogs: use the branded R3 dialog');
   console.log('PASS R3 UI '+width+'px: fictional research editor, encrypted vault backup/recovery at 393px, revision history, original 14-tab visual contract and no external requests');
   await context.close();

   // Separate new browser profile for source-linked Gap Finder review;
   // never let the baseline encrypted notebook leak into another project.
   const gapContext=await browser.newContext({
    viewport:{width,height:850},locale:'en-GB',acceptDownloads:true,serviceWorkers:'block'
   });
   const gapRequests=[];
   await gapContext.route('**/*',route=>{
    const origin=new URL(route.request().url()).origin;
    if(origin===BASE)return route.continue();
    gapRequests.push(route.request().url());return route.abort('blockedbyclient');
   });
   const gapPage=await gapContext.newPage(),gapErrors=[];
   gapPage.on('pageerror',e=>gapErrors.push(String(e.message||e)));
   await gapPage.goto(BASE+'/?r3-gaps=review',{waitUntil:'domcontentloaded'});
   assert.equal(await gapPage.locator('#catalogueCaseSelect option').count(),4,
    'Only three public incident investigations, plus a placeholder; do not scan guides');
   await gapPage.locator('#catalogueCaseSelect').selectOption('featured-rendlesham-1980');
   assert.equal(await gapPage.locator('#caseInput').inputValue(),'featured-rendlesham-1980');
   await gapPage.locator('#workspaceInput').fill('gap-qa-'+width);
   await gapPage.locator('#createNotebookBtn').click();
   const startup=await gapPage.evaluate(()=>({
    caseId:document.getElementById('caseInput').value,
    workspaceId:document.getElementById('workspaceInput').value,
    title:document.getElementById('notebookInput').value,
    notice:document.getElementById('notice').textContent,
    setupHidden:document.getElementById('setupPanel').hidden,
    workHidden:document.getElementById('workPanel').hidden
   }));
   console.log('R3 gap-case setup:',JSON.stringify(startup),'browser errors:',gapErrors);
   assert.equal(startup.workHidden,false,'Curated case notebook must open: '+JSON.stringify(startup));
   await gapPage.locator('#gapsTab').click();
   await gapPage.locator('#gapsView').waitFor({state:'visible'});
   assert.match(await gapPage.locator('#gapSummary').innerText(),/tentative questions/);
   assert.equal(await gapPage.locator('#gapCandidateList .gap-card').count(),4);
   assert.equal(await gapPage.locator('#gapReviewList .gap-recorded').count(),0);
   assert.match(await gapPage.locator('#gapsView').innerText(),/catalogue/i);
   assert.match(await gapPage.locator('#gapsView').innerText(),/not.*verified/i);
   const firstGap=gapPage.locator('#gapCandidateList .gap-card').first();
   assert.match(await firstGap.locator('a.gap-source-link').getAttribute('href'),
    /^https:\/\/www\.nationalarchives\.gov\.uk\//);
   assert.equal(await firstGap.locator('a.gap-source-link').getAttribute('rel'),
    'noopener noreferrer');
   fs.mkdirSync('.r3-lab-preview/screenshots',{recursive:true});
   await gapPage.screenshot({
    path:'.r3-lab-preview/screenshots/source-linked-gap-review-'+width+'px.png',
    fullPage:false
   });
   await firstGap.locator('button[data-gap-record]').click();
   assert.equal(await gapPage.locator('#gapReviewList .gap-recorded').count(),1,
    'Only explicitly accepted research questions go into the notebook');
   assert.equal(await firstGap.locator('button[data-gap-record]').isDisabled(),true);
   assert.match(await gapPage.locator('#notice').innerText(),/session only/i);
   await gapPage.locator('#writeTab').click();
   await gapPage.locator('#newHypothesisBtn').click();
   await gapPage.locator('#hypothesisTitle').fill('Fictional source hypothesis');
   await gapPage.locator('#hypothesisExplanation').fill('An imagined testable explanation, never a claim that an event had this cause.');
   await gapPage.locator('#assumptionsInput').fill('Published archive indexes may omit details.');
   await gapPage.locator('#alternativesInput').fill('Other hypothetical explanations could fit.');
   await gapPage.locator('#predictionEntries [data-field="predictedObservation"]')
    .fill('An independently documented timestamp could be found.');
   await gapPage.locator('#predictionEntries [data-field="ifObserved"]')
    .fill('A source for a future test, not confirmation');
   await gapPage.locator('#predictionEntries [data-field="ifNotObserved"]')
    .fill('Review other archives before interpreting');
   await gapPage.locator('#predictionEntries [data-field="howToTest"]')
    .fill('Inspect original archival documentation');
   await gapPage.locator('#disconfirmEntries [data-field="potentiallyDisconfirmingObservation"]')
    .fill('A documented contradiction to this fictional account');
   await gapPage.locator('#disconfirmEntries [data-field="howToCheck"]')
    .fill('Compare independently published source context');
   await gapPage.locator('#saveHypothesisBtn').click();
   await gapPage.locator('#selectedPreview').waitFor({state:'visible'});
   await gapPage.locator('#gapsTab').click();
   const secondGap=gapPage.locator('#gapCandidateList .gap-card').nth(1);
   await secondGap.locator('select').selectOption('h-fictional-source-hypothesis-1');
   await secondGap.locator('button[data-gap-record]').click();
   assert.equal(await gapPage.locator('#gapReviewList .gap-recorded').count(),2);
   assert.match(await gapPage.locator('#gapReviewList').innerText(),/Linked to hypothesis: Fictional source hypothesis/);
   // Encrypt the research-question ledger; it must persist without plaintext
   // in IndexedDB or the export. Older notebooks without the ledger still work.
   if(width===393){
    await gapPage.locator('#vaultNewPassphrase').fill('R3 Gap vault synthetic passphrase strong 2026');
    await gapPage.locator('#vaultConfirmPassphrase').fill('R3 Gap vault synthetic passphrase strong 2026');
    await gapPage.locator('#enableVaultBtn').click();
    await gapPage.waitForFunction(()=>document.getElementById('exportBtn').disabled===false);
    const encrypted=await gapPage.evaluate(async()=>{
     const db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open('dd-r3-hypothesis-vault-alpha-1',1);
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
     });
     const envelope=await new Promise((resolve,reject)=>{
      const tx=db.transaction('encrypted','readonly'),r=tx.objectStore('encrypted').get('local-vault');
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     db.close();return JSON.stringify(envelope);
    });
    assert(!encrypted.includes('Fictional source hypothesis'));
    assert(!encrypted.includes('event-date-precision-not-indexed'));
    await gapPage.reload({waitUntil:'domcontentloaded'});
    await gapPage.locator('#unlockVaultForm').waitFor({state:'visible'});
    await gapPage.locator('#unlockPassphrase').fill('R3 Gap vault synthetic passphrase strong 2026');
    await gapPage.locator('#unlockVaultBtn').click();
    await gapPage.locator('#workPanel').waitFor({state:'visible'});
    await gapPage.locator('#gapsTab').click();
    assert.equal(await gapPage.locator('#gapReviewList .gap-recorded').count(),2,
     'Source-linked research-question ledger must survive encrypted reload');
    assert.match(await gapPage.locator('#gapReviewList').innerText(),/Fictional source hypothesis/);
   }
   const sizes=await gapPage.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert(sizes.body<=sizes.viewport+3,'Gap tab causes horizontal scroll '+JSON.stringify(sizes));
   assert.deepEqual(gapRequests,[],'Case bridge must not fetch source URLs or user data');
   assert.deepEqual(gapErrors,[],'No R3 Gap Finder browser errors');
   console.log('PASS R3 Gap Finder UI '+width+'px: three source-linked cases, explicit private question recording, optional hypothesis link, encrypted recovery, zero external requests');
   await gapContext.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL R3 browser UI prototype:',e.stack||e);process.exitCode=1});
