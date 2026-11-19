/* Disclosure Desk My Research Hub. Existing Auth and owner-only RLS data.
 * Administrative UI never grants privileges: protected DB functions do.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=['test','production'].includes(cfg.environment)&&!!cfg.url&&!!cfg.publishableKey;
let db=null,nonce=0,userId=null,reactionNonce=0,lastReactionLoad=0;
const $=id=>document.getElementById(id);
const client=()=>enabled&&window.supabase?(db||(db=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}))):null;
function visit(page){document.querySelector('.tab[data-tab="'+page+'"]')?.click()}
function formattedDate(v){if(!v)return 'Date unavailable';const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleDateString():'Date unavailable'}
function empty(target,label){const p=$(target);if(!p)return;p.replaceChildren();const txt=document.createElement('p');txt.className='dd-profile-empty';txt.textContent=label;p.append(txt)}
function entry(target,title,caption,fn){
 const container=$(target);if(!container)return;
 const b=document.createElement('button');b.className='dd-profile-entry';b.type='button';
 const heading=document.createElement('strong');heading.textContent=String(title||'Untitled').slice(0,180);
 const small=document.createElement('small');small.textContent=String(caption||'').slice(0,240);
 b.append(heading,small);if(fn)b.onclick=fn;else {b.disabled=true;b.setAttribute('aria-disabled','true')}
 container.append(b);
}

/* Managed rows use the same authenticated Supabase account; all writes have
 * independent owner checks in existing DB policies/RPCs. No private IDs displayed. */
let actionNotice='';
function managedEntry(target,title,caption){
 const list=$(target);if(!list)return null;
 const root=document.createElement('div');root.className='dd-profile-entry dd-profile-managed-entry';
 const heading=document.createElement('strong');heading.textContent=String(title||'Untitled').slice(0,180);
 const small=document.createElement('small');small.textContent=String(caption||'').slice(0,240);
 const actions=document.createElement('div');actions.className='dd-profile-actions';
 const status=document.createElement('p');status.className='muted small dd-profile-entry-status';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 root.append(heading,small,actions,status);list.append(root);
 return {root,actions,status};
}
function addAction(row,title,callback){
 const button=document.createElement('button');button.type='button';button.className='outline';
 button.textContent=title;
 button.onclick=()=>{void callback(button,row.status)};
 row.actions.append(button);return button;
}
async function runOwned(ownerId,button,status,operation,message){
 const c=client();
 if(!c||userId!==ownerId){status.textContent='Please sign in again before changing private content.';return}
 button.disabled=true;status.textContent='Checking your account…';
 try{
  const {data,error}=await c.auth.getUser();
  if(error||!data?.user||data.user.is_anonymous||data.user.id!==ownerId||userId!==ownerId)
   throw Error('Your sign-in changed. Please sign in again.');
  const success=await operation(c);
  if(success!==true)throw Error('No change was made. Refresh this section and try again.');
  if(userId!==ownerId)return;
  actionNotice=message;
  await refresh();
 }catch(e){
  if(userId===ownerId)status.textContent=String(e?.message||'Could not save the change. Please retry.').slice(0,220);
 }finally{button.disabled=false}
}
function commentEdit(row,item,ownerId){
 if(row.root.querySelector('.dd-profile-edit'))return;
 const form=document.createElement('form');form.className='dd-profile-edit';
 const label=document.createElement('label');label.textContent='Edit your comment (3–2000 characters)';
 const textarea=document.createElement('textarea');textarea.className='field';textarea.rows=4;textarea.maxLength=2000;
 textarea.value=String(item.body||'');label.append(textarea);
 const controls=document.createElement('div');controls.className='dd-profile-actions';
 const save=document.createElement('button');save.className='outline';save.type='submit';save.textContent='Save edit';
 const cancel=document.createElement('button');cancel.className='outline';cancel.type='button';cancel.textContent='Cancel';
 cancel.onclick=()=>form.remove();
 controls.append(save,cancel);form.append(label,controls);row.root.append(form);textarea.focus();
 form.addEventListener('submit',event=>{
  event.preventDefault();const body=textarea.value.trim();
  if(body.length<3||body.length>2000){row.status.textContent='Comments must be 3–2000 characters.';return}
  void runOwned(ownerId,save,row.status,async c=>{
   const {data,error}=await c.rpc('dd_edit_my_comment',{p_id:item.id,p_body:body});
   if(error)throw error;
   if(data!==true)throw Error('This comment may be older than 30 minutes, flagged or unavailable for editing.');
   return true;
  },'Comment updated.');
 });
}
function guest(){
 userId=null;++reactionNonce;lastReactionLoad=0;clearReactions('Sign in to view reactions received on your content.'); $('ddProfileGuest').hidden=false;$('ddProfilePrivate').hidden=true;
 $('ddProfileEmail').textContent='';
 for(const id of ['ddProfileFilesList','ddProfileTrashList','ddProfileBoardsList','ddProfileCommentsList','ddProfileWitnessList'])$(id).replaceChildren();
 actionNotice='';
 for(const id of ['ddProfileFilesCount','ddProfileBoardsCount','ddProfileWitnessCount'])$(id).textContent='—';
 $('ddProfileAdmin').hidden=true;
 $('ddProfileNewPassword').value='';$('ddProfileConfirmPassword').value='';
}
/* M69: Profile sign-in stays on Profile. Preserve the existing Supabase
 * account/RLS and leave Boards as a separate, deliberate navigation choice. */
