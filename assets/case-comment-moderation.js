/* Moderator queue. Access is enforced by Supabase RPC, not by hiding the button. */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const URL=cfg.url||'',KEY=cfg.publishableKey||'';
const db=()=>cfg.environment==='test'&&URL&&KEY?window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
async function init(){
 const client=db();if(!client)return;
 const trigger=el('button','🛡 Community review');
 trigger.type='button';trigger.className='outline';trigger.style.cssText='display:none;margin:8px';
 const root=el('section');root.hidden=true;root.style.cssText='position:fixed;inset:0;z-index:100200;background:#06101bf4;overflow-y:auto;padding:16px;color:#f5e9cb';
 const panel=el('div');panel.style.cssText='max-width:720px;margin:auto;padding:18px;background:#112331;border:1px solid #987b4f;border-radius:12px';
 const title=el('h2','Community-hidden comments · Review');
 const status=el('p','');status.setAttribute('role','status');
 const rows=el('div');
 const close=el('button','Close');close.type='button';close.onclick=()=>root.hidden=true;
 panel.append(close,title,status,rows);root.append(panel);document.body.append(root);
 const anchor=document.querySelector('#ddCloudAccount')||document.querySelector('#cases')||document.body;
 anchor.append(trigger);
 async function refresh(){
  rows.replaceChildren();status.textContent='Loading flagged comments…';
  const {data,error}=await client.rpc('dd_case_comment_moderation_queue');
  if(error){status.textContent='Moderation queue unavailable or access denied.';return}
  status.textContent=data.length?data.length+' community-hidden comments to review':'No community-hidden comments need review.';
  for(const item of data){
   const card=el('article');card.style.cssText='border-top:1px solid #526171;padding:14px 0';
   const heading=el('strong',item.case_id+' · '+item.flag_count+' flags · '+item.status);
   const body=el('p',item.body);body.style.whiteSpace='pre-wrap';
   card.append(heading,body);
   for(const [label,next] of [['Restore','approved'],['Keep hidden','hidden'],['Reject','rejected']]){
    const action=el('button',label);action.type='button';action.style.margin='4px';
    action.onclick=async()=>{action.disabled=true;const {error}=await client.rpc('dd_moderate_case_comment',{p_id:item.comment_id,p_status:next});if(error){status.textContent='Action failed: '+error.message;action.disabled=false;}else await refresh();};
    card.append(action);
   }
   rows.append(card);
  }
 }
 trigger.onclick=()=>{root.hidden=false;refresh()};
 async function check(){
  const {data:{user}}=await client.auth.getUser();
  if(!user){trigger.style.display='none';return}
  // A gated server check: unauthorised users never receive queue data.
  const {error}=await client.rpc('dd_case_comment_moderation_queue');
  trigger.style.display=error?'none':'inline-block';
 }
 client.auth.onAuthStateChange(()=>{setTimeout(check,0)});
 check();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();