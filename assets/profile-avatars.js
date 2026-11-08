/* Disclosure Desk profile avatars: 512px WebP/JPEG, one opaque private Storage path.
 * User photos show beside PUBLIC aliases by default, with a server-enforced
 * Hide switch in Profile. No Auth UUID, email or raw file reaches other users.
 * Selecting a photo auto-saves it; Retry is shown only after failed upload.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=window.DD_COMMUNITY_FEATURES?.profileAvatars===true &&
 ['test','production'].includes(cfg.environment)&&!!cfg.url&&!!cfg.publishableKey;
const BUCKET='dd-profile-avatars',MAX_INPUT=5*1024*1024,MAX_OUTPUT=1024*1024;
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
 file.disabled=operation||!owner||!avatarKey;
 remove.disabled=operation||!owner||!avatarKey||!hasSavedPhoto;
 visible.disabled=operation||!owner||!avatarKey;
}
function updateOwnNavigation(src){
 // The account owner sees their own photo even when public visibility is off.
 // Never embed a Storage public URL or the user's private identifier.
 const targets=[document.getElementById('ddProfileShortcut'),
  document.querySelector('.tab[data-tab="profilePage"] .ico')].filter(Boolean);
 for(const target of targets){
  target.replaceChildren();
  if(src){
   const picture=document.createElement('img');
   picture.alt='';picture.setAttribute('aria-hidden','true');
   picture.src=src;target.appendChild(picture);
  }else target.textContent='👤';
 }
}
function revoke(){if(objectUrl){updateOwnNavigation(null);try{URL.revokeObjectURL(objectUrl)}catch(_){}}objectUrl=null;}
function reset(clearKey=true){
 if(clearKey){avatarKey=null;visible.checked=false;}
 pending=null;hasSavedPhoto=false;file.value='';revoke();image.removeAttribute('src');
 image.hidden=true;fallback.hidden=false;remove.hidden=true;buttons();
}
function show(blob,saved=false){
 if(saved)hasSavedPhoto=true;
 const next=URL.createObjectURL(blob);revoke();objectUrl=next;
 image.src=next;image.hidden=false;fallback.hidden=true;
 updateOwnNavigation(next);
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
// Safari may lack createImageBitmap(), or reject individual iPhone photo files.
// HTMLImageElement is a safe alternative: both paths still rasterise to a
// 512px re-encoded canvas, so original photo bytes never reach Storage.
async function decodePhoto(fileBlob){
 if(typeof createImageBitmap==='function'){
  try{
   const bitmap=await createImageBitmap(fileBlob);
   if(bitmap.width>0&&bitmap.height>0)
    return {source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close?.()};
   bitmap.close?.();
  }catch(_){/* Some Safari versions support the API but reject this encoding. */}
 }
 if(typeof Image!=='function')throw Error('Image decoding is unavailable in this browser.');
 const url=URL.createObjectURL(fileBlob);
 try{
  const img=await new Promise((resolve,reject)=>{
   const node=new Image();
   node.onload=()=>resolve(node);
   node.onerror=()=>reject(Error('Safari could not open this picture. Try a JPG or PNG.'));
   node.src=url;
  });
  const width=img.naturalWidth||img.width,height=img.naturalHeight||img.height;
  if(!width||!height)throw Error('This picture has no readable dimensions.');
  return {source:img,width,height,close:()=>URL.revokeObjectURL(url)};
 }catch(e){URL.revokeObjectURL(url);throw e;}
}
// iOS WebKit can decode a PNG or HEIC but refuse WebP export, or silently
// return a PNG when asked for WebP. Check the *actual* MIME, not the request.
// Canvas output never contains the original photo's metadata.
async function encodeCanvas(canvas,mime,quality){
 if(typeof canvas.toBlob==='function'){
  try{
   const blob=await new Promise((resolve,reject)=>{
    try{canvas.toBlob(resolve,mime,quality)}catch(error){reject(error)}
   });
   if(blob?.type===mime&&blob.size>0)return blob;
  }catch(_){/* Some iOS browsers reject toBlob for this format. */}
 }
 if(typeof canvas.toDataURL==='function'&&typeof atob==='function'&&typeof Blob==='function'){
  try{
   const encoded=canvas.toDataURL(mime,quality);
   const prefix='data:'+mime+';base64,';
   if(typeof encoded==='string'&&encoded.startsWith(prefix)){
    const raw=atob(encoded.slice(prefix.length));
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return new Blob([bytes],{type:mime});
   }
  }catch(_){/* Try the next supported output format. */}
 }
 return null;
}
async function convert(fileBlob){
 const mime=String(fileBlob?.type||'').toLowerCase();
 const name=String(fileBlob?.name||'').toLowerCase();
 const known=['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(mime);
 // Safari's Files picker may omit the MIME type. Decoding/rasterising still
 // rejects unsuitable content; never accept SVG or upload original bytes.
 const named=!mime&&/\\.(jpe?g|png|webp|heic|heif)$/.test(name);
 if(!fileBlob||(!known&&!named))
  throw Error('Choose a JPG, PNG, WebP or iPhone HEIC photo.');
 if(fileBlob.size<=0||fileBlob.size>MAX_INPUT)
  throw Error('Choose an image smaller than 5 MB.');
 const decoded=await decodePhoto(fileBlob);
 try{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Unable to process this photo.');
  ctx.fillStyle='#172635';ctx.fillRect(0,0,512,512);
  const scale=Math.max(512/decoded.width,512/decoded.height);
  const w=decoded.width*scale,h=decoded.height*scale;
  ctx.drawImage(decoded.source,(512-w)/2,(512-h)/2,w,h);
  // Prefer WebP, but JPEG must work on WebKit variants without WebP encoding.
  // The private Storage key stays /avatar.webp for compatibility; its actual
  // MIME is stored correctly as image/webp or image/jpeg.
  for(const [mime,quality] of [['image/webp',0.83],['image/jpeg',0.84],['image/jpeg',0.68]]){
   const encoded=await encodeCanvas(canvas,mime,quality);
   if(encoded&&encoded.size<=MAX_OUTPUT)return encoded;
  }
  throw Error('This browser could not prepare a small JPG or WebP photo. Try another picture.');
 }finally{decoded.close();}
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
   upsert:true,contentType:candidate.type,cacheControl:'60'
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
buttons(); // Do not offer upload while the account's private Storage key is loading.
c?.auth.onAuthStateChange(()=>{++epoch;owner=null;reset();Promise.resolve().then(refresh)});
window.DDProfileAvatars=Object.freeze({refresh});
void refresh();
})();
