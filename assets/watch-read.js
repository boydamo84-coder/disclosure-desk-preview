/* Watch & Read beta — curated starter list; rankings need moderated database votes. */
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
const weaponizedEpisodes=[...Array.from({length:30},(_,i)=>i+1),...Array.from({length:17},(_,i)=>i+32)]
 .map(n=>['podcasts','WEAPONIZED — Episode #'+n,'2023–2024','Jeremy Corbell & George Knapp · WEAPONIZED',
 'https://www.weaponizedpodcast.com/'+(n<=30?'episodes-1/episode-number-':'episodes-2/episode-')+n]);
const joeRoganEpisodes=[[1315,"Bob Lazar & Jeremy Corbell",2019],[1361,"Cmdr. David Fravor & Jeremy Corbell",2019],[1510,"George Knapp & Jeremy Corbell",2020],[1574,"Jacques Vallée & James Fox",2020],[1597,"Travis Walton",2021],[1645,"Christopher Mellon",2021],[1853,"Jeremy Corbell",2022],[1883,"Ryan Graves",2022],[1976,"James Fox",2023],[2028,"Jeremy Corbell & George Knapp",2023],[2065,"David Grusch",2023],[2091,"Diana Walsh Pasulka",2024],[2194,"Luis Elizondo",2024],[2244,"Ryan Graves",2024],[2246,"James Fox",2024],[2288,"Jacques Vallée",2025],[2314,"Hal Puthoff",2025],[2331,"Jesse Michels",2025],[2372,"Garry Nolan",2025],[2479,"Bob Lazar & Luigi Vendittelli",2026],[2560,"David Grusch",2026]]
 .map(([number,guest,year])=>['podcasts','Joe Rogan Experience #'+number+' — '+guest,String(year),'Joe Rogan Experience · '+guest,
 'https://jrelibrary.com/'+number+'-'+guest.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'/']);
