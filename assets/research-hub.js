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
function guest(){
 userId=null; $('ddProfileGuest').hidden=false;$('ddProfilePrivate').hidden=true;
 $('ddProfileEmail').textContent='';
 for(const id of ['ddProfileFilesList','ddProfileBoardsList','ddProfileCommentsList','ddProfileWitnessList'])$(id).replaceChildren();
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
  c.rpc('dd_is_comment_moderator')
 ]);
 if(n!==nonce||userId!==user.id)return;
 let failed=0;
 const success=i=>results[i].status==='fulfilled'&&!results[i].value.error?results[i].value:null;
 const docs=success(0),boards=success(1),comments=success(2),reports=success(3),alias=success(4),moderator=success(5);
 $('ddProfileDisplayName').textContent=alias?.data?.display_name||initialName||'Researcher';
 if(docs){
  $('ddProfileFilesCount').textContent=String(docs.count??docs.data?.length??0);
  $('ddProfileFilesList').replaceChildren();
  if(!docs.data?.length)empty('ddProfileFilesList','No cloud-saved documents yet.');
  for(const d of docs.data||[])entry('ddProfileFilesList',d.title||'Untitled research','Saved '+formattedDate(d.updated_at)+' · Browse in W.NE',()=>visit('researchStudio'));
 }else{failed++;empty('ddProfileFilesList','Private document list unavailable. Local files are unchanged.')}
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
   const label=item.case_id.startsWith('video:')?'Video':item.case_id.startsWith('archive:')?'Archive':item.case_id.startsWith('news:')?'News':item.case_id.startsWith('media:')?'Watch & Read':'Case';
   const where=item.case_id;
   entry('ddProfileCommentsList',item.body.slice(0,125),label+' · '+item.status+' · '+formattedDate(item.created_at),
    item.status==='approved'?()=>{window.ddGoToDiscussionOrigin?.(where);window.ddOpenCaseDiscussion?.(where,label+' comments',item.id)}:null);
  }
 }else{failed++;empty('ddProfileCommentsList','Private comment history unavailable.')}
 if(reports){
  $('ddProfileWitnessCount').textContent=String(reports.count??reports.data?.length??0);
  $('ddProfileWitnessList').replaceChildren();
  if(!reports.data?.length)empty('ddProfileWitnessList','No witness reports submitted yet.');
  for(const r of reports.data||[])entry('ddProfileWitnessList',r.category+' · '+r.city+', '+r.country,
   r.status+' · Event '+formattedDate(r.event_date),()=>visit('witness'));
 }else{failed++;empty('ddProfileWitnessList','Your witness report history is unavailable.')}
 $('ddProfileStatus').textContent=failed?failed+' private section(s) temporarily unavailable. No data was modified.':'Research Hub updated from your private account.';
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