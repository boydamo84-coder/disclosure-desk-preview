(() => {
  'use strict';

  const find = id => document.getElementById(id);
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const link = (text, href, className) => {
    const node = element('a', text, className);
    node.href = href;
    return node;
  };
  const button = (text, action) => {
    const node = element('button', text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  };
  const firstPartySources = {
    'foia-27-f-0917': {
      title: 'WHS 27-F-0917 final decision', agency: 'Washington Headquarters Services',
      source: 'https://uapdisclosuredesk.com/data/foia/27-f-0917-decision-extract.pdf',
      page: '/foia-tracker#request-27-f-0917'
    },
    'foia-25-f-3215': {
      title: 'Pentagon 25-F-3215 referral and tracking evidence', agency: 'NAVAIR and Pentagon',
      source: 'https://uapdisclosuredesk.com/data/foia/27-f-0917-referral-extracts.pdf',
      page: '/foia-tracker#request-25-f-3215'
    },
    'navy-video-records-referral': {
      title: 'Tracing the Pentagon referral for the Navy UAP videos', agency: 'Disclosure Desk',
      source: 'https://uapdisclosuredesk.com/investigations#navy-video-records-referral',
      page: '/investigations#navy-video-records-referral'
    }
  };
  const safeOriginal = value => {
    if (Object.values(firstPartySources).some(record => record.source === value)) return value;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && !url.username && !url.password &&
          ['www.war.gov', 'www.dvidshub.net'].includes(url.host)) return url.href;
    } catch {}
    return null;
  };
  const safeRelated = value => typeof value === 'string' &&
    /^\/(?:pursue#record-[a-z0-9-]+|investigations#[a-z0-9-]+)$/.test(value);
  const label = number => 'Release ' + String(number).padStart(2, '0');
  const displayDate = date => new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(date));
  const keyPattern = /^r\d{2}-[a-z0-9-]{2,75}$/;
  const referenceKey = 'wne_research_references_v1';
  const offlineOrigin = 'https://uapdisclosuredesk.com';
  let catalogue;

  function loadCatalogue() {
    catalogue ??= fetch('/data/pursue-index.json').then(async response => {
      if (!response.ok) throw Error('Catalogue unavailable');
      const data = await response.json();
      data.records = data.records.filter(record => keyPattern.test(record.key) && safeOriginal(record.source));
      return data;
    });
    return catalogue;
  }

  function saveReference(record, status) {
    try {
      const items = JSON.parse(localStorage.getItem(referenceKey) ?? '[]');
      if (!Array.isArray(items)) throw Error('Unexpected reference list');
      const source = safeOriginal(record.source);
      if (items.some(item => item?.url === source)) {
        status.textContent = 'This source is already in your W.NE references.';
        return;
      }
      if (items.length >= 499) {
        status.textContent = 'Your W.NE reference list is full. Manage it in Research Library.';
        return;
      }
      localStorage.setItem(referenceKey, JSON.stringify([...items, {
        title: record.title.slice(0, 160), url: source, publisher: record.agency,
        addedAt: new Date().toISOString()
      }]));
      status.textContent = 'Saved to W.NE · My saved references on this device.';
    } catch {
      status.textContent = 'Could not save to W.NE references. Your existing references were preserved.';
    }
  }

  function transferActions(record, key, actions) {
    const notice = element('p', null, 'record-meta');
    notice.hidden = true;
    notice.setAttribute('role', 'status');
    actions.append(link('Add to Board', '/?dd_tab=boards&dd_research=' + key, 'action'));
    const save = button('+ W.NE Ref', () => {
      notice.hidden = false;
      saveReference(record, notice);
    });
    save.setAttribute('aria-label', '+ W.NE Ref — Save to W.NE references');
    save.title = 'Save to W.NE references';
    actions.append(save);
    actions.append(link('Open W.NE', '/?dd_tab=researchStudio', 'action'));
    return notice;
  }

  function renderRecord(record, releaseDates, offline = false) {
    const card = element('article', null, 'record');
    card.id = 'record-' + record.key;
    const date = releaseDates.get(record.release);
    card.append(element('p', [label(record.release), date && displayDate(date), record.kind]
      .filter(Boolean).join(' · '), 'record-id'));
    const heading = element('h2');
    heading.textContent = record.title;
    card.append(heading);
    const identity = [record.agency, record.date && 'Catalogue date ' + record.date, record.location];
    if (record.identifier && !record.title.includes(record.identifier)) identity.push(record.identifier);
    if (record.virin) identity.push('VIRIN ' + record.virin);
    card.append(element('p', identity.filter(Boolean).join(' · '), 'record-meta'));
    const actions = element('div', null, 'actions');
    const original = link('Open original ' + record.kind.toLowerCase(), safeOriginal(record.source), 'action');
    actions.append(original);
    if (offline) {
      card.append(actions);
    } else {
      const notice = transferActions(record, record.key, actions);
      actions.append(link('Record link', '#' + card.id));
      card.append(actions, element('small', 'W.NE references are stored in this app or browser.'), notice);
    }
    if (record.related?.length) {
      const list = element('ul');
      for (const [title, path, relation] of record.related) {
        if (!safeRelated(path)) continue;
        const item = element('li');
        item.append(link(title, offline ? offlineOrigin + path : path), document.createTextNode(' · ' + relation));
        list.append(item);
      }
      if (list.children.length) card.append(element('h3', 'Related research'), list);
    }
    return card;
  }

  function downloadRecords(records, dates) {
    const doc = document.implementation.createHTMLDocument('Disclosure Desk PURSUE offline index');
    doc.documentElement.lang = 'en';
    const viewport = doc.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    const charset = doc.createElement('meta');
    charset.setAttribute('charset', 'utf-8');
    doc.head.prepend(charset, viewport);
    const style = doc.createElement('style');
    style.textContent = 'body{font:16px/1.55 system-ui;max-width:62rem;margin:1.5rem auto;padding:0 1rem}article{border-top:1px solid #999;padding:1rem 0;overflow-wrap:anywhere}h2{font-size:1.25rem}';
    doc.head.append(style);
    const main = doc.createElement('main');
    main.append(element('h1', 'PURSUE offline index'),
      element('p', records.length + ' records from your search. Government files and web links require a connection.'),
      link('Open the current Disclosure Desk catalogue', offlineOrigin + '/pursue'));
    for (const record of records) main.append(renderRecord(record, dates, true));
    doc.body.append(main);
    const url = URL.createObjectURL(new Blob(['<!doctype html>\n', doc.documentElement.outerHTML], {type:'text/html;charset=utf-8'}));
    const exportLink = link('Download index', url);
    exportLink.download = 'Disclosure-Desk-PURSUE-Offline.html';
    document.body.append(exportLink);
    exportLink.click();
    exportLink.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function setupArchive() {
    const search = find('archive-search');
    const release = find('archive-release');
    const kind = find('archive-kind');
    const count = find('archive-status');
    const results = find('archive-records');
    const more = find('archive-more');
    const download = find('archive-download');
    download.hidden = navigator.userAgent.includes('DisclosureDeskAndroid');
    let data;
    try {
      data = await loadCatalogue();
    } catch {
      count.textContent = 'The catalogue could not be loaded. Reload to try again or open the official catalogue above.';
      return;
    }
    const dates = new Map(data.releases.map(item => [item.number, item.date]));
    find('archive-provenance').append(document.createTextNode(' Snapshot through ' +
      displayDate(data.releases.at(-1).date) + '. '),
      link('Catalogue snapshot and checksums', data.sourceSnapshot), document.createTextNode('.'));
    for (const [number] of [...dates].reverse()) release.add(new Option(label(number), number));
    for (const value of [...new Set(data.records.map(record => record.kind))].sort()) kind.add(new Option(value, value));
    let matching = [];
    let shown = 0;
    const pageSize = 24;
    function appendResults() {
      const chunk = matching.slice(shown, shown + pageSize);
      for (const record of chunk) results.append(renderRecord(record, dates));
      shown += chunk.length;
      more.hidden = shown >= matching.length;
      count.textContent = matching.length
        ? 'Showing ' + shown + ' of ' + matching.length + ' records.'
        : 'No records match these filters.';
      download.disabled = !matching.length;
    }
    function applyFilters(prioritiseKey = '') {
      const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      matching = data.records.filter(record => {
        const haystack = [record.title, record.identifier, record.agency, record.virin,
          record.date, record.location].join(' ').toLowerCase();
        return (!release.value || Number(release.value) === record.release) &&
          (!kind.value || kind.value === record.kind) && terms.every(term => haystack.includes(term));
      });
      if (prioritiseKey) {
        const index = matching.findIndex(record => record.key === prioritiseKey);
        if (index > 0) matching.unshift(...matching.splice(index, 1));
      }
      shown = 0;
      results.replaceChildren();
      appendResults();
    }
    function showLinkedRecord() {
      const key = location.hash.slice('#record-'.length);
      if (!location.hash.startsWith('#record-') || !keyPattern.test(key) ||
          !data.records.some(record => record.key === key)) return;
      search.value = ''; release.value = ''; kind.value = '';
      applyFilters(key);
      const card = find('record-' + key);
      card.tabIndex = -1;
      card.focus();
      card.scrollIntoView({block: 'start'});
    }
    search.addEventListener('input', () => applyFilters());
    release.addEventListener('change', () => applyFilters());
    kind.addEventListener('change', () => applyFilters());
    more.addEventListener('click', () => {
      const firstNew = shown;
      appendResults();
      const card = results.children[firstNew];
      if (card) {
        card.tabIndex = -1;
        card.focus();
      }
    });
    download.addEventListener('click', () => downloadRecords(matching, dates));
    window.addEventListener('hashchange', showLinkedRecord);
    applyFilters();
    showLinkedRecord();
  }

  async function setupBoard(mount) {
    const params = new URLSearchParams(location.search);
    const key = params.get('dd_research') || '';
    if (params.get('dd_tab') !== 'boards' || (!Object.hasOwn(firstPartySources,key) && !keyPattern.test(key))) return;
    try {
      const record = Object.hasOwn(firstPartySources,key) ? firstPartySources[key] :
        (await loadCatalogue()).records.find(item => item.key === key);
      if (!record) return;
      mount.append(element('h3', 'Add research source to a Board'), element('p', record.title),
        button('Choose investigation board', () => window.DDSavePublicLinkToBoard(record.title, record.source)),
        document.createTextNode(' '), link('Return to this record', record.page || '/pursue#record-' + key));
      mount.hidden = false;
    } catch {
      mount.append(element('p', 'The source could not be loaded. Reopen it from the PURSUE Archive.'));
      mount.hidden = false;
    }
  }

  function setupFoia(search) {
    const statusFilter = find('foia-status-filter');
    const cards = [...find('foia-records').children];
    function filter() {
      const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      for (const card of cards) card.hidden = (!!statusFilter.value && card.dataset.status !== statusFilter.value) ||
        !terms.every(term => card.textContent.toLowerCase().includes(term));
      const count = cards.filter(card => !card.hidden).length;
      find('foia-status').textContent = count ? count + (count === 1 ? ' request.' : ' requests.') : 'No requests match these filters.';
    }
    function revealLinkedRequest() {
      if (!cards.some(card => '#' + card.id === location.hash)) return;
      search.value = ''; statusFilter.value = '';
      filter();
      const card = find(location.hash.slice(1));
      card.tabIndex = -1;
      card.focus();
      card.scrollIntoView({block: 'start'});
    }
    search.addEventListener('input', filter);
    statusFilter.addEventListener('change', filter);
    window.addEventListener('hashchange', revealLinkedRequest);
    filter();
    revealLinkedRequest();
  }

  find('collaboration-enquiry')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = data.get('summary').trim();
    if (!message) {
      find('enquiry-status').textContent = 'Enter a short project summary.';
      event.currentTarget.elements.summary.focus();
      return;
    }
    const subject = encodeURIComponent('Disclosure Desk · ' + data.get('topic'));
    find('enquiry-status').textContent = 'Review and send the draft from your email app.';
    location.href = 'mailto:support@uapdisclosuredesk.com?subject=' + subject + '&body=' + encodeURIComponent(message);
  });
  for (const mount of document.querySelectorAll('[data-research-transfer]')) {
    const key = mount.dataset.researchTransfer;
    if (!Object.hasOwn(firstPartySources,key)) continue;
    const actions = element('div', null, 'actions');
    mount.append(actions, transferActions(firstPartySources[key], key, actions));
  }
  if (find('archive-records')) setupArchive();
  if (find('foia-search')) setupFoia(find('foia-search'));
  if (find('dd-research-board-source')) setupBoard(find('dd-research-board-source'));
})();
