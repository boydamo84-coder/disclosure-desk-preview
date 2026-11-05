/* Disclosure Desk newsroom ticker — public-source headlines only, no private backend. */
(function (root) {
  'use strict';
  const HOUR = 3600000;
  const BREAKING_WINDOW = 2 * HOUR;
  const RECENT_WINDOW = 48 * HOUR;
  const KEY = 'dd_live_news_ticker_preferences_v1';

  function safeSourceUrl(value) {
    if (typeof value !== 'string' || value.length > 2048) return '';
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' || !host || url.username || url.password ||
          host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') ||
          host === '127.0.0.1' || host === '0.0.0.0' || host === '[::1]') return '';
      return url.href;
    } catch { return ''; }
  }

  function selectHeadlines(rows, now) {
    const time = Number.isFinite(now) ? now : Date.now();
    const seen = new Set(), breaking = [], recent = [];
    if (!Array.isArray(rows)) return {breaking, recent, major: []};
    for (const r of rows) {
      if (!r || typeof r.headline !== 'string' || typeof r.source !== 'string') continue;
      const title = r.headline.trim(), source = r.source.trim();
      const url = safeSourceUrl(r.url);
      const date = typeof r.date === 'string' ? Date.parse(r.date) : NaN;
      const age = time - date;
      if (!title || !source || !url || !Number.isFinite(age) || age < 0 || age > RECENT_WINDOW) continue;
      const unique = url.toLowerCase();
      if (seen.has(unique)) continue;
      seen.add(unique);
      const article = {
        id: String(r.id || url).slice(0, 350),
        headline: title.slice(0, 240),
        source: source.slice(0, 90),
        url, date: date,
        major: r.priority === 'major'
      };
      (age <= BREAKING_WINDOW ? breaking : recent).push(article);
    }
    breaking.sort((a, b) => b.date - a.date);
    recent.sort((a, b) => b.date - a.date);
    return {breaking, recent, major: breaking.filter(r => r.major)};
  }

  const core = {safeSourceUrl, selectHeadlines, BREAKING_WINDOW, RECENT_WINDOW};
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (!root || !root.document) return;

  const doc = root.document;
  const byId = id => doc.getElementById(id);
  function readPrefs() {
    try {
      const value = JSON.parse(root.localStorage.getItem(KEY) || '{}');
      return {
        hub: value.hub !== false,
        alerts: value.alerts !== false,
        dismissed: Array.isArray(value.dismissed) ? value.dismissed.filter(x => typeof x === 'string').slice(-80) : []
      };
    } catch { return {hub: true, alerts: true, dismissed: []}; }
  }
  let prefs = readPrefs();
  function store() {
    try { root.localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  }
  function makeLink(article, isCopy) {
    const link = doc.createElement('a');
    link.className = 'dd-ticker-link';
    link.href = article.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = article.headline + '  ·  ' + article.source;
    link.title = 'Read reporting from ' + article.source;
    if (isCopy) { link.setAttribute('aria-hidden', 'true'); link.tabIndex = -1; }
    link.addEventListener('click', event => {
      if (typeof root.ddTickerOpenStory === 'function' &&
          root.ddTickerOpenStory(article.id) === true) event.preventDefault();
    });
    return link;
  }

  function drawTrack(track, articles, emptyText) {
    if (!track) return;
    track.replaceChildren();
    const viewport = track.parentElement;
    const signature = JSON.stringify(articles.map(x => [x.id, x.headline, x.source, x.date]));
    if (track.dataset.signature === signature) return;
    track.dataset.signature = signature;
    if (!articles.length) {
      const empty = doc.createElement('span');
      empty.className = 'dd-ticker-empty';
      empty.textContent = emptyText;
      track.appendChild(empty);
      viewport.classList.add('dd-ticker-still');
      return;
    }
    viewport.classList.remove('dd-ticker-still');
    // Two visually identical runs make a seamless loop; only the first is keyboard-visible.
    for (let copy = 0; copy < 2; copy++) {
      const group = doc.createElement('span');
      group.className = 'dd-ticker-run';
      if (copy) group.setAttribute('aria-hidden', 'true');
      for (const article of articles) group.appendChild(makeLink(article, copy > 0));
      track.appendChild(group);
    }
    const chars = articles.reduce((n, a) => n + a.headline.length + a.source.length, 0);
    track.style.setProperty('--dd-news-scroll-seconds', Math.min(240, Math.max(22, chars / 9)) + 's');
  }

  function init() {
    const hub = byId('ddNewsTickerHub'), floating = byId('ddNewsTickerAlert');
    const newsSection = byId('discover');
    if (!hub || !floating || !newsSection) return;
    const hubBody = byId('ddNewsTickerRows');
    const toggleHub = byId('ddNewsTickerHubToggle');
    const toggleAlerts = byId('ddNewsTickerAlertsToggle');
    const hide = byId('ddNewsTickerHide');
    const off = byId('ddNewsTickerOff');

    function render() {
      const selected = selectHeadlines(root.ddNewsTickerRows || []);
      const isNewsTab = !newsSection.classList.contains('hidden');
      hub.hidden = !isNewsTab;
      doc.body.classList.toggle('dd-news-ticker-visible', isNewsTab);
      doc.body.classList.toggle('dd-news-ticker-expanded', isNewsTab && prefs.hub);
      hubBody.hidden = !prefs.hub;
      toggleHub.textContent = prefs.hub ? 'Hide ticker' : 'Show ticker';
      toggleHub.setAttribute('aria-expanded', String(prefs.hub));
      toggleAlerts.textContent = 'Alerts: ' + (prefs.alerts ? 'On' : 'Off');
      toggleAlerts.setAttribute('aria-pressed', String(prefs.alerts));
      drawTrack(byId('ddNewsTickerBreakingTrack'), selected.breaking,
        'No sourced headlines published in the last 2 hours.');
      drawTrack(byId('ddNewsTickerRecentTrack'), selected.recent,
        'No sourced headlines between 2 and 48 hours old.');
      const newMajor = selected.major.filter(x => !prefs.dismissed.includes(x.id));
      floating.hidden = isNewsTab || !prefs.alerts || !newMajor.length;
      if (!floating.hidden) {
        drawTrack(byId('ddNewsTickerAlertTrack'), newMajor, '');
      }
    }
    toggleHub.addEventListener('click', () => { prefs.hub = !prefs.hub; store(); render(); });
    toggleAlerts.addEventListener('click', () => {
      prefs.alerts = !prefs.alerts;
      if (prefs.alerts) prefs.dismissed = [];
      store(); render();
    });
    hide.addEventListener('click', () => {
      const selected = selectHeadlines(root.ddNewsTickerRows || []);
      prefs.dismissed = [...new Set([...prefs.dismissed, ...selected.major.map(x => x.id)])].slice(-80);
      store(); render();
    });
    off.addEventListener('click', () => { prefs.alerts = false; store(); render(); });
    root.addEventListener('dd-news-updated', render);
    function measureDock(){
      const nav = doc.querySelector('.nav');
      if (nav) doc.documentElement.style.setProperty('--dd-news-nav-height', Math.ceil(nav.getBoundingClientRect().height) + 'px');
    }
    measureDock();
    root.addEventListener('resize', measureDock);
    if (root.ResizeObserver) {
      const dock = doc.querySelector('.nav');
      if (dock) new root.ResizeObserver(measureDock).observe(dock);
    }
    // Navigation updates the .hidden class; observer avoids modifying the site-wide router.
    new MutationObserver(render).observe(newsSection, {attributes: true, attributeFilter: ['class']});
    root.setInterval(() => {
      if (doc.visibilityState !== 'hidden') render();
    }, 60000);
    // The existing source feed is updated on GitHub; refreshing does not create a new service.
    root.setInterval(() => {
      if (doc.visibilityState !== 'hidden' && typeof root.ddTickerRefresh === 'function')
        root.ddTickerRefresh();
    }, 10 * 60000);
    render();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
