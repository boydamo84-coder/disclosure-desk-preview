/* Research Edition beta entry: reuses Disclosure Desk Supabase Auth.
 * No guest access to authenticated editor, APIs, or real documents.
 * Remembered document IDs are scoped per verified user and checked against RLS.
 */
(()=>{'use strict';
const URL='https://omqxizswzcwgzqaczlhe.supabase.co';
const KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const $=id=>document.getElementById(id);
const VALID_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const status=text=>{$('status').textContent=text};
const ready=()=>{$('checking').hidden=true;$('entry').hidden=false};
if(!window.supabase?.createClient){
 $('checking').textContent='Sign-in service unavailable. Try again when connected.';
 return;
}
const db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
let routing=false;
async function enter(user){
 if(routing)return;routing=true;
 $('checking').hidden=false;$('checking').textContent='Opening your research…';$('entry').hidden=true;
 try{
  const remembered=localStorage.getItem('wne-research-last-document:'+user.id);
  let chosen=null;
  if(VALID_ID.test(remembered||'')){
   // The stored ID is only a hint: verify ownership via existing Supabase RLS.
   const {data,error}=await db.from('research_documents').select('id').eq('id',remembered).maybeSingle();
   if(error)throw error;
   if(data?.id===remembered)chosen=remembered;
  }
  if(!chosen){
   const {data,error}=await db.from('research_documents').select('id').order('updated_at',{ascending:false}).limit(1);
   if(error)throw error;
   chosen=data?.[0]?.id||null;
  }
  if(chosen){
   sessionStorage.setItem('wne-research-active-document',chosen);
   try{localStorage.setItem('wne-research-last-document:'+user.id,chosen)}catch{}
  }else{
   sessionStorage.removeItem('wne-research-active-document');
  }
  location.replace('./research-workspace.html'+(chosen?'?id='+encodeURIComponent(chosen):''));
 }catch(err){
  routing=false;ready();
  status('We could not open your research safely. '+(err.message||'Please retry.'));
 }
}
async function check(){
 try{
  const {data,error}=await db.auth.getUser();
  if(error && error.status!==400)throw error;
  if(data?.user)return enter(data.user);
  ready();
 }catch(e){
  ready();status('Connection issue: '+(e.message||'Please sign in again.'));
 }
}
$('auth-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const button=$('sign-in');button.disabled=true;status('Signing in…');
 try{
  const {data,error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  if(error)throw error;
  $('password').value='';
  if(!data?.user)throw Error('Sign-in was not confirmed.');
  await enter(data.user);
 }catch(e){
  status('Could not sign in: '+(e.message||'Check your details.'));
  button.disabled=false;
 }
});
$('guest').addEventListener('click',()=>{location.href='./guest-preview.html'});
check();
})();