/* Shared web dock. Existing Home tab nodes keep their handlers and badge mounts. */
(() => {
  'use strict';

  const android = navigator.userAgent.includes('DisclosureDeskAndroid');
  const webPrimary = ['discover', 'archivePage', 'originalResearchPage', 'peopleDirectory', 'researchStudio'];
  const appPrimary = ['discover', 'clips', 'archivePage', 'originalResearchPage', 'researchStudio'];
  const preferencesKey = 'dd-android-dock-order-v1';
  const labels = {discover:'News',clips:'Videos',archivePage:'Archive',originalResearchPage:'Research',researchStudio:'W.NE',peopleDirectory:'Who’s Who',mapPage:'Map',livePage:'LIVE',boards:'Boards',witness:'Witness',discussionsPage:'Discussions',watchRead:'Watch & Read',chatPage:'Chat',profilePage:'Profile',hub:'Help',cases:'Case Files',rabbitHole:'Rabbit Hole',resources:'Documents',about:'About'};
  const primary = android ? appPrimary : webPrimary;
  const icons = {
    discover: 'M4 5h16v14H4zM8 9h3v4H8zM14 9h3m-3 4h3m-9 3h9',
    archivePage: 'M4 8h16v12H4zM3 4h18v4H3zM9 12h6',
    originalResearchPage: 'M16 16l4 4M11 17a6 6 0 1 1 0-12 6 6 0 0 1 0 12z',
    peopleDirectory: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2',
    researchStudio: 'M4 20l1-5L16 4l4 4L9 19zM13 7l4 4m-5 9h8',
    mapPage: 'M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 0 1 14 0zM14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    clips: 'M3 5h18v14H3zM10 9l5 3-5 3z',
    livePage: 'M8 8a6 6 0 0 0 0 8m8-8a6 6 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14M12 11v2',
    boards: 'M4 4h16v16H4zM8 8h8m-8 4h3m2 0h3m-8 4h8',
    witness: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    discussionsPage: 'M4 4h16v11H9l-5 4zM8 8h8m-8 3h6',
    watchRead: 'M3 5h6l3 2 3-2h6v13h-6l-3 2-3-2H3zM12 7v13',
    chatPage: 'M20 11.5a8 8 0 0 1-8 8 9 9 0 0 1-3.5-.8L4 20l1.3-4.2a8 8 0 1 1 14.7-4.3z',
    profilePage: 'M20 12A8 8 0 1 1 4 12a8 8 0 0 1 16 0zM8 17a4 4 0 0 1 8 0m-2-7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    hub: 'M20 12A8 8 0 1 1 4 12a8 8 0 0 1 16 0zM10 10a2 2 0 1 1 3 1.7c-.8.5-1 1-1 1.3m0 2v.5',
    cases: 'M3 7h7l2 2h9v10H3zM3 7V5h7l2 2h7v2',
    rabbitHole: 'M6 6h12M7 10h10m-8 4h6m-4 4h2M12 18v3',
    resources: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6',
    podcasts: 'M4 13v-2a8 8 0 0 1 16 0v2M4 13h4v6H4zm12 0h4v6h-4z',
    about: 'M20 12A8 8 0 1 1 4 12a8 8 0 0 1 16 0zM12 11v6m0-10v.5',
    more: 'M5 12h.5m6.5 0h.5m6.5 0h.5',
  };
  const additional = [
    ['cases', 'Case Files'], ['rabbitHole', 'Rabbit Hole'], ['resources', 'Documents'],
    ['about', 'About'],
  ];

  function addIcon(button, id) {
    const glyph = icons[id];
    if (!glyph) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', glyph);
    svg.append(path);
    const icon = button.querySelector('.ico') || document.createElement('span');
    icon.className = 'ico';
    icon.setAttribute('aria-hidden', 'true');
    icon.replaceChildren(svg);
    button.prepend(icon);
  }

  function makeTab(id, label, action) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab';
    tab.dataset.tab = id;
    tab.textContent = label;
    tab.addEventListener('click', action);
    return tab;
  }

  function mount(nav, action) {
    const rail = nav.querySelector('.nav-inner');
    if (!rail || nav.classList.contains('dd-site-dock')) return;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab dd-dock-more';
    trigger.textContent = 'More';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'dialog');
    addIcon(trigger, 'more');

    const dialog = document.createElement('dialog');
    dialog.id = 'ddDockMore';
    dialog.className = 'dd-dock-dialog';
    dialog.setAttribute('aria-labelledby', 'ddDockMoreTitle');
    trigger.setAttribute('aria-controls', dialog.id);
    dialog.innerHTML = '<div class="dd-dock-panel"><div class="dd-dock-heading"><h2 id="ddDockMoreTitle">More destinations</h2><button type="button">Close</button></div><div class="dd-dock-links"></div></div>';
    const destinations = dialog.querySelector('.dd-dock-links');
    const close = dialog.querySelector('.dd-dock-heading button');
    function syncSelected() {
      trigger.classList.toggle('dd-dock-current', !!destinations.querySelector('[aria-current="page"]'));
      // Reuse the existing live news/video/chat badges. Do not query another
      // endpoint, accumulate counts, or display private chat content.
      let attention = 0;
      for (const tab of destinations.querySelectorAll('[data-tab]')) {
        const unread = !tab.hidden && !tab.classList.contains('hidden') &&
          !!tab.querySelector('[data-new-badge]:not([hidden]), .dd-chat-unread-badge:not([hidden])');
        tab.toggleAttribute('data-dd-attention', unread);
        if (unread) attention++;
      }
      trigger.toggleAttribute('data-dd-attention', attention > 0);
      trigger.setAttribute('aria-label', attention ? 'More destinations, '+attention+' with new items' : 'More');
    }
    const registered = new Map();
    let preference = appPrimary.slice(), draft = null;
    if(android){
      try{
        const saved=JSON.parse(localStorage.getItem(preferencesKey)||'null');
        if(Array.isArray(saved)&&saved.length===5&&new Set(saved).size===5&&saved.every(id=>Object.hasOwn(labels,id)))preference=saved;
      }catch(_){}
    }
    const available = () => [...registered.entries()].filter(([id,tab])=>Object.hasOwn(labels,id)&&tab.isConnected&&!tab.hidden&&!tab.classList.contains('hidden')).map(([id])=>id);
    function desired(order=preference){
      const ids=available();
      return [...new Set([...order,...appPrimary,...ids])].filter(id=>ids.includes(id)).slice(0,5);
    }
    function register(){
      for(const tab of [...rail.querySelectorAll(':scope > [data-tab]'),...destinations.querySelectorAll(':scope > [data-tab]')]){
        const id=tab.dataset.tab;
        if(registered.get(id)===tab)continue;
        addIcon(tab,id);registered.set(id,tab);
      }
    }
    function placeTabs() {
      if(!android){
        for (const tab of rail.querySelectorAll('[data-tab]')) {
          if(!tab.querySelector('.ico svg, .ico img'))addIcon(tab, tab.dataset.tab);
          if (!primary.includes(tab.dataset.tab)) destinations.append(tab);
        }
        syncSelected();
        return;
      }
      register();
      const selected=desired();
      for(const [id,tab] of registered){
        if(!tab.isConnected)continue;
        if(!selected.includes(id)&&tab.parentNode!==destinations)destinations.append(tab);
      }
      selected.forEach((id,i)=>{
        const tab=registered.get(id);
        if(rail.children[i]!==tab)rail.insertBefore(tab,rail.children[i]||trigger);
      });
      if(rail.lastElementChild!==trigger)rail.append(trigger);
      syncSelected();
    }
    for (const [id, label] of additional) {
      const tab = makeTab(id, label, () => action(id));
      addIcon(tab, id);
      destinations.append(tab);
    }
    rail.append(trigger);
    nav.append(dialog);
    nav.classList.add('dd-site-dock');
    if(android){
      const customise=document.createElement('button');
      customise.type='button';customise.className='dd-dock-customise';customise.textContent='Customise bottom tabs';
      customise.setAttribute('aria-expanded','false');
      const settings=document.createElement('section');
      settings.className='dd-dock-settings';settings.hidden=true;settings.id='ddDockSettings';
      customise.setAttribute('aria-controls',settings.id);
      settings.innerHTML='<h3>Your bottom tabs</h3><p>Choose the five destinations in the order you prefer. Selecting an existing tab swaps its position. More always stays visible.</p><div class="dd-dock-slots"></div><div class="dd-dock-settings-actions"><button type="button" data-dock-reset>Reset defaults</button><button type="button" data-dock-cancel>Cancel</button><button type="button" data-dock-save>Save tabs</button></div>';
      destinations.before(customise,settings);
      const slots=settings.querySelector('.dd-dock-slots');
      function renderSettings(){
        slots.replaceChildren();
        const choices=available();
        draft.forEach((id,i)=>{
          const row=document.createElement('label');row.className='dd-dock-slot';row.textContent='Position '+(i+1);
          const select=document.createElement('select');select.setAttribute('aria-label','Bottom tab '+(i+1));
          for(const key of choices){
            const option=document.createElement('option');option.value=key;option.textContent=labels[key]||key;select.append(option);
          }
          select.value=id;
          select.addEventListener('change',()=>{
            const value=select.value, other=draft.indexOf(value);
            if(other>=0&&other!==i)draft[other]=draft[i];
            draft[i]=value;
            renderSettings();slots.querySelectorAll('select')[i]?.focus();
          });
          row.append(select);slots.append(row);
        });
      }
      function endSettings(){
        draft=null;settings.hidden=true;destinations.hidden=false;
        customise.setAttribute('aria-expanded','false');
        customise.textContent='Customise bottom tabs';
      }
      customise.addEventListener('click',()=>{
        if(draft){endSettings();return}
        draft=desired();renderSettings();
        settings.hidden=false;destinations.hidden=true;customise.setAttribute('aria-expanded','true');customise.textContent='Back to destinations';
        slots.querySelector('select')?.focus();
      });
      settings.querySelector('[data-dock-reset]').onclick=()=>{draft=desired(appPrimary);renderSettings()};
      settings.querySelector('[data-dock-cancel]').onclick=()=>{endSettings();customise.focus()};
      settings.querySelector('[data-dock-save]').onclick=()=>{
        if(!draft||draft.length!==5||new Set(draft).size!==5)return;
        preference=draft.slice();
        try{localStorage.setItem(preferencesKey,JSON.stringify(preference))}catch(_){}
        placeTabs();endSettings();dialog.close();
      };
      dialog.addEventListener('close',endSettings);
      window.addEventListener('storage',e=>{
        if(e.key!==preferencesKey)return;
        try{
          const value=JSON.parse(e.newValue||'null');
          if(Array.isArray(value)&&value.length===5&&new Set(value).size===5&&value.every(id=>Object.hasOwn(labels,id))){preference=value;placeTabs()}
          else if(!value){preference=appPrimary.slice();placeTabs()}
        }catch(_){}
      });
    }
    placeTabs();
    new MutationObserver(placeTabs).observe(rail, {childList: true});
    new MutationObserver(syncSelected).observe(destinations, {childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'hidden', 'class']});
    trigger.addEventListener('click', () => {
      if (dialog.open) return;
      dialog.showModal();
      trigger.setAttribute('aria-expanded', 'true');
      (destinations.querySelector('[aria-current="page"]') || close).focus();
    });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog && !event.target.closest('[data-tab]')) return;
      if (!dialog.open) return;
      dialog.close();
    });
    dialog.addEventListener('close', () => {
      trigger.setAttribute('aria-expanded', 'false');
      if (document.activeElement === document.body || dialog.contains(document.activeElement)) trigger.focus({preventScroll: true});
    });
    window.addEventListener('popstate', () => { if (dialog.open) dialog.close(); });
  }

  function destination(id) {
    if (id === 'peopleDirectory' && !navigator.userAgent.includes('DisclosureDeskAndroid')) return '/who-is-who.html';
    if (id === 'researchStudio') {
      try {
        if (sessionStorage.getItem('dd-wne-resume-entry-v1') === '1' ||
            localStorage.getItem('dd-wne-resume-entry-v1') === '1' ||
            /^[0-9a-f-]{36}$/i.test(sessionStorage.getItem('wne-research-active-document') || '')) return '/research/index.html';
      } catch (_) {}
    }
    return '/?dd_tab=' + encodeURIComponent(id);
  }
  window.DDSiteDock = {mount, makeTab, addIcon, destination};
  const home = document.querySelector('#ddHomeDock');
  if (home) mount(home, id => window.ddUserNavigateTo?.(id));
})();
