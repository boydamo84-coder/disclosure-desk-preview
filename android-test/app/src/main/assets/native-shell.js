(function (generation) {
    'use strict';
    if (location.origin !== 'https://uapdisclosuredesk.com' || location.pathname !== '/') return false;
    const nav = document.querySelector('nav.nav');
    const profile = document.getElementById('ddProfileShortcut');
    if (!nav || !profile || !window.DDAndroid?.postMessage || !window.navigateTo) return false;
    if (window.DDNativeShell) return true;

    function send(type, fields = {}) {
        window.DDAndroid.postMessage(JSON.stringify({ type, generation, ...fields }));
    }
    const style = document.createElement('style');
    style.textContent = `
        html.dd-native-shell nav.nav {
            visibility: hidden !important; pointer-events: none !important;
            height: 0 !important; min-height: 0 !important; padding: 0 !important;
            border: 0 !important; overflow: hidden !important; bottom: 0 !important;
        }
        html.dd-native-shell body:not(.dd-news-ticker-visible) .shell { padding-bottom: 24px; }
        html.dd-native-shell #chatPage { --dd-chat-bottom-space: 0px !important; }
    `;
    document.head.append(style);
    document.documentElement.classList.add('dd-native-shell');
    document.documentElement.style.setProperty('--dd-news-nav-height', '0px');
    nav.inert = true;

    const active = () => nav.querySelector('.tab.active')?.dataset.tab || 'discover';
    let stateTimer;
    function sendState() {
        clearTimeout(stateTimer);
        stateTimer = setTimeout(() => {
            const chat = nav.querySelector('[data-tab="chatPage"]');
            const videos = nav.querySelector('[data-new-badge="videos"]');
            send('shell_state', {
                section: active(),
                modal: !!document.querySelector('dialog[open], #immersiveViewer:not([hidden])'),
                chat: chat?.querySelector('.dd-chat-unread-badge:not([hidden])')?.textContent || '',
                videos: videos && !videos.hidden ? videos.textContent : ''
            });
        }, 0);
    }
    new MutationObserver(sendState).observe(nav, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ['class', 'hidden', 'aria-current']
    });
    const pageState = new MutationObserver(records => {
        if (records.some(record => record.target.matches?.('dialog, #immersiveViewer') ||
            [...record.addedNodes, ...record.removedNodes].some(node => node.matches?.('dialog')))) sendState();
    });
    pageState.observe(document.body, {
        subtree: true, childList: true, attributes: true, attributeFilter: ['open', 'hidden']
    });
    window.addEventListener('dd-public-section-change', sendState);
    sendState();

    let avatarVersion = 0;
    async function sendAvatar() {
        const version = ++avatarVersion;
        const image = profile.querySelector('img');
        if (!image || !image.src.startsWith('blob:' + location.origin + '/')) {
            send('shell_avatar', { photo: '' });
            return;
        }
        try {
            await image.decode();
            if (version !== avatarVersion || !profile.contains(image)) return;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 96;
            canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, 96, 96);
            send('shell_avatar', { photo: canvas.toDataURL('image/jpeg', 0.82).split(',')[1] });
        } catch {
            if (version === avatarVersion) send('shell_avatar', { photo: '' });
        }
    }
    new MutationObserver(sendAvatar).observe(profile, {
        subtree: true, childList: true, attributes: true, attributeFilter: ['src']
    });
    void sendAvatar();

    function sendNews() {
        const rows = window.ddNewsTickerRows;
        const available = Array.isArray(rows) && rows.length > 0;
        send('shell_news', {
            rows: available ? rows.slice(0, 250).map(row => ({
                id: String(row.id || '').slice(0, 180),
                headline: String(row.headline || '').slice(0, 400),
                source: String(row.source || '').slice(0, 120),
                date: String(row.date || '').slice(0, 40),
                category: String(row.category || 'UAP').slice(0, 40),
                url: String(row.url || '').slice(0, 2048)
            })) : [],
            status: (document.getElementById('feedStatus')?.textContent || '').slice(0, 260)
        });
    }
    window.addEventListener('dd-news-updated', sendNews);
    const status = document.getElementById('feedStatus');
    if (status) new MutationObserver(sendNews).observe(status, { childList: true, characterData: true, subtree: true });
    sendNews();

    // Compact on first visit to the shared News page. The original control stores subsequent choices.
    const ticker = document.getElementById('ddNewsTickerHubToggle');
    if (ticker?.getAttribute('aria-expanded') === 'true') {
        try {
            const prefs = JSON.parse(localStorage.getItem('dd_live_news_ticker_preferences_v1') || '{}');
            if (prefs.hub === undefined) ticker.click();
        } catch { /* Leave the browser controls available. */ }
    }
    window.DDNativeShell = Object.freeze({
        go(section) {
            if (document.querySelector('dialog[open], #immersiveViewer:not([hidden])')) return false;
            const tab = [...nav.querySelectorAll('.tab')].find(button => button.dataset.tab === section);
            if (!tab || tab.disabled || tab.hidden) return false;
            tab.click();
            return true;
        },
        refresh() {
            return Promise.resolve(window.ddTickerRefresh?.()).finally(() => {
                sendNews();
                send('shell_refresh_done');
            });
        },
        story(id, url) {
            const row = window.ddNewsTickerRows?.find(article => article.url === url && String(article.id || '') === id);
            if (!row || !id) return false;
            return window.ddTickerOpenStory?.(id) === true;
        },
        read(row) {
            if (typeof window.rememberReadStory === 'function') window.rememberReadStory(row);
        }
    });
    return true;
})
