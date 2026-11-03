/* Disclosure Desk: preview-only case discussions. Registered comments publish immediately; flagged comments require review. */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const URL=cfg.url||'',KEY=cfg.publishableKey||'';
let db=null, current=null, expanded=false,loadedComments=[];
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function client(){if(db)return db;if(!window.supabase||!URL||!KEY||cfg.environment!=='test')return null;db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return db;}
function announce(t){const el=document.querySelector('#ddCaseDiscussionStatus');if(el)el.textContent=t;}
function ownProfileButton(){
 const b=document.createElement('button');b.type='button';b.className='outline';b.textContent='👤 My Comments';b.style.margin='8px';
 const account=document.getElementById('ddCloudAccount')||document.getElementById('cases')||document.body;
 account.append(b);return b;
}
function displayDate(s){try{return new Date(s).toLocaleDateString()}catch{return ''}}
async function load(){
 const c=client();if(!c||!current)return;
 const list=document.querySelector('#ddCaseDiscussionList');
 list.textContent='Loading comments…';
 const {data,error}=await c.from('dd_case_comments').select('id,case_id,author_id,parent_id,body,status,created_at').eq('case_id',current).eq('status','approved').order('created_at',{ascending:true}).limit(100);
 if(error){list.textContent='Comments unavailable. The database migration may not have been applied.';return}
 const chosen=current;
 const aliases=await window.DDPublicProfiles?.namesFor('comment',data||[])||{};
 if(chosen!==current||!list.isConnected)return;
 loadedComments=(data||[]).map(x=>({...x,publicAlias:aliases[x.id]||null}));
 renderComments();
}
function renderComments(){
 const c=client();
 const list=document.querySelector('#ddCaseDiscussionList');
 list.textContent='';
 const toggle=document.querySelector('#ddCommentsToggle');
 toggle.textContent='Comments ('+loadedComments.length+') '+(expanded?'▲':'▼');
 toggle.setAttribute('aria-expanded',String(expanded));
 if(!loadedComments.length){list.textContent='No comments yet. Be the first to contribute.';return}
 const visible=expanded?loadedComments:loadedComments.slice(-2);
 for(const item of visible){
   const card=document.createElement('article');card.className='card';card.id='discussion-comment-'+item.id;card.style.cssText='padding:12px;margin:8px 0';
   const header=document.createElement('div');header.className='muted small';header.textContent=(item.publicAlias||'Community member')+' · '+displayDate(item.created_at);
   const body=document.createElement('p');body.textContent=item.body;body.style.whiteSpace='pre-wrap';
   const flag=document.createElement('button');flag.className='outline';flag.type='button';flag.textContent='⚑ Flag';flag.style.fontSize='12px';
   flag.onclick=async()=>{
     const {data:{user}}=await c.auth.getUser();
     if(!user){announce('Sign in to report a comment.');return}
     const reason=window.prompt('Reason: privacy, abuse, spam, harmful, copyright, other','spam');
     if(!reason)return;
     if(!['privacy','abuse','spam','harmful','copyright','other'].includes(reason.trim().toLowerCase())){announce('Please select a listed reason.');return}
     const {error}=await c.from('dd_case_comment_flags').insert({comment_id:item.id,reporter_id:user.id,reason:reason.trim().toLowerCase()});
     announce(error?'Flag could not be submitted, or you have already flagged this comment.':'Flag received for moderator review.');
   };
   card.append(header,body,flag);window.DDCommunityVotes?.mount(card,'comment',item.id);list.append(card);
 }
}
function init(){
 const profileButton=ownProfileButton();
 const root=document.createElement('div');
 root.id='ddCaseDiscussionDialog';
 root.hidden=true;
 root.style.cssText='position:fixed;inset:0;z-index:100100;background:#050b13ed;overflow-y:auto;padding:14px';
 root.innerHTML='<section role="dialog" aria-modal="true" aria-label="Case discussion" style="max-width:700px;margin:auto;background:#112131;border:1px solid #9e875d;border-radius:14px;padding:18px;color:#f4ead9"><button type="button" id="ddCaseDiscussionClose" class="outline" style="float:right">✕ Close</button><h2>Case Discussion</h2><p class="muted small">Comments are community contributions, not verified evidence. Comments appear immediately. Flag inappropriate content for moderation.</p><button id="ddCommentsToggle" type="button" class="outline" aria-expanded="false" aria-controls="ddCaseDiscussionList" style="display:block;margin:12px 0">Comments ▼</button><div id="ddCaseDiscussionList" aria-live="polite"></div><form id="ddCaseDiscussionForm"><label for="ddCaseDiscussionBody">Add a comment (registered users)</label><textarea id="ddCaseDiscussionBody" minlength="3" maxlength="2000" required rows="4" style="width:100%;margin:10px 0" placeholder="Ask a question or share a source reference. Never post personal details."></textarea><button type="submit">Post comment</button></form><p id="ddCaseDiscussionStatus" role="status" class="muted small"></p></section>';
 document.body.append(root);
 const profile=document.createElement('section');profile.hidden=true;profile.style.cssText='position:fixed;inset:0;z-index:100110;background:#06101bee;overflow:auto;padding:16px;color:#f5ead9';
 const profileBox=document.createElement('div');profileBox.style.cssText='max-width:680px;margin:auto;background:#102331;border:1px solid #99805b;border-radius:14px;padding:18px';
 const profileClose=document.createElement('button');profileClose.type='button';profileClose.textContent='✕ Close';profileClose.onclick=()=>profile.hidden=true;
 const profileTitle=document.createElement('h2');profileTitle.textContent='My Profile · My Comments';
 const profileList=document.createElement('div');profileBox.append(profileClose,profileTitle,profileList);profile.append(profileBox);document.body.append(profile);
 profileButton.onclick=async()=>{
   profile.hidden=false;profileList.textContent='Loading your comments…';
   const c=client();if(!c){profileList.textContent='Account service unavailable.';return}
   const {data:{user}}=await c.auth.getUser();if(!user){profileList.textContent='Sign in to view your comments.';return}
   const {data,error}=await c.from('dd_case_comments').select('id,case_id,body,status,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(100);
   profileList.replaceChildren();
   if(error){profileList.textContent='Comments unavailable until the database migration is active.';return}
   if(!data?.length){profileList.textContent='You have not posted any comments yet.';return}
   for(const item of data){
     const row=document.createElement('button');row.type='button';row.className='outline';
     row.style.cssText='display:block;width:100%;margin:9px 0;padding:12px;text-align:left;white-space:normal';
     const label=item.case_id.startsWith('video:')?'Video':item.case_id.startsWith('news:')?'News':'Case';
     row.textContent=label+' · '+item.status+' · '+displayDate(item.created_at)+'\\n'+item.body.slice(0,200);
     row.onclick=()=>{
       profile.hidden=true;
       if(item.status!=='approved'){profileList.textContent='This comment is unavailable to the public.';return}
       window.ddGoToDiscussionOrigin?.(item.case_id);
       window.ddOpenCaseDiscussion?.(item.case_id,label+' Discussion',item.id);
     };
     profileList.append(row);
   }
 };

 document.querySelector('#ddCommentsToggle').onclick=()=>{expanded=!expanded;renderComments()};
 document.querySelector('#ddCaseDiscussionClose').onclick=()=>{root.hidden=true;document.body.style.overflow='';current=null};
 root.addEventListener('click',e=>{if(e.target===root)document.querySelector('#ddCaseDiscussionClose').click()});
 window.ddOpenCaseDiscussion=(id,title='Case Discussion',focusComment=null)=>{
   if(!id)return;
   current=String(id).slice(0,180);expanded=false;loadedComments=[];
   const heading=root.querySelector('h2');if(heading)heading.textContent=title;
   root.hidden=false;document.body.style.overflow='hidden';
   announce('');load().then(()=>{if(focusComment){expanded=true;renderComments();const item=document.getElementById('discussion-comment-'+focusComment);item?.scrollIntoView({block:'center',behavior:'smooth'});if(item)item.style.outline='2px solid #e2bc74';}});
 };
 document.addEventListener('click',e=>{
   const button=e.target.closest('[data-case-discussion]');
   if(button)window.ddOpenCaseDiscussion(button.dataset.caseDiscussion);
 });
 document.querySelector('#ddCaseDiscussionForm').onsubmit=async e=>{
   e.preventDefault();const c=client();if(!c){announce('Sign-in service unavailable.');return}
   const {data:{user},error:authError}=await c.auth.getUser();
   if(authError||!user){announce('Please sign in using your Disclosure Desk account first.');return}
   const body=document.querySelector('#ddCaseDiscussionBody').value.trim();
   if(body.length<3||body.length>2000){announce('Comments must contain 3–2000 characters.');return}
   const button=e.target.querySelector('button[type=submit]');button.disabled=true;
   const {error}=await c.from('dd_case_comments').insert({case_id:current,author_id:user.id,body,status:'approved'});
   announce(error?'Unable to submit comment. Please try again.':'Comment posted.');
   if(!error){e.target.reset();await load();}
   button.disabled=false;
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
