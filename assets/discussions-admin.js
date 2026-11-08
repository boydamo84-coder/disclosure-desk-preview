/* Discussions overall-administrator review.
 * Source-staged only: feature is disabled until protected server owner allowlist,
 * independent audit/security QA and coordinated release. No steward is an owner. */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{},flags=window.DD_COMMUNITY_FEATURES||{};
const enabled=flags.discussions===true&&['test','production'].includes(cfg.environment);
if(!enabled)return; // Cannot call owner-only RPCs or reveal Admin tools while disabled.
const $=id=>document.getElementById(id),node=(tag,text,cls)=>{
 const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el};
let db=null,active=false;
const client=()=>db||(db=window.supabase?.createClient(cfg.url,cfg.publishableKey,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
function say(message){const n=$('ddAdminForumStatus');if(n)n.textContent=String(message).slice(0,240)}
async function registered(){
 const c=client();if(!c)throw Error('Account service unavailable');
 const {data,error}=await c.auth.getUser();
 if(error||!data?.user||data.user.is_anonymous)throw Error('Sign in with your authorised site-owner account.');
 return c;
}
async function rpc(c,name,args){const {data,error}=await c.rpc(name,args||{});
 if(error)throw Error('Site-owner review unavailable. '+String(error.message||'').slice(0,100));
 return data}
function action(parent,label,fn){
 const button=node('button',label,'outline');button.type='button';
 button.onclick=()=>{void fn(button)};parent.append(button);return button;
}
async function moderated(button,fn){
 button.disabled=true;say('Checking site-owner authorisation…');
 try{
  const c=await registered();const ok=await fn(c);
  if(ok!==true)throw Error('The item was not changed. Please reload the moderation queue.');
  await load();
 }catch(e){say(e?.message||'Review action denied.')}
 finally{button.disabled=false}
}
async function load(){
 if(active)return;
 const root=$('ddAdminDiscussions');if(!root||!root.open)return;
 active=true;say('Checking owner-only review queue…');
 const queue=$('ddAdminForumQueue'),sections=$('ddAdminForumSections');
 try{
  const c=await registered();
  // These RPCs separately verify dd_forum_owner_admins, not public or section steward status.
  const [items,groups]=await Promise.all([
   rpc(c,'dd_discussions_owner_queue',{p_limit:50}),
   rpc(c,'dd_discussions_owner_sections',{p_limit:100})
  ]);
  queue.replaceChildren();sections.replaceChildren();
  if(!items?.length)queue.append(node('p','No hidden or escalated topics awaiting review.','muted small'));
  for(const item of items||[]){
   const card=node('article',undefined,'dd-forum-item');
   const heading=node('strong',(item.section_title||'Section')+' · '+item.target_kind,'');
   const summary=node('p',(item.flag_count||0)+' flags · '+(item.escalation_count||0)+' steward escalations','muted small');
   const excerpt=node('p',String(item.content_preview||'').slice(0,600),'dd-forum-body');
   card.append(heading,summary,excerpt);
   if(item.latest_escalation_reason)card.append(node('p','Escalated concern: '+String(item.latest_escalation_reason).slice(0,500),'muted small'));
   const actions=node('div',undefined,'dd-forum-actions');
   for(const [label,status] of [['Restore','published'],['Hide pending review','hidden'],['Remove','removed']]){
    action(actions,label,async button=>{
     const explanation=prompt('Enter the reason for this overall-admin decision (minimum 8 characters):');
     if(!explanation||explanation.trim().length<8)return;
     if(status==='removed'&&!confirm('Permanently remove this item from public discussions? The moderation audit remains.'))return;
     await moderated(button,c=>rpc(c,'dd_discussions_owner_review',{
      p_kind:item.target_kind,p_id:item.target_id,p_status:status,p_reason:explanation.trim().slice(0,500)
     }));
    });
   }
   card.append(actions);queue.append(card);
  }
  if(!groups?.length)sections.append(node('p','No sections have been created.','muted small'));
  for(const s of groups||[]){
   const card=node('article',undefined,'dd-forum-item');
   card.append(node('strong',s.title||'Untitled section'));
   card.append(node('p',s.has_steward?'Steward appointed: '+(s.steward_name||'Name private'):'No current steward','muted small'));
   action(card,'Remove entire section',async button=>{
    const explanation=prompt('Site owner: reason for removing this section (minimum 8 characters):');
    if(!explanation||explanation.trim().length<8)return;
    if(!confirm('ADMIN ONLY: Remove this section and hide all its public posts and replies? This is reversible through owner review, not physical data deletion.'))return;
    await moderated(button,c=>rpc(c,'dd_discussions_owner_review',{
     p_kind:'section',p_id:s.section_id,p_status:'removed',p_reason:explanation.trim().slice(0,500)
    }));
   });
   action(card,'Restore section',async button=>{
    const explanation=prompt('Site owner: reason for restoring this section (minimum 8 characters):');
    if(!explanation||explanation.trim().length<8)return;
    await moderated(button,c=>rpc(c,'dd_discussions_owner_review',{
     p_kind:'section',p_id:s.section_id,p_status:'published',p_reason:explanation.trim().slice(0,500)
    }));
   });
   if(s.has_steward)action(card,'Revoke steward role',async button=>{
    const explanation=prompt('Reason for removing this section steward (minimum 8 characters):');
    if(!explanation||explanation.trim().length<8)return;
    if(!confirm('Remove the steward role from this section? The section and everyone’s posts stay intact.'))return;
    await moderated(button,c=>rpc(c,'dd_discussions_owner_set_steward',{
     p_section_id:s.section_id,p_steward_id:null,p_reason:explanation.trim().slice(0,500)
    }));
   });
   sections.append(card);
  }
  say('Overall-administrator queue loaded. Stewardship never grants access here.');
 }catch(e){
  queue.replaceChildren();sections.replaceChildren();
  say(e?.message||'Only the authorised site owner can open this queue.');
 }finally{active=false}
}
function init(){
 const root=$('ddAdminDiscussions');if(!root)return;
 root.hidden=false;
 root.addEventListener('toggle',()=>{if(root.open)void load()});
 $('ddAdminForumRefresh').onclick=()=>{void load()};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();