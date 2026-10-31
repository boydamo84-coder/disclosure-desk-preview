/* Disclosure Desk account sync. Cloud operations require explicit user action. */
(()=>{
'use strict';
const URL="https://omqxizswzcwgzqaczlhe.supabase.co", KEY="sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X";
const status=()=>document.getElementById('ddCloudStatus');
const say=t=>{if(status())status().textContent=t};
const client=()=>window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const db=client();
if(!db){say('Cloud service library unavailable. Device boards remain safe.');return}
let session=null;
const panel=document.getElementById('ddCloudAccount');
const email=document.getElementById('ddCloudEmail');
const pass=document.getElementById('ddCloudPass');
const act=document.getElementById('ddCloudActions');
const guest=document.getElementById('ddCloudGuest');
const cloudControls=document.getElementById('ddCloudControls');
const ddLocalIndicator=document.createElement('p');ddLocalIndicator.id='ddLocalBoardIdentity';ddLocalIndicator.className='muted small';ddLocalIndicator.setAttribute('aria-live','polite');ddLocalIndicator.textContent='Checking account-specific local Boards…';panel.append(ddLocalIndicator);
const syncKey=()=>session?.user?.id?'dd-sync-log-'+session.user.id:null;
function syncStamp(kind,count){
 const key=syncKey();if(!key)return;
 try{const old=JSON.parse(localStorage.getItem(key)||'{}');old[kind]={time:new Date().toISOString(),count};localStorage.setItem(key,JSON.stringify(old));}catch(_){}
 renderSyncStamp();
}
function renderSyncStamp(){
 const area=document.getElementById('ddCloudSyncInfo');if(!area)return;
 if(!session){area.hidden=true;return}
 area.hidden=false;
 let info={};try{info=JSON.parse(localStorage.getItem(syncKey())||'{}')}catch(_){}
 const fmt=v=>v?.time?new Date(v.time).toLocaleString()+' ('+v.count+' board(s))':'Not yet on this device';
 area.textContent='CLOUD SYNC STATUS\nLast upload from this device: '+fmt(info.upload)+'\nLast download to this device: '+fmt(info.download)+'\nTransfers are manual. Existing boards are never overwritten.';area.style.whiteSpace='pre-line';
}
function resetNotice(){
 const overlay=document.createElement('div');
 overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#020a12de;display:flex;align-items:center;justify-content:center;padding:18px';
 const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Set new Disclosure Desk password');
 panel.style.cssText='background:#102131;border:1px solid #E0C48E;border-radius:14px;box-sizing:border-box;padding:24px;width:min(100%,420px);color:#F5F0E6;font-family:Arial,sans-serif';
 const title=document.createElement('h2');title.textContent='Choose a new password';title.style.cssText='color:#E0C48E;font-size:22px;margin:0 0 12px';
 const description=document.createElement('p');description.textContent='Enter your new password twice. Your Investigation Boards will not be changed.';description.style.cssText='font-size:14px;line-height:1.5';
 const inputs=[0,1].map(i=>{const box=document.createElement('input');box.type='password';box.placeholder=i?'Confirm new password':'New password (8+ characters)';box.autocomplete='new-password';box.style.cssText='width:100%;box-sizing:border-box;margin:7px 0;padding:13px;background:#0A151F;color:#F5F0E6;border:1px solid #8B7754;border-radius:7px';return box});
 const msg=document.createElement('p');msg.setAttribute('role','status');msg.style.cssText='font-size:13px;color:#E0C48E';
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap';
 const submit=document.createElement('button');submit.type='button';submit.textContent='Update password';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';
 for(const button of [submit,cancel])button.style.cssText='padding:12px;background:#E0C48E;color:#102131;border:0;border-radius:8px;font-weight:bold;cursor:pointer';
 const close=()=>{overlay.remove();};
 cancel.onclick=close;
 submit.onclick=async()=>{
  if(inputs[0].value.length<8){msg.textContent='Please use at least 8 characters.';return}
  if(inputs[0].value!==inputs[1].value){msg.textContent='Passwords do not match.';return}
  submit.disabled=true;msg.textContent='Updating password…';
  const {error}=await db.auth.updateUser({password:inputs[0].value});
  if(error){msg.textContent='Update failed: '+error.message;submit.disabled=false;return}
  close();say('Password changed successfully. Your boards are unchanged.');
 };
 actions.append(submit,cancel);panel.append(title,description,...inputs,msg,actions);overlay.append(panel);document.body.append(overlay);inputs[0].focus();
}
function ensureSyncInfo(){
 if(document.getElementById('ddCloudSyncInfo'))return;
 const area=document.createElement('p');area.id='ddCloudSyncInfo';area.className='muted small';area.setAttribute('aria-live','polite');
 cloudControls.append(area);
}
ensureSyncInfo();
async function refreshAccountOverview(){
 const box=document.getElementById('ddAccountSummary');
 if(!box)return;
 box.hidden=!session;
 if(!session)return;
 document.getElementById('ddAccountSummaryEmail').textContent=session.user.email;
 document.getElementById('ddAccountLocalCount').textContent=Array.isArray(investigationBoards)?String(investigationBoards.length):'—';
 const cloudCount=document.getElementById('ddAccountCloudCount');
 const cloudCheck=document.getElementById('ddAccountCloudCheck');
 cloudCheck.textContent='Checking private cloud collections…';
 try{
  const {count,error}=await db.from('investigation_boards').select('id',{count:'exact',head:true});
  if(error)throw error;
  cloudCount.textContent=String(count??0);
  cloudCheck.textContent='Counts checked just now. Cloud transfers remain manual.';
 }catch(e){cloudCount.textContent='—';cloudCheck.textContent='Could not check cloud boards. Your device boards are unchanged.'}
}
document.getElementById('ddAccountRefresh').addEventListener('click',refreshAccountOverview);
let ddAuthGeneration=0;
function applyBoardSession(nextSession){
 session=nextSession||null;
 if(typeof ddSwitchBoardSpace==='function')ddSwitchBoardSpace(session?.user?.id||null);
 guest.hidden=!!session;cloudControls.hidden=!session;
 const emailText=session?.user?.email||'';
 act.textContent=session?'Signed in as '+emailText:'Optional private account';
 say(session?'Signed in. Your local Boards are separated by account. Cloud transfers are manual.':'Guest mode: legacy guest Boards are separate from signed-in account Boards.');
 renderSyncStamp();
 const indicator=document.getElementById('ddLocalBoardIdentity');
 if(indicator)indicator.textContent='Local Board space: '+(session?'Signed-in account ('+emailText+')':'Guest / legacy')+' · '+investigationBoards.length+' Board(s) · isolation v2';
 if(session)refreshAccountOverview();
}
async function refresh(){
 const generation=++ddAuthGeneration;
 try{
  const {data:{session:s},error}=await db.auth.getSession();
  if(error)throw error;
  if(generation!==ddAuthGeneration)return;
  applyBoardSession(s);
 }catch(e){say('Sign-in service unavailable: '+e.message)}
}
function signupNotice(){
 const overlay=document.createElement('div');
 overlay.setAttribute('role','presentation');
 overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(2,10,18,.82);display:flex;align-items:center;justify-content:center;padding:18px;';
 const panel=document.createElement('div');
 panel.setAttribute('role','alertdialog');
 panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-labelledby','ddSignupHeading');
 panel.style.cssText='width:min(100%,430px);box-sizing:border-box;background:#102131;border:1px solid #E0C48E;border-radius:16px;padding:30px 22px;text-align:center;color:#E8EDF1;box-shadow:0 20px 65px rgba(0,0,0,.55);font-family:Arial,Helvetica,sans-serif;';
 const logo=document.createElement('div');logo.textContent='DISCLOSURE DESK';logo.style.cssText='color:#E0C48E;font-size:19px;font-weight:800;letter-spacing:2px;margin-bottom:20px;';
 const heading=document.createElement('h2');heading.id='ddSignupHeading';heading.textContent='Check your email';heading.style.cssText='color:#F5F0E6;font-size:25px;margin:0 0 15px;';
 const p=document.createElement('p');p.textContent='Your signup request was received. We have sent a confirmation link if this email address can be registered. Open the email and tap “Confirm my email” to activate your account.';p.style.cssText='font-size:15px;line-height:1.65;color:#D5E0E8;';
 const tip=document.createElement('p');tip.textContent='No email? Check Spam or Junk, then try again if needed.';tip.style.cssText='font-size:13px;line-height:1.5;color:#B5C1CE;margin:16px 0 25px;';
 const btn=document.createElement('button');btn.type='button';btn.textContent='Got it';btn.style.cssText='background:#E0C48E;color:#0E1D2B;border:0;border-radius:9px;padding:13px 29px;font-size:15px;font-weight:700;cursor:pointer;min-height:44px;';
 const close=()=>{overlay.remove();document.removeEventListener('keydown',esc);};
 const esc=ev=>{if(ev.key==='Escape')close()};
 btn.addEventListener('click',close);document.addEventListener('keydown',esc);
 panel.append(logo,heading,p,tip,btn);overlay.append(panel);document.body.append(overlay);btn.focus();
}
function verificationNotice(success,message){
 const overlay=document.createElement('div');
 overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(2,10,18,.84);display:flex;align-items:center;justify-content:center;padding:18px;';
 const panel=document.createElement('section');
 panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','ddVerificationTitle');
 panel.style.cssText='width:min(100%,430px);box-sizing:border-box;background:#102131;border:1px solid #E0C48E;border-radius:16px;padding:30px 24px;text-align:center;color:#E8EDF1;box-shadow:0 20px 65px rgba(0,0,0,.55);font-family:Arial,Helvetica,sans-serif;';
 const logo=document.createElement('div');logo.textContent='DISCLOSURE DESK';logo.style.cssText='color:#E0C48E;font-weight:800;letter-spacing:2px;margin-bottom:20px;';
 const title=document.createElement('h2');title.id='ddVerificationTitle';title.textContent=success?'Email verified successfully!':'Confirmation link problem';title.style.cssText='font-size:24px;color:#F5F0E6;margin:0 0 14px;';
 const body=document.createElement('p');body.textContent=message;body.style.cssText='font-size:15px;color:#D5E0E8;line-height:1.6;margin:0 0 24px;';
 const button=document.createElement('button');button.type='button';button.textContent='Continue to Disclosure Desk';button.style.cssText='background:#E0C48E;color:#0E1D2B;border:0;border-radius:8px;min-height:44px;padding:12px 22px;font-weight:700;font-size:14px;cursor:pointer;';
 const close=()=>{overlay.remove();document.removeEventListener('keydown',escape)};
 const escape=e=>{if(e.key==='Escape')close()};
 button.onclick=close;document.addEventListener('keydown',escape);
 panel.append(logo,title,body,button);overlay.append(panel);document.body.append(overlay);button.focus();
}
async function handleConfirmationReturn(){
 const query=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.replace(/^#/,'')),targeted=query.get('dd_confirm')==='1'||hash.get('type')==='signup';
 if(!targeted)return;
 const failure=query.get('error_description')||hash.get('error_description')||query.get('error')||hash.get('error');
 // Supabase processes the email tokens/code asynchronously; let the auth client finish first.
 try{
  if(!failure){
   const {data:{session:s},error}=await db.auth.getSession();
   if(!error&&s?.user?.email_confirmed_at){
    verificationNotice(true,'Your email address has been confirmed. Your private Investigation Boards account is ready to use.');
   }else{
    verificationNotice(false,'We could not verify this confirmation yet. Please try the link again or sign in to check your account.');
   }
  }else verificationNotice(false,'The confirmation link was invalid or expired. Please request a new confirmation email. ('+failure.replace(/_/g,' ')+')');
 }catch(_){verificationNotice(false,'We could not check your confirmation. Please try signing in again.')}
 // Remove only our marker; leave Supabase callback parameters alone.
 if(query.has('dd_confirm')){query.delete('dd_confirm');history.replaceState(null,'',location.pathname+(query.toString()?'?'+query.toString():'')+location.hash)}
}
async function auth(mode){
 const e=email.value.trim(),p=pass.value;
 if(!e||!p){say('Enter an email and password.');return}
 say('Contacting sign-in service…');
 try{
  const out=mode==='signup'?await db.auth.signUp({email:e,password:p,options:{emailRedirectTo:location.origin+location.pathname+'?dd_confirm=1'}}):await db.auth.signInWithPassword({email:e,password:p});
  if(out.error)throw out.error;
  pass.value='';
  await refresh();
  if(mode==='signup'&&!out.data.session){say('Signup request received. Check your inbox for a confirmation link (and check spam).');signupNotice()}else if(mode==='signup'){say('Account created and signed in. Your device boards have not been changed.');}else{say('Signed in successfully. Your existing device boards have not been changed.')}
 }catch(ex){const msg=String(ex.message||'Unknown error');say(mode==='signup'&&/already registered|already exists|user already registered/i.test(msg)?'This email is already registered. Tap Sign in instead, or Reset password if needed.':'Account action failed: '+msg)}
}
const quantity=(n,singular,plural=singular+'s')=>n+' '+(n===1?singular:plural);
function cloudDialog(title,description,confirmLabel){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#020a12df;display:flex;align-items:center;justify-content:center;padding:16px';
  const card=document.createElement('section');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label',title);card.style.cssText='width:min(100%,440px);box-sizing:border-box;background:#102131;color:#F5F0E6;border:1px solid #E0C48E;border-radius:15px;padding:25px 22px;font:15px/1.6 Arial,sans-serif;box-shadow:0 18px 65px #0009';
  const brand=document.createElement('div');brand.textContent='DISCLOSURE DESK';brand.style.cssText='color:#E0C48E;font-weight:bold;letter-spacing:2px;margin-bottom:14px';
  const heading=document.createElement('h2');heading.textContent=title;heading.style.cssText='font-size:23px;margin:0 0 12px;color:#F5F0E6';
  const body=document.createElement('p');body.textContent=description;body.style.cssText='white-space:pre-line;color:#D5E0E8;margin:0 0 20px';
  const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:10px';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.style.cssText='flex:1;min-width:100px;background:#1C2B39;color:#F5F0E6;border:1px solid #8B7754;border-radius:8px;padding:12px';
  const ok=document.createElement('button');ok.type='button';ok.textContent=confirmLabel||'Close';ok.style.cssText='flex:1;min-width:140px;background:#E0C48E;color:#0E1D2B;border:0;border-radius:8px;padding:12px;font-weight:bold';
  const close=value=>{overlay.remove();document.removeEventListener('keydown',esc);resolve(value)};
  const esc=e=>{if(e.key==='Escape')close(false)};
  if(confirmLabel){cancel.onclick=()=>close(false);actions.append(cancel)}
  ok.onclick=()=>close(true);actions.append(ok);card.append(brand,heading,body,actions);overlay.append(card);document.body.append(overlay);document.addEventListener('keydown',esc);ok.focus();
 });
}
const cloudBusy=(busy,type)=>{
 for(const id of ['ddCloudUpload','ddCloudDownload']){const btn=document.getElementById(id);btn.disabled=busy;btn.style.opacity=busy?'.65':''}
 const button=document.getElementById(type==='upload'?'ddCloudUpload':'ddCloudDownload');
 if(busy){button.dataset.originalText=button.textContent;button.textContent=type==='upload'?'Uploading…':'Downloading…'}
 else if(button.dataset.originalText){button.textContent=button.dataset.originalText;delete button.dataset.originalText}
};
async function upload(){
 if(!session){await cloudDialog('Sign in required','Sign in to use your private cloud boards.');return}
 if(!Array.isArray(investigationBoards)||!investigationBoards.length){await cloudDialog('No boards on this device','Create an Investigation Board first, then upload it to your private cloud.');return}
 if(!await cloudDialog('Upload boards to cloud','Copy '+quantity(investigationBoards.length,'board')+' from this device to your private account. Existing cloud boards stay safe; identical copies will be skipped.\n\nWe recommend exporting a backup before uploading.','Upload to cloud'))return;
 cloudBusy(true,'upload');say('Uploading your boards…');
 let added=0,skipped=0;
 try{
  const {data:existing,error:readErr}=await db.from('investigation_boards').select('id,name,content');
  if(readErr)throw readErr;
  const fingerprint=b=>JSON.stringify({name:b.name,links:b.links||[],notes:b.notes||[],timeline:b.timeline||[],videos:b.videos||[],connections:b.connections||[],comparisons:b.comparisons||[]});
  const saved=new Set((existing||[]).map(x=>fingerprint({name:x.name,...x.content})));
  for(const b of investigationBoards){
   const fp=fingerprint(b);if(saved.has(fp)){skipped++;continue}
   const {error}=await db.from('investigation_boards').insert({name:String(b.name).slice(0,60),content:{links:b.links||[],notes:b.notes||[],timeline:(b.timeline||[]).slice(0,250),videos:(b.videos||[]).slice(0,100),connections:(b.connections||[]).slice(0,100),comparisons:(b.comparisons||[]).slice(0,100)}});
   if(error)throw error;added++;saved.add(fp);
  }
  syncStamp('upload',added);refreshAccountOverview();say('Upload complete: '+quantity(added,'new board')+', '+quantity(skipped,'duplicate')+' skipped.');
  await cloudDialog('Cloud upload complete',quantity(added,'new board')+' uploaded. '+quantity(skipped,'duplicate')+' skipped. Your device boards remain unchanged.');
 }catch(ex){say('Upload interrupted: '+ex.message+'. Existing device boards are safe.');await cloudDialog('Cloud upload interrupted','Some boards may have been copied before the interruption. Your device boards have not changed. Check your connection and retry; existing identical copies will be skipped.');}
 finally{cloudBusy(false,'upload')}
}
async function download(){
 if(!session){await cloudDialog('Sign in required','Sign in to access your private cloud boards.');return}
 cloudBusy(true,'download');say('Checking your cloud boards…');
 try{
  const {data,error}=await db.from('investigation_boards').select('id,name,content').order('updated_at',{ascending:false});
  if(error)throw error;
  const incoming=(data||[]).filter(x=>x&&typeof x.name==='string'&&Array.isArray(x.content?.links)&&Array.isArray(x.content?.notes));
  if(!incoming.length){say('No cloud boards found yet.');await cloudDialog('No cloud boards found','You have not uploaded any Investigation Boards to this account yet.');return}
  cloudBusy(false,'download');
  if(!await cloudDialog('Download boards from cloud','Check '+quantity(incoming.length,'board')+' in your private cloud account and add any missing boards to this device. Existing boards will never be overwritten.','Download to device')){say('Download cancelled.');return}
  cloudBusy(true,'download');
  const fp=b=>JSON.stringify({name:b.name,links:b.links||[],notes:b.notes||[],timeline:b.timeline||[],videos:b.videos||[],connections:b.connections||[],comparisons:b.comparisons||[]});
  const seen=new Set(investigationBoards.map(fp));let added=0,skipped=0,full=0;
  for(const row of incoming){
   const b={name:row.name,links:row.content.links,notes:row.content.notes,timeline:Array.isArray(row.content.timeline)?row.content.timeline.slice(0,250):[],videos:Array.isArray(row.content.videos)?row.content.videos.slice(0,100).filter(v=>v&&typeof v.title==='string'&&/^https?:\/\//.test(v.url||'')):[],connections:Array.isArray(row.content.connections)?row.content.connections.slice(0,100):[],comparisons:Array.isArray(row.content.comparisons)?row.content.comparisons.slice(0,100):[]};
   if(seen.has(fp(b))){skipped++;continue}
   if(investigationBoards.length>=40){full++;continue}
   investigationBoards.push(b);seen.add(fp(b));added++;
  }
  if(added)boardSave();syncStamp('download',added);refreshAccountOverview();
  say('Download complete: '+quantity(added,'new board')+', '+quantity(skipped,'duplicate')+' skipped'+(full?', '+full+' beyond device limit':'')+'.');
  await cloudDialog('Cloud download complete',quantity(added,'new board')+' added. '+quantity(skipped,'duplicate')+' skipped.'+(full?' '+full+' could not be added because the device limit is 40.':'')+' Your existing boards remain safe.');
 }catch(ex){say('Cloud retrieval failed: '+ex.message);await cloudDialog('Cloud download failed','We could not complete the cloud download. Your existing device boards are unchanged. Please try again.')}
 finally{cloudBusy(false,'download')}
}
const eyeButton=document.getElementById('ddCloudShowPass');
const eyeGraphic=eyeButton.querySelector('svg');
eyeButton.onclick=()=>{
 const visible=pass.type==='password';
 pass.type=visible?'text':'password';
 eyeButton.setAttribute('aria-label',visible?'Hide password':'Show password');
 eyeButton.setAttribute('title',visible?'Hide password':'Show password');
 eyeButton.setAttribute('aria-pressed',String(visible));
 eyeGraphic.innerHTML=visible?'<path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.2 4.1"/><path d="M6.1 6.1C3.5 8.1 2 12 2 12s3.5 7 10 7c1.5 0 2.9-.4 4.1-1"/><path d="M10 10a3 3 0 0 0 4 4"/>':'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
};
document.getElementById('ddCloudAlreadyRegistered').onclick=()=>{
 say('Already have an account? Enter your email and password, then tap Sign in. Forgotten your password? Use Reset password.');
 document.getElementById('ddCloudLogin').focus();
};
document.getElementById('ddCloudSignup').onclick=()=>auth('signup');
document.getElementById('ddCloudLogin').onclick=()=>auth('login');
document.getElementById('ddCloudLogout').onclick=async()=>{await db.auth.signOut();await refresh()};
document.getElementById('ddCloudUpload').textContent='↑ Upload boards to cloud';document.getElementById('ddCloudDownload').textContent='↓ Download boards from cloud';async function emailBackup(){
 const button=document.getElementById('ddEmailBackup');
 if(!session?.user?.email_confirmed_at){await cloudDialog('Verified account required','Please sign in to a verified Disclosure Desk account before sending backups.');return}
 if(!investigationBoards.length){await cloudDialog('Nothing to back up','Create or download at least one Investigation Board first.');return}
 const count=investigationBoards.length;
 if(!await cloudDialog('Email my private Boards','Send an attached JSON backup of '+quantity(count,'board')+' to your registered account email ('+session.user.email+'). The file includes private notes, saved sources, timeline events and videos. Email attachments are not end-to-end encrypted; protect your inbox and do not forward the file.','Send backup'))return;
 button.disabled=true;button.textContent='Sending backup…';say('Requesting private email backup…');
 try{
  const {data,error}=await db.functions.invoke('email-board-backup',{body:{boards:investigationBoards}});
  if(error||!data?.ok)throw Error(data?.error||'Email backup service is not yet available or could not complete the request.');
  say('Backup requested for '+session.user.email+'. Check your inbox and spam folder.');
  await cloudDialog('Backup email requested','Your backup has been accepted for delivery to your registered email. Check your inbox and spam folder. Your Boards remain unchanged.');
 }catch(e){say('Email backup unavailable: '+e.message);await cloudDialog('Email backup not available','The email backup service has not been configured or could not send your backup. Your Boards are safe on this device. Use a Board JSON export until email delivery is enabled.');}
 finally{button.disabled=false;button.textContent='✉ Send backup to my email'}
}
document.getElementById('ddCloudUpload').onclick=upload;
document.getElementById('ddEmailBackup').onclick=emailBackup;
document.getElementById('ddCloudDownload').onclick=download;
document.getElementById('ddCloudReset').onclick=async()=>{const e=email.value.trim();if(!e){say('Enter your email first, then choose Reset password.');return}const {error}=await db.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname});say(error?'Reset request failed: '+error.message:'If an account exists for that address, a password-reset email will arrive shortly. Check your spam folder too.');};
db.auth.onAuthStateChange((event,authSession)=>{if(event==='PASSWORD_RECOVERY'){setTimeout(resetNotice,0)}++ddAuthGeneration;applyBoardSession(authSession)});
refresh();
handleConfirmationReturn();
})();