const seenUrls=new Set();
const starter=[...starterRows,...weaponizedEpisodes,...joeRoganEpisodes].filter(row=>{
 const url=row[4];if(url&&seenUrls.has(url))return false;
 if(url)seenUrls.add(url);return true;
}).map(([category,title,year,creator,url])=>({category,title,year,creator,url,id:(category+'-'+title).toLowerCase().replace(/[^a-z0-9]+/g,'-')}));
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
 section.append(node('p','Explore documentaries, movies, books and podcast episodes. Starter titles are editorial picks, not community-ranked results.'));
 const toolbar=node('div');toolbar.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:12px 0';
 const list=node('div'),msg=node('p','Community voting and member nominations will launch after our Supabase security tests.');msg.className='muted small';
 let category='documentaries',viewAll=false,sort='picks',podcastSearch='';
 function render(){
  toolbar.replaceChildren();
  for(const [cat,label] of [['documentaries','Documentaries'],['movies','Movies'],['books','Books'],['podcasts','Podcast Episodes']]){
   const b=node('button',label);b.type='button';b.className=category===cat?'chip active':'chip';b.onclick=()=>{category=cat;viewAll=false;render()};toolbar.append(b);
  }
  list.replaceChildren();
  if(category==='podcasts'){
   const info=node('p','Top 100 UFO Podcast Episodes · Unranked starter catalogue (official episode links; not a most-listened chart). '+starter.filter(v=>v.category==='podcasts').length+' verified episode links so far; no invented community rankings.');info.className='muted small';list.append(info);
   const search=node('input');search.type='search';search.className='field';search.placeholder='Search episode, guest or podcast…';search.value=podcastSearch;search.setAttribute('aria-label','Search podcast episode recommendations');search.oninput=()=>{podcastSearch=search.value;render();const next=list.querySelector('input[type="search"]');next?.focus();next?.setSelectionRange(podcastSearch.length,podcastSearch.length)};list.append(search);
  }
  if(category==='podcasts'){
   const details=node('details');details.className='card';details.style.cssText='padding:12px;margin:12px 0';
   const heading=node('summary','＋ Suggest a podcast episode');heading.style.cssText='cursor:pointer;color:#e4c58b;font-weight:700';details.append(heading);
   const description=node('p','Paste a link to a specific episode. Suggestions are private until reviewed; submitting does not add an episode to the Top 100.');description.className='muted small';details.append(description);
   const form=node('form');form.style.cssText='display:grid;gap:9px';
   const url=node('input');url.className='field';url.type='url';url.required=true;url.maxLength=1000;url.placeholder='https://… episode URL';url.setAttribute('aria-label','Podcast episode URL');
   const title=node('input');title.className='field';title.required=true;title.maxLength=180;title.minLength=3;title.placeholder='Episode title';title.setAttribute('aria-label','Episode title');
   const notes=node('textarea');notes.className='field';notes.maxLength=500;notes.rows=2;notes.placeholder='Why should we feature it? (optional)';notes.setAttribute('aria-label','Reason for recommendation');
   const submit=node('button','Submit suggestion for review');submit.type='submit';submit.className='outline';
   const feedback=node('p','');feedback.className='muted small';feedback.setAttribute('role','status');
   const validUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!['localhost','127.0.0.1'].includes(u.hostname)}catch{return false}};
   form.onsubmit=async e=>{
    e.preventDefault();
    const link=url.value.trim(),name=title.value.trim(),reason=notes.value.trim();
    if(!validUrl(link)){feedback.textContent='Please paste a public HTTPS episode link.';return}
    if(starter.some(v=>v.url===link)){feedback.textContent='This episode is already in our recommendations.';return}
    const c=db();if(!c){feedback.textContent='Suggestions are not enabled in this build yet.';return}
    submit.disabled=true;feedback.textContent='Submitting…';
    try{
     const {data:{user},error:authError}=await c.auth.getUser();
     if(authError||!user){feedback.textContent='Please sign in before submitting an episode.';return}
     const {error}=await c.from('dd_podcast_suggestions').insert({user_id:user.id,episode_url:link,title:name,notes:reason});
     if(error){feedback.textContent=error.code==='23505'?'You already suggested this episode.':'Could not submit. The suggestions database may not be enabled yet.';return}
     feedback.textContent='✓ Suggestion received for review. Thank you!';
     form.reset();
    }catch(err){feedback.textContent='Could not submit this suggestion. Please try again.'}
    finally{submit.disabled=false}
   };
   form.append(url,title,notes,submit,feedback);details.append(form);list.append(details);
  }
  const order=node('select');order.setAttribute('aria-label','Sort Watch and Read titles');
  for(const [v,l] of [['picks','Editorial picks'],['score','Community rating'],['recommended','Most recommended']]){
    const opt=node('option',l);opt.value=v;order.append(opt);
  }
  order.value=sort;order.onchange=()=>{sort=order.value;render()};toolbar.append(order);
  const candidates=starter.filter(v=>v.category===category&&(!podcastSearch||category!=='podcasts'||[v.title,v.creator,v.year].join(' ').toLowerCase().includes(podcastSearch.toLowerCase()))).slice(0,category==='podcasts'?100:1000);
  if(available&&sort!=='picks')candidates.sort((a,b)=>{
    const x=scores[a.id]||{},y=scores[b.id]||{};
    const value=t=>sort==='score'?(Number(t.ratings)>=5?Number(t.average_score)||0:0):Number(t.recommendations)||0;
    return value(y)-value(x)||a.title.localeCompare(b.title);
  });
  for(const item of candidates.slice(0,viewAll?100:10)){
   const card=node('article');card.className='card';card.style.cssText='padding:12px;margin:8px 0';
   card.append(node('strong',item.title),node('p',item.year+' · '+item.creator));
   if(item.url){const source=node('a','▶ Watch episode ↗');source.href=item.url;source.target='_blank';source.rel='noopener noreferrer';source.style.cssText='display:inline-block;color:#dfc48d;margin:0 0 12px;text-decoration:underline';card.append(source)}
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
  if(candidates.length>10){const more=node('button',viewAll?'Show Top Picks':'View all titles');more.type='button';more.className='outline';more.onclick=()=>{viewAll=!viewAll;render()};list.append(more)}
 }
 section.append(toolbar,list,msg);host.append(section);window.ddRenderWatchRead=render;render();loadVotes().then(render);
 const c=db();c?.auth.onAuthStateChange(()=>{mine={};scores={};available=false;render();setTimeout(()=>loadVotes().then(render),0)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
