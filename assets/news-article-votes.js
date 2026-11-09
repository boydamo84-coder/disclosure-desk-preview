/* M34: saved News-article ▲/▼ voting. Different from comment votes.
 * Article identity hashes the SAME stable article key as its comments.
 * Counts never pretend to be saved when the read-only RPC is unavailable.
 */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=window.DD_COMMUNITY_FEATURES?.voting===true&&['test','production'].includes(cfg.environment);
let db=null;
const client=()=>db||(db=enabled&&window.supabase?.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
const pending=new Map(),mounted=new WeakSet();
let requestTimer=null;
const make=(tag,cls,label)=>{const el=document.createElement(tag);el.className=cls;if(label!==undefined)el.textContent=label;return el};
const asNumber=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
async function hashStory(raw){
 if(typeof raw!=='string'||!raw.startsWith('news:')||raw.length<6||raw.length>180||!globalThis.crypto?.subtle)throw Error('Article identity unavailable');
 const bytes=new TextEncoder().encode(raw);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function display(item,data){
 if(!item?.isConnected)return;
 const up=item.querySelector('[data-news-vote="1"]');
 const down=item.querySelector('[data-news-vote="-1"]');
 if(!data||!up||!down)return;
 item.dataset.currentVote=String(Number(data.my_vote||0));
 up.textContent='▲ '+asNumber(data.upvotes);
 down.textContent='▼ '+asNumber(data.downvotes);
 up.setAttribute('aria-pressed',String(item.dataset.currentVote==='1'));
 down.setAttribute('aria-pressed',String(item.dataset.currentVote==='-1'));
 item.querySelector('[role=status]').textContent='';
 item.dataset.ready='yes';
}
function fail(item,message){
 if(!item?.isConnected)return;
 item.querySelectorAll('button').forEach(b=>b.disabled=true);
 item.querySelector('[role=status]').textContent=message;
 item.dataset.ready='no';
}
function queue(item,key){
 if(!pending.has(key))pending.set(key,new Set());
 pending.get(key).add(item);
 if(requestTimer===null)requestTimer=setTimeout(()=>void refresh(),100);
}
async function refresh(){
 requestTimer=null;
 const c=client();
 const grouped=[...pending.entries()];pending.clear();
 if(!c){for(const [,hosts] of grouped)for(const item of hosts)fail(item,'Voting unavailable');return;}
 // The server explicitly rejects >50 keys per call.
 for(let index=0;index<grouped.length;index+=50){
  const slice=grouped.slice(index,index+50),keys=slice.map(row=>row[0]);
  try{
   const {data,error}=await c.rpc('dd_news_article_vote_summary',{p_story_keys:keys});
   if(error)throw error;
   const byKey=new Map((data||[]).map(row=>[row.story_key,row]));
   for(const [key,hosts] of slice)for(const host of hosts)display(host,byKey.get(key)||{upvotes:0,downvotes:0,my_vote:0});
  }catch(_){for(const [,hosts] of slice)for(const item of hosts)fail(item,'Article voting not yet available')}
 }
}
async function mount(node){
 if(mounted.has(node))return;
 mounted.add(node);
 const key=String(node.dataset.newsArticleVotes||'');
 const rail=make('div','dd-news-article-vote-controls');
 const status=make('span','dd-news-vote-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const buttons=[1,-1].map(value=>{
  const btn=make('button','dd-news-article-vote-button',value===1?'▲ …':'▼ …');
  btn.type='button';btn.dataset.newsVote=String(value);
  btn.setAttribute('aria-label',value===1?'Upvote article':'Downvote article');
  btn.setAttribute('aria-pressed','false');btn.disabled=true;return btn;
 });
 rail.append(...buttons,status);node.append(rail);
 if(!enabled){fail(node,'Voting not enabled');return;}
 let hash;
 try{hash=await hashStory(key);}catch(_){fail(node,'Article identity unavailable');return;}
 if(!node.isConnected)return;
 node.dataset.voteStoryKey=hash;buttons.forEach(btn=>btn.disabled=false);
 for(const value of [1,-1]){
  buttons[value===1?0:1].onclick=async()=>{
   const c=client();if(!c)return;
   const current=Number(node.dataset.currentVote||0),next=current===value?0:value;
   const auth=await c.auth.getUser();
   if(auth.error||!auth.data?.user||auth.data.user.is_anonymous){
    status.textContent='Sign in to vote';return;
   }
   buttons.forEach(btn=>btn.disabled=true);
   status.textContent='Saving…';
   try{
    const {data,error}=await c.rpc('dd_news_article_vote_set',{p_story_key:hash,p_value:next});
    if(error)throw error;
    if(!data||!(Array.isArray(data)?data[0]:data))throw Error('Vote not confirmed');
    display(node,Array.isArray(data)?data[0]:data);
   }catch(_){status.textContent='Vote not saved. Please try again.'}
   finally{buttons.forEach(btn=>btn.disabled=false)}
  };
 }
 queue(node,hash);
}
function scan(){
 document.querySelectorAll('#newsGrid [data-news-article-votes]').forEach(node=>{if(!mounted.has(node))void mount(node)});
}
function init(){
 const grid=document.getElementById('newsGrid');if(!grid)return;
 scan();
 const observer=new MutationObserver(scan);
 observer.observe(grid,{childList:true,subtree:true});
 window.addEventListener('pagehide',()=>{observer.disconnect();if(requestTimer)clearTimeout(requestTimer)},{once:true});
}
window.DDNewsArticleVotes=Object.freeze({hashStory});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
