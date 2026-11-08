/* Disclosure Desk profile avatars: 512px WebP, one opaque private Storage path.
 * User photos show beside PUBLIC aliases by default, with a server-enforced
 * Hide switch in Profile. No Auth UUID, email or raw file reaches other users.
 * Selecting a photo auto-saves it; Retry is shown only after failed upload.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=window.DD_COMMUNITY_FEATURES?.profileAvatars===true &&
 ['test','production'].includes(cfg.environment)&&!!cfg.url&&!!cfg.publishableKey;
const BUCKET='dd-profile-avatars',MAX_INPUT=5*1024*1024,MAX_WEBP=1024*1024;
const $=id=>document.getElementById(id),panel=$('ddAvatarPanel');
if(!panel)return;
panel.hidden=!enabled;if(!enabled)return;
const image=$('ddAvatarImage'),fallback=$('ddAvatarFallback'),file=$('ddAvatarFile'),
 save=$('ddAvatarSave'),remove=$('ddAvatarRemove'),status=$('ddAvatarStatus'),visible=$('ddAvatarVisible');
if(!image||!fallback||!file||!save||!remove||!status||!visible)return;
let db=null,owner=null,avatarKey=null,epoch=0,objectUrl=null,pending=null,operation=false,hasSavedPhoto=false;
const client=()=>window.supabase?(db||(db=window.supabase.createClient(
 cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}
))):null;
const validId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id||''));
function say(msg){status.textContent=msg;}
function buttons(){
 save.hidden=!pending;
 save.disabled=operation||!pending||!owner||!avatarKey;
 file.disabled=operation;
 remove.disabled=operation||!owner||!avatarKey||!hasSavedPhoto;
 visible.disabled=operation||!owner||!avatarKey;
}
function revoke(){if(objectUrl){try{URL.revokeObjectURL(objectUrl)}catch(_){}}objectUrl=null;}
function reset(clearKey=true){
 if(clearKey){avatarKey=null;visible.checked=false;}
 pending=null;hasSavedPhoto=false;file.value='';revoke();image.removeAttribute('src');
 image.hidden=true;fallback.hidden=false;remove.hidden=true;buttons();
}
function show(blob,saved=false){
 if(saved)hasSavedPhoto=true;
 const next=URL.createObjectURL(blob);revoke();objectUrl=next;
 image.src=next;image.hidden=false;fallback.hidden=true;
 remove.hidden=!hasSavedPhoto;buttons();
}
function pathFor(key){return key+'/avatar.webp';}
async function identity(){
 const c=client();if(!c)throw Error('Account service unavailable');
 const {data,error}=await c.auth.getUser();
 if(error||!data?.user||data.user.is_anonymous||!validId(data.user.id))
  throw Error('Sign in with a registered account.');
 return {c,id:data.user.id};
}
async function settings(c){
 const {data,error}=await c.rpc('dd_avatar_my_settings');
 if(error)throw error;
 const row=Array.isArray(data)?data[0]:null;
 if(!row||!validId(row.public_key))throw Error('Profile photo settings are not ready yet.');
 return {key:String(row.public_key),visible:row.visible===true};
}
async function refresh(){
 const generation=++epoch,c=client();
 if(!c){owner=null;reset();panel.hidden=true;return}
 let user;
 try{const auth=await c.auth.getUser();
  if(generation!==epoch)return;
  user=!auth.error&&!auth.data?.user?.is_anonymous?auth.data?.user:null;
 }catch(_){user=null}
 if(generation!==epoch)return;
 if(!user||!validId(user.id)){
  owner=null;reset();panel.hidden=true;say('Sign in to manage your profile photo.');return;
 }
 if(owner!==user.id){owner=user.id;reset();}
 panel.hidden=false;if(operation)return;
 say('Loading profile-photo preferences…');
 let prefs;
 try{prefs=await settings(c);}catch(e){
  if(generation===epoch&&owner===user.id){avatarKey=null;buttons();
   say('Profile photos are unavailable: '+String(e.message||'Try again.').slice(0,100));}
  return;
 }
 if(generation!==epoch||owner!==user.id)return;
 avatarKey=prefs.key;visible.checked=prefs.visible;buttons();
 const response=await c.storage.from(BUCKET).download(pathFor(avatarKey));
 if(generation!==epoch||owner!==user.id)return;
 if(response.error||!response.data){
  revoke();image.removeAttribute('src');image.hidden=true;fallback.hidden=false;
  hasSavedPhoto=false;remove.hidden=true;buttons();say('No profile photo saved yet.');return;
 }
 show(response.data,true);
 say(visible.checked?'Photo saved and shown beside your public username.':
  'Photo saved privately; it is hidden from other members.');
}
async function convert(fileBlob){
 if(!fileBlob||!['image/jpeg','image/png','image/webp'].includes(fileBlob.type))
  throw Error('Choose a JPG, PNG or WebP image.');
 if(fileBlob.size<=0||fileBlob.size>MAX_INPUT)
  throw Error('Choose an image smaller than 5 MB.');
 if(typeof createImageBitmap!=='function')throw Error('Image processing is unavailable in this browser.');
 const decoded=await createImageBitmap(fileBlob);
 try{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Unable to process this photo.');
  ctx.fillStyle='#172635';ctx.fillRect(0,0,512,512);
  const scale=Math.max(512/decoded.width,512/decoded.height);
  const w=decoded.width*scale,h=decoded.height*scale;
  ctx.drawImage(decoded,(512-w)/2,(512-h)/2,w,h);
  const webp=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.83));
  if(!webp||webp.type!=='image/webp'||webp.size>MAX_WEBP)
   throw Error('This photo could not be safely reduced to 1 MB WebP.');
  return webp;
 }finally{decoded.close?.();}
}
file.addEventListener('change',async()=>{
 const chosen=file.files?.[0];if(!chosen||operation)return;
 const expected=owner,stamp=++epoch;pending=null;buttons();say('Preparing and saving your photo…');
 try{
  const blob=await convert(chosen);
  if(stamp!==epoch||owner!==expected)return;
  pending=blob;show(blob);
  // Choosing the image triggers the upload; only failures need a Retry.
  await uploadPending();
 }catch(e){
  if(stamp!==epoch)return;
  pending=null;buttons();const cause=String(e.message||'Unable to read photo.').slice(0,150);
  await refresh();if(owner===expected)say('Photo not selected: '+cause);
 }
});
async function uploadPending(){
 if(operation||!pending||!owner||!avatarKey)return;
 const candidate=pending,expected=owner,key=avatarKey,stamp=epoch;
 operation=true;buttons();say('Saving profile photo…');
 try{
  const {c,id}=await identity();
  if(id!==expected||stamp!==epoch||key!==avatarKey)
   throw Error('Account changed. Reopen Profile and retry.');
  const result=await c.storage.from(BUCKET).upload(pathFor(key),candidate,{
   upsert:true,contentType:'image/webp',cacheControl:'60'
  });
  if(result.error)throw result.error;
  if(stamp===epoch&&owner===id){
   pending=null;hasSavedPhoto=true;file.value='';remove.hidden=false;
   window.DDMemberAvatars?.clearCache?.();
   say(visible.checked?'Profile picture saved automatically and visible beside your public username.':
    'Profile picture saved automatically and hidden from other members.');
  }
 }catch(e){
  if(stamp===epoch)say('Photo not saved: '+String(e.message||'Try again.').slice(0,130));
 }finally{operation=false;buttons();}
}
save.addEventListener('click',()=>{void uploadPending()});
remove.addEventListener('click',async()=>{
 if(operation||!owner||!avatarKey||!hasSavedPhoto)return;
 if(!confirm('Remove your account profile photo? You can upload another later.'))return;
 const expected=owner,key=avatarKey,stamp=epoch;
 operation=true;buttons();say('Removing profile photo…');
 try{
  const {c,id}=await identity();
  if(id!==expected||stamp!==epoch||key!==avatarKey)throw Error('Account changed. Retry from Profile.');
  const result=await c.storage.from(BUCKET).remove([pathFor(key)]);
  if(result.error)throw result.error;
  if(stamp===epoch&&owner===id){reset(false);window.DDMemberAvatars?.clearCache?.();say('Profile photo removed.');}
 }catch(e){
  if(stamp===epoch)say('Photo could not be removed: '+String(e.message||'Try again.').slice(0,130));
 }finally{operation=false;buttons();}
});
visible.addEventListener('change',async()=>{
 if(operation||!owner||!avatarKey)return;
 const desired=!!visible.checked,expected=owner,stamp=epoch;
 operation=true;buttons();say('Saving photo visibility…');
 try{
  const {c,id}=await identity();
  if(id!==expected||stamp!==epoch)throw Error('Account changed. Reopen Profile.');
  const result=await c.rpc('dd_avatar_set_visibility',{p_visible:desired});
  if(result.error||result.data!==true)throw (result.error||Error('Visibility change was not saved.'));
  window.DDMemberAvatars?.clearCache?.();
  if(stamp===epoch&&owner===id)say(desired?
   'Your photo is shown beside your public username.':
   'Your photo is now hidden from other members.');
 }catch(e){
  if(stamp===epoch&&owner===expected){visible.checked=!desired;
   say('Could not change photo visibility: '+String(e.message||'Try again.').slice(0,110));}
 }finally{operation=false;buttons();}
});
const c=client();
c?.auth.onAuthStateChange(()=>{++epoch;owner=null;reset();Promise.resolve().then(refresh)});
window.DDProfileAvatars=Object.freeze({refresh});
void refresh();
})();
