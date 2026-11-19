/* R2 public Who's Who navigation: original 14-tab navy/gold dock,
   matching Home/M12.3 rather than the retired five-tab native shell.
   Only first-party destinations; no auth, storage, trackers or bridge calls. */
(()=>{
 'use strict';
 if(!/^\/who-is-who(?:\.html)?$/.test(location.pathname))return;
 if(document.getElementById('ddWebSecondaryNav')||document.getElementById('ddAndroidEditorialNav'))return;
 const tabs=[
  ['discover','◈','News'],['archivePage','▥','Archive'],
  ['peopleDirectory','♙','Who’s Who'],['researchStudio','✎','W.NE'],
  ['mapPage','◎','Map'],['clips','▶','Videos'],['livePage','●','LIVE'],
  ['boards','▣','Boards'],['witness','◉','Witness'],
  ['discussionsPage','☷','Discussions'],['watchRead','♫','Watch & Read'],
  ['chatPage','','Chat'],['profilePage','👤','Profile'],['hub','☷','Explore']
 ];
 const nav=document.createElement('nav');
 nav.id='ddWebSecondaryNav';nav.className='dd-web-editorial-nav';
 nav.setAttribute('aria-label','App navigation');
 const rail=document.createElement('div');rail.className='nav-inner';
 const arrow=(direction)=>{
  const btn=document.createElement('button');
  btn.type='button';btn.className='dd-nav-swipe-hint dd-nav-swipe-'+direction;
  btn.id=direction==='prev'?'ddWebNavPrev':'ddWebNavNext';
  btn.setAttribute('aria-label',direction==='prev'?'Scroll navigation one tab left':'Scroll navigation one tab right');
  btn.textContent=direction==='prev'?'‹':'›';btn.hidden=true;
  return btn;
 };
 const prev=arrow('prev'),next=arrow('next');
 function chatGlyph(){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('stroke-width','1.85');
  svg.setAttribute('stroke-linecap','round');
  svg.setAttribute('stroke-linejoin','round');
  svg.setAttribute('class','dd-chat-nav-symbol');
  svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(ns,'path');
  path.setAttribute('d','M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4.2-1L3 21l2-5a8.5 8.5 0 1 1 16-4.5Z');
  svg.appendChild(path);return svg;
 }
 for(const [id,symbol,label] of tabs){
  const btn=document.createElement('button');
  btn.type='button';btn.className='tab';btn.dataset.tab=id;
  btn.setAttribute('aria-label',label==='Who’s Who'?'Who’s Who in Disclosure':label);
  if(id==='peopleDirectory'){btn.classList.add('active');btn.setAttribute('aria-current','page')}
  const icon=document.createElement('span');
  icon.className='ico';icon.setAttribute('aria-hidden','true');
  if(id==='chatPage')icon.appendChild(chatGlyph());else icon.textContent=symbol;
  btn.append(icon,document.createTextNode(label));
  btn.addEventListener('click',()=>{
   if(id==='peopleDirectory'){
    const profile=document.getElementById('personProfile');
    if(profile&&!profile.classList.contains('hidden')&&typeof window.DDPeopleDirectoryBack==='function'){
     window.DDPeopleDirectoryBack();
    }else{
     document.getElementById('directoryPage')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
    return;
   }
   // Use the existing Home router, so Archive/W.NE/Map/Chat retain their
   // approved route, account scope and profile behaviour.
   location.assign('/?dd_tab='+encodeURIComponent(id));
  });
  rail.appendChild(btn);
 }
 nav.append(prev,rail,next);
 document.body.appendChild(nav);
 document.body.classList.add('dd-web-secondary-nav');
 const update=()=>{
  const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
  prev.hidden=max<8||rail.scrollLeft<=5;
  next.hidden=max<8||rail.scrollLeft>=max-5;
 };
 const shift=direction=>{
  const tabWidth=rail.querySelector('.tab')?.getBoundingClientRect().width||72;
  rail.scrollTo({left:Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,rail.scrollLeft+direction*tabWidth)),behavior:'smooth'});
 };
 prev.addEventListener('click',()=>shift(-1));
 next.addEventListener('click',()=>shift(1));
 rail.addEventListener('scroll',update,{passive:true});
 window.addEventListener('resize',update);
 if(window.ResizeObserver)new ResizeObserver(update).observe(rail);
 requestAnimationFrame(update);
 // Android M12.3 already has the original dock; suppress the standalone
 // website copy if its injected dock appears after the document is loaded.
 const hideIfAndroid=()=>{
  if(document.getElementById('ddAndroidEditorialNav')){
   nav.hidden=true;nav.style.display='none';
   document.body.classList.remove('dd-web-secondary-nav');
   observer.disconnect();
  }
 };
 const observer=new MutationObserver(hideIfAndroid);
 observer.observe(document.body,{childList:true});
 hideIfAndroid();
 const editing=el=>!!el&&(el.matches?.('input,textarea,select,[contenteditable=true]')||
  !!el.closest?.('[contenteditable=true]'));
 const syncKeyboard=()=>document.body.classList.toggle('dd-web-keyboard-open',editing(document.activeElement));
 document.addEventListener('focusin',syncKeyboard);
 document.addEventListener('focusout',()=>setTimeout(syncKeyboard,50));
})();
