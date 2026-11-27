/* Source-first rotating spotlight. No analytics, API or personal storage. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DDResearchSpotlight=api;api.mount(document,root);}
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const epoch=Date.UTC(2026,10,27),period=2*86400000;
 function validRecord(r,kind){
  if(!r||r.kind!==kind||typeof r.id!=='string'||typeof r.title!=='string'||!r.title.trim()||
    typeof r.subtitle!=='string'||typeof r.summary!=='string'||typeof r.source!=='string'||typeof r.href!=='string')return false;
  try{
   const source=new URL(r.source),dest=new URL(r.href,'https://uapdisclosuredesk.com');
   if(source.protocol!=='https:'||source.username||source.password||!r.href.startsWith('/')||dest.origin!=='https://uapdisclosuredesk.com')return false;
   return kind==='pursue'&&/^pursue-r\d{2}-[a-z0-9-]{2,75}$/.test(r.id)
    ?dest.pathname==='/'&&dest.searchParams.get('dd_tab')==='archivePage'&&dest.searchParams.get('dd_archive_case')===r.id&&['www.war.gov','www.dvidshub.net'].includes(source.host)&&/^\d{4}-\d{2}-\d{2}$/.test(r.published)
    :kind==='historical'&&(/^[a-z0-9-]+$/.test(r.id))&&([ '/rendlesham-forest-1980.html','/roswell-1947.html'].includes(dest.pathname)||dest.pathname==='/'&&(dest.searchParams.get('dd_archive_case')===r.id||dest.searchParams.get('case')===r.id));
  }catch{return false;}
 }
 function batch(data,now=Date.now()){
  if(!data||data.version!==1)return [];
  const lists=['historical','pursue'].map(k=>[...new Map((Array.isArray(data[k])?data[k]:[]).filter(x=>validRecord(x,k)).map(x=>[x.id,x])).values()]);
  if(lists.some(a=>a.length<4))return [];
  const slot=Math.floor((now-epoch)/period);
  const indexes=lists.map(a=>((slot*2)%a.length+a.length)%a.length);
  return [lists[0][indexes[0]],lists[1][indexes[1]],lists[0][(indexes[0]+1)%lists[0].length],lists[1][(indexes[1]+1)%lists[1].length]];
 }
 function mount(doc,win){
  const box=doc.getElementById('ddSpotlight');
  if(!box)return;
  let rows=[],index=0,timer=null,paused=false,hovered=false,focused=false,visible=false,chosenKey='';
  const motion=win.matchMedia('(prefers-reduced-motion: reduce)');
  paused=motion.matches;
  const get=id=>doc.getElementById(id);
  const card=get('ddSpotlightCard'),prev=get('ddSpotlightPrev'),next=get('ddSpotlightNext'),pause=get('ddSpotlightPause'),pos=get('ddSpotlightPosition'),live=get('ddSpotlightLive');
  const art=get('ddSpotlightArt'),tag=get('ddSpotlightTag'),title=get('ddSpotlightTitle'),meta=get('ddSpotlightMeta'),summary=get('ddSpotlightSummary');
  let data=null;
  function stop(){if(timer!==null){win.clearInterval(timer);timer=null;}}
  function draw(announce=false){
   const item=rows[index];if(!item)return;
   card.href=item.href;card.dataset.spotlightId=item.id;
   title.textContent=item.title;meta.textContent=item.subtitle;
   summary.textContent=item.summary;
   tag.textContent=item.kind==='pursue'?'PURSUE record':'Historical investigation';
   tag.className='dd-evidence-badge '+(item.kind==='pursue'?'dd-badge-record':'dd-badge-ongoing');
   art.dataset.art=['forest','desert','sea','sky','video','record'].includes(item.art)?item.art:'record';
   art.textContent=item.kind==='pursue'?(item.art==='video'?'▶':'▤'):'◈';
   pos.textContent=(index+1)+' / '+rows.length;
   if(announce)live.textContent='Spotlight '+(index+1)+' of '+rows.length+': '+item.title;
   const label=paused?'Play automatic rotation':'Pause automatic rotation';
   pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',label);pause.title=label;
  }
  function refreshBatch(){
   if(!data)return;
   const r=batch(data),key=r.map(x=>x.id).join('|');
   if(r.length!==4||key===chosenKey)return false;
   chosenKey=key;rows=r;index=0;draw();get('ddSpotlightControls').hidden=false;return true;
  }
  function schedule(){
   stop();if(rows.length!==4||paused||hovered||focused||!visible||doc.hidden)return;
   timer=win.setInterval(()=>{if(!refreshBatch()){index=(index+1)%rows.length;draw();}},9500);
  }
  function step(delta){if(rows.length!==4)return;refreshBatch();index=(index+delta+rows.length)%rows.length;draw(true);schedule();}
  prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  pause.addEventListener('click',()=>{paused=!paused;draw(true);schedule();});
  box.addEventListener('mouseenter',()=>{hovered=true;schedule();});box.addEventListener('mouseleave',()=>{hovered=false;schedule();});
  box.addEventListener('focusin',()=>{focused=true;schedule();});box.addEventListener('focusout',e=>{if(!box.contains(e.relatedTarget)){focused=false;schedule();}});
  doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)refreshBatch();schedule();});
  motion.addEventListener?.('change',e=>{if(e.matches){paused=true;draw();schedule();}});
  if('IntersectionObserver' in win)new win.IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)refreshBatch();schedule();},{threshold:.25}).observe(box);
  else visible=true;
  // Horizontal swipe changes card; leave vertical scrolling and link tapping intact.
  let down=null;
  card.addEventListener('touchstart',e=>{if(e.touches.length===1)down={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  card.addEventListener('touchend',e=>{if(!down||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-down.x,dy=t.clientY-down.y;down=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5){if(e.cancelable)e.preventDefault();step(dx<0?1:-1);}}, {passive:false});
  // Only fetch compact, build-generated public data when home is actually visible.
  function load(){if(data||loading)return;loading=true;win.fetch('/data/research-spotlight.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Spotlight unavailable');return r.json();}).then(value=>{data=value;refreshBatch();schedule();}).catch(()=>{}).finally(()=>{loading=false;});}
  let loading=false;
  const home=doc.getElementById('discover');
  if(!home.classList.contains('hidden'))load();
  new win.MutationObserver(()=>{if(!home.classList.contains('hidden')){load();refreshBatch();schedule();}else stop();}).observe(home,{attributes:true,attributeFilter:['class']});
 }
 return {batch,mount};
});
