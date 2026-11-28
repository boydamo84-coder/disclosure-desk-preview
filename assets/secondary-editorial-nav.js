/* Public editorial pages use the same destination dock as Home. */
(() => {
  'use strict';
  if(document.documentElement.dataset.ddEmbeddedDirectory==='true')return; // Parent Desk owns the dock.
  const page = location.pathname.replace(/\.html$/, '');
  if (document.getElementById('ddWebSecondaryNav') || document.getElementById('ddAndroidEditorialNav')) return;
  const nav = document.createElement('nav');
  nav.id = 'ddWebSecondaryNav';
  nav.className = 'dd-web-editorial-nav';
  nav.setAttribute('aria-label', 'App navigation');
  const rail = document.createElement('div');
  rail.className = 'nav-inner';
  const tabs = [
    ['discover', 'News'], ['archivePage', 'Archive'], ['originalResearchPage', 'Research'],
    ['peopleDirectory', 'Who’s Who'], ['researchStudio', 'W.NE'], ['mapPage', 'Map'],
    ['clips', 'Videos'], ['livePage', 'LIVE'], ['boards', 'Boards'], ['witness', 'Witness'],
    ['discussionsPage', 'Discussions'], ['watchRead', 'Watch & Read'], ['chatPage', 'Chat'],
    ['profilePage', 'Profile'], ['hub', 'Help'],
  ];
  const researchPage = /^\/(?:first-investigation|investigations|research-collaborations|pursue|foia-tracker|rendlesham-forest-1980|roswell-1947|sources|project-blue-book|nasa-uap-study|pentagon-navy-video-referral|foia-whs-27-f-0917|foia-pentagon-25-f-3215)$/.test(page);
  const current = researchPage ? 'originalResearchPage' : ({
    '/who-is-who': 'peopleDirectory',
    '/nasa-mike-gold': 'peopleDirectory',
    '/david-fravor-hearing': 'peopleDirectory',
    '/world-uap-programmes': 'peopleDirectory',
    '/research-edition': 'researchStudio',
    '/guide': 'hub',
  })[page];

  function openTab(id) {
    if (id === 'peopleDirectory') {
      if (navigator.userAgent.includes('DisclosureDeskAndroid')) { location.assign(window.DDSiteDock.destination(id)); return; }
      if (page !== '/who-is-who') { location.assign(window.DDSiteDock.destination(id)); return; }
      const profile = document.getElementById('personProfile');
      if (profile && !profile.classList.contains('hidden') && typeof window.DDPeopleDirectoryBack === 'function') {
        window.DDPeopleDirectoryBack();
      } else document.getElementById('directoryPage')?.scrollIntoView({block: 'start'});
      return;
    }
    location.assign(window.DDSiteDock.destination(id));
  }

  const dock = window.DDSiteDock;
  for (const [id, label] of tabs) {
    const tab = dock.makeTab(id, label, () => openTab(id));
    if (current === id) {
      tab.classList.add('active');
      tab.setAttribute('aria-current', 'page');
    }
    if (id === 'peopleDirectory') tab.setAttribute('aria-label', 'Who’s Who in Disclosure');
    rail.append(tab);
  }
  nav.append(rail);
  document.body.append(nav);
  document.body.classList.add('dd-web-secondary-nav');
  dock.mount(nav, openTab);
  const editing = el => el?.matches('input:not([type=radio]):not([type=checkbox]):not([type=button]):not([type=submit]),textarea,select,[contenteditable=true]') ||
    el?.closest('[contenteditable=true]');
  const syncKeyboard = () => document.body.classList.toggle('dd-web-keyboard-open', !!editing(document.activeElement));
  document.addEventListener('focusin', syncKeyboard);
  document.addEventListener('focusout', () => setTimeout(syncKeyboard, 50));
})();
