/* Watch & Read beta — curated starter list; rankings need moderated database votes. */
(()=>{'use strict';
const starter=[
 ['documentaries','The Phenomenon','2020','James Fox'],
 ['documentaries','Moment of Contact','2022','James Fox'],
 ['documentaries','The Age of Disclosure','2025','Dan Farah'],
 ['movies','Close Encounters of the Third Kind','1977','Steven Spielberg'],
 ['movies','Arrival','2016','Denis Villeneuve'],
 ['movies','Contact','1997','Robert Zemeckis'],
 ['books','UFOs: Generals, Pilots, and Government Officials Go on the Record','2010','Leslie Kean'],
 ['books','Passport to Magonia','1969','Jacques Vallée'],
 ['books','In Plain Sight','2021','Ross Coulthart']
].map(([category,title,year,creator])=>({category,title,year,creator,id:(category+'-'+title).toLowerCase().replace(/[^a-z0-9]+/g,'-')}));
const key='dd_watch_read_saved_v1';
let client=null;
const db=()=>{const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};if(!window.supabase||!cfg.url||!cfg.publishableKey||cfg.environment!=='test')return null;return client||(client=window.supabase.createClient(cfg.url,cfg.publishableKey));};
let scores={},mine={},available=false,busy=false;
async function loadVotes(){
 const c=db();if(!c){available=false;mine={};scores={};return;}
 available=false;mine={};scores={};
 try {
  const {data,error}=await c.rpc('dd_media_ranking');if(error)throw error;
  scores=Object.fromEntries((data||[]).map(v=>[v.title_id,v]));
  const {data:{user}}=await c.auth.getUser();
  mine={};
  if(user){
   const {data:rows,error:err}=await c.from('dd_media_votes').select('title_id,score,recommended').eq('user_id',user.id);
   if(err)throw err;
   mine=Object.fromEntries((rows||[]).map(v=>[v.title_id,v]));
  }
  available=true;
 }catch(ex){available=false;mine={};scores={};console.warn('Watch & Read voting not activated:',ex.message)}
}
async function castVote(item,patch){
 if(busy)return;
 const c=db();if(!c)return alert('Voting is unavailable.');
 const {data:{user}}=await c.auth.getUser();
 if(!user)return alert('Sign in to your Disclosure Desk account to vote.');
 if(!available)return alert('Community voting will open after the database is activated.');
 busy=true;
 try{
  const previous=mine[item.id]||{score:null,recommended:false};
  const next={...previous,...patch};
  const result=next.score===null&&!next.recommended
   ?await c.from('dd_media_votes').delete().eq('title_id',item.id).eq('user_id',user.id)
   :await c.from('dd_media_votes').upsert({title_id:item.id,user_id:user.id,score:next.score,recommended:next.recommended},{onConflict:'title_id,user_id'});
  if(result.error)throw result.error;
  await loadVotes();window.ddRenderWatchRead?.();
 }catch(ex){alert('Unable to save your rating: '+ex.message)}finally{busy=false}
}

let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
function node(tag,value){const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n}
function init(){
 const host=document.getElementById('ddWatchReadMount');if(!host)return;
 const section=node('div');section.className='section';section.id='ddWatchRead';
 section.append(node('p','Explore documentaries, movies and books. Starter titles are editorial picks, not community-ranked results.'));
 const toolbar=node('div');toolbar.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:12px 0';
 const list=node('div'),msg=node('p','Community voting and member nominations will launch after our Supabase security tests.');msg.className='muted small';
 let category='documentaries',viewAll=false,sort='picks';
 function render(){
  toolbar.replaceChildren();
  for(const [cat,label] of [['documentaries','Documentaries'],['movies','Movies'],['books','Books']]){
   const b=node('button',label);b.type='button';b.className=category===cat?'chip active':'chip';b.onclick=()=>{category=cat;viewAll=false;render()};toolbar.append(b);
  }
  list.replaceChildren();
  const order=node('select');order.setAttribute('aria-label','Sort Watch and Read titles');
  for(const [v,l] of [['picks','Editorial picks'],['score','Community rating'],['recommended','Most recommended']]){
    const opt=node('option',l);opt.value=v;order.append(opt);
  }
  order.value=sort;order.onchange=()=>{sort=order.value;render()};toolbar.append(order);
  const candidates=starter.filter(v=>v.category===category);
  if(available&&sort!=='picks')candidates.sort((a,b)=>{
    const x=scores[a.id]||{},y=scores[b.id]||{};
    const value=t=>sort==='score'?(Number(t.ratings)>=5?Number(t.average_score)||0:0):Number(t.recommendations)||0;
    return value(y)-value(x)||a.title.localeCompare(b.title);
  });
  for(const item of candidates.slice(0,viewAll?100:10)){
   const card=node('article');card.className='card';card.style.cssText='padding:12px;margin:8px 0';
   card.append(node('strong',item.title),node('p',item.year+' · '+item.creator));
   const save=node('button',saved[item.id]?'✓ On my list':'+ My list');save.type='button';save.className='outline';
   save.onclick=()=>{if(saved[item.id])delete saved[item.id];else saved[item.id]=true;try{localStorage.setItem(key,JSON.stringify(saved))}catch{}render()};
   const discuss=node('button','💬 Discuss');discuss.type='button';discuss.className='outline';discuss.style.marginLeft='6px';
   discuss.onclick=()=>window.ddOpenCaseDiscussion?.('media:'+item.id,'Watch & Read Discussion');
   card.append(save,discuss);
   const summary=node('p',available
     ?((scores[item.id]?.ratings||0)+' ratings · '+(scores[item.id]?.ratings?Number(scores[item.id].average_score).toFixed(1)+'/10':'Not yet rated')+' · '+(scores[item.id]?.recommendations||0)+' recommendations')
     :'Community ratings coming soon · no votes displayed yet');
   summary.className='muted small';card.append(summary);
   const rating=node('select');rating.setAttribute('aria-label','Rate '+item.title);
   for(const [v,l] of [['','Your rating: —'],...Array.from({length:10},(_,i)=>[String(i+1),(i+1)+'/10'])]){
     const option=node('option',l);option.value=v;rating.append(option);
   }
   rating.value=mine[item.id]?.score==null?'':String(mine[item.id].score);
   rating.disabled=!available;rating.onchange=()=>castVote(item,{score:rating.value?Number(rating.value):null});
   const recommend=node('button',mine[item.id]?.recommended?'👍 Recommended':'👍 Recommend');recommend.type='button';recommend.className='outline';recommend.disabled=!available;
   recommend.onclick=()=>castVote(item,{recommended:!mine[item.id]?.recommended});
   card.append(rating,recommend);list.append(card);
  }
  const more=node('button',viewAll?'Show Top Picks':'View all titles');more.type='button';more.className='outline';more.onclick=()=>{viewAll=!viewAll;render()};list.append(more);
 }
 section.append(toolbar,list,msg);host.append(section);window.ddRenderWatchRead=render;render();loadVotes().then(render);
 const c=db();c?.auth.onAuthStateChange(()=>{mine={};scores={};available=false;render();setTimeout(()=>loadVotes().then(render),0)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
