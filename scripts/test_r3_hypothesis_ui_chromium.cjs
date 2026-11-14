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
   await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
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
    await page.locator('#addSourceBtn').click();
    const source=page.locator('#sourceEntries');
    const sourceState=await page.evaluate(()=>({
     sourceEntries:document.querySelectorAll('#sourceEntries .entry-card').length,
     editorHidden:document.getElementById('editorForm').hidden,
     dialogOpen:document.getElementById('ddConfirmDialog').open,
     actionButton:document.getElementById('addSourceBtn').outerHTML.slice(0,450),
     notice:document.getElementById('notice').textContent
    }));
    console.log('R3 source-entry state after Add source:',JSON.stringify(sourceState),'JS errors',errors);
    assert.equal(sourceState.sourceEntries,1,'Add source must create exactly one citation input');
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
    const ready=page.waitForEvent('download');
    await page.locator('#exportBtn').click();
    const download=await ready;
    assert.match(download.suggestedFilename(),/ENCRYPTED-backup/);
    const backupText=fs.readFileSync(await download.path(),'utf8');
    const backup=JSON.parse(backupText);
    assert.equal(backup.format,'dd-r3-private-aes256gcm-v1');
    assert(!backupText.includes('Third synthetic idea'));
    assert(!backupText.includes('fictional-reference'));
    assert(!backupText.includes('demo-workspace'));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#unlockVaultForm').waitFor({state:'visible'});
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
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL R3 browser UI prototype:',e.stack||e);process.exitCode=1});
