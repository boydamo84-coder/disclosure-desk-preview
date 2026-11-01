/* Disclosure Desk: optional, privacy-first Google Analytics.
 * No GA network request is made unless the visitor explicitly opts in.
 * Do not send usernames, board contents, searches, case notes or email.
 */
(()=>{
'use strict';
const ID='G-ZWJQMK8JSW',KEY='dd-analytics-choice-v1';
let enabled=false,loaded=false;
const status=()=>document.getElementById('ddAnalyticsChoiceStatus');
function stored(){try{return localStorage.getItem(KEY)}catch{return null}}
function persist(value){try{localStorage.setItem(KEY,value)}catch{}}
function updateUI(){
 const s=status();if(s)s.textContent=enabled?'Optional analytics enabled on this device.':'Optional analytics disabled on this device.';
 document.querySelectorAll('[data-dd-analytics-choice]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.ddAnalyticsChoice==='yes')===enabled)));
}
function event(name,parameters){
 if(!enabled||!loaded||typeof window.gtag!=='function')return;
 window.gtag('event',name,parameters);
}
function load(){
 if(loaded)return;
 loaded=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 window.gtag('config',ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ID);
 document.head.append(script);
 event('page_view',{page_title:'Disclosure Desk',page_location:location.origin+location.pathname});
}
function choose(value){
 enabled=value==='yes';
 persist(value);
 if(enabled)load();
 else if(loaded&&typeof window.gtag==='function')window.gtag('consent','update',{analytics_storage:'denied'});
 updateUI();
}
window.ddAnalyticsPage=function(section){
 if(!enabled)return;
 // Only predefined internal section labels; never log visitor content.
 const names={discover:'News',archivePage:'Archive',mapPage:'Map',cases:'Cases',clips:'Videos',rabbitHole:'Rabbit Hole',witness:'Witness Reports',about:'About',resources:'Resources',podcasts:'Podcasts',hub:'Explore',boards:'Investigation Boards',watchRead:'Watch and Read',livePage:'Live'};
 if(names[section])event('screen_view',{screen_name:names[section]});
};
function init(){
 document.querySelectorAll('[data-dd-analytics-choice]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.ddAnalyticsChoice)));
 enabled=stored()==='yes';if(enabled)load();updateUI();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();