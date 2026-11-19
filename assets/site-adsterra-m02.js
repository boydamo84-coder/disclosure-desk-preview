/* Disclosure Desk Ads M02 — REAL UNIT ADAPTER / RELEASE LOCKED.
 * Publisher supplied three standard Adsterra iframe tags on 18 Nov 2026.
 * IMPORTANT: the release gate is FALSE: never load a network ad by default.
 * No popunder / smartlink / social-bar / notifications, and no W.NE slots.
 * Explicit standalone advertising consent must be accepted before ad requests.
 * Provider creative, UK privacy, iframe compatibility and mobile QA remain pending.
 */
(()=>{'use strict';
const RELEASE_ENABLED=false; // Must stay FALSE until explicit owner release, audits and QA.
const CHOICE_KEY='dd-site-advertising-consent-v1';
const ROOT='https://bicea.org/22/';
const UNIT=Object.freeze({
  tile:Object.freeze({width:300,height:250,key:'6e71e0ae33c20d811ac3ff6e51c016a5'}),
  mobile:Object.freeze({width:320,height:50,key:'583ba41b4ca944fbeb2ae6136eec2cdd'}),
  wide:Object.freeze({width:728,height:90,key:'4e32127ce7b1af4bb948957fe0015e97'})
});
window.DDAdsterraM02=Object.freeze({releaseEnabled:RELEASE_ENABLED,
  units:Object.freeze(Object.fromEntries(Object.entries(UNIT).map(([name,u])=>[name,Object.freeze({width:u.width,height:u.height})]))),
  advertisingConsentSeparateFromAnalytics:true});
if(!RELEASE_ENABLED||window.top!==window||
   !['/','/index.html','/privacy','/privacy.html'].includes(location.pathname)||
   window.DDAdLayoutM01?.preview)return;

let choice=null,banner=null;
try{const saved=localStorage.getItem(CHOICE_KEY);if(saved==='accepted'||saved==='declined')choice=saved}catch(_){}
const isHome=location.pathname==='/'||location.pathname==='/index.html';
const plan=(count,every,max)=>{const out=[];for(let n=every;n<=count&&out.length<max;n+=every)out.push(n);return out};
const slots=()=>Array.from(document.querySelectorAll('.dd-adsterra-slot'));
function activeTab(){return document.querySelector('.nav .tab.active')?.dataset.tab||'discover'}
function clearSlots(){slots().forEach(node=>node.remove())}
function responsiveUnit(host){
 const available=host.getBoundingClientRect().width;
 return window.innerWidth>=1024&&available>=748?'wide':'mobile';
}
function makeSlot(area,index,unitName,host){
 const unit=UNIT[unitName];
 const aside=document.createElement('aside');
 aside.className='dd-adsterra-slot';
 aside.dataset.ddAdArea=area;aside.dataset.ddAdSequence=String(index);
 aside.dataset.ddAdUnit=unitName;aside.setAttribute('aria-label','Advertisement');
 const label=document.createElement('span');
 label.className='dd-adsterra-label';label.textContent='Advertisement';
 const wrap=document.createElement('div');wrap.className='dd-adsterra-frame-wrap';
 const width=Math.min(unit.width,Math.max(1,document.documentElement.clientWidth-36),
  Math.max(1,host.getBoundingClientRect().width-22));
 const scale=Math.min(1,width/unit.width);
 wrap.style.width=(unit.width*scale)+'px';wrap.style.height=(unit.height*scale)+'px';
 const frame=document.createElement('iframe');frame.title='Advertisement';
 frame.width=String(unit.width);frame.height=String(unit.height);
 frame.setAttribute('sandbox','allow-scripts'); // No popups, top navigation or same-origin.
 frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
 frame.setAttribute('loading','lazy');frame.style.transformOrigin='0 0';
 frame.style.transform='scale('+scale+')';
 frame.style.width=unit.width+'px';frame.style.height=unit.height+'px';
 frame.style.border='0';frame.style.display='block';
 // Keep each Adsterra atOptions global isolated in a sandboxed opaque-origin frame.
 // The vendor script is not even placed in an iframe until AFTER affirmative consent.
 frame.srcdoc='<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;overflow:hidden"><script>atOptions={key:'+JSON.stringify(unit.key)+',format:"iframe",height:'+unit.height+',width:'+unit.width+',params:{}};<\/script><script src="'+ROOT+unit.key+'"><\/script></body></html>';
 wrap.append(frame);aside.append(label,wrap);
 return aside;
}
function syncFeed(hostId,selector,every,max,area,unit){
 const host=document.getElementById(hostId);if(!host)return;
 const entries=Array.from(host.children).filter(n=>n.matches(selector));
 const stops=plan(entries.length,every,max);
 const current=Array.from(host.children).filter(n=>n.classList.contains('dd-adsterra-slot'));
 const unitName=typeof unit==='function'?unit(host):unit;
 const correct=current.length===stops.length&&stops.every((n,i)=>
  current[i].dataset.ddAdArea===area&&current[i].dataset.ddAdUnit===unitName&&
  entries[n-1].nextElementSibling===current[i]);
 if(correct)return;
 current.forEach(n=>n.remove());
 stops.forEach((n,i)=>entries[n-1].after(makeSlot(area,i+1,unitName,host)));
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
 const node=makeSlot(area,1,unitName,host);
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
 desc.textContent='May Adsterra load adverts on public News, Archive, Videos and Discussions pages? Adverts may use cookies or similar technologies. This choice is separate from analytics. You can say no and keep using Disclosure Desk.';
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