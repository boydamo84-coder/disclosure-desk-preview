'use strict';
// No real account writes. Tests the exact publish-staged hosted R3 route on
// desktop/mobile Chromium, using a strict fake server returning ciphertext only.
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:850},
    acceptDownloads:true,serviceWorkers:'block'});
   const errors=[],foreign=[];
   const fake=`(function(){
    const USER={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email:'researcher.test@example.invalid',is_anonymous:false};
    const records={};
    window.__r3HostedFakeRecords=records;
    window.supabase={createClient:function(){
     return {
      auth:{getUser:async()=>({data:{user:USER},error:null}),
       onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
      from:function(table){
       if(table!=='dd_r3_private_notebooks')throw Error('Unexpected cloud table');
       const query={data:null,kind:'read',filters:{},select(){return this},
        eq(k,v){this.filters[k]=v;return this},
        insert(v){this.kind='insert';this.data=v;return this},
        update(v){this.kind='update';this.data=v;return this},
        delete(){this.kind='delete';return this},
        async maybeSingle(){
         const id=this.filters.owner_user_id||USER.id;
         const entry=records[id]||null;
         // Simulate server RLS: other owner exists but must be invisible.
         if(this.kind==='read')return {data:id===USER.id?entry:null,error:null};
         if(this.kind==='insert'){
          if(entry)return {data:null,error:{message:'duplicate cloud slot'}};
          records[id]={...this.data,updated_at:new Date().toISOString()};
          return {data:{generation:this.data.generation},error:null};
         }
         if(!entry||entry.generation!==this.filters.generation)
          return {data:null,error:null};
         if(this.kind==='update'){
          records[id]={...entry,...this.data};
          return {data:{generation:this.data.generation},error:null};
         }
         if(this.kind==='delete'){
          delete records[id];
          return {data:{generation:entry.generation},error:null};
         }
        }};
       return query;
      }
     };
    }};
   })();`;
   await context.addInitScript({content:fake});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE)return route.continue();
    if(u.hostname==='cdn.jsdelivr.net'&&
      u.pathname.includes('supabase-js')){
      // The production SDK has SHA-384 SRI, so a fake response cannot replace it.
      // Block CDN; the controlled mock is injected by the test harness before scripts run.
      return route.abort();
    }
    foreign.push(u.href);return route.abort();
   });
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(BASE+'/research/r3-lab/?dd_r3_qa=1',{waitUntil:'domcontentloaded'});
   try{
    await page.waitForFunction(()=>document.documentElement.dataset.r3Boot==='ready',undefined,{timeout:9000});
   }catch(error){
    console.error('R3 BOOT DIAGNOSTIC',await page.evaluate(()=>({
     state:document.documentElement.dataset.r3Boot,
     readyState:document.readyState,
     status:document.getElementById('notice')?.textContent,
     cloud:document.getElementById('r3CloudStatus')?.textContent,
     cloudPresent:!!window.DDR3Cloud,
     vaultPresent:!!window.DDPrivateVault,
     gapBridgePresent:!!window.DDResearchGapBridge,
     supabasePresent:!!window.supabase,
     scripts:[...document.querySelectorAll('script[src]')].map(x=>x.src)
    })), 'errors',errors,'blocked',foreign);
    throw error;
   }
   assert.equal(await page.locator('#r3CloudPanel').isVisible(),true);
   assert.equal(await page.locator('#r3QaPanel').isVisible(),true);
   await page.locator('#r3QaVerify').click();
   await page.waitForFunction(()=>/Verified a real Supabase session/.test(document.querySelector('#r3QaStatus').textContent));
   assert.equal(await page.locator('#r3QaOwnId').inputValue(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
   assert.match(await page.locator('#r3QaResults').textContent(),/Own encrypted notebook backup present: NO/);
   assert.match(await page.locator('#r3CloudProfile').textContent(),/researcher\.test/);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab[disabled]').count(),0);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab.active').getAttribute('data-tab'),'boards');
   assert.equal(await page.locator('#r3CloudUpload').isDisabled(),true);
   await page.locator('#sampleBtn').click();
   await page.locator('#workPanel').waitFor({state:'visible'});
   await page.locator('#vaultNewPassphrase').fill('Fake hosted account only - long passphrase 2026');
   await page.locator('#vaultConfirmPassphrase').fill('Fake hosted account only - long passphrase 2026');
   await page.locator('#enableVaultBtn').click();
   await page.waitForFunction(()=>!document.querySelector('#r3CloudUpload').disabled,{timeout:25000});
   await page.locator('#r3CloudUpload').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   assert.match(await page.locator('#ddDialogTitle').textContent(),/Back up notebook/);
   await page.locator('#ddDialogCancel').click();
   assert.equal(await page.evaluate(()=>Object.keys(window.__r3HostedFakeRecords).length),0);
   await page.locator('#r3CloudUpload').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   await page.locator('#ddDialogAccept').click();
   await page.waitForFunction(()=>/Encrypted cloud backup saved/.test(
    document.querySelector('#r3CloudStatus').textContent),undefined,{timeout:20000});
   const stored=await page.evaluate(()=>JSON.stringify(window.__r3HostedFakeRecords));
   assert.match(stored,/dd-r3-private-aes256gcm-v1/);
   assert.doesNotMatch(stored,/Environmental interpretation|fictional report/i);
   // A real-looking second owner has a row in the fake DB, but the mocked
   // RLS SELECT must return no row to A's authenticated browser session.
   await page.evaluate(()=>{
    const id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    window.__r3HostedFakeRecords[id]={owner_user_id:id,generation:'b'.repeat(32),
     encrypted_envelope:{format:'dd-r3-private-aes256gcm-v1',cipher:'AES-256-GCM',
      generation:'b'.repeat(32),ciphertext:'B'.repeat(384)}};
   });
   await page.locator('#r3QaVerify').click();
   await page.waitForFunction(()=>/Own encrypted notebook backup present: YES/.test(
    document.querySelector('#r3QaResults').textContent));
   await page.locator('#r3QaOtherId').fill('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
   await page.locator('#r3QaOtherCheck').click();
   await page.waitForFunction(()=>/DENIED – ZERO OTHER-ACCOUNT ROWS/.test(
    document.querySelector('#r3QaResults').textContent));
   assert.doesNotMatch(await page.locator('#r3QaResults').textContent(),/aaaaaaaa|bbbbbbbb|researcher.test/);
   await page.evaluate(()=>delete window.__r3HostedFakeRecords['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']);
   const dl=page.waitForEvent('download');
   await page.locator('#r3CloudDownload').click();
   const output=await dl;
   assert.match(output.suggestedFilename(),/CLOUD-ENCRYPTED/);
   // A cloud restore may not overwrite a live local notebook.
   assert.equal(await page.locator('#r3CloudRestore').isDisabled(),true);
   await page.locator('#lockVaultBtn').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   await page.locator('#ddDialogAccept').click();
   await page.locator('#vaultAccessPanel').waitFor({state:'visible'});
   await page.locator('#deleteVaultBtn').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   await page.locator('#ddDialogVerify').fill('DELETE');
   await page.locator('#ddDialogAccept').click();
   await page.waitForFunction(()=>document.getElementById('r3CloudRestore').disabled===false);
   await page.locator('#r3CloudPassphrase').fill('Wrong fictional passphrase for negative test');
   await page.locator('#r3CloudRestore').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   await page.locator('#ddDialogAccept').click();
   await page.waitForFunction(()=>/Cloud restore failed/.test(
    document.querySelector('#r3CloudStatus').textContent),undefined,{timeout:20000});
   assert.equal(await page.locator('#workPanel').isVisible(),false,
    'Wrong passphrase must not reveal or import any cloud notebook');
   await page.locator('#r3CloudPassphrase').fill('Fake hosted account only - long passphrase 2026');
   await page.locator('#r3CloudRestore').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   await page.locator('#ddDialogAccept').click();
   await page.locator('#workPanel').waitFor({state:'visible'});
   assert.match(await page.locator('#notebookHeading').innerText(),/Fictional case/);
   assert.match(await page.locator('#r3CloudStatus').innerText(),/restored to this browser/i);
   await page.locator('#r3CloudDelete').click();
   await page.locator('#ddConfirmDialog').waitFor({state:'visible'});
   assert.match(await page.locator('#ddDialogTitle').textContent(),/Delete encrypted account backup/);
   await page.locator('#ddDialogVerify').fill('DELETE');
   await page.locator('#ddDialogAccept').click();
   await page.waitForFunction(()=>/Encrypted account backup deleted/.test(
    document.querySelector('#r3CloudStatus').textContent));
   assert.equal(await page.evaluate(()=>Object.keys(window.__r3HostedFakeRecords).length),0);
   // The same event raised by sign-out/account switching must wipe the
   // decrypted notebook immediately, even before the browser reload completes.
   assert.equal(await page.locator('#workPanel').isVisible(),true);
   await page.evaluate(()=>window.dispatchEvent(new Event('dd-r3-account-changed')));
   assert.equal(await page.locator('#workPanel').isVisible(),false);
   assert.equal(await page.locator('#notebookHeading').textContent(),'');
   assert.equal(await page.locator('#r3CloudProfile').textContent(),'Account changed');
   assert.equal(await page.locator('#r3CloudUpload').isDisabled(),true);
   assert.equal(await page.locator('#r3CloudDownload').isDisabled(),true);
   assert.equal(await page.locator('#r3CloudRestore').isDisabled(),true);
   assert.equal(await page.locator('#r3CloudDelete').isDisabled(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.r3Boot),'locked');
   assert.deepEqual(errors,[],'No hosted R3 runtime errors');
   assert.deepEqual(foreign,[],'No unapproved network traffic');
   const size=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,width:innerWidth}));
   assert(size.actual<=size.width+3,'Hosted R3 horizontal overflow '+JSON.stringify(size));
   await context.close();
   console.log('PASS R3 hosted '+width+'px: signed-in profile, 14-nav, explicit ciphertext backup, cancel, download and delete; no plaintext');
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
