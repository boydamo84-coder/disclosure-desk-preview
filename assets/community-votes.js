/* Disclosure Desk public like/dislike counters for comments and witness reports.
 * One registered account vote per item, enforced by database RPC, not JavaScript.
 * Voter identities are not public. No third-party analytics.
 */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=window.DD_COMMUNITY_FEATURES?.voting===true&&['test','production'].includes(cfg.environment);
const key=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
let db=null;
const client=()=>db||(db=enabled&&window.supabase?.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const waiting=new Map();
let timer=null;
function apply(w,result){
 if(!w?.isConnected)return;
 w.dataset.myVote=String(Number(result?.my_vote||0));
 const like=w.querySelector('[data-vote-value="1"]');
 const dislike=w.querySelector('[data-vote-value="-1"]');
 const n1=Number(result?.likes||0),n2=Number(result?.dislikes||0);
 like.textContent='▲ '+Math.max(0,n1);
 dislike.textContent='▼ '+Math.max(0,n2);
 like.setAttribute('aria-pressed',String(w.dataset.myVote==='1'));
 dislike.setAttribute('aria-pressed',String(w.dataset.myVote==='-1'));
 w.querySelector('.dd-vote-status').textContent='';
}
async function flush(){
 const lists=new Map(waiting);waiting.clear();timer=null;
 const c=client();if(!c)return;
 for(const [kind,group] of lists){
  const ids=[...group.keys()];
  if(!ids.length)continue;
  const {data,error}=await c.rpc('dd_vote_summary',{p_kind:kind,p_ids:ids});
  for(const [id,containers] of group){
   for(const widget of containers){
    if(!widget.isConnected)continue;
    if(error){
     widget.querySelector('.dd-vote-status').textContent='Voting unavailable';
     widget.querySelectorAll('button').forEach(b=>b.disabled=true);
    }else apply(widget,(data||[]).find(row=>row.target_id===id)||{likes:0,dislikes:0,my_vote:0});
   }
  }
 }
}
function fetchSummary(widget,kind,id){
 if(!waiting.has(kind))waiting.set(kind,new Map());
 const map=waiting.get(kind);
 if(!map.has(id))map.set(id,[]);
 map.get(id).push(widget);
 if(timer===null)timer=setTimeout(()=>void flush(),100);
}
function mount(host,kind,id){
 if(!enabled||!host||!['comment','witness'].includes(kind)||!key.test(String(id||'')))return;
 if(host.querySelector('[data-vote-item="'+String(id)+'"]'))return;
 const widget=make('div','dd-community-votes');
 widget.dataset.voteItem=id;
 widget.dataset.myVote='0';
 widget.setAttribute('role','group');
 widget.setAttribute('aria-label','Community upvote and downvote buttons');
 const buttons=[1,-1].map(value=>{
  const btn=make('button','dd-community-vote-button',value===1?'▲ …':'▼ …');
  btn.type='button';
  btn.dataset.voteValue=String(value);
  btn.setAttribute('aria-label',value===1?'Upvote this '+kind:'Downvote this '+kind);
  btn.setAttribute('aria-pressed','false');
  btn.addEventListener('click',async()=>{
   const c=client();if(!c)return;
   const {data:{user},error:authError}=await c.auth.getUser();
   if(authError||!user||user.is_anonymous){
    widget.querySelector('.dd-vote-status').textContent='Sign in to vote. Open My Account under Boards.';
    return;
   }
   const next=widget.dataset.myVote===String(value)?0:value;
   buttons.forEach(b=>b.disabled=true);
   widget.querySelector('.dd-vote-status').textContent='Saving vote…';
   try{
    const {data,error}=await c.rpc('dd_vote_set',{p_kind:kind,p_id:id,p_value:next});
    if(error)throw error;
    apply(widget,Array.isArray(data)?data[0]:data);
   }catch(err){
    widget.querySelector('.dd-vote-status').textContent='Vote not saved. '+String(err.message||'Try again.');
   }finally{buttons.forEach(b=>b.disabled=false)}
  });
  return btn;
 });
 const status=make('span','dd-vote-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 widget.append(...buttons,status);
 host.append(widget);
 fetchSummary(widget,kind,id);
}
// Shared presentation for ALL public comment cards (News, Cases, Videos, Hearings).
// The actual report handler stays with its host; voting stays in mount()/RPC.
// Like the Discussions cards: flag in the header, votes in a dark bottom rail.
function threadedComments(items){
 const source=Array.isArray(items)?items:[];
 const lookup=new Map(source.filter(x=>key.test(String(x?.id||''))).map(x=>[String(x.id),x]));
 const children=new Map(),roots=[];
 for(const item of source){
  const parent=lookup.get(String(item?.parent_id||''));
  if(parent&&parent!==item){
   if(!children.has(String(parent.id)))children.set(String(parent.id),[]);
   children.get(String(parent.id)).push(item);
  }else roots.push(item);
 }
 const out=[],seen=new Set();
 const visit=(item,depth)=>{
  const id=String(item.id||'');if(seen.has(id))return;seen.add(id);
  const parent=lookup.get(String(item.parent_id||''));
  out.push({...item,replyDepth:Math.min(depth,4),replyParentName:parent?.publicAlias||null});
  for(const child of children.get(id)||[])visit(child,depth+1);
 };
 for(const item of roots)visit(item,0);
 for(const item of source)if(!seen.has(String(item.id||'')))visit(item,0);
 return out;
}
function mountCommentCard(card,header,body,flag,id,onReply){
 if(!card||!header||!body||!flag)return false;
 const content=make('div','dd-comment-main');
 const rail=make('div','dd-comment-action-rail');
 card.classList.add('dd-comment-card');
 header.classList.add('dd-comment-head');
 body.classList.add('dd-comment-body');
 flag.classList.remove('outline');
 flag.classList.add('dd-comment-flag');
 flag.setAttribute('aria-label',flag.disabled?'You cannot report your own comment':'Report this comment');
 flag.setAttribute('title',flag.disabled?'You cannot report your own comment':'Report this comment');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');
 svg.setAttribute('aria-hidden','true');
 svg.setAttribute('class','dd-comment-flag-icon');
 const shape=document.createElementNS('http://www.w3.org/2000/svg','path');
 shape.setAttribute('d','M4 22V5 M4 5c4-3 7 3 11 0s5-2 5-2v12c-4-3-6 3-10 0s-6-1-6-1');
 svg.append(shape);
 flag.replaceChildren(svg);
 header.append(flag);
 content.append(header,body);
 card.replaceChildren(content,rail);
 mount(rail,'comment',id);
 if(typeof onReply==='function'){
  const reply=make('button','dd-comment-reply-button','↳ Reply');
  reply.type='button';reply.setAttribute('aria-label','Reply to this comment');
  reply.addEventListener('click',()=>onReply(id));
  rail.append(reply);
 }
 return true;
}
window.DDCommunityVotes=Object.freeze({mount,mountCommentCard,threadedComments});
})();
