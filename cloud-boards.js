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
async function refresh(){
 try{
  const {data:{session:s}}=await db.auth.getSession();session=s;
  guest.hidden=!!s; cloudControls.hidden=!s;
  if(s){act.textContent='Signed in as '+s.user.email;say('Signed in. Device boards stay on this device until you choose an action.')}else{act.textContent='Optional private account';say('Guest mode: your research stays on this device. Sign in to access cloud boards.')}
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
async function upload(){
 if(!session){say('Sign in first.');return}
 if(!Array.isArray(investigationBoards)||!investigationBoards.length){say('No device boards to copy.');return}
 if(!confirm('Copy your '+investigationBoards.length+' DEVICE collections to your private cloud account? Nothing will be deleted locally. Make an export backup first.'))return;
 say('Copying device boards…');
 try{
  const {data:existing,error:readErr}=await db.from('investigation_boards').select('id,name,content');
  if(readErr)throw readErr;
  const fingerprint=b=>JSON.stringify({name:b.name,links:b.links||[],notes:b.notes||[]});
  const saved=new Set((existing||[]).map(x=>fingerprint({name:x.name,...x.content})));
  let count=0,skipped=0;
  for(const b of investigationBoards){
   if(saved.has(fingerprint(b))){skipped++;continue}
   const {error}=await db.from('investigation_boards').insert({name:String(b.name).slice(0,60),content:{links:b.links||[],notes:b.notes||[]}});
   if(error)throw error;count++;
  }
  say('Copied '+count+' board(s) to cloud; '+skipped+' already present. Your device boards are unchanged.');
 }catch(ex){say('Cloud copy interrupted: '+ex.message+'. Device boards are unchanged; please export a backup before retrying.')}
}
async function download(){
 if(!session){say('Sign in first.');return}
 say('Checking private cloud boards…');
 try{
  const {data,error}=await db.from('investigation_boards').select('id,name,content').order('updated_at',{ascending:false});
  if(error)throw error;
  const incoming=(data||[]).filter(x=>x&&typeof x.name==='string'&&Array.isArray(x.content?.links)&&Array.isArray(x.content?.notes));
  if(!incoming.length){say('No cloud boards found yet.');return}
  if(!confirm('Import '+incoming.length+' cloud collection(s) onto this device? Existing collections stay untouched and identical copies will be skipped.')){say('Import cancelled.');return}
  const fp=b=>JSON.stringify({name:b.name,links:b.links||[],notes:b.notes||[]});
  const seen=new Set(investigationBoards.map(fp));let added=0;
  for(const row of incoming){const b={name:row.name,links:row.content.links,notes:row.content.notes};if(!seen.has(fp(b))&&investigationBoards.length<40){investigationBoards.push(b);seen.add(fp(b));added++}}
  boardSave();say('Imported '+added+' collections. Existing device boards preserved. Cloud import is a snapshot; upload changes manually when ready.');
 }catch(ex){say('Cloud retrieval failed: '+ex.message+'. Device boards were not changed.')}
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
document.getElementById('ddCloudUpload').onclick=upload;
document.getElementById('ddCloudDownload').onclick=download;
document.getElementById('ddCloudReset').onclick=async()=>{const e=email.value.trim();if(!e){say('Enter your email to request a password reset.');return}const {error}=await db.auth.resetPasswordForEmail(e,{redirectTo:location.origin+'/'});say(error?'Reset request failed: '+error.message:'Check your email for a password-reset link.');};
db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){setTimeout(async()=>{const next=prompt('Choose your new Disclosure Desk password (minimum 8 characters):');if(!next)return;if(next.length<8){say('Password must contain at least 8 characters.');return}const {error}=await db.auth.updateUser({password:next});say(error?'Password update failed: '+error.message:'Password updated. You can now sign in.');},0)}setTimeout(refresh,0)});
refresh();
handleConfirmationReturn();
})();
