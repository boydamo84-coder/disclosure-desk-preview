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
let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
function node(tag,value){const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n}
function init(){
 const host=document.getElementById('hub');if(!host)return;
 const section=node('div');section.className='section';section.id='ddWatchRead';
 section.append(node('h2','🎬 Watch & Read'),node('p','The UFO one-stop shop: discover documentaries, movies and books. These starter selections are editorial suggestions, NOT community-voted Top 10 rankings.'));
 const toolbar=node('div');toolbar.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:12px 0';
 const list=node('div'),msg=node('p','Community voting and member nominations will launch after our Supabase security tests.');msg.className='muted small';
 let category='documentaries',viewAll=false;
 function render(){
  toolbar.replaceChildren();
  for(const [cat,label] of [['documentaries','Documentaries'],['movies','Movies'],['books','Books']]){
   const b=node('button',label);b.type='button';b.className=category===cat?'chip active':'chip';b.onclick=()=>{category=cat;viewAll=false;render()};toolbar.append(b);
  }
  list.replaceChildren();
  const candidates=starter.filter(v=>v.category===category);
  for(const item of candidates.slice(0,viewAll?100:10)){
   const card=node('article');card.className='card';card.style.cssText='padding:12px;margin:8px 0';
   card.append(node('strong',item.title),node('p',item.year+' · '+item.creator));
   const save=node('button',saved[item.id]?'✓ On my list':'+ My list');save.type='button';save.className='outline';
   save.onclick=()=>{if(saved[item.id])delete saved[item.id];else saved[item.id]=true;try{localStorage.setItem(key,JSON.stringify(saved))}catch{}render()};
   const discuss=node('button','💬 Discuss');discuss.type='button';discuss.className='outline';discuss.style.marginLeft='6px';
   discuss.onclick=()=>window.ddOpenCaseDiscussion?.('media:'+item.id,'Watch & Read Discussion');
   card.append(save,discuss);list.append(card);
  }
  const more=node('button',viewAll?'Show Top Picks':'View all titles');more.type='button';more.className='outline';more.onclick=()=>{viewAll=!viewAll;render()};list.append(more);
 }
 section.append(toolbar,list,msg);host.append(section);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
