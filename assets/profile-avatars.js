/* Disclosure Desk profile avatars: owner-only, consent-free PRIVATE storage.
 * Disabled until reviewed Storage policies are applied and A/B QA passes.
 * Never shares avatar URLs in public comments, Discussions or Chat.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=window.DD_COMMUNITY_FEATURES?.profileAvatars===true &&
 ['test','production'].includes(cfg.environment)&&!!cfg.url&&!!cfg.publishableKey;
const BUCKET='dd-profile-avatars',MAX_INPUT=5*1024*1024,MAX_WEBP=1024*1024;
const $=id=>document.getElementById(id);
const panel=$('ddAvatarPanel');
if(!panel)return;
panel.hidden=!enabled;
if(!enabled)return;
const image=$('ddAvatarImage'),fallback=$('ddAvatarFallback'),
 file=$('ddAvatarFile'),save=$('ddAvatarSave'),remove=$('ddAvatarRemove'),
 status=$('ddAvatarStatus');
if(!image||!fallback||!file||!save||!remove||!status)return;
let db=null,owner=null,epoch=0,objectUrl=null,pending=null,operation=false;
const client=()=>window.supabase?(db||(db=window.supabase.createClient(
 cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}
))):null;
const validId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id||''));
function say(msg){status.textContent=msg;}
function buttons(){save.disabled=operation||!pending||!owner;remove.disabled=operation||!owner;}
function revoke(){
 if(objectUrl){try{URL.revokeObjectURL(objectUrl)}catch(_){}}
 objectUrl=null;
}
function reset(){
 pending=null;file.value='';revoke();image.removeAttribute('src');
 image.hidden=true;fallback.hidden=false;remove.hidden=true;buttons();
}
function show(blob){
 const next=URL.createObjectURL(blob);
 revoke();objectUrl=next;image.src=next;image.hidden=false;
 fallback.hidden=true;remove.hidden=false;buttons();
}
function pathFor(id){return id+'/avatar.webp';}
async function identity(){
 const c=client();
 if(!c)throw Error('Account service unavailable');
 const {data,error}=await c.auth.getUser();
 if(error||!data?.user||data.user.is_anonymous||!validId(data.user.id))
  throw Error('Sign in with a registered account.');
 return {c,id:data.user.id};
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
 panel.hidden=false;
 if(operation)return;
 say('Loading your private profile photo…');
 const response=await c.storage.from(BUCKET).download(pathFor(user.id));
 if(generation!==epoch||owner!==user.id)return;
 if(response.error||!response.data){
  revoke();image.removeAttribute('src');image.hidden=true;fallback.hidden=false;
  remove.hidden=true;buttons();
  say('No profile photo saved, or the private photo service is not available yet.');
  return;
 }
 show(response.data);say('Your private profile photo is ready.');
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
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Unable to process this photo.');
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
 const chosen=file.files?.[0];
 if(!chosen)return;
 const expected=owner,stamp=++epoch;
 pending=null;buttons();say('Checking and cropping your photo…');
 try{
  const blob=await convert(chosen);
  if(stamp!==epoch||owner!==expected)return;
  pending=blob;show(blob);
  say('Preview ready. Select Save photo to upload it to your private account.');
 }catch(e){
  if(stamp!==epoch)return;
  pending=null;buttons();say(String(e.message||'Unable to read photo.'));
  void refresh();
 }
});
save.addEventListener('click',async()=>{
 if(operation||!pending||!owner)return;
 const candidate=pending,expected=owner,stamp=epoch;
 operation=true;buttons();say('Saving private profile photo…');
 try{
  const {c,id}=await identity();
  if(id!==expected||stamp!==epoch)throw Error('Account changed. Reopen Profile and retry.');
  const result=await c.storage.from(BUCKET).upload(pathFor(id),candidate,{
   upsert:true,contentType:'image/webp',cacheControl:'60'
  });
  if(result.error)throw result.error;
  if(stamp===epoch&&owner===id){pending=null;file.value='';say('Profile photo saved.');}
 }catch(e){
  if(stamp===epoch)say('Photo not saved: '+String(e.message||'Try again.').slice(0,130));
 }finally{operation=false;buttons();}
});
remove.addEventListener('click',async()=>{
 if(operation||!owner)return;
 if(!confirm('Remove your account profile photo? You can upload another later.'))return;
 const expected=owner,stamp=epoch;
 operation=true;buttons();say('Removing your private profile photo…');
 try{
  const {c,id}=await identity();
  if(id!==expected||stamp!==epoch)throw Error('Account changed. Retry from Profile.');
  const result=await c.storage.from(BUCKET).remove([pathFor(id)]);
  if(result.error)throw result.error;
  if(stamp===epoch&&owner===id){reset();say('Profile photo removed.');}
 }catch(e){
  if(stamp===epoch)say('Photo could not be removed: '+String(e.message||'Try again.').slice(0,130));
 }finally{operation=false;buttons();}
});
const c=client();
c?.auth.onAuthStateChange(()=>{++epoch;owner=null;reset();Promise.resolve().then(refresh)});
window.DDProfileAvatars=Object.freeze({refresh});
void refresh();
})();
