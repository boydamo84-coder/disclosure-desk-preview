/* Who's Who in Disclosure — research profile directory, R2 draft.
 * Public editorial data only. Click-to-load privacy-aware YouTube embeds.
 * No unreviewed popularity ratings, user accounts, tracking or private witnesses.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safeUrl=value=>{try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const supportedVideoId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id);
let people=[];
let selected=null;
const initials=p=>String(p.name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const shortDate=v=>String(v||'');
const validLinks=(v)=>Array.isArray(v)?v.filter(x=>x&&safeUrl(x.url)).slice(0,30):[];
function renderList(items,opts={}){
 const filtered=validLinks(items);
 return filtered.length?'<ul class="link-list">'+filtered.map(x=>
  '<li><a href="'+esc(safeUrl(x.url))+'" rel="noopener noreferrer" target="_blank">'+esc(x.label||x.title||'Original source')+' ↗</a>'+
  (x.publisher?'<span class="muted small"> · '+esc(x.publisher)+'</span>':'')+
  (x.date?'<span class="muted small"> · '+esc(x.date)+'</span>':'')+
  (x.kind?'<span class="muted small"> · '+esc(x.kind)+'</span>':'')+'</li>').join('')+'</ul>':
  '<p class="muted small">'+(opts.empty||'No independently confirmed links in this research profile.')+'</p>';
}
function openPerson(person,updateUrl=true){
 if(!person)return;
 selected=person;
 const show=$('personProfile'),directory=$('directoryPage');
 if(!show||!directory)return;
 $('profileName').textContent=person.name;
 $('profileRole').textContent=person.role;
 $('profileShort').textContent=person.short;
 $('profileAvatar').textContent=initials(person);
 $('profilePosition').textContent=person.position;
 $('profileContext').textContent=person.context;
 $('profileTags').innerHTML=(person.category||[]).map(c=>'<span class="pill">'+esc(c)+'</span>').join('');
 $('profileSources').innerHTML=validLinks(person.sources).map(x=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(x.url))+'">'+esc(x.label)+' ↗</a></li>').join('')||'<li>Source documents awaiting review</li>';
 $('profileMedia').innerHTML=validLinks(person.media).map(x=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(x.url))+'">'+esc(x.label)+' ↗</a></li>').join('')||'<li>No publisher video selected yet</li>';
 $('profileLinks').innerHTML=validLinks(person.officialLinks).map(x=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(x.url))+'">'+esc(x.label)+' ↗</a></li>').join('')||'<li>Official public accounts not established from cited sources</li>';
 const long=$('profileBiography');
 long.innerHTML=(Array.isArray(person.biography)?person.biography:[]).map(p=>'<p>'+esc(p)+'</p>').join('')||
   '<p>'+esc(person.short)+'</p>';
 const years=$('profileTimeline');
 years.innerHTML=(Array.isArray(person.milestones)?person.milestones:[]).map(entry=>
  '<li><time>'+esc(shortDate(entry.date))+'</time><div><strong>'+esc(entry.title)+'</strong>'+
  '<p>'+esc(entry.detail)+'</p>'+
  (safeUrl(entry.source)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(entry.source))+'">Inspect original reference ↗</a>':'')+
  '</div></li>').join('');
 $('profileArticles').innerHTML=renderList(person.articles,{empty:'No separately verified media references added yet.'});
 $('profileSocials').innerHTML=renderList(person.socialPages,{empty:"No personal social media account has been positively attributed from an official source. We won't guess or link fan accounts."});
 const videoHost=$('profileVideoPlayers');videoHost.replaceChildren();
 for(const v of Array.isArray(person.videos)?person.videos.slice(0,8):[]){
  if(!supportedVideoId(v.youtubeId))continue;
  const watch='https://www.youtube.com/watch?v='+v.youtubeId;
  const card=document.createElement('div');card.className='video-card';
  card.innerHTML='<strong>'+esc(v.title)+'</strong><p class="muted small">'+
   esc(v.type)+' · '+esc(v.publisher)+' · '+esc(v.date)+'</p><p>'+esc(v.context)+'</p>'+
   '<div class="video-preview"><button type="button" class="btn video-play">▶ Play here (YouTube)</button>'+
   '<p class="muted small">YouTube is loaded only after you press play. It may set cookies and apply its own privacy policy.</p></div>'+
   '<p><a target="_blank" rel="noopener noreferrer" href="'+esc(watch)+'">Open original video on YouTube ↗</a></p>';
  card.querySelector('.video-play').addEventListener('click',()=>{
   const slot=card.querySelector('.video-preview');
   slot.replaceChildren();
   const iframe=document.createElement('iframe');
   iframe.title='Video: '+v.title;iframe.width='560';iframe.height='315';
   iframe.loading='lazy';iframe.referrerPolicy='strict-origin-when-cross-origin';
   iframe.setAttribute('allow','accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share');
   iframe.setAttribute('allowfullscreen','');
   iframe.src='https://www.youtube-nocookie.com/embed/'+v.youtubeId;
   slot.appendChild(iframe);
  });
  videoHost.appendChild(card);
 }
 if(!videoHost.childElementCount)videoHost.textContent='No independently verified, embeddable publisher video selected. Use the attributed links above.';
 directory.classList.add('hidden');show.classList.remove('hidden');
 $('directoryBack').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
 if(updateUrl){
  const u=new URL(location.href);u.searchParams.set('person',person.id);
  history.pushState({directoryPerson:person.id},'',u.pathname+u.search+u.hash);
 }
}
function showDirectory(updateUrl=true){
 $('personProfile').classList.add('hidden');$('directoryPage').classList.remove('hidden');
 selected=null;
 if(updateUrl){
  const u=new URL(location.href);u.searchParams.delete('person');
  history.pushState({directoryPerson:null},'',u.pathname+u.search+u.hash);
 }
 window.scrollTo({top:0,behavior:'instant'});
}
function renderCards(){
 const query=$('peopleSearch').value.trim().toLocaleLowerCase();
 const kind=$('peopleCategory').value;
 const results=people.filter(p=>{
  if(kind!=='all'&&!(p.category||[]).includes(kind))return false;
  const searchable=[p.name,p.short,p.role,p.position,...(p.category||[])].join(' ').toLocaleLowerCase();
  return !query||searchable.includes(query);
 });
 $('peopleStatus').textContent=results.length+' people match · Source-linked editorial profiles';
 const host=$('peopleCards');host.replaceChildren();
 for(const person of results){
  const card=document.createElement('article');card.className='card';
  card.innerHTML='<div class="person-head"><span aria-hidden="true" class="avatar">'+esc(initials(person))+
   '</span><div><h3>'+esc(person.name)+'</h3><p class="muted small compact">'+esc(person.role)+'</p></div></div>'+
   '<div class="pills">'+(person.category||[]).map(c=>'<span class="pill">'+esc(c)+'</span>').join('')+'</div>'+
   '<p>'+esc(person.short)+'</p><button type="button" class="btn">Read detailed profile</button>';
  card.querySelector('button').addEventListener('click',()=>openPerson(person));
  host.appendChild(card);
 }
 if(!results.length)host.innerHTML='<div class="card"><h3>No matching profiles yet</h3><p>Try another search or category. More public profiles can be added after checking their original sources.</p></div>';
}
function fromLocation(){
 const id=new URL(location.href).searchParams.get('person');
 const record=people.find(p=>p.id===id);
 if(record)openPerson(record,false);
 else showDirectory(false);
}
$('directoryBack').addEventListener('click',()=>showDirectory());
$('peopleSearch').addEventListener('input',renderCards);
$('peopleCategory').addEventListener('change',renderCards);
window.addEventListener('popstate',fromLocation);
fetch('/data/public-people-directory.json',{cache:'no-store'}).then(resp=>{
 if(!resp.ok)throw Error('Source directory '+resp.status);
 return resp.json();
}).then(data=>{
 if(data.version!==1||!Array.isArray(data.people))throw Error('Unsupported people schema');
 const ids=new Set();
 people=data.people.filter(p=>{
  if(!p||typeof p.id!=='string'||!(/^[a-z0-9-]{2,80}$/).test(p.id)||ids.has(p.id)||!p.name)return false;
  ids.add(p.id);return true;
 });
 people.sort((a,b)=>a.name.localeCompare(b.name));
 renderCards();fromLocation();
}).catch(error=>{
 $('peopleStatus').textContent='The public profile directory is temporarily unavailable. The research pages and source links above remain accessible.';
 console.warn('Who’s Who public editorial profiles not loaded:',error);
});
})();