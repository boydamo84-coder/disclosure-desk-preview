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
async function auth(mode){
 const e=email.value.trim(),p=pass.value;
 if(!e||!p){say('Enter an email and password.');return}
 say('Contacting sign-in service…');
 try{
  const out=mode==='signup'?await db.auth.signUp({email:e,password:p,options:{emailRedirectTo:location.origin+'/'}}):await db.auth.signInWithPassword({email:e,password:p});
  if(out.error)throw out.error;
  pass.value='';
  await refresh();
  if(mode==='signup'&&!out.data.session){say('Account created. Check your inbox for the Disclosure Desk confirmation email and tap its verification link before signing in. Check spam if needed.')}else{say('Signed in successfully. Your existing device boards have not been changed.')}
 }catch(ex){say('Account action failed: '+ex.message)}
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
document.getElementById('ddCloudSignup').onclick=()=>auth('signup');
document.getElementById('ddCloudLogin').onclick=()=>auth('login');
document.getElementById('ddCloudLogout').onclick=async()=>{await db.auth.signOut();await refresh()};
document.getElementById('ddCloudUpload').onclick=upload;
document.getElementById('ddCloudDownload').onclick=download;
document.getElementById('ddCloudReset').onclick=async()=>{const e=email.value.trim();if(!e){say('Enter your email to request a password reset.');return}const {error}=await db.auth.resetPasswordForEmail(e,{redirectTo:location.origin+'/'});say(error?'Reset request failed: '+error.message:'Check your email for a password-reset link.');};
db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){setTimeout(async()=>{const next=prompt('Choose your new Disclosure Desk password (minimum 8 characters):');if(!next)return;if(next.length<8){say('Password must contain at least 8 characters.');return}const {error}=await db.auth.updateUser({password:next});say(error?'Password update failed: '+error.message:'Password updated. You can now sign in.');},0)}setTimeout(refresh,0)});
refresh();
})();
