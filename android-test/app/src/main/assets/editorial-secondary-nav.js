/* M12.1 Android-only editorial navigation.
 * Mirrors the visible public-site dock without replacing the site's home navigation.
 * MainActivity injects only into explicitly allowed bundled HTTPS research pages.
 * No external assets, no privileged JS interface and no public-website deployment.
 */
(function(){
  'use strict';
  if(document.getElementById('ddAndroidEditorialNav')) return true;
  const allowed=new Set([
    '/who-is-who','/who-is-who.html','/investigations','/investigations.html',
    '/guide','/guide.html','/sources','/sources.html',
    '/research-edition','/research-edition.html','/rendlesham-forest-1980',
    '/rendlesham-forest-1980.html','/roswell-1947','/roswell-1947.html',
    '/terms','/terms.html','/privacy','/privacy.html','/community-rules',
    '/community-rules.html'
  ]);
  if(!allowed.has(location.pathname))return false;
  // Same order, names and symbols as index.html's dock + approved Discussions/Chat injected tabs.
  const tabs=[
    ['discover','◈','News'],['archivePage','▥','Archive'],
    ['peopleDirectory','♙','Who’s Who'],['researchStudio','✎','W.NE'],
    ['mapPage','◎','Map'],['clips','▶','Videos'],['livePage','●','LIVE'],
    ['boards','▣','Boards'],['witness','◉','Witness'],
    ['discussionsPage','☷','Discussions'],
    ['watchRead','♫','Watch & Read'],['chatPage','','Chat'],
    ['profilePage','👤','Profile'],
    ['hub','☷','Explore']
  ];
  const current=location.pathname.startsWith('/who-is-who')?'peopleDirectory':
    location.pathname.startsWith('/research-edition')?'researchStudio':null;
  const style=document.createElement('style');
  style.id='ddAndroidEditorialNavStyles';
  style.textContent=`
#ddAndroidEditorialNav.nav{position:fixed;z-index:850;bottom:0;left:0;right:0;background:#101a27f7;backdrop-filter:blur(10px);border-top:1px solid #36485a;padding:7px 5px 7px}
#ddAndroidEditorialNav .nav-inner{max-width:820px;display:flex;justify-content:space-between;margin:auto;overflow-x:auto;scrollbar-width:none;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding-right:20px}
#ddAndroidEditorialNav .nav-inner::-webkit-scrollbar{display:none}
#ddAndroidEditorialNav .tab{min-width:72px;flex:1 0 72px;scroll-snap-align:center;background:transparent;color:#8ca1b3;border:0;font:400 10px system-ui,-apple-system,Segoe UI,sans-serif;padding:6px 1px;min-height:49px;overflow-wrap:anywhere;text-align:center;cursor:pointer}
#ddAndroidEditorialNav .tab .ico{display:block;font-size:21px;margin-bottom:2px;line-height:1.2}
#ddAndroidEditorialNav .tab.active{color:#efd3a0}
#ddAndroidEditorialNav .tab[data-tab="chatPage"] .ico .dd-chat-nav-symbol{display:block;width:21px;height:21px;margin:auto;stroke:currentColor;fill:none}
#ddAndroidEditorialNav .tab:focus-visible,#ddAndroidEditorialNav .dd-nav-swipe-hint:focus-visible{outline:2px solid #e8c98d;outline-offset:2px}
#ddAndroidEditorialNav .dd-nav-swipe-hint{position:absolute;top:8px;bottom:auto;width:27px;min-width:27px;height:43px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:0;border:1px solid #705e3c;border-radius:7px;background:#162739e8;font-size:25px;color:#e8cb91;cursor:pointer;z-index:2}
#ddAndroidEditorialNav .dd-nav-swipe-prev{left:2px;right:auto;background:linear-gradient(90deg,#1a3043,#101a27)}
#ddAndroidEditorialNav .dd-nav-swipe-next{right:2px;left:auto;background:linear-gradient(270deg,#1a3043,#101a27)}
#ddAndroidEditorialNav .dd-nav-swipe-hint[hidden]{display:none!important}
body.dd-android-editorial-nav{padding-bottom:max(83px,env(safe-area-inset-bottom,0px))!important}
body.dd-android-keyboard-open #ddAndroidEditorialNav{display:none!important}
@media(max-width:390px){#ddAndroidEditorialNav .nav-inner{gap:1px}#ddAndroidEditorialNav .tab{font-size:9px;padding:6px 0}#ddAndroidEditorialNav .tab .ico{font-size:19px}}
`;
  document.head.appendChild(style);
  const nav=document.createElement('nav');
  nav.className='nav';nav.id='ddAndroidEditorialNav';
  nav.setAttribute('aria-label','App navigation');
  const rail=document.createElement('div');rail.className='nav-inner';
  const prev=document.createElement('button');prev.type='button';
  prev.className='dd-nav-swipe-hint dd-nav-swipe-prev';prev.id='ddAndroidNavPrev';
  prev.setAttribute('aria-label','Scroll navigation one tab left');prev.textContent='‹';prev.hidden=true;
  const next=document.createElement('button');next.type='button';
  next.className='dd-nav-swipe-hint dd-nav-swipe-next';next.id='ddAndroidNavNext';
  next.setAttribute('aria-label','Scroll navigation one tab right');next.textContent='›';next.hidden=true;
  function chatGlyph(){
    // Match assets/chat-tab-ui.js's original SVG icon on the public home dock.
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.85');svg.setAttribute('stroke-linejoin','round');
    svg.setAttribute('stroke-linecap','round');svg.setAttribute('aria-hidden','true');
    svg.setAttribute('class','dd-chat-nav-symbol');
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d','M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4.2-1L3 21l2-5a8.5 8.5 0 1 1 16-4.5Z');
    svg.appendChild(path);return svg;
  }
  for(const [id,icon,label] of tabs){
    const btn=document.createElement('button');btn.type='button';btn.className='tab';
    btn.dataset.tab=id;
    if(id===current){btn.classList.add('active');btn.setAttribute('aria-current','page')}
    btn.setAttribute('aria-label',label==='Who’s Who'?'Who’s Who in Disclosure':label);
    const ico=document.createElement('span');ico.className='ico';
    if(id==='chatPage')ico.appendChild(chatGlyph());else ico.textContent=icon;
    ico.setAttribute('aria-hidden','true');
    btn.appendChild(ico);btn.appendChild(document.createTextNode(label));
    btn.addEventListener('click',()=>{
      if(id==='peopleDirectory'){
        if(location.pathname.startsWith('/who-is-who')){
          if(typeof window.DDPeopleDirectoryBack==='function')window.DDPeopleDirectoryBack();
          return;
        }
        location.assign('/who-is-who.html');
      }else location.assign('/?dd_tab='+encodeURIComponent(id));
    });
    rail.appendChild(btn);
  }
  nav.append(prev,rail,next);document.body.appendChild(nav);
  document.body.classList.add('dd-android-editorial-nav');
  const update=()=>{
    const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
    prev.hidden=max<8||rail.scrollLeft<=5;
    next.hidden=max<8||rail.scrollLeft>=max-5;
  };
  const shift=direction=>{
    const first=rail.querySelector('.tab');
    const width=first?first.getBoundingClientRect().width:72;
    const target=Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,rail.scrollLeft+direction*width));
    rail.scrollTo({left:target,behavior:'smooth'});
  };
  prev.addEventListener('click',()=>shift(-1));
  next.addEventListener('click',()=>shift(1));
  rail.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  if(window.ResizeObserver)new ResizeObserver(update).observe(rail);
  requestAnimationFrame(update);
  // Consistent with the native shell: don't cover text fields when keyboard is shown.
  const isEditing=el=>!!el&&(
    el.matches?.('input,textarea,select,[contenteditable=true]')||
    !!el.closest?.('[contenteditable=true]')
  );
  const syncKeyboard=()=>document.body.classList.toggle(
    'dd-android-keyboard-open',isEditing(document.activeElement)
  );
  document.addEventListener('focusin',syncKeyboard);
  document.addEventListener('focusout',()=>setTimeout(syncKeyboard,50));
  return true;
})()
