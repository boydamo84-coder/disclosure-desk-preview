/* Watch & Read — shared catalogue, member additions and five-report moderation. */
(()=>{'use strict';
const starterRows=[
 ['documentaries','The Phenomenon','2020','James Fox'],
 ['documentaries','Moment of Contact','2022','James Fox'],
 ['documentaries','The Age of Disclosure','2025','Dan Farah'],
 ['movies','Close Encounters of the Third Kind','1977','Steven Spielberg'],
 ['movies','Arrival','2016','Denis Villeneuve'],
 ['movies','Contact','1997','Robert Zemeckis'],
 ['books','UFOs: Generals, Pilots, and Government Officials Go on the Record','2010','Leslie Kean'],
 ['books','Passport to Magonia','1969','Jacques Vallée'],
 ['books','In Plain Sight','2021','Ross Coulthart'],
 ['podcasts','Confessions Of A UFO Insider — The David Grusch Revelations','2023','WEAPONIZED · Episode 21','https://www.youtube.com/watch?v=dc6V0O_OPJ0'],
 ['podcasts','Hollywood, The CIA & UFOs: The History Beyond Spielberg','2026','American Alchemy · Jesse Michels','https://www.youtube.com/watch?v=yJUBSuPh1pM'],
 ['podcasts','David Grusch: UFOs, Atomic Secrecy and Anti-Gravity Research','2023','American Alchemy · Jesse Michels','https://www.youtube.com/watch?v=kRO5jOa06Qw'],
 ['podcasts','WEAPONIZED #21 — The David Grusch Whistleblower Story','2023','WEAPONIZED · Corbell & Knapp','https://www.weaponizedpodcast.com/episodes-1/episode-number-21']
];
// Official publisher episode pages; these are unranked catalogue entries, NOT listening statistics.
// Episode #31 covers animal welfare rather than UFO investigations, so it is not included.
const weaponizedEpisodes=[1,2,3,4,5,6,7,8,9,10,11,12]
 .map(n=>['podcasts','WEAPONIZED — Episode #'+n,'2023–2024','Jeremy Corbell & George Knapp · WEAPONIZED',
 'https://www.weaponizedpodcast.com/'+(n<=30?'episodes-1/episode-number-':'episodes-2/episode-')+n]);
const otherPodcastEpisodes=[
 ['podcasts','Diana Pasulka: The Others, UFOs, AI, Death & the Vatican','2026','That UFO Podcast · Andy McGrillen','https://www.thatufopodcast.com/thatufopodcast/diana-pasulka-the-others-ufos-ai-death-amp-the-vatican'],
 ['podcasts','Dr Eric Davis: Recovered Craft, NHI Bodies and Government Contact','2026','That UFO Podcast · Andy McGrillen','https://www.thatufopodcast.com/thatufopodcast/dr-eric-davis-recovered-craft-nhi-bodies-and-government-contact'],
 ['podcasts','Chris Ramsay Returns: UFO Crashes, Disclosure Fatigue & Secret Technology','2026','That UFO Podcast · Andy McGrillen','https://www.thatufopodcast.com/thatufopodcast/chris-ramsay-returns-ufo-crashes-disclosure-fatigue-amp-secret-technology'],
 ['podcasts','If You Still Think UFOs Are Fake, Watch This — Ryan Graves Interview','2026','Daniel Dushy · Ryan Graves','https://www.youtube.com/watch?v=u9hCc2RTIhI']
];
const joeRoganEpisodes=[[1315,"Bob Lazar & Jeremy Corbell",2019],[1361,"Cmdr. David Fravor & Jeremy Corbell",2019],[1510,"George Knapp & Jeremy Corbell",2020],[1574,"Jacques Vallée & James Fox",2020],[1597,"Travis Walton",2021],[1645,"Christopher Mellon",2021],[1853,"Jeremy Corbell",2022],[1883,"Ryan Graves",2022],[1976,"James Fox",2023],[2028,"Jeremy Corbell & George Knapp",2023],[2065,"David Grusch",2023],[2091,"Diana Walsh Pasulka",2024],[2194,"Luis Elizondo",2024],[2244,"Ryan Graves",2024],[2246,"James Fox",2024],[2288,"Jacques Vallée",2025],[2314,"Hal Puthoff",2025],[2331,"Jesse Michels",2025],[2372,"Garry Nolan",2025],[2479,"Bob Lazar & Luigi Vendittelli",2026],[2560,"David Grusch",2026]]
 .map(([number,guest,year])=>['podcasts','Joe Rogan Experience #'+number+' — '+guest,String(year),'Joe Rogan Experience · '+guest,
 'https://jrelibrary.com/'+number+'-'+guest.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'/']);
const seenUrls=new Set();
const starter=[...starterRows,...otherPodcastEpisodes,...joeRoganEpisodes,...weaponizedEpisodes].filter(row=>{
 const url=row[4];if(url&&seenUrls.has(url))return false;
 if(url)seenUrls.add(url);return true;
}).map(([category,title,year,creator,url])=>({category,title,year,creator,url,id:(category+'-'+title).toLowerCase().replace(/[^a-z0-9]+/g,'-')}));
const key='dd_watch_read_saved_v1';
let client=null;
const db=()=>{const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};if(!window.supabase||!cfg.url||!cfg.publishableKey||!['test','production'].includes(cfg.environment))return null;return client||(client=window.supabase.createClient(cfg.url,cfg.publishableKey));};
let scores={},mine={},available=false,busy=false;
let catalogue=[],catalogueState='loading',catalogueRequest=0,catalogueFingerprint='';
async function loadCatalogue(){
 const stamp=++catalogueRequest,c=db();
 if(!c){catalogue=[];catalogueState='unavailable';window.ddRenderWatchRead?.();return}
 try{const result=await c.rpc('dd_media_catalogue');if(stamp!==catalogueRequest)return;if(result.error||!Array.isArray(result.data))throw result.error||Error('Invalid catalogue');
  const next=result.data.filter(x=>x&&typeof x.id==='string'&&x.id.length<=150&&['documentaries','movies','books','podcasts'].includes(x.category)&&typeof x.title==='string').map(x=>({
   id:x.id,category:x.category,title:x.title,year:x.display_year||x.release_year||'',creator:x.creator||'',
   url:x.public_url?window.DDMediaSubmissions?.publicUrl(x.public_url):null,created_at:x.created_at,source_kind:x.source_kind
  }));
  const fingerprint=JSON.stringify(next),different=fingerprint!==catalogueFingerprint||catalogueState!=='ready';catalogueFingerprint=fingerprint;catalogue=next;catalogueState='ready';if(different)window.ddRenderWatchRead?.();
 }catch(e){if(stamp===catalogueRequest){catalogue=[];catalogueState='unavailable';window.ddRenderWatchRead?.()}}
}
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
 section.append(node('p','Explore documentaries, films, books and podcast episodes. Editorial picks and community additions share the catalogue; additions are not independently verified.'));
 window.DDMediaSubmissions?.mount?.(section);
 const toolbar=node('div');toolbar.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:12px 0';
 const list=node('div'),msg=node('p','Saved titles stay on this device. Added titles and links are public; optional notes stay private.');msg.className='muted small';
 let category='documentaries',viewAll=false,sort='picks',podcastSearch='';
 function render(){
  toolbar.replaceChildren();
  for(const [cat,label] of [['documentaries','Documentaries'],['movies','Movies'],['books','Books'],['podcasts','Podcasts']]){
   const b=node('button',label);b.type='button';b.className=category===cat?'chip active':'chip';b.onclick=()=>{category=cat;viewAll=false;render()};toolbar.append(b);
  }
  list.replaceChildren();
  if(catalogueState!=='ready'){
   const note=node('p',catalogueState==='loading'?'Loading catalogue…':'Catalogue temporarily unavailable. Please retry to see the current moderated list.');note.setAttribute('role','status');list.append(note);
   if(catalogueState==='unavailable'){const retry=node('button','Retry catalogue');retry.type='button';retry.className='outline';retry.onclick=()=>void loadCatalogue();list.append(retry)}
  }
  if(category==='podcasts'){
   const info=node('p','Explore podcast episodes, guests and original publisher links. Community ratings reflect member votes.');info.className='muted small';list.append(info);
   const search=node('input');search.type='search';search.className='field';search.placeholder='Search episode, guest or podcast…';search.value=podcastSearch;search.setAttribute('aria-label','Search podcast episode recommendations');search.oninput=()=>{podcastSearch=search.value;render();const next=list.querySelector('input[type="search"]');next?.focus();next?.setSelectionRange(podcastSearch.length,podcastSearch.length)};list.append(search);
  }
  const order=node('select');order.setAttribute('aria-label','Sort Watch and Read titles');
  for(const [v,l] of [['picks','Catalogue'],['newest','Newest additions'],['score','Community rating'],['recommended','Most recommended']]){
    const opt=node('option',l);opt.value=v;order.append(opt);
  }
  order.value=sort;order.onchange=()=>{sort=order.value;render()};toolbar.append(order);
  const candidates=catalogue.filter(v=>v.category===category&&(!podcastSearch||category!=='podcasts'||[v.title,v.creator,v.year].join(' ').toLowerCase().includes(podcastSearch.toLowerCase()))).slice(0,category==='podcasts'?100:1000);
  if(sort==='newest')candidates.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
  if(available&&['score','recommended'].includes(sort))candidates.sort((a,b)=>{
    const x=scores[a.id]||{},y=scores[b.id]||{};
    const value=t=>sort==='score'?(Number(t.ratings)>=5?Number(t.average_score)||0:0):Number(t.recommendations)||0;
    return value(y)-value(x)||a.title.localeCompare(b.title);
  });
  for(const item of candidates.slice(0,viewAll?100:10)){
   const card=node('article');card.className='card dd-media-card';
   const content=node('div');content.className='dd-media-content';card.append(content);
   const rail=node('div');rail.className='dd-media-actions dd-action-rail';rail.setAttribute('role','group');rail.setAttribute('aria-label','Title actions');
   const name=item.url?node('a',item.title):node('strong',item.title);if(item.url){name.href=item.url;name.target='_blank';name.rel='noopener noreferrer';name.style.cssText='display:block;font-weight:750;color:#e7c58a;text-decoration:underline;text-underline-offset:3px;margin-bottom:6px'}content.append(name,node('p',item.year+' · '+item.creator));
   const save=node('button',saved[item.id]?'✓ On my list':'+ My list');save.type='button';save.className='outline';
   save.onclick=()=>{if(saved[item.id])delete saved[item.id];else saved[item.id]=true;try{localStorage.setItem(key,JSON.stringify(saved))}catch{}render()};
   rail.append(save);
   const share=node('button','Share');share.type='button';share.className='dd-action-share';share.setAttribute('aria-label','Share '+item.title);share.title='Share';
   share.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.4 6.6-3.8 M8.7 13.6l6.6 3.8"/></svg>';
   const discussionLink=new URL('/',location.origin);discussionLink.searchParams.set('dd_tab','watchRead');discussionLink.searchParams.set('dd_discussion','media:'+item.id);
   const board=node('button','☆');board.type='button';board.className='dd-action-board';board.title='Add to Board';board.setAttribute('aria-label','Add '+item.title+' to an Investigation Board');
   board.dataset.bookmarkUrl=discussionLink.href;board.dataset.bookmarkLabel=item.title;board.innerHTML='<span data-star-icon>☆</span>';
   board.onclick=()=>window.DDSavePublicLinkToBoard?.(item.title,discussionLink.href);
   share.onclick=()=>window.DDSharePublicLink?.(item.title,item.url||discussionLink.href);rail.append(board,share);window.DDMediaSubmissions?.attachReport?.(rail,item);card.append(rail);
   const comments=node('div');comments.className='dd-news-inline-comments';comments.dataset.newsComments='media:'+item.id;card.append(comments);
   const summary=node('p',available
     ?((scores[item.id]?.ratings||0)+' ratings · '+(scores[item.id]?.ratings?Number(scores[item.id].average_score).toFixed(1)+'/10':'Not yet rated')+' · '+(scores[item.id]?.recommendations||0)+' recommendations')
     :'Community ratings coming soon · no votes displayed yet');
   summary.className='muted small';content.append(summary);
   const rating=node('select');rating.setAttribute('aria-label','Rate '+item.title);
   for(const [v,l] of [['','Your rating: —'],...Array.from({length:10},(_,i)=>[String(i+1),(i+1)+'/10'])]){
     const option=node('option',l);option.value=v;rating.append(option);
   }
   rating.value=mine[item.id]?.score==null?'':String(mine[item.id].score);
   rating.disabled=!available;rating.onchange=()=>castVote(item,{score:rating.value?Number(rating.value):null});
   const recommend=node('button',mine[item.id]?.recommended?'👍 Recommended':'👍 Recommend');recommend.type='button';recommend.className='outline';recommend.disabled=!available;
   recommend.onclick=()=>castVote(item,{recommended:!mine[item.id]?.recommended});
   const ratings=node('div');ratings.className='dd-media-ratings';ratings.append(rating,recommend);content.append(ratings);list.append(card);
  }
  if(candidates.length>10){const more=node('button',viewAll?'Show Top Picks':'View all titles');more.type='button';more.className='outline';more.onclick=()=>{viewAll=!viewAll;render()};list.append(more)}
 }
 section.append(toolbar,list,msg);host.append(section);window.ddRenderWatchRead=render;render();loadVotes().then(render);void loadCatalogue();
 window.addEventListener('dd-media-catalogue-changed',event=>{if(event.detail?.category)category=event.detail.category;if(event.detail?.newest)sort='newest';void loadCatalogue();void loadVotes().then(render)});
 window.setInterval(()=>{const page=document.getElementById('watchRead');if(page&&!page.classList.contains('hidden')&&document.visibilityState==='visible')void loadCatalogue()},15000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void loadCatalogue()});
 const c=db();c?.auth.onAuthStateChange(()=>{mine={};scores={};available=false;render();setTimeout(()=>loadVotes().then(render),0)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
