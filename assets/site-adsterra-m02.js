/* Disclosure Desk Ads M04 — direct banner tags, localhost-only QA / RELEASE LOCKED.
 * Publisher supplied three standard Adsterra iframe tags on 18 Nov 2026.
 * IMPORTANT: the release gate is FALSE. The only test override is an explicitly flagged localhost fixture; CI mocks the vendor and makes NO real ad requests.
 * No popunder / smartlink / social-bar / notifications, and no W.NE slots.
 * Explicit standalone advertising consent must be accepted before ad requests.
 * Provider creative, UK privacy, dynamic script compatibility and live QA remain pending.
 */
(()=>{'use strict';
const RELEASE_ENABLED=false; // Must stay FALSE until explicit owner release, audits and QA.
const LOCAL_TEST=(location.hostname==='localhost'||location.hostname==='127.0.0.1')&&location.pathname==='/scripts/fixtures/ad-m04-direct-banner-test.html'&&new URLSearchParams(location.search).get('dd_adsterra_direct_test')==='1';
const CHOICE_KEY='dd-site-advertising-consent-v1';
const ROOT='https://bicea.org/22/';
const UNIT=Object.freeze({
  tile:Object.freeze({width:300,height:250,key:'6e71e0ae33c20d811ac3ff6e51c016a5'}),
  mobile:Object.freeze({width:320,height:50,key:'583ba41b4ca944fbeb2ae6136eec2cdd'}),
  wide:Object.freeze({width:728,height:90,key:'4e32127ce7b1af4bb948957fe0015e97'})
});
window.DDAdsterraM02=Object.freeze({releaseEnabled:RELEASE_ENABLED,localTest:LOCAL_TEST,
  units:Object.freeze(Object.fromEntries(Object.entries(UNIT).map(([name,u])=>[name,Object.freeze({width:u.width,height:u.height})]))),
  advertisingConsentSeparateFromAnalytics:true});
if((!RELEASE_ENABLED&&!LOCAL_TEST)||window.top!==window||
   !['/','/index.html','/privacy','/privacy.html','/scripts/fixtures/ad-m04-direct-banner-test.html'].includes(location.pathname)||
   window.DDAdLayoutM01?.preview)return;

let choice=null,banner=null;
try{const saved=localStorage.getItem(CHOICE_KEY);if(saved==='accepted'||saved==='declined')choice=saved}catch(_){}
const isHome=location.pathname==='/'||location.pathname==='/index.html'||LOCAL_TEST;
const plan=(count,every,max)=>{const out=[];for(let n=every;n<=count&&out.length<max;n+=every)out.push(n);return out};
const slots=()=>Array.from(document.querySelectorAll('.dd-adsterra-slot'));
function activeTab(){return document.querySelector('.nav .tab.active')?.dataset.tab||'discover'}
function clearSlots(){slots().forEach(node=>node.remove())}
/* Never resize the creative or squeeze a 320px banner into a narrower slot.
 * A smaller viewport simply does not show an ad there. This avoids horizontal
 * scrolling and tampering with the original provider iframe dimensions.
 */
function availableWidth(host){return Math.min(document.documentElement.clientWidth-24,host.getBoundingClientRect().width-12)}
function responsiveUnit(host){
 const available=availableWidth(host);
 if(window.innerWidth>=1024&&available>=728)return 'wide';
 if(available>=320)return 'mobile';
 if(available>=300)return 'tile';
 return null;
}
const loadingQueue=[];
let loaderBusy=false;
function pump(){
 if(loaderBusy)return;
 while(loadingQueue.length){
  const next=loadingQueue.shift();
  if(!next.wrap.isConnected)continue;
  const {wrap,unit}=next;
  loaderBusy=true;
  // Append Adsterra's original two scripts to the website body rather than
  // placing the tag in any additional iframe. The first is the original
  // atOptions configuration; the second is its unmodified vendor src.
  // Loads are serialised so the global atOptions cannot be overwritten by a
  // different sized ad while the previous provider script is loading.
  const config=document.createElement('script');
  config.textContent="atOptions = { 'key' : "+JSON.stringify(unit.key)+", 'format' : 'iframe', 'height' : "+unit.height+", 'width' : "+unit.width+", 'params' : {} };";
  wrap.append(config);
  const script=document.createElement('script');
  script.async=false;
  // On localhost the QA fixture deliberately substitutes first-party fake ad JS.
  // Never issue publisher impressions from an unapproved origin or automated test.
  script.src=LOCAL_TEST?'/scripts/fixtures/ad-m04-mock-tag.js':ROOT+unit.key;
  const finish=()=>{loaderBusy=false;pump()};
  script.addEventListener('load',finish,{once:true});
  script.addEventListener('error',()=>{const slot=wrap.closest('.dd-adsterra-slot');if(slot){slot.hidden=true;slot.dataset.ddAdLoadFailed='1'}finish()},{once:true});
  wrap.append(script);
  return;
 }
}
function makeSlot(area,index,unitName,host){
 const unit=UNIT[unitName];
 if(!unit||availableWidth(host)<unit.width)return null;
 const aside=document.createElement('aside');
 aside.className='dd-adsterra-slot';
 aside.dataset.ddAdArea=area;
 aside.dataset.ddAdSequence=String(index);
 aside.dataset.ddAdUnit=unitName;
 aside.setAttribute('aria-label','Advertisement');
 const label=document.createElement('span');
 label.className='dd-adsterra-label';label.textContent='Advertisement';
 const wrap=document.createElement('div');
 wrap.className='dd-adsterra-frame-wrap';
 wrap.style.width=unit.width+'px';
 wrap.style.height=unit.height+'px';
 aside.append(label,wrap);
 loadingQueue.push({wrap,unit});
 queueMicrotask(pump);
 return aside;
}
function syncFeed(hostId,selector,every,max,area,unit){
 const host=document.getElementById(hostId);if(!host)return;
 const entries=Array.from(host.children).filter(n=>n.matches(selector));
 const stops=plan(entries.length,every,max);
 const current=Array.from(host.children).filter(n=>n.classList.contains('dd-adsterra-slot'));
 const unitName=typeof unit==='function'?unit(host):unit;
 if(!unitName||availableWidth(host)<UNIT[unitName].width){current.forEach(n=>n.remove());return}
 const correct=current.length===stops.length&&stops.every((n,i)=>
  current[i].dataset.ddAdArea===area&&current[i].dataset.ddAdUnit===unitName&&
  entries[n-1].nextElementSibling===current[i]);
 if(correct)return;
 current.forEach(n=>n.remove());
 stops.forEach((n,i)=>{const node=makeSlot(area,i+1,unitName,host);if(node)entries[n-1].after(node)});
}
function syncStandalone(area,selector,where){
 const anchor=document.querySelector(selector);
 if(!anchor)return;
 const host=anchor.parentElement;
 const unitName=responsiveUnit(host);
 const existing=slots().find(n=>n.dataset.ddAdArea===area);
 if(existing&&existing.dataset.ddAdUnit===unitName&&
   (where==='before'?anchor.previousElementSibling===existing:anchor.nextElementSibling===existing))return;
 if(existing)existing.remove();
 if(!unitName)return;
 const node=makeSlot(area,1,unitName,host);
 if(!node)return;
 if(where==='before')anchor.before(node);else anchor.after(node);
}
function sync(){
 if(!isHome||choice!=='accepted'){clearSlots();return}
 const tab=activeTab(),areas={discover:'news',archivePage:'archive',clips:'videos',discussionsPage:'discussions'};
 const area=areas[tab]||null;
 slots().filter(n=>n.dataset.ddAdArea!==area).forEach(n=>n.remove());
 if(area==='news')syncFeed('newsGrid','article[data-news-id]',6,3,area,'tile');
 else if(area==='archive')syncFeed('archiveList','article[data-archive-id]',12,2,area,responsiveUnit);
 else if(area==='videos')syncStandalone(area,'#clipsFeed','before');
 else if(area==='discussions')syncStandalone(area,'#discussionsPage .dd-community-banner','after');
}
function setChoice(accepted){
 choice=accepted?'accepted':'declined';
 try{localStorage.setItem(CHOICE_KEY,choice)}catch(_){}
 if(banner)banner.hidden=true;
 if(choice==='accepted')sync();else clearSlots();
 const status=document.querySelector('[data-dd-advertising-status]');
 if(status)status.textContent=choice==='accepted'?'Advertising allowed on public pages':
  'Advertising declined on this browser';
}
function showPreferences(){
 if(!banner)return;
 banner.hidden=false;
 banner.querySelector('[data-dd-advertising-yes]')?.focus({preventScroll:true});
}
function setupBanner(){
 const panel=document.createElement('section');panel.id='dd-advertising-consent';
 panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Optional advertising consent');
 const heading=document.createElement('strong');heading.textContent='Optional advertising';
 const desc=document.createElement('p');
 desc.textContent='May Adsterra load adverts on the public News, Archive, Videos and Discussions sections? Adverts may use cookies or similar technologies. You can say no and keep using Disclosure Desk. This does not affect Netlify website statistics.';
 const yes=document.createElement('button');yes.type='button';yes.dataset.ddAdvertisingYes='1';yes.textContent='Allow adverts';
 const no=document.createElement('button');no.type='button';no.dataset.ddAdvertisingNo='1';no.textContent='No thanks';
 const link=document.createElement('a');link.href='/privacy#advertising-settings';link.textContent='Privacy details and preferences';
 yes.addEventListener('click',()=>setChoice(true));
 no.addEventListener('click',()=>setChoice(false));
 panel.append(heading,desc,yes,no,link);document.body.insertBefore(panel,document.body.firstChild);
 banner=panel;
 document.querySelectorAll('[data-dd-advertising-open]').forEach(b=>b.addEventListener('click',showPreferences));
 if(location.hash==='#advertising-settings'||(isHome&&!choice))showPreferences();
}
function start(){
 setupBanner();
 if(!isHome)return;
 for(const id of ['newsGrid','archiveList']){
  const node=document.getElementById(id);if(node)new MutationObserver(sync).observe(node,{childList:true});
 }
 window.addEventListener('dd-public-section-change',sync);
 window.addEventListener('resize',sync);
 window.addEventListener('storage',e=>{
  if(e.key!==CHOICE_KEY)return;
  choice=e.newValue==='accepted'||e.newValue==='declined'?e.newValue:null;
  clearSlots();if(choice==='accepted')sync();else if(!choice)showPreferences();
 });
 if(choice==='accepted')sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();