let profileAuthForm=null,profileAuthMode='signin',profileAuthBusy=false;
function profileAuthMessage(message,error=false){
 const status=$('ddProfileAuthStatus');
 if(status){status.textContent=message;status.dataset.state=error?'error':'info'}
}
function showProfileAuth(mode){
 const guest=$('ddProfileGuest');if(!guest||profileAuthBusy)return;
 if(!profileAuthForm){
  const form=document.createElement('form');form.id='ddProfileAuthForm';
  form.className='dd-profile-auth-form';
  form.setAttribute('aria-label','Disclosure Desk account');
  const title=document.createElement('h4');title.id='ddProfileAuthHeading';form.append(title);
  const field=(id,label,type,autocomplete)=>{
   const wrap=document.createElement('label');wrap.className='dd-profile-auth-field';
   wrap.htmlFor=id;wrap.textContent=label;
   const input=document.createElement('input');input.id=id;input.type=type;
   input.className='field';input.autocomplete=autocomplete;input.required=true;
   if(type==='password')input.minLength=8;
   wrap.append(input);form.append(wrap);return {wrap,input};
  };
  field('ddProfileAuthEmail','Email address','email','email');
  field('ddProfileAuthPassword','Password','password','current-password');
  const username=field('ddProfileAuthUsername','Public username (3–24 characters)','text','off');
  username.wrap.id='ddProfileAuthUsernameRow';
  username.input.maxLength=24;
  username.input.pattern='[A-Za-z][A-Za-z0-9_]{2,23}';
  const disclosure=document.createElement('p');disclosure.className='muted small';
  disclosure.textContent='Your username is public and Chat-discoverable by default. You can change visibility and Chat requests in Profile. Your email stays private.';
  username.wrap.append(disclosure);
  const actions=document.createElement('div');actions.className='dd-profile-auth-actions';
  const submit=document.createElement('button');submit.type='submit';submit.className='action';submit.id='ddProfileAuthSubmit';
  const reset=document.createElement('button');reset.type='button';reset.className='outline';reset.id='ddProfileAuthReset';
  reset.textContent='Reset password';actions.append(submit,reset);form.append(actions);
  const status=document.createElement('p');status.id='ddProfileAuthStatus';
  status.className='muted small';status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');form.append(status);
  form.addEventListener('submit',event=>{event.preventDefault();void submitProfileAuth()});
  reset.addEventListener('click',()=>{void resetProfileAuthPassword()});
  guest.append(form);profileAuthForm=form;
 }
 profileAuthMode=mode==='signup'?'signup':'signin';
 const signup=profileAuthMode==='signup';
 $('ddProfileAuthHeading').textContent=signup?'Create your Disclosure Desk account':'Sign in to Disclosure Desk';
 $('ddProfileAuthSubmit').textContent=signup?'Create account':'Sign in';
 $('ddProfileAuthUsernameRow').hidden=!signup;
 $('ddProfileAuthUsername').required=signup;
 $('ddProfileAuthPassword').autocomplete=signup?'new-password':'current-password';
 profileAuthForm.hidden=false;profileAuthMessage('');
 profileAuthForm.scrollIntoView?.({block:'nearest'});
 $('ddProfileAuthEmail')?.focus?.({preventScroll:true});
}
async function submitProfileAuth(){
 if(!profileAuthForm||profileAuthBusy)return;
 const c=client();if(!c){profileAuthMessage('Account service unavailable. Please try again.',true);return}
 const email=$('ddProfileAuthEmail').value.trim(),password=$('ddProfileAuthPassword').value;
 const name=$('ddProfileAuthUsername').value.trim(),signup=profileAuthMode==='signup';
 if(!email||password.length<8){profileAuthMessage('Enter your email and a password of at least eight characters.',true);return}
 if(signup&&(!/^[A-Za-z][A-Za-z0-9_]{2,23}$/.test(name)||
  /(admin|moderator|support|official|verified|staff|disclosuredesk|boyddigitalstudios|uapdisclosuredesk)/i.test(name))){
  profileAuthMessage('Use a 3–24 character public username beginning with a letter (letters, numbers and underscores only). Official and staff names are reserved.',true);return;
 }
 profileAuthBusy=true;
 const submit=$('ddProfileAuthSubmit'),reset=$('ddProfileAuthReset');
 submit.disabled=true;reset.disabled=true;profileAuthMessage(signup?'Creating account…':'Signing in…');
 try{
  const out=signup?await c.auth.signUp({email,password,options:{
   emailRedirectTo:location.origin+location.pathname+'?dd_tab=profilePage&dd_confirm=1',
   data:{dd_requested_username:name}
  }}):await c.auth.signInWithPassword({email,password});
  if(out.error)throw out.error;
  $('ddProfileAuthPassword').value='';
  if(signup&&!out.data?.session){
   profileAuthMessage('Check your confirmation email, then return to Profile to sign in.');
  }else{
   // Account state listeners update Profile and Boards. Do NOT navigate to Boards.
   void refresh();
   profileAuthMessage(signup?'Account created. You are signed in.':'Signed in successfully.');
  }
 }catch(error){
  const message=String(error?.message||'Please try again.').slice(0,160);
  profileAuthMessage(signup&&/already registered|already exists|user already registered/i.test(message)?
   'That email is already registered. Choose Sign in or Reset password.':'Account action failed: '+message,true);
 }finally{profileAuthBusy=false;submit.disabled=false;reset.disabled=false}
}
async function resetProfileAuthPassword(){
 if(!profileAuthForm||profileAuthBusy)return;
 const c=client(),email=$('ddProfileAuthEmail').value.trim();
 if(!c){profileAuthMessage('Account service unavailable.',true);return}
 if(!email){profileAuthMessage('Enter your email before requesting a password reset.',true);return}
 profileAuthBusy=true;const reset=$('ddProfileAuthReset');reset.disabled=true;
 profileAuthMessage('Requesting password reset…');
 try{
  const {error}=await c.auth.resetPasswordForEmail(email,{
   redirectTo:location.origin+location.pathname+'?dd_tab=profilePage'
  });
  if(error)throw error;
  profileAuthMessage('If an account exists, a password-reset email will be sent.');
 }catch(error){
  profileAuthMessage('Reset failed: '+String(error?.message||'Please try again.').slice(0,150),true);
 }finally{profileAuthBusy=false;reset.disabled=false}
}
function signIn(){showProfileAuth('signin')}
function register(){showProfileAuth('signup')}
/* Received votes are server-side counts of other people's active votes on this
 * member's published content. Never derive a score from visible cards or localStorage. */
