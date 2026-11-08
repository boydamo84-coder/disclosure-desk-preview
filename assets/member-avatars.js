/* Visible public-name member avatars, backed by a private Storage bucket.
 * A server RLS policy checks the author's Hide setting on each download.
 * Keys are random and never expose the corresponding auth user UUID.
 */
(()=>{'use strict';
const flags=window.DD_COMMUNITY_FEATURES||{},cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
if(flags.profileAvatars!==true||!['test','production'].includes(cfg.environment)||!cfg.url||!cfg.publishableKey)return;
const BUCKET='dd-profile-avatars',nameOK=/^[A-Za-z][A-Za-z0-9_]{2,23}$/,
 keyOK=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const inflight=new Map(),activeDecorations=new WeakMap();let db=null,generation=0;
const client=()=>window.supabase?(db||(db=window.supabase.createClient(cfg.url,cfg.publishableKey,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}))):null;
function keyName(name){return String(name).replace(/[^A-Za-z0-9]/g,'').toLowerCase()}
function load(name){
 const key=keyName(name);
 if(inflight.has(key))return inflight.get(key);
 const p=(async()=>{
  const c=client();if(!c)return null;
  const lookup=await c.rpc('dd_avatar_public_keys',{p_usernames:[name]});
  if(lookup.error)return null;
  const row=(lookup.data||[]).find(r=>r.name_key===key&&keyOK.test(String(r.public_key||'')));
  if(!row)return null;
  const file=await c.storage.from(BUCKET).download(row.public_key+'/avatar.webp');
  return file.error?null:file.data;
 })().catch(()=>null).finally(()=>{if(inflight.get(key)===p)inflight.delete(key);});
 inflight.set(key,p);return p;
}
async function decorate(el,name){
 if(!el||typeof el!=='object')return;
 const ticket={generation};
 activeDecorations.set(el,ticket);
 if(!nameOK.test(String(name||'')))return;
 const blob=await load(name);
 if(!blob||el.isConnected===false||activeDecorations.get(el)!==ticket||ticket.generation!==generation)return;
 let url;
 try{
  url=URL.createObjectURL(blob);
  if(el.isConnected===false||activeDecorations.get(el)!==ticket||ticket.generation!==generation){
   URL.revokeObjectURL(url);return;
  }
  const img=document.createElement('img');img.alt='';img.setAttribute('aria-hidden','true');
  img.onload=()=>URL.revokeObjectURL(url);
  img.onerror=()=>{URL.revokeObjectURL(url);img.remove?.()};
  el.replaceChildren(img);img.src=url;
 }catch(_){if(url)URL.revokeObjectURL(url)}
}
window.DDMemberAvatars=Object.freeze({decorate,clearCache(){generation++;inflight.clear()}});
})();
