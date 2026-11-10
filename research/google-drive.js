/* Optional, user-initiated Google Drive Word copies. Tokens live in memory;
 * every transfer verifies the current DD owner; existing Drive files untouched.
 */
(()=>{'use strict';
const MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const SCOPE='https://www.googleapis.com/auth/drive.file',APP='disclosure-desk-wne-research';
let dialog,feedback,list,connect,backup,refresh,disconnect,last,token=null,expires=0,owner=null,ownerHash=null,epoch=0,busy=false,googleClient=null,needsAccountChooser=false;
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
async function hash(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')}
async function verified(){const id=await window.WNECloudIntegration?.verifiedOwner?.();if(!id)throw Error('Sign in to Research before connecting Google Drive.');if(owner&&owner!==id){reset();throw Error('Your Research account changed. Reopen Google Drive.')}return id}
function say(message){if(feedback)feedback.textContent=message}
function connected(){return !!token&&Date.now()<expires}
// A non-sensitive reconnect preference, scoped to the verified Research owner.
// Never persist any Google access/refresh token, Google email, or credentials.
// GIS still requires an explicit user click to obtain a fresh access token.
const REMEMBER_KEY='dd-wne-drive-reconnect:';
function remembered(){
 if(!ownerHash)return false;
 try{return localStorage.getItem(REMEMBER_KEY+ownerHash)==='1'}catch(_){return false}
}
function remember(on){
 if(!ownerHash)return;
 try{if(on)localStorage.setItem(REMEMBER_KEY+ownerHash,'1');else localStorage.removeItem(REMEMBER_KEY+ownerHash)}catch(_){}
}
function controls(){
 const ok=connected();
 if(connect){
  connect.disabled=busy||!googleClient||ok;
  connect.textContent=ok?'Google Drive connected ✓':needsAccountChooser?'Choose Google account':remembered()?'Reconnect Google Drive':'Connect Google Drive';
 }
 if(backup)backup.disabled=busy||!ok;
 if(refresh)refresh.disabled=busy||!ok;
 if(disconnect)disconnect.disabled=busy||(!ok&&!remembered());
}
function reset(){epoch++;token=null;expires=0;owner=null;ownerHash=null;needsAccountChooser=false;list?.replaceChildren();if(last)last.textContent='';controls()}
async function request(url,options={}){
 const stamp=epoch;await verified();if(stamp!==epoch||!connected())throw Error('Connect Google Drive again to continue.');
 const parsed=new URL(url);if(parsed.origin!=='https://www.googleapis.com')throw Error('Unexpected Drive service address.');
 const response=await fetch(url,{...options,headers:{...options.headers,Authorization:'Bearer '+token},cache:'no-store'});
 if(stamp!==epoch)throw Error('Your Research account changed.');
 if(response.status===401){token=null;expires=0;controls();throw Error('Your Google connection expired. Tap Reconnect Google Drive to continue. Your Research document is safe.')}
 if(!response.ok)throw Error('Google Drive could not complete this request ('+response.status+'). Your original document is safe.');
 return response;
}
async function files(){
 if(!connected())return;const stamp=epoch;
 const query="trashed=false and mimeType='"+MIME+"' and appProperties has { key='dd_app' and value='"+APP+"' } and appProperties has { key='dd_owner' and value='"+ownerHash+"' }";
 const response=await request('https://www.googleapis.com/drive/v3/files?'+new URLSearchParams({q:query,pageSize:'100',orderBy:'modifiedTime desc',fields:'files(id,name,size,modifiedTime,appProperties)'}));
 const result=await response.json();if(stamp!==epoch)return;list.replaceChildren();
 const rows=(result.files||[]).filter(f=>f.appProperties?.dd_app===APP&&f.appProperties?.dd_owner===ownerHash&&/^[a-zA-Z0-9_-]+$/.test(f.id));
 if(!rows.length)list.append(node('p','No Research Word backups in this Google account yet.'));
 for(const file of rows){
  const row=node('article');row.className='dd-drive-file';row.append(node('strong',file.name),node('small',new Date(file.modifiedTime).toLocaleString()));
  const open=node('button','Open as a new document');open.type='button';open.onclick=()=>void run(async()=>{
   const response=await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?fields=id,mimeType,size,appProperties');const meta=await response.json();
   if(meta.appProperties?.dd_app!==APP||meta.appProperties?.dd_owner!==ownerHash||meta.mimeType!==MIME||Number(meta.size)>14*1024*1024)throw Error('Choose a Research Word backup under 14 MB.');
   const body=await (await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media')).blob();
   if(body.size>14*1024*1024)throw Error('This Word file is too large to import.');
   await verified();if(stamp!==epoch)return;
   if(!window.DDResearchImport?.importFile)throw Error('Word import tools are still loading.');
   await window.DDResearchImport.importFile(new File([body],file.name.endsWith('.docx')?file.name:file.name+'.docx',{type:MIME}));
  });row.append(open);list.append(row);
 }
}
async function run(operation){if(busy)return;busy=true;controls();try{await operation()}catch(e){say(e?.message||'Drive request could not be completed.')}finally{busy=false;controls()}}
async function save(){
 const stamp=epoch;await verified();const doc=window.wneCaptureDocument?.();
 if(!doc)throw Error('Open a document before making a Drive copy.');
 say('Preparing your current writing as a Word document…');
 const blob=await window.DDResearchDocx.exportFile(doc);if(blob.size>14*1024*1024)throw Error('This Word file is over 14 MB. Download a local Word copy instead.');
 const name=(String(doc.bookTitle||'Research').replace(/[\\/:*?"<>|]/g,'-').slice(0,110))+' — '+new Date().toISOString().replace(/[:.]/g,'-')+'.docx';
 const metadata={name,mimeType:MIME,appProperties:{dd_app:APP,dd_owner:ownerHash}};
 if(stamp!==epoch)return;say('Uploading a new Word backup to your Google Drive…');
 const session=await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,modifiedTime,appProperties',{
  method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':MIME,'X-Upload-Content-Length':String(blob.size)},body:JSON.stringify(metadata)});
 const upload=session.headers.get('Location');const dest=upload?new URL(upload):null;
 if(!dest||dest.origin!=='https://www.googleapis.com'||dest.pathname!=='/upload/drive/v3/files')throw Error('Google did not provide a valid upload session.');
 const uploaded=await request(dest.href,{method:'PUT',headers:{'Content-Type':MIME},body:blob});const file=await uploaded.json();
 if(!/^[a-zA-Z0-9_-]+$/.test(file.id||''))throw Error('A backup may exist, but Google did not confirm its file ID. Check Drive before retrying.');
 say('Checking the uploaded Word file…');
 const check=await (await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media')).arrayBuffer();
 if(await hash(check)!==await hash(await blob.arrayBuffer()))throw Error('The uploaded file could not be verified. It may exist in Drive; check before retrying.');
 await verified();if(stamp!==epoch)return;
 const time=new Date().toISOString();try{localStorage.setItem('dd-wne-drive-backup:'+ownerHash,time)}catch{}
 last.textContent='Last verified backup: '+new Date(time).toLocaleString();say('Word backup verified in your Google Drive. Existing files were kept.');await files();
}
function connectGoogle(){
 const requestedEpoch=epoch,requestedOwner=owner;
 if(!requestedOwner||!googleClient){say('Reopen Google Drive and sign in to Research first.');return}
 const clientId=window.DDResearchDriveConfig.clientId;
 const attempt=window.google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPE,include_granted_scopes:false,
  callback:async response=>{try{
   if(epoch!==requestedEpoch||owner!==requestedOwner)return;
   if(response.error||!response.access_token){needsAccountChooser=true;throw Error('Google could not reconnect. Tap Choose Google account to confirm access.');}
   if(!window.google.accounts.oauth2.hasGrantedAllScopes(response,SCOPE))throw Error('Google Drive file permission was not granted.');
   await verified();if(epoch!==requestedEpoch||owner!==requestedOwner)return;
   token=response.access_token;expires=Date.now()+Math.max(0,Number(response.expires_in||0)-60)*1000;
   needsAccountChooser=false;remember(true);
   say('Google Drive connected for this session. Your account choice is remembered on this device; Google may still require a tap to reconnect after a reload.');controls();await files();
  }catch(e){if(epoch===requestedEpoch){say(e.message);controls()}}},error_callback:()=>{if(epoch===requestedEpoch){needsAccountChooser=true;say('Google could not open the connection window. Allow the popup and tap Choose Google account.');controls()}}});
 // A returning user can request the previously granted permission in one tap,
 // without forcing the account chooser on every visit. Google may still show
 // consent; this request is always initiated by the user's direct click.
 attempt.requestAccessToken({prompt:remembered()&&!needsAccountChooser?'':'select_account'});
}
async function loadGoogle(){
 const clientId=window.DDResearchDriveConfig?.clientId||'';
 if(!/^[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(clientId)){say('Google Drive needs its website connection set up before it can be used. You can still download a Word copy to your device.');controls();return}
 if(!window.google?.accounts?.oauth2){
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>reject(Error('Google connection tools could not load. Please try again.'));document.head.append(script)});
 }
 googleClient=true;say(remembered()?'Google Drive was connected before on this device. Tap Reconnect to confirm access.':'Connect Google Drive to back up or open a Word copy.');controls();
}
async function open(){
 if(!dialog){
  dialog=node('dialog');dialog.id='dd-research-drive-dialog';dialog.className='dd-m34-dialog';dialog.setAttribute('aria-labelledby','dd-drive-heading');
  const heading=node('h2','Google Drive backups');heading.id='dd-drive-heading';
  dialog.append(heading,node('p','Keep an additional Word copy in your own Google Drive. You choose when to upload. These copies are readable in Word and are not password-encrypted. Your normal Research autosave continues.'));
  feedback=node('p');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');last=node('p');
  const actions=node('div');actions.className='dd-drive-actions';
  connect=node('button','Connect Google Drive');backup=node('button','Back up this document');refresh=node('button','Find my backups');disconnect=node('button','Disconnect');
  for(const b of [connect,backup,refresh,disconnect]){b.type='button';actions.append(b)}
  connect.onclick=connectGoogle;
  backup.onclick=()=>void run(save);refresh.onclick=()=>void run(files);
  disconnect.onclick=()=>{const previous=token;remember(false);reset();if(previous)window.google?.accounts?.oauth2.revoke(previous,()=>{});say('Google Drive disconnected and its remembered connection cleared on this device. Your Drive files remain untouched.')};
  list=node('div');list.id='dd-drive-files';
  const close=node('button','Close');close.type='button';close.onclick=()=>dialog.close();
  dialog.append(actions,feedback,last,node('h3','Recent Word backups'),list,close);document.body.append(dialog);
 }
 dialog.showModal();say('Checking your Research account…');
 const stamp=epoch;
 try{const next=await verified();if(stamp!==epoch)return;owner=next;const digest=await hash(new TextEncoder().encode(owner));if(stamp!==epoch)return;ownerHash=digest;const previous=localStorage.getItem('dd-wne-drive-backup:'+ownerHash);last.textContent=previous?'Last verified backup on this browser: '+new Date(previous).toLocaleString():'';if(!googleClient)await loadGoogle();else {say(connected()?'Google Drive connected for this session.':remembered()?'Google Drive was connected before. Tap Reconnect to continue safely.':'Connect Google Drive to back up or open a Word copy.');controls()}}catch(e){say(e.message);controls()}
}
window.addEventListener('dd-wne-account-changed',()=>{reset();say('Your Research sign-in changed. Reopen Google Drive to connect the right account.')});
document.getElementById('dd-drive-open')?.addEventListener('click',()=>{const menu=document.getElementById('wne-file-menu');if(menu)menu.hidden=true;document.getElementById('wne-file-button')?.setAttribute('aria-expanded','false');void open()});
window.DDResearchDrive=Object.freeze({open});
})();