function clearReactions(message='Reaction totals unavailable.'){
 for(const id of ['ddProfileLikesReceived','ddProfileDislikesReceived']){const el=$(id);if(el)el.textContent='—'}
 const note=$('ddProfileReactionBreakdown');if(note)note.textContent=message;
}
function displayReactions(data){
 const row=Array.isArray(data)?data[0]:data;
 const keys=['post_likes','post_dislikes','comment_likes','comment_dislikes'];
 const validCount=value=>(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))&&
  Number.isSafeInteger(Number(value))&&Number(value)>=0;
 if(!row||!keys.every(key=>validCount(row[key]))||
    !Number.isSafeInteger(Number(row.post_likes)+Number(row.comment_likes))||
    !Number.isSafeInteger(Number(row.post_dislikes)+Number(row.comment_dislikes))){
  clearReactions('Reaction totals are temporarily unavailable. Your votes and posts are unchanged.');
  return false;
 }
 const [postLikes,postDislikes,commentLikes,commentDislikes]=keys.map(key=>Number(row[key]));
 $('ddProfileLikesReceived').textContent=(postLikes+commentLikes).toLocaleString();
 $('ddProfileDislikesReceived').textContent=(postDislikes+commentDislikes).toLocaleString();
 $('ddProfileReactionBreakdown').textContent='Posts ▲ '+postLikes.toLocaleString()+' / ▼ '+postDislikes.toLocaleString()+
  ' · Comments ▲ '+commentLikes.toLocaleString()+' / ▼ '+commentDislikes.toLocaleString()+
  ' · Published content only; your own votes are excluded.';
 lastReactionLoad=Date.now();
 return true;
}
async function refreshReactions(){
 const c=client(),current=userId;
 if(!c||!current||document.hidden||$('profilePage')?.classList.contains('hidden')||
    Date.now()-lastReactionLoad<25000)return;
 const pageRevision=nonce,request=++reactionNonce;
 try{
  const {data:auth,error:authError}=await c.auth.getUser();
  if(authError||auth?.user?.id!==current||auth?.user?.is_anonymous){
   if(request===reactionNonce&&pageRevision===nonce&&userId===current)
    clearReactions('Sign in to view reactions received on your content.');
   return;
  }
  const {data,error}=await c.rpc('dd_profile_received_reactions');
  if(request!==reactionNonce||pageRevision!==nonce||userId!==current)return;
  if(error)throw error;
  displayReactions(data);
 }catch(_){
  if(request===reactionNonce&&pageRevision===nonce&&userId===current)
   clearReactions('Reaction totals are temporarily unavailable. Refresh to try again.');
 }
}
async function refresh(){
 if($('profilePage')?.classList.contains('hidden'))return;
 const n=++nonce,c=client(),reactionsRevision=++reactionNonce;if(!c){guest();return}
 const {data,error}=await c.auth.getUser();
 if(n!==nonce)return;
 const user=!error&&data?.user&&!data.user.is_anonymous?data.user:null;
 if(!user){guest();return}
 userId=user.id;$('ddProfileGuest').hidden=true;$('ddProfilePrivate').hidden=false;
 $('ddProfileEmail').textContent=user.email||'Registered account';
 $('ddProfileVerification').textContent=user.email_confirmed_at?'Verified account':'Email verification pending';
 const initialName=String(user.user_metadata?.dd_requested_username||'').trim();
 $('ddProfileDisplayName').textContent=initialName||'Researcher';
 $('ddProfileStatus').textContent='Loading your private activity…';
 clearReactions('Loading reactions received on your published posts and comments…');
 $('ddProfileAdmin').hidden=true;
 const results=await Promise.allSettled([
  c.from('research_documents').select('id,title,updated_at',{count:'exact'}).order('updated_at',{ascending:false}).limit(8),
  c.from('investigation_boards').select('id,name,updated_at',{count:'exact'}).order('updated_at',{ascending:false}).limit(8),
  c.rpc('dd_my_comments',{p_limit:25}),
  c.from('dd_witness_reports').select('id,category,event_date,city,country,status,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(10),
  c.from('dd_public_names').select('display_name').eq('user_id',user.id).maybeSingle(),
  c.rpc('dd_is_comment_moderator'),
  c.from('research_document_trash').select('id,title,trashed_at',{count:'exact'}).order('trashed_at',{ascending:false}).limit(15),
  c.rpc('dd_profile_received_reactions')
 ]);
 if(n!==nonce||userId!==user.id)return;
 let failed=0;
 const success=i=>results[i].status==='fulfilled'&&!results[i].value.error?results[i].value:null;
 const docs=success(0),boards=success(1),comments=success(2),reports=success(3),alias=success(4),moderator=success(5),trash=success(6),reactions=success(7);
 $('ddProfileDisplayName').textContent=alias?.data?.display_name||initialName||'Researcher';
 if(reactionsRevision===reactionNonce){
  if(reactions)displayReactions(reactions.data);
  else clearReactions('Reaction totals are temporarily unavailable. Refresh to try again.');
 }
 if(docs){
  $('ddProfileFilesCount').textContent=String(docs.count??docs.data?.length??0);
  $('ddProfileFilesList').replaceChildren();
  if(!docs.data?.length)empty('ddProfileFilesList','No cloud-saved documents yet.');
  for(const d of docs.data||[]){
   const row=managedEntry('ddProfileFilesList',d.title||'Untitled research','Saved '+formattedDate(d.updated_at)+' · Cloud copy');
   if(!row)continue;
   addAction(row,'Open Studio',()=>visit('researchStudio'));
   addAction(row,'Move to trash',async(button,status)=>{
    if(!await window.DDConfirm?.show?.({title:'Move document to trash?',message:'You can restore this cloud document later. Downloaded and device-only copies will not be affected.',confirmText:'Move to trash',danger:false}))return;
    void runOwned(user.id,button,status,async c=>{
     const {data,error}=await c.rpc('research_trash_document',{p_id:d.id});
     if(error)throw error;return data===true;
    },'Document moved to Recently deleted.');
   });
  }
 }else{failed++;empty('ddProfileFilesList','Private document list unavailable. Local files are unchanged.')}
 if(trash){
  $('ddProfileTrashList').replaceChildren();
  if(!trash.data?.length)empty('ddProfileTrashList','No recently deleted cloud documents.');
  for(const d of trash.data||[]){
   const row=managedEntry('ddProfileTrashList',d.title||'Untitled research','Trashed '+formattedDate(d.trashed_at));
   if(!row)continue;
   addAction(row,'Restore',(button,status)=>void runOwned(user.id,button,status,async c=>{
    const {data,error}=await c.rpc('research_restore_document',{p_id:d.id});
    if(error)throw error;return data===true;
   },'Cloud document restored.'));
   addAction(row,'Delete forever',async(button,status)=>{
    if(!await window.DDConfirm?.show?.({title:'Permanently delete document?',message:'This removes your trashed cloud document permanently and cannot be undone.',confirmText:'Delete forever',requiredPhrase:'DELETE'}))return;
    void runOwned(user.id,button,status,async c=>{
     const {data,error}=await c.rpc('research_purge_trashed_document',{p_id:d.id});
     if(error)throw error;return data===true;
    },'Trashed cloud document permanently deleted.');
   });
  }
 }else{failed++;empty('ddProfileTrashList','Recently deleted cloud documents are temporarily unavailable. No copies were changed.')}
 if(boards){
  $('ddProfileBoardsCount').textContent=String(boards.count??boards.data?.length??0);
  $('ddProfileBoardsList').replaceChildren();
  if(!boards.data?.length)empty('ddProfileBoardsList','No cloud Boards yet.');
  for(const b of boards.data||[])entry('ddProfileBoardsList',b.name||'Untitled Board','Updated '+formattedDate(b.updated_at),()=>visit('boards'));
 }else{failed++;empty('ddProfileBoardsList','Cloud Board list unavailable. Device Boards are unchanged.')}
 if(comments){
  $('ddProfileCommentsList').replaceChildren();
  if(!comments.data?.length)empty('ddProfileCommentsList','No comments yet.');
  for(const item of comments.data||[]){
   const where=String(item.case_id||'');
   const label=where.startsWith('video:')?'Video':where.startsWith('archive:')?'Archive':where.startsWith('news:')?'News':where.startsWith('media:')?'Watch & Read':'Case';
   const row=managedEntry('ddProfileCommentsList',String(item.body||'').slice(0,125),label+' · '+item.status+' · '+formattedDate(item.created_at));
   if(!row)continue;
   if(item.status==='approved'){
    addAction(row,'View',()=>{window.ddGoToDiscussionOrigin?.(where);window.ddOpenCaseDiscussion?.(where,label+' comments',item.id)});
    const postTime=Date.parse(item.created_at);
    if(Number.isFinite(postTime)&&Date.now()-postTime<30*60*1000&&Date.now()>=postTime)
     addAction(row,'Edit',()=>commentEdit(row,item,user.id));
   }
   addAction(row,'Delete',async(button,status)=>{
    if(!await window.DDConfirm?.show?.({title:'Delete your comment?',message:'This action cannot be undone and may remove its votes. Replies from other members may remain visible.',confirmText:'Delete comment'}))return;
    void runOwned(user.id,button,status,async c=>{
     const {data,error}=await c.rpc('dd_delete_my_comment',{p_id:item.id});
     if(error)throw error;return data===true;
    },'Your comment was deleted.');
   });
  }
 }else{failed++;empty('ddProfileCommentsList','Private comment history unavailable.')}
 if(reports){
  $('ddProfileWitnessCount').textContent=String(reports.count??reports.data?.length??0);
  $('ddProfileWitnessList').replaceChildren();
  if(!reports.data?.length)empty('ddProfileWitnessList','No witness reports submitted yet.');
  for(const r of reports.data||[]){
   const row=managedEntry('ddProfileWitnessList',r.category+' · '+r.city+', '+r.country,
    r.status+' · Event '+formattedDate(r.event_date));
   if(!row)continue;
   addAction(row,'Witness section',()=>visit('witness'));
   addAction(row,'Delete report',async(button,status)=>{
    if(!await window.DDConfirm?.show?.({title:'Delete witness report?',message:'This permanently removes the report and its public map marker. It cannot be undone and will not reset your three-per-day submission limit.',confirmText:'Delete report'}))return;
    void runOwned(user.id,button,status,async c=>{
     const {data,error}=await c.from('dd_witness_reports').delete().eq('id',r.id).eq('author_id',user.id).select('id');
     if(error)throw error;
     if(!Array.isArray(data)||data.length!==1)return false;
     try{await window.DDWitnessReports?.refresh?.()}catch(_e){/* Public map will refresh on its next poll. */}
     return true;
    },'Your witness report was removed from the public map.');
   });
  }
 }else{failed++;empty('ddProfileWitnessList','Your witness report history is unavailable.')}
 $('ddProfileStatus').textContent=(actionNotice?actionNotice+' ':'')+
  (failed?failed+' private section(s) temporarily unavailable. No data was modified.':'Research Hub updated from your private account.');
 actionNotice='';
 const isAdmin=moderator?.data===true;
 $('ddProfileAdmin').hidden=!isAdmin;
 if(isAdmin)void adminStats(c,n,user.id);
}
async function adminStats(c,n,id){
 $('ddAdminStatus').textContent='Checking hidden items…';
 const reqs=await Promise.allSettled([
  c.rpc('dd_case_comment_moderation_queue'),
  c.rpc('dd_witness_moderation_queue'),
  c.from('dd_public_witness_reports').select('id',{count:'exact',head:true}),
  c.rpc('dd_live_chat_moderation_queue')
 ]);
 if(n!==nonce||userId!==id||$('ddProfileAdmin').hidden)return;
 const value=i=>reqs[i].status==='fulfilled'&&!reqs[i].value.error?reqs[i].value:null;
 const comments=value(0),reports=value(1),published=value(2),live=value(3);
 $('ddAdminHiddenComments').textContent=comments?String(comments.data?.length??0):'—';
 $('ddAdminHiddenWitness').textContent=reports?String(reports.data?.length??0):'—';
 $('ddAdminHiddenLive').textContent=live?String(live.data?.length??0):'—';
 $('ddAdminPublicWitness').textContent=published?String(published.count??0):'—';
 $('ddAdminStatus').textContent=comments&&reports?'Only hidden items enter routine moderation. Ordinary comments publish immediately.':'Some moderation counters are unavailable. No permissions were changed.';
}
async function updatePassword(event){
 event.preventDefault();
 const c=client(),status=$('ddProfilePasswordStatus'),button=event.currentTarget.querySelector('button[type=submit]');
 const one=$('ddProfileNewPassword'),two=$('ddProfileConfirmPassword');
 if(!c||!userId){status.textContent='Sign in first.';return}
 if(one.value.length<8||one.value!==two.value){status.textContent='Use at least eight characters and enter matching passwords.';return}
 button.disabled=true;status.textContent='Updating password securely…';
 const {data,error}=await c.auth.getUser();
 if(error||!data?.user||data.user.is_anonymous||data.user.id!==userId){status.textContent='Please sign in again.';button.disabled=false;return}
 const result=await c.auth.updateUser({password:one.value});
 if(result.error)status.textContent='Password change failed: '+String(result.error.message||'Try again.').slice(0,130);
 else {status.textContent='Password updated successfully.';one.value='';two.value=''}
 button.disabled=false;
}
function init(){
 if(!$('profilePage'))return;
 $('ddProfileSignIn').onclick=signIn;
 $('ddProfileRegister').onclick=register;
 $('ddProfileRefresh').onclick=refresh;
 $('ddProfilePasswordForm').addEventListener('submit',updatePassword);
 $('ddProfileSignOut').onclick=async()=>{
  const c=client();if(!c)return;
  const b=$('ddProfileSignOut');b.disabled=true;
  const {error}=await c.auth.signOut();
  b.disabled=false;
  if(error){$('ddProfileStatus').textContent='Sign out failed. Please try again.';return}
  ++nonce;guest();
 };
 document.querySelectorAll('[data-profile-go]').forEach(b=>b.onclick=()=>visit(b.dataset.profileGo));
 const c=client();if(c)c.auth.onAuthStateChange(()=>{
  ++nonce;++reactionNonce;lastReactionLoad=0;
  clearReactions('Checking your account…');
  setTimeout(()=>void refresh(),0);
 });
 // Lightweight totals refresh only while this profile is actually visible.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshReactions()});
 window.addEventListener('focus',()=>void refreshReactions());
 setInterval(()=>void refreshReactions(),45000);
 void refresh();
}
window.DDResearchHub=Object.freeze({refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
