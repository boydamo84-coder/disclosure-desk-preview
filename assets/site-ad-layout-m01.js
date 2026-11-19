/* Disclosure Desk M01 advertisement LAYOUT PREVIEW ONLY.
 * This file never loads an ad provider, cookie, pixel, or third-party URL.
 * Production and all non-preview sessions leave the page untouched.
 * Future vendor integration requires a separate documented consent gate,
 * vetted vendor ad units, privacy/cookie updates, quality QA and release.
 */
(()=>{'use strict';
const policy=Object.freeze({
  newsEvery:6,newsMax:3,archiveEvery:12,archiveMax:2,
  videosMax:1,discussionsMax:1,
  providerEnabled:false,requiresAdvertisingConsent:true,
  excluded:['W.NE','private draft','chat','login','immersive video','evidence reader']
});
const plans=(total,every,limit)=>{
 const count=Math.max(0,Number.isFinite(Number(total))?Math.floor(Number(total)):0);
 const stops=[];
 for(let n=every;n<=count&&stops.length<limit;n+=every)stops.push(n);
 return stops;
};
const testHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'
 ||/^deploy-preview-\d+--uap-disclosure-desk\.netlify\.app$/.test(location.hostname);
const preview=testHost && new URLSearchParams(location.search).get('dd_ads_preview')==='1';
window.DDAdLayoutM01=Object.freeze({policy,plan:plans,preview});
if(!preview||!['/','/index.html'].includes(location.pathname)||window.top!==window)return;

function slot(area,sequence){
 const aside=document.createElement('aside');
 aside.className='dd-ad-preview';
 aside.dataset.ddAdArea=area;
 aside.dataset.ddAdSequence=String(sequence);
 aside.setAttribute('role','complementary');
 aside.setAttribute('aria-label','Advertisement layout preview');
 const label=document.createElement('span');
 label.className='dd-ad-preview-label';label.textContent='Advertisement';
 const note=document.createElement('p');note.textContent='Layout preview only · no ad network is connected';
 aside.append(label,note);
 return aside;
}
function syncFeed(id,selector,every,cap,area){
 const host=document.getElementById(id);if(!host)return;
 const entries=Array.from(host.children).filter(n=>n.matches(selector));
 const stops=plans(entries.length,every,cap);
 const current=Array.from(host.children).filter(n=>n.classList.contains('dd-ad-preview'));
 if(current.length===stops.length&&stops.every((n,i)=>
   current[i].dataset.ddAdArea===area&&
   current[i].dataset.ddAdSequence===String(i+1)&&
   entries[n-1].nextElementSibling===current[i]))return;
 current.forEach(x=>x.remove());
 for(const [i,n] of stops.entries())entries[n-1].after(slot(area,i+1));
}
function syncStatic(){
 const video=document.getElementById('clipsFeed');
 if(video&&!document.querySelector('[data-dd-ad-area="videos"]')){
   // Keep the fullscreen swipe feed and iframe/player completely uninterrupted.
   video.before(slot('videos',1));
 }
 const forum=document.querySelector('#discussionsPage .dd-community-banner');
 if(forum&&!document.querySelector('[data-dd-ad-area="discussions"]')){
   // Outside posts, replies, voting and writing controls.
   forum.after(slot('discussions',1));
 }
}
function init(){
 const feeds=[
  ['newsGrid','article[data-news-id]',policy.newsEvery,policy.newsMax,'news'],
  ['archiveList','article[data-archive-id]',policy.archiveEvery,policy.archiveMax,'archive']
 ];
 feeds.forEach(([id,selector,every,max,area])=>{
  const host=document.getElementById(id);if(!host)return;
  const sync=()=>syncFeed(id,selector,every,max,area);
  const observer=new MutationObserver(sync);
  observer.observe(host,{childList:true});
  sync();
 });
 syncStatic();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();