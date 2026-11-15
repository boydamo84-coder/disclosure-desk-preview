'use strict';
/* Hosted R3 only. A verified Supabase account owns one encrypted cloud slot.
 * Browser encrypts BEFORE upload. Never sends notebook plaintext or passphrase.
 * The server's row-level security is the authoritative access boundary.
 * Offline Termux ZIP deliberately does not load this module.
 */
(()=>{
 const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
 const allowed=!!cfg.url&&!!cfg.publishableKey&&
  ['production','test'].includes(cfg.environment)&&
  /^(?:www\.)?uapdisclosuredesk\.com$|^uap-disclosure-desk\.netlify\.app$|^deploy-preview-[0-9]+--uap-disclosure-desk\.netlify\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
 const client=allowed&&window.supabase?.createClient?
  window.supabase.createClient(cfg.url,cfg.publishableKey,{
   auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  }):null;
 const TABLE='dd_r3_private_notebooks';
 const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const HEX=/^[0-9a-f]{32}$/;
 let initial=null,initialized=false,identityVersion=0;
 const failure=text=>{throw new Error(text)};
 function validUser(user){
  return user&&!user.is_anonymous&&UUID.test(String(user.id||''))?user:null;
 }
 async function fetchVerifiedUser(){
  if(!client)return null;
  const {data,error}=await client.auth.getUser();
  if(error)failure('Account verification unavailable; cloud access paused');
  return validUser(data?.user);
 }
 const ready=(async()=>{
  const owner=await fetchVerifiedUser();
  initial=owner?{id:owner.id,email:String(owner.email||'').slice(0,200)}:null;
  initialized=true;
  if(client)client.auth.onAuthStateChange((event,session)=>{
   if(!initialized||['INITIAL_SESSION','TOKEN_REFRESHED'].includes(event))return;
   const next=validUser(session?.user)?.id||null;
   if(next!==(initial?.id||null)){
    ++identityVersion;
    // A change of account MUST remove the old decrypted notebook and key.
    // Reload before showing the new owner's local vault and cloud controls.
    location.reload();
   }
  });
  return initial;
 })();
 async function owner(){
  await ready;
  if(!initial||!client)failure('Sign in to Disclosure Desk to use encrypted cloud backups');
  const expected=initial.id,version=identityVersion;
  const actual=await fetchVerifiedUser();
  if(!actual||actual.id!==expected||identityVersion!==version)
   failure('Your sign-in has changed; reload before accessing cloud backups');
  return expected;
 }
 function validate(envelope){
  if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    envelope.format!=='dd-r3-private-aes256gcm-v1'||
    envelope.cipher!=='AES-256-GCM'||
    !HEX.test(envelope.generation||'')||
    JSON.stringify(envelope).length>1900000)
   failure('Only a supported encrypted R3 notebook can enter cloud storage');
  return envelope;
 }
 async function get(){
  const id=await owner();
  const {data,error}=await client.from(TABLE)
   .select('generation,encrypted_envelope,updated_at').eq('owner_user_id',id).maybeSingle();
  if(error)failure('Could not read your encrypted cloud backup: '+error.message);
  if(data){
   validate(data.encrypted_envelope);
   if(data.encrypted_envelope.generation!==data.generation)
    failure('Cloud backup version mismatch; nothing was changed');
  }
  return data||null;
 }
 async function save(encryptedText,expectedCloudGeneration){
  const id=await owner();
  if(typeof encryptedText!=='string'||encryptedText.length>1900000)
   failure('Encrypted notebook exceeds the cloud backup limit');
  let envelope;
  try{envelope=JSON.parse(encryptedText)}catch{failure('Invalid encrypted notebook backup')}
  validate(envelope);
  if(expectedCloudGeneration===null){
   const {data,error}=await client.from(TABLE)
    .insert({owner_user_id:id,encrypted_envelope:envelope,generation:envelope.generation})
    .select('generation').maybeSingle();
   if(error||!data)failure('A cloud backup already exists, or cloud storage is unavailable. Nothing was overwritten.');
  }else{
   if(!HEX.test(expectedCloudGeneration))failure('Cloud backup version must be verified first');
   const {data,error}=await client.from(TABLE)
    .update({encrypted_envelope:envelope,generation:envelope.generation,updated_at:new Date().toISOString()})
    .eq('owner_user_id',id).eq('generation',expectedCloudGeneration)
    .select('generation').maybeSingle();
   if(error)failure('Cloud update failed: '+error.message);
   if(!data)failure('Cloud backup changed in another session. Nothing was overwritten.');
  }
  await owner();
  return envelope.generation;
 }
 async function remove(expectedCloudGeneration){
  const id=await owner();
  if(!HEX.test(expectedCloudGeneration))failure('No verified cloud backup to delete');
  const {data,error}=await client.from(TABLE).delete()
   .eq('owner_user_id',id).eq('generation',expectedCloudGeneration)
   .select('generation').maybeSingle();
  if(error)failure('Cloud deletion failed: '+error.message);
  if(!data)failure('Cloud backup changed; nothing was deleted');
  await owner();
  return true;
 }
 Object.defineProperty(window,'DDR3Cloud',{
  value:Object.freeze({ready:()=>ready,readEncrypted:get,saveEncrypted:save,deleteEncrypted:remove}),
  configurable:false,writable:false
 });
})();
