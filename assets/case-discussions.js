/* Disclosure Desk: preview-only case discussions. Comments require approved status. */
(()=>{
'use strict';
const URL='https://omqxizswzcwgzqaczlhe.supabase.co';
const KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
let db=null, current=null;
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function client(){if(db)return db;if(!window.supabase)return null;db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return db;}
function announce(t){const el=document.querySelector('#ddCaseDiscussionStatus');if(el)el.textContent=t;}
function displayDate(s){try{return new Date(s).toLocaleDateString()}catch{return ''}}
async function load(){
 const c=client();if(!c||!current)return;
 const list=document.querySelector('#ddCaseDiscussionList');
 list.textContent='Loading comments…';
 const {data,error}=await c.from('dd_case_comments').select('id,case_id,author_id,parent_id,body,status,created_at').eq('case_id',current).eq('status','approved').order('created_at',{ascending:true}).limit(100);
 if(error){list.textContent='Comments unavailable. The database migration may not have been applied.';return}
 list.textContent='';
 if(!data?.length)list.textContent='No approved comments yet. Be the first to contribute.';
 for(const item of data||[]){
   const card=document.createElement('article');card.className='card';card.style.cssText='padding:12px;margin:8px 0';
   const header=document.createElement('div');header.className='muted small';header.textContent='Community member · '+displayDate(item.created_at);
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
   card.append(header,body,flag);list.append(card);
 }
}
function init(){
 const root=document.createElement('div');
 root.id='ddCaseDiscussionDialog';
 root.hidden=true;
 root.style.cssText='position:fixed;inset:0;z-index:100100;background:#050b13ed;overflow-y:auto;padding:14px';
 root.innerHTML='<section role="dialog" aria-modal="true" aria-label="Case discussion" style="max-width:700px;margin:auto;background:#112131;border:1px solid #9e875d;border-radius:14px;padding:18px;color:#f4ead9"><button type="button" id="ddCaseDiscussionClose" class="outline" style="float:right">✕ Close</button><h2>Case Discussion</h2><p class="muted small">Comments are community contributions, not verified evidence. New comments require moderator approval.</p><div id="ddCaseDiscussionList" aria-live="polite"></div><form id="ddCaseDiscussionForm"><label for="ddCaseDiscussionBody">Add a comment (registered users)</label><textarea id="ddCaseDiscussionBody" minlength="3" maxlength="2000" required rows="4" style="width:100%;margin:10px 0" placeholder="Ask a question or share a source reference. Never post personal details."></textarea><button type="submit">Submit for review</button></form><p id="ddCaseDiscussionStatus" role="status" class="muted small"></p></section>';
 document.body.append(root);
 document.querySelector('#ddCaseDiscussionClose').onclick=()=>{root.hidden=true;document.body.style.overflow='';current=null};
 root.addEventListener('click',e=>{if(e.target===root)document.querySelector('#ddCaseDiscussionClose').click()});
 document.addEventListener('click',e=>{
   const button=e.target.closest('[data-case-discussion]');
   if(!button)return;
   current=button.dataset.caseDiscussion;
   root.hidden=false;document.body.style.overflow='hidden';
   announce('');load();
 });
 document.querySelector('#ddCaseDiscussionForm').onsubmit=async e=>{
   e.preventDefault();const c=client();if(!c){announce('Sign-in service unavailable.');return}
   const {data:{user},error:authError}=await c.auth.getUser();
   if(authError||!user){announce('Please sign in using your Disclosure Desk account first.');return}
   const body=document.querySelector('#ddCaseDiscussionBody').value.trim();
   if(body.length<3||body.length>2000){announce('Comments must contain 3–2000 characters.');return}
   const button=e.target.querySelector('button[type=submit]');button.disabled=true;
   const {error}=await c.from('dd_case_comments').insert({case_id:current,author_id:user.id,body,status:'pending'});
   announce(error?'Unable to submit comment. Please try again.':'Submitted for moderation. Your comment is not publicly visible yet.');
   if(!error)e.target.reset();
   button.disabled=false;
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
