/* Disclosure Desk public signup usernames. New signup names activate on first
 * signed-in visit, public and contactable for Chat, as clearly disclosed.
 * Existing owner profile privacy and Chat off switches are never overwritten.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=['test','production'].includes(cfg.environment)&&!!cfg.url&&!!cfg.publishableKey;
const VALID=/^[A-Za-z][A-Za-z0-9_]{2,23}$/;
const RESERVED=/(admin|moderator|support|official|verified|staff|disclosuredesk|boyddigitalstudios|uapdisclosuredesk)/i;
const idOk=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
const chatEnabled=window.DD_COMMUNITY_FEATURES?.privateChat===true;
let db=null,sessionId=null,revision=0,host=null,input=null,optIn=null,chatOptIn=null,status=null;
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
 if(!user){input.value='';optIn.checked=false;if(chatOptIn)chatOptIn.checked=false;return;}
 say('Loading private username…');
 let {data:row,error:readError}=await c.from('dd_public_names')
  .select(chatEnabled?'display_name,is_public,chat_contact_opt_in':'display_name,is_public').eq('user_id',user.id).maybeSingle();
 if(marker!==revision||sessionId!==user.id)return;
 if(readError){input.value='';optIn.checked=false;say('Username settings are unavailable. No account data changed.',true);return;}
 const requested=String(user.user_metadata?.dd_requested_username||'').trim();
 let onboardingError=null;
 // Signup explicitly discloses public usernames and incoming requests as
 // defaults. Create ONLY a missing owner row; never overwrite saved Hide/Off.
 if(!row&&VALID.test(requested)&&!RESERVED.test(requested)){
  say('Activating your public username for Chat…');
  try{
   const identity=await c.auth.getUser();
   if(identity.error||identity.data?.user?.id!==user.id||marker!==revision)return;
   const {error:insertError}=await c.from('dd_public_names').upsert({
    user_id:user.id,display_name:requested,is_public:true,
    chat_contact_opt_in:chatEnabled,updated_at:new Date().toISOString()
   },{onConflict:'user_id',ignoreDuplicates:true});
   if(insertError)throw insertError;
   const found=await c.from('dd_public_names')
    .select(chatEnabled?'display_name,is_public,chat_contact_opt_in':'display_name,is_public')
    .eq('user_id',user.id).maybeSingle();
   if(found.error||!found.data)throw (found.error||Error('Username was not saved.'));
   row=found.data;
  }catch(error){onboardingError=error;}
 }
 if(marker!==revision||sessionId!==user.id)return;
 input.value=row?.display_name||requested.slice(0,24);
 optIn.checked=row ? row.is_public===true : !!requested;
 // Preserve existing explicit Chat off and hidden username preferences.
 if(chatOptIn)chatOptIn.checked=row ? row.chat_contact_opt_in===true : true;
 if(onboardingError){
  say(/unique|duplicate/i.test(String(onboardingError.message||''))?
   'That username is already taken. Choose another below and press Save.':
   'Could not activate your username automatically. Review the name below and press Save. '+String(onboardingError.message||'').slice(0,90),true);
 }else say(row?
  'Username ready. You can change public visibility or Chat requests at any time.':
  'Choose a username and press Save to make it public.');
}
async function save(ev){
 ev.preventDefault();
 if(!enabled)return;
 const c=client(),name=input.value.trim(),publicName=optIn.checked;
 // A stale username form from account A must never save into account B.
 const expectedOwner=sessionId,expectedRevision=revision;
 if(!c||!expectedOwner||host.hidden){say('Sign in again before updating your username.',true);return;}
 if(!VALID.test(name)||RESERVED.test(name)){
  say('Use 3–24 characters: start with a letter, then letters, numbers or underscores. No official/staff impersonation.',true);return;
 }
 const button=host.querySelector('button[type="submit"]');
 button.disabled=true;say('Saving username…');
 try{
  const {data,error}=await c.auth.getUser();
  if(error||!data?.user||data.user.is_anonymous)throw Error('Sign in with a registered account first.');
  const user=data.user;
  if(user.id!==expectedOwner||sessionId!==expectedOwner||revision!==expectedRevision)
   throw Error('Your sign-in changed. Reload username settings and try again.');
  // Existing table already enforces owner-only INSERT/UPDATE and unique name_key.
  const settings={user_id:user.id,display_name:name,is_public:publicName,updated_at:new Date().toISOString()};
  if(chatEnabled)settings.chat_contact_opt_in=publicName&&chatOptIn.checked;
  const {error:writeError}=await c.from('dd_public_names').upsert(settings,{onConflict:'user_id'});
  if(writeError)throw writeError;
  if(sessionId!==expectedOwner||revision!==expectedRevision)return;
  say(publicName?'Saved. Your username can appear beside approved public comments and chat messages.'
    :'Saved privately. Your name will not appear publicly.');
 }catch(e){
  if(sessionId!==expectedOwner||revision!==expectedRevision)return;
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
 const help=mk('p','muted small','Your signup username is public and discoverable for Chat by default after sign-in. Your email stays private. To hide your username or disable incoming requests, change the switches below and Save.');
 const form=mk('form');form.id='ddPublicProfileForm';
 const label=mk('label','muted small','My username (3–24 characters)');label.htmlFor='ddPublicProfileName';
 input=mk('input','field');input.id='ddPublicProfileName';input.maxLength=24;input.minLength=3;
 input.autocomplete='off';input.placeholder='e.g. SkyResearcher';input.required=true;input.pattern='[A-Za-z][A-Za-z0-9_]{2,23}';
 const line=mk('label','muted small');line.style.cssText='display:flex;gap:8px;align-items:flex-start;margin:9px 0';
 optIn=mk('input');optIn.type='checkbox';optIn.id='ddPublicProfileOptIn';
 line.append(optIn,mk('span','','Show my username publicly next to my approved comments and LIVE chat messages.'));
 const submit=mk('button','outline','Save username & visibility');submit.type='submit';
 status=mk('p','muted small','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(label,input,line);
 if(chatEnabled){
  const chatLine=mk('label','muted small');
  chatLine.style.cssText='display:flex;gap:8px;align-items:flex-start;margin:9px 0';
  chatOptIn=mk('input');chatOptIn.type='checkbox';chatOptIn.id='ddChatContactOptIn';
  chatLine.append(chatOptIn,mk('span','','Allow registered members to request a one-to-one private chat when your username is public. On by default for new profiles; you can turn requests off at any time. No conversation opens until you accept a request.'));
  form.append(chatLine);
 }
 form.append(submit,status);form.addEventListener('submit',save);
 host.append(title,help,form);
 (root.id==='ddProfileUsername'?root:root.querySelector('.card-body'))?.append(host);
 const c=client();if(!c)return;
 c.auth.onAuthStateChange(()=>{Promise.resolve().then(refresh)});
 void refresh();
}
window.DDPublicProfiles=Object.freeze({namesFor});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
