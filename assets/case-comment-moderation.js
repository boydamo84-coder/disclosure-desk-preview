/* Disclosure Desk beta moderator review: hidden comments AND witness reports.
 * One to four ordinary flags do not fill this queue. Backend RPCs enforce
 * moderation allowlist independently of the visibility of this UI.
 */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const db=()=>cfg.environment==='test'&&cfg.url&&cfg.publishableKey
 ?window.supabase?.createClient(cfg.url,cfg.publishableKey,{auth:{
    persistSession:true,autoRefreshToken:true,detectSessionInUrl:true
  }}):null;
function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
async function init(){
 const client=db();if(!client)return;
 const trigger=el('button','🛡 Community review');trigger.type='button';
 trigger.className='outline';trigger.style.cssText='display:none;margin:8px';
 const root=el('section');root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 root.setAttribute('aria-label','Community moderator review');
 root.style.cssText='position:fixed;inset:0;z-index:100200;background:#06101bf4;overflow-y:auto;padding:16px;color:#f5e9cb';
 const panel=el('div');panel.style.cssText='max-width:720px;margin:auto;padding:18px;background:#112331;border:1px solid #987b4f;border-radius:12px';
 const title=el('h2','Community review · Hidden content');
 const intro=el('p','Only content hidden after five distinct member flags (or by a moderator) appears here. Urgent safety or privacy reports need direct attention.');
 intro.className='muted small';
 const status=el('p','');status.setAttribute('role','status');
 const commentsTitle=el('h3','Hidden comments');
 const commentRows=el('div');
 const reportsTitle=el('h3','Hidden witness reports');
 const reportRows=el('div');
 const close=el('button','Close');close.type='button';close.onclick=()=>root.hidden=true;
 panel.append(close,title,intro,status,commentsTitle,commentRows,reportsTitle,reportRows);
 root.append(panel);document.body.append(root);
 const anchor=document.querySelector('#ddCloudAccount')||document.querySelector('#cases')||document.body;
 anchor.append(trigger);
 function reviewCard(headingText,bodyText){
  const card=el('article');card.style.cssText='border-top:1px solid #526171;padding:14px 0';
  const heading=el('strong',headingText);
  const body=el('p',bodyText);body.style.whiteSpace='pre-wrap';
  card.append(heading,body);
  return card;
 }
 function actionButton(card,label,rpc,args){
  const action=el('button',label);action.type='button';action.style.margin='4px';
  action.onclick=async()=>{
   if(label==='Remove'&&!window.confirm('Remove this witness report from public view?'))return;
   action.disabled=true;
   const {error}=await client.rpc(rpc,args);
   if(error){status.textContent='Review action failed: '+String(error.message||'Try again.');action.disabled=false;}
   else await refresh();
  };
  card.append(action);
 }
 async function refresh(){
  status.textContent='Loading hidden content…';
  commentRows.replaceChildren();reportRows.replaceChildren();
  const [comments,reports]=await Promise.all([
   client.rpc('dd_case_comment_moderation_queue'),
   client.rpc('dd_witness_moderation_queue')
  ]);
  if(comments.error){
   status.textContent='Comment moderation unavailable or access denied.';
   return;
  }
  for(const item of comments.data||[]){
   const card=reviewCard(item.case_id+' · '+item.flag_count+' flags · '+item.status,item.body);
   actionButton(card,'Restore','dd_moderate_case_comment',{p_id:item.comment_id,p_status:'approved'});
   actionButton(card,'Keep hidden','dd_moderate_case_comment',{p_id:item.comment_id,p_status:'hidden'});
   actionButton(card,'Reject','dd_moderate_case_comment',{p_id:item.comment_id,p_status:'rejected'});
   commentRows.append(card);
  }
  if(!(comments.data||[]).length)commentRows.textContent='No hidden comments to review.';
  if(reports.error){
   reportRows.textContent='Witness review will activate with the reviewed witness database migration.';
   status.textContent=(comments.data||[]).length+' hidden comments; witness review not enabled.';
   return;
  }
  for(const item of reports.data||[]){
   const card=reviewCard(item.category+' · '+item.city+', '+item.country+
     ' · '+item.flag_count+' flags · '+item.status,item.story);
   actionButton(card,'Restore','dd_moderate_witness',{p_id:item.report_id,p_action:'published'});
   actionButton(card,'Keep hidden','dd_moderate_witness',{p_id:item.report_id,p_action:'hidden'});
   actionButton(card,'Remove','dd_moderate_witness',{p_id:item.report_id,p_action:'removed'});
   reportRows.append(card);
  }
  if(!(reports.data||[]).length)reportRows.textContent='No hidden witness reports to review.';
  status.textContent=(comments.data||[]).length+' hidden comments · '+
    (reports.data||[]).length+' hidden witness reports.';
 }
 trigger.onclick=()=>{root.hidden=false;void refresh()};
 async function check(){
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user||user.is_anonymous){trigger.style.display='none';return}
  // No unguarded queue reads. Server allows only designated moderators.
  const result=await client.rpc('dd_case_comment_moderation_queue');
  trigger.style.display=result.error?'none':'inline-block';
 }
 client.auth.onAuthStateChange(()=>{setTimeout(()=>void check(),0)});
 void check();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
