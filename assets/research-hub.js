/* Disclosure Desk My Research Hub. Existing Auth and owner-only RLS data.
 * Administrative UI never grants privileges: protected DB functions do.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=['test','production'].includes(cfg.environment)&&!!cfg.url&&!!cfg.publishableKey;
let db=null,nonce=0,userId=null;
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
 userId=null; $('ddProfileGuest').hidden=false;$('ddProfilePrivate').hidden=true;
 $('ddProfileEmail').textContent='';
 for(const id of ['ddProfileFilesList','ddProfileTrashList','ddProfileBoardsList','ddProfileCommentsList','ddProfileWitnessList'])$(id).replaceChildren();
 actionNotice='';
 for(const id of ['ddProfileFilesCount','ddProfileBoardsCount','ddProfileWitnessCount'])$(id).textContent='—';
 $('ddProfileAdmin').hidden=true;
 $('ddProfileNewPassword').value='';$('ddProfileConfirmPassword').value='';
}
function signIn(){
 visit('boards');
 $('ddCloudAccount')?.scrollIntoView({block:'start',behavior:'smooth'});
 $('ddCloudEmail')?.focus({preventScroll:true});
}
async function refresh(){
 if($('profilePage')?.classList.contains('hidden'))return;
 const n=++nonce,c=client();if(!c){guest();return}
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
 $('ddProfileAdmin').hidden=true;
 const results=await Promise.allSettled([
  c.from('research_documents').select('id,title,updated_at',{count:'exact'}).order('updated_at',{ascending:false}).limit(8),
  c.from('investigation_boards').select('id,name,updated_at',{count:'exact'}).order('updated_at',{ascending:false}).limit(8),
  c.rpc('dd_my_comments',{p_limit:25}),
  c.from('dd_witness_reports').select('id,category,event_date,city,country,status,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(10),
  c.from('dd_public_names').select('display_name').eq('user_id',user.id).maybeSingle(),
  c.rpc('dd_is_comment_moderator'),
  c.from('research_document_trash').select('id,title,trashed_at',{count:'exact'}).order('trashed_at',{ascending:false}).limit(15)
 ]);
 if(n!==nonce||userId!==user.id)return;
 let failed=0;
 const success=i=>results[i].status==='fulfilled'&&!results[i].value.error?results[i].value:null;
 const docs=success(0),boards=success(1),comments=success(2),reports=success(3),alias=success(4),moderator=success(5),trash=success(6);
 $('ddProfileDisplayName').textContent=alias?.data?.display_name||initialName||'Researcher';
 if(docs){
  $('ddProfileFilesCount').textContent=String(docs.count??docs.data?.length??0);
  $('ddProfileFilesList').replaceChildren();
  if(!docs.data?.length)empty('ddProfileFilesList','No cloud-saved documents yet.');
  for(const d of docs.data||[]){
   const row=managedEntry('ddProfileFilesList',d.title||'Untitled research','Saved '+formattedDate(d.updated_at)+' · Cloud copy');
   if(!row)continue;
   addAction(row,'Open Studio',()=>visit('researchStudio'));
   addAction(row,'Move to trash',(button,status)=>{
    if(!confirm('Move this cloud document to Recently deleted? You can restore it later. Downloaded and device-only copies are not affected.'))return;
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
   addAction(row,'Delete forever',(button,status)=>{
    if(prompt('This permanently removes the trashed cloud document and cannot be undone. Type DELETE to confirm:')!=='DELETE')return;
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
   addAction(row,'Delete',(button,status)=>{
    if(!confirm('Permanently delete this comment? This cannot be undone and may remove its votes.'))return;
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
   addAction(row,'Delete report',(button,status)=>{
    if(!confirm('Permanently remove this witness report from Disclosure Desk, including its public map marker? This cannot be undone and does NOT reset the three-per-day report limit.'))return;
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
 $('ddProfileRegister').onclick=()=>{signIn();$('ddSignupUsername')?.focus({preventScroll:true})};
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
 const c=client();if(c)c.auth.onAuthStateChange(()=>{setTimeout(()=>void refresh(),0)});
 void refresh();
}
window.DDResearchHub=Object.freeze({refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();