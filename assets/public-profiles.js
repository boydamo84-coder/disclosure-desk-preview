/* Disclosure Desk pseudonymous community names: private until explicit opt-in.
 * Uses the existing owner-only dd_public_names table. No public direct SELECT.
 * Preview is gated by community-test-config; production changes separately.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=cfg.environment==='test'&&!!cfg.url&&!!cfg.publishableKey;
const VALID=/^[A-Za-z][A-Za-z0-9_]{2,23}$/;
const RESERVED=/(admin|moderator|support|official|verified|staff|disclosuredesk|boyddigitalstudios|uapdisclosuredesk)/i;
const idOk=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
let db=null,sessionId=null,revision=0,host=null,input=null,optIn=null,status=null;
const client=()=>enabled&&window.supabase?(db||(db=window.supabase.createClient(cfg.url,cfg.publishableKey,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
}))):null;
const mk=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
function say(message,error=false){if(status){status.textContent=message;status.dataset.error=error?'yes':'no';}}
async function namesFor(kind,items){
 const out=Object.create(null),c=client();
 if(!c||!['comment','chat'].includes(kind)||!Array.isArray(items))return out;
 const ids=[...new Set(items.map(x=>String(x?.id||'')).filter(id=>idOk.test(id)))].slice(0,100);
 if(!ids.length)return out;
 try{
  const {data,error}=await c.rpc('dd_public_aliases',{p_kind:kind,p_ids:ids});
  if(error)return out;
  for(const row of data||[]){
   const name=String(row.display_name||'');
   if(ids.includes(row.content_id)&&VALID.test(name)&&!RESERVED.test(name))out[row.content_id]=name;
  }
 }catch(_){}
 return out;
}
async function refresh(){
 if(!host)return;
 const c=client();
 const marker=++revision;
 if(!c){host.hidden=true;return;}
 const {data,error}=await c.auth.getUser();
 if(marker!==revision)return;
 const user=!error&&data?.user&&!data.user.is_anonymous?data.user:null;
 sessionId=user?.id||null;
 host.hidden=!user;
 if(!user){input.value='';optIn.checked=false;return;}
 say('Loading private username…');
 const {data:row,error:readError}=await c.from('dd_public_names')
  .select('display_name,is_public').eq('user_id',user.id).maybeSingle();
 if(marker!==revision||sessionId!==user.id)return;
 if(readError){input.value='';optIn.checked=false;say('Username settings are not active in this beta yet. No account data changed.',true);return;}
 input.value=row?.display_name||String(user.user_metadata?.dd_requested_username||'').slice(0,24);
 optIn.checked=row?.is_public===true;
 say(row?'Username loaded. You can update it or change public visibility.':'Choose a username. Public display is off until you opt in.');
}
async function save(ev){
 ev.preventDefault();
 if(!enabled)return;
 const c=client(),name=input.value.trim(),publicName=optIn.checked;
 if(!c)return;
 if(!VALID.test(name)||RESERVED.test(name)){
  say('Use 3–24 characters: start with a letter, then letters, numbers or underscores. No official/staff impersonation.',true);return;
 }
 const button=host.querySelector('button[type="submit"]');
 button.disabled=true;say('Saving username…');
 try{
  const {data,error}=await c.auth.getUser();
  if(error||!data?.user||data.user.is_anonymous)throw Error('Sign in with a registered account first.');
  const user=data.user;
  // Existing table already enforces owner-only INSERT/UPDATE and unique name_key.
  const {error:writeError}=await c.from('dd_public_names').upsert({
   user_id:user.id,display_name:name,is_public:publicName,updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
  if(writeError)throw writeError;
  say(publicName?'Saved. Your username can appear beside approved public comments and chat messages.'
    :'Saved privately. Your name will not appear publicly.');
 }catch(e){
  say(/unique|duplicate/i.test(String(e.message||''))?'That username is already taken. Please choose another.'
   :'Username could not be saved. '+String(e.message||'Please try again.').slice(0,130),true);
 }finally{button.disabled=false;}
}
function init(){
 const root=document.getElementById('ddProfileUsername')||document.getElementById('ddCloudAccount');if(!root)return;
 host=mk('section','dd-public-profile-panel');
 host.hidden=true;host.style.cssText='margin:13px 0;padding:13px;border:1px solid #685d49;background:#132838;border-radius:11px';
 const title=mk('h4','', 'Public username · Community');
 title.style.cssText='margin:0 0 6px;color:#e5c890';
 const help=mk('p','muted small','Your account email stays private. Your username appears on approved comments and LIVE chat only if you choose to make it public.');
 const form=mk('form');form.id='ddPublicProfileForm';
 const label=mk('label','muted small','My username (3–24 characters)');label.htmlFor='ddPublicProfileName';
 input=mk('input','field');input.id='ddPublicProfileName';input.maxLength=24;input.minLength=3;
 input.autocomplete='off';input.placeholder='e.g. SkyResearcher';input.required=true;input.pattern='[A-Za-z][A-Za-z0-9_]{2,23}';
 const line=mk('label','muted small');line.style.cssText='display:flex;gap:8px;align-items:flex-start;margin:9px 0';
 optIn=mk('input');optIn.type='checkbox';optIn.id='ddPublicProfileOptIn';
 line.append(optIn,mk('span','','Show my username publicly next to my approved comments and LIVE chat messages.'));
 const submit=mk('button','outline','Save username & visibility');submit.type='submit';
 status=mk('p','muted small','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(label,input,line,submit,status);form.addEventListener('submit',save);
 host.append(title,help,form);
 (root.id==='ddProfileUsername'?root:root.querySelector('.card-body'))?.append(host);
 const c=client();if(!c)return;
 c.auth.onAuthStateChange(()=>{Promise.resolve().then(refresh)});
 void refresh();
}
window.DDPublicProfiles=Object.freeze({namesFor});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
