/* Disclosure Desk: preview-only case discussions. Registered comments publish immediately; flagged comments require review. */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const URL=cfg.url||'',KEY=cfg.publishableKey||'';
let db=null, current=null, expanded=false,loadedComments=[],loadRevision=0,dialogRevision=0,replyTo=null;
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function client(){if(db)return db;if(!window.supabase||!URL||!KEY||!['test','production'].includes(cfg.environment))return null;db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return db;}
function announce(t){const el=document.querySelector('#ddCaseDiscussionStatus');if(el)el.textContent=t;}
function ownProfileButton(){
 const b=document.createElement('button');b.type='button';b.className='outline';b.textContent='👤 My Comments';b.style.margin='8px';
 const account=document.getElementById('ddCloudAccount')||document.getElementById('cases')||document.body;
 account.append(b);return b;
}
function displayDate(s){try{return new Date(s).toLocaleDateString()}catch{return ''}}
async function load(){
 const c=client();if(!c||!current)return false;
 const chosen=current,revision=++loadRevision;
 const list=document.querySelector('#ddCaseDiscussionList');
 if(!list)return false;
 const composer=document.getElementById('ddCaseDiscussionForm');
 if(composer&&list.contains(composer))document.getElementById('ddCommentsToggle')?.after(composer);
 list.textContent='Loading comments…';
 const {data,error}=await c.rpc('dd_public_comments',{p_case_id:chosen,p_limit:100});
 // Never show a response for a case that has since been switched, closed or refreshed.
 if(revision!==loadRevision||chosen!==current||!list.isConnected)return false;
 if(error){list.textContent='Comments unavailable. Please try again.';return false}
 const aliases=await window.DDPublicProfiles?.namesFor('comment',data||[])||{};
 if(revision!==loadRevision||chosen!==current||!list.isConnected)return false;
 loadedComments=(data||[]).map(x=>({...x,publicAlias:aliases[x.id]||null}));
 renderComments();
 return true;
}
function chooseReply(item){
 replyTo=item&&item.id?{id:item.id,alias:item.publicAlias||'this commenter'}:null;
 const form=document.getElementById('ddCaseDiscussionForm'),input=document.getElementById('ddCaseDiscussionBody');
 if(form){
  const anchor=replyTo&&item?.id?document.getElementById('discussion-comment-'+item.id):document.getElementById('ddCommentsToggle');
  anchor?.after(form);form.hidden=false;
 }
 const submit=form?.querySelector('button[type="submit"]');if(submit)submit.textContent=replyTo?'Post reply':'Post comment';
 let context=document.getElementById('ddCaseReplyContext');
 if(!context&&form){context=document.createElement('p');context.id='ddCaseReplyContext';context.className='dd-comment-reply-context';form.prepend(context)}
 if(context)context.textContent=replyTo?'Replying to '+replyTo.alias+' · your reply will appear beneath this comment.':'Commenting on '+String(document.querySelector('#ddCaseDiscussionDialog h2')?.textContent||'this discussion');
 if(input){input.placeholder=replyTo?'Write your reply…':'Ask a question or share a source reference.';input.focus({preventScroll:true})}
}
function renderComments(){
 const c=client();
 const list=document.querySelector('#ddCaseDiscussionList');
 const form=document.getElementById('ddCaseDiscussionForm');
 if(form&&list.contains(form))document.getElementById('ddCommentsToggle')?.after(form);
 list.textContent='';
 const toggle=document.querySelector('#ddCommentsToggle');
 toggle.textContent='Comments ('+loadedComments.length+') '+(expanded?'▲':'▼');
 toggle.setAttribute('aria-expanded',String(expanded));
 if(!loadedComments.length){list.textContent='No comments yet. Be the first to contribute.';return}
 const all=window.DDCommunityVotes?.threadedComments?.(loadedComments)||loadedComments;
 const visible=expanded?all:all.slice(-2);
 for(const item of visible){
   const card=document.createElement('article');card.className='card';card.id='discussion-comment-'+item.id;card.style.cssText='margin:8px 0';
   if(item.replyDepth>0)card.classList.add('dd-comment-nested');
   const alias=item.publicAlias||'Community member';
   const header=document.createElement('div');header.className='muted small';
   header.style.cssText='display:flex;align-items:center;min-width:0';
   const avatar=document.createElement('span');avatar.className='dd-forum-avatar';
   avatar.textContent=item.publicAlias?alias.charAt(0).toUpperCase():'?';
   avatar.setAttribute('aria-hidden','true');
   const byline=document.createElement('span');byline.textContent=alias+' · '+displayDate(item.created_at);
   header.append(avatar,byline);
   if(item.replyParentName){const parent=document.createElement('small');parent.className='dd-comment-parent-label';parent.textContent='↳ to '+item.replyParentName;header.append(parent)}
   if(item.publicAlias)window.DDMemberAvatars?.decorate?.(avatar,item.publicAlias);
   const body=document.createElement('p');body.textContent=item.body;body.style.whiteSpace='pre-wrap';
   const flag=document.createElement('button');flag.className='outline';flag.type='button';flag.textContent='⚑ Flag';flag.style.fontSize='12px';
   if(item.is_mine){flag.disabled=true;flag.title='You cannot flag your own comment'}
   flag.onclick=async()=>{
     const {data:{user}}=await c.auth.getUser();
     if(!user||user.is_anonymous){announce('Sign in with a registered account to flag comments.');return}
     if(item.is_mine){announce('You cannot flag your own comment.');return}
     const reason=window.prompt('Reason: privacy, abuse, spam, harmful, copyright, other','spam');
     if(!reason)return;
     if(!['privacy','abuse','spam','harmful','copyright','other'].includes(reason.trim().toLowerCase())){announce('Please select a listed reason.');return}
     const {error}=await c.from('dd_case_comment_flags').insert({comment_id:item.id,reporter_id:user.id,reason:reason.trim().toLowerCase()});
     const issue=String(error?.message||'');
     announce(!error?'Flag recorded. Five distinct account flags will hide this comment for review.'
       :/own comment/i.test(issue)?'You cannot flag your own comment.'
       :/unique|duplicate/i.test(issue)?'You already flagged this comment.'
       :/flagging limit/i.test(issue)?'Flagging limit reached. Please try again later.'
       :'Flag could not be submitted. Please try again.');
     if(!error)void load();
   };
   if(!window.DDCommunityVotes?.mountCommentCard?.(card,header,body,flag,item.id,()=>{
     expanded=true;renderComments();chooseReply(item);
   },{discussionKey:current,title:'Comment on '+String(document.querySelector('#ddCaseDiscussionDialog h2')?.textContent||'Case discussion').slice(0,80)})){
    card.append(header,body,flag);window.DDCommunityVotes?.mount(card,'comment',item.id);
   }
   list.append(card);
 }
 window.DDRefreshBoardStars?.();
 if(replyTo&&form&&!form.hidden){const target=document.getElementById('discussion-comment-'+replyTo.id);if(target)target.after(form)}
}
function init(){
 const profileButton=ownProfileButton();
 const root=document.createElement('div');
 root.id='ddCaseDiscussionDialog';
 root.hidden=true;
 root.style.cssText='position:fixed;inset:0;z-index:100100;background:#050b13ed;overflow-y:auto;padding:14px';
 root.innerHTML='<section role="dialog" aria-modal="true" aria-label="Case discussion" style="max-width:700px;margin:auto;background:#112131;border:1px solid #9e875d;border-radius:14px;padding:18px;color:#f4ead9"><button type="button" id="ddCaseDiscussionClose" class="outline" style="float:right">✕ Close</button><h2>Case Discussion</h2><p class="muted small">Comments are community contributions, not verified evidence. Comments appear immediately. Flag inappropriate content for moderation.</p><button id="ddCommentsToggle" type="button" class="outline" aria-expanded="false" aria-controls="ddCaseDiscussionList" style="display:block;margin:12px 0">Comments ▼</button><div id="ddCaseDiscussionList" aria-live="polite"></div><form id="ddCaseDiscussionForm"><label for="ddCaseDiscussionBody">Add a comment (registered users)</label><textarea id="ddCaseDiscussionBody" minlength="3" maxlength="2000" required rows="4" style="width:100%;margin:10px 0" placeholder="Ask a question or share a source reference. Never post personal details."></textarea><button type="submit">Post comment</button></form><p id="ddCaseDiscussionStatus" role="status" class="muted small"></p></section>';
 document.body.append(root);
 const composer=document.getElementById('ddCaseDiscussionForm');
 const toggleNode=document.getElementById('ddCommentsToggle');
 if(composer&&toggleNode){toggleNode.after(composer);composer.hidden=true;}
 const profile=document.createElement('section');profile.hidden=true;profile.style.cssText='position:fixed;inset:0;z-index:100110;background:#06101bee;overflow:auto;padding:16px;color:#f5ead9';
 const profileBox=document.createElement('div');profileBox.style.cssText='max-width:680px;margin:auto;background:#102331;border:1px solid #99805b;border-radius:14px;padding:18px';
 const profileClose=document.createElement('button');profileClose.type='button';profileClose.textContent='✕ Close';profileClose.onclick=()=>profile.hidden=true;
 const profileTitle=document.createElement('h2');profileTitle.textContent='My Profile · My Comments';
 const profileList=document.createElement('div');profileBox.append(profileClose,profileTitle,profileList);profile.append(profileBox);document.body.append(profile);
 profileButton.onclick=async()=>{
   profile.hidden=false;profileList.textContent='Loading your comments…';
   const c=client();if(!c){profileList.textContent='Account service unavailable.';return}
   const {data:{user}}=await c.auth.getUser();if(!user){profileList.textContent='Sign in to view your comments.';return}
   const {data,error}=await c.rpc('dd_my_comments',{p_limit:100});
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

 document.querySelector('#ddCommentsToggle').onclick=()=>{
  replyTo=null;expanded=!expanded;
  const composer=document.getElementById('ddCaseDiscussionForm');
  if(composer)composer.hidden=!expanded;
  renderComments();
  if(expanded){const input=document.getElementById('ddCaseDiscussionBody');if(input){input.focus({preventScroll:true})}}
 };
 document.querySelector('#ddCaseDiscussionClose').onclick=()=>{++dialogRevision;++loadRevision;root.hidden=true;document.body.style.overflow='';current=null;loadedComments=[];replyTo=null};
 root.addEventListener('click',e=>{if(e.target===root)document.querySelector('#ddCaseDiscussionClose').click()});
 window.ddOpenCaseDiscussion=(id,title='Case Discussion',focusComment=null)=>{
   if(!id)return;
   ++dialogRevision;current=String(id).slice(0,180);expanded=false;loadedComments=[];replyTo=null;
   const composer=document.getElementById('ddCaseDiscussionForm');if(composer)composer.hidden=true;
   const opened=dialogRevision,chosen=current;
   const heading=root.querySelector('h2');if(heading)heading.textContent=title;
   root.hidden=false;document.body.style.overflow='hidden';
   announce('');void load().then(success=>{if(!success||opened!==dialogRevision||chosen!==current||root.hidden)return;
     if(focusComment){expanded=true;renderComments();const item=document.getElementById('discussion-comment-'+focusComment);item?.scrollIntoView({block:'center',behavior:'smooth'});if(item)item.style.outline='2px solid #e2bc74';}});
 };
 // Public deep links produced by the shared Board/Share bar open the exact
 // parent discussion and optionally highlight the selected approved comment.
 try{
  const params=new URLSearchParams(location.search),deep=params.get('dd_discussion');
  const focus=params.get('dd_comment');
  if(deep&&deep.length<=180&&/^(news|video|archive|case|hearing):/.test(deep)
   &&(!focus||/^[0-9a-f-]{36}$/i.test(focus))){
   window.ddOpenCaseDiscussion(deep,'Community discussion',focus);
  }
 }catch(_){}
 document.addEventListener('click',e=>{
   const button=e.target.closest('[data-case-discussion]');
   if(button)window.ddOpenCaseDiscussion(button.dataset.caseDiscussion);
 });
 document.querySelector('#ddCaseDiscussionForm').onsubmit=async e=>{
   e.preventDefault();const c=client();if(!c){announce('Sign-in service unavailable.');return}
   const chosen=current,revision=dialogRevision;
   if(!chosen||root.hidden)return;
   const body=document.querySelector('#ddCaseDiscussionBody').value.trim();
   if(body.length<3||body.length>2000){announce('Comments must contain 3–2000 characters.');return}
   const button=e.target.querySelector('button[type=submit]');button.disabled=true;
   try{
     const {data,error:authError}=await c.auth.getUser();
     if(revision!==dialogRevision||chosen!==current||root.hidden)return;
     const user=data?.user;
     if(authError||!user||user.is_anonymous){announce('Please sign in with a registered Disclosure Desk account first.');return}
     const parent=replyTo;
     const {error}=await c.from('dd_case_comments').insert({case_id:chosen,author_id:user.id,parent_id:parent?.id||null,body,status:'approved'});
     if(revision!==dialogRevision||chosen!==current||root.hidden)return;
     const issue=String(error?.message||'');
     announce(!error?(parent?'Reply posted.':'Comment posted.')
      :/duplicate comment/i.test(issue)?'You have already posted this comment.'
      :/limit reached/i.test(issue)?'Posting limit reached. Please try again later.'
      :'Unable to submit comment. Please try again.');
     if(!error){e.target.reset();replyTo=null;await load();}
   }finally{button.disabled=false}
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
