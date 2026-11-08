/* Disclosure Desk GA4 basic opt-in consent on public pages only.
 * No Google request or cookieless analytics ping before acceptance.
 * Advertising consent remains separate; no private content is measured.
 */
(()=>{'use strict';
const MEASUREMENT='G-ZWJQMK8JSW',KEY='dd-site-analytics-consent-v1';
const pages=new Set(['/','/index.html','/guide.html','/sources.html',
 '/community-rules.html','/privacy.html','/research-edition.html']);
const path=location.pathname;if(!pages.has(path)||window.top!==window)return;
const sections=Object.freeze({
 discover:'News',archivePage:'Archive',mapPage:'Map',clips:'Videos',
 livePage:'Live',witness:'Witness',watchRead:'Watch and Read',hub:'Explore'
});
let state=null,started=false,lastPage='',banner=null;
try{const raw=localStorage.getItem(KEY);if(raw==='accepted'||raw==='declined')state=raw}catch(_){}
function store(v){state=v;try{localStorage.setItem(KEY,v)}catch(_){}}
function show(v){if(banner)banner.hidden=!v}
function bootTag(){
 if(started||state!=='accepted')return;
 started=true;window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 window.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',
  ad_personalization:'denied',analytics_storage:'denied'});
 window.gtag('js',new Date());
 window.gtag('consent','update',{analytics_storage:'granted'});
 window.gtag('config',MEASUREMENT,{send_page_view:false,allow_google_signals:false,
  allow_ad_personalization_signals:false,anonymize_ip:true});
 const script=document.createElement('script');
 script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+MEASUREMENT;
 script.referrerPolicy='no-referrer';
 document.head.appendChild(script);
}
function current(){
 if(path!=='/'&&path!=='/index.html')return path;
 const tab=document.querySelector('.nav .tab.active')?.dataset.tab;
 return '/site/'+(sections[tab]||'News').toLowerCase().replace(/[^a-z0-9]+/g,'-');
}
function measure(p){
 if(state!=='accepted')return;
 bootTag();
 if(!started||p===lastPage)return;
 if(!/^\/(?:site\/[a-z0-9-]+|(?:guide|sources|community-rules|privacy|research-edition)\.html)$/.test(p))return;
 lastPage=p;
 window.gtag('event','page_view',{page_title:'Disclosure Desk · '+p.slice(1),
  page_location:location.origin+p,page_path:p,page_referrer:''});
}
function deleteAnalyticsCookies(){
 for(const name of document.cookie.split(';').map(s=>s.trim().split('=')[0])){
  if(!/^_ga(?:_|$)/.test(name))continue;
  for(const domain of ['',location.hostname,'.'+location.hostname,'.uapdisclosuredesk.com']){
   document.cookie=name+'=;Max-Age=0;Path=/;SameSite=Lax'+(domain?';Domain='+domain:'');
  }
 }
}
function choose(yes){
 store(yes?'accepted':'declined');show(false);
 if(yes){bootTag();measure(current())}
 else{lastPage='';if(started&&window.gtag)
  window.gtag('consent','update',{analytics_storage:'denied'});
  deleteAnalyticsCookies()}
}
function preferences(){show(true);banner?.querySelector('[data-accept]')?.focus({preventScroll:true})}
function create(){
 const style=document.createElement('style');
 style.id='dd-analytics-consent-style';
style.textContent="\n#dd-analytics-consent{position:fixed;z-index:10050;left:12px;right:12px;bottom:max(90px,env(safe-area-inset-bottom));margin:0 auto;max-width:470px;max-height:65dvh;overflow:auto;box-sizing:border-box;padding:14px 16px;border:1px solid #dbb47a;border-radius:14px;background:#152b3a;color:#f6ebdb;box-shadow:0 12px 42px #000b;font:13px/1.45 system-ui,sans-serif}\n#dd-analytics-consent[hidden]{display:none!important}\n#dd-analytics-consent strong{display:block;color:#efd198;margin-bottom:4px;font-size:14px}\n#dd-analytics-consent p{margin:0 0 11px;color:#f3e5d1}\n#dd-analytics-consent .dd-analytics-buttons{display:flex;flex-wrap:wrap;gap:8px;align-items:center}\n#dd-analytics-consent button{min-height:44px;border-radius:9px;padding:9px 14px;border:1px solid #bba079;background:#273e4e;color:#fff5e8;cursor:pointer;font-weight:650}\n#dd-analytics-consent button[data-accept]{background:#d9b780;color:#142331}\n#dd-analytics-consent button:focus-visible{outline:3px solid #fff4d2;outline-offset:2px}\n#dd-analytics-consent a{color:#f6d49c;text-decoration:underline}\n@media(min-width:750px){#dd-analytics-consent{bottom:18px}}\n";
 document.head.appendChild(style);
 banner=document.createElement('section');
 banner.id='dd-analytics-consent';banner.hidden=true;
 banner.setAttribute('role','region');banner.setAttribute('aria-label','Optional website analytics');
 const h=document.createElement('strong');h.textContent='Optional website analytics';
 const info=document.createElement('p');
 info.textContent='May we measure visits to public pages using Google Analytics? Private reports, messages and account details are not tracked. Advertising consent is separate.';
 const actions=document.createElement('div');actions.className='dd-analytics-buttons';
 const allow=document.createElement('button');allow.type='button';allow.dataset.accept='yes';allow.textContent='Allow analytics';
 const no=document.createElement('button');no.type='button';no.dataset.decline='yes';no.textContent='No thanks';
 const link=document.createElement('a');link.href='/privacy.html#analytics-settings';link.textContent='Privacy & preferences';
 allow.addEventListener('click',()=>choose(true));no.addEventListener('click',()=>choose(false));
 actions.append(allow,no,link);banner.append(h,info,actions);document.body.appendChild(banner);
 document.querySelectorAll('[data-dd-analytics-open]').forEach(x=>x.addEventListener('click',preferences));
 if(location.hash==='#analytics-settings')preferences();
 else if(!state)show(true);
 if(state==='accepted')measure(current());
}
window.DDAnalyticsConsent=Object.freeze({openPreferences:preferences});
window.addEventListener('dd-public-section-change',event=>{
 const name=sections[String(event.detail?.section||'')];
 if(name)measure('/site/'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'));
});
window.addEventListener('storage',event=>{
 if(event.key!==KEY)return;
 if(event.newValue==='accepted'){state='accepted';show(false);measure(current());}
 else if(event.newValue==='declined'){state='declined';show(false);
  if(started&&window.gtag)window.gtag('consent','update',{analytics_storage:'denied'});
  deleteAnalyticsCookies();
 }else{state=null;show(true)}
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});
else create();
})();