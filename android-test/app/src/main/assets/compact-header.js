(function () {
    'use strict';
    if (location.origin !== 'https://uapdisclosuredesk.com' || location.pathname !== '/') return false;

    const header = document.querySelector('.shell > header.top');
    // This script may be evaluated on the very first WebView paint.
    // Do NOT touch layout until the actual dock and contextual help are mounted.
    const dock=document.getElementById('ddHomeDock');
    if (!dock?.classList.contains('dd-site-dock') ||
        typeof window.DDPageHelp?.open !== 'function' ||
        document.documentElement.classList.contains('dd-android-early') ||
        document.documentElement.classList.contains('dd-navigation-pending')) return false;
    const profile = header?.querySelector('#ddProfileShortcut');
    const support = header?.querySelector('a.dd-header-support');
    if (!profile || typeof window.navigateTo !== 'function' ||
        support?.href !== 'https://ko-fi.com/disclosuredesk') return false;

    // Prepare every layout-affecting native control synchronously, BEFORE the
    // header is hidden and before Java uncovers the WebView. No remote requests.
    const addStyle=(id,css)=>{
        if(document.getElementById(id))return;
        const style=document.createElement('style');style.id=id;style.textContent=css;document.head.append(style);
    };
    addStyle('dd-android-breaking-2line',
        '.dd-news-ticker-breaking{height:39px;min-height:39px;max-height:39px;}'+
        '.dd-news-ticker-breaking .dd-ticker-viewport{height:39px;min-height:0;max-height:39px;}'+
        '.dd-news-ticker-breaking .dd-ticker-link{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;line-height:15px;padding:4px 9px;max-height:38px;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis;}');
    if(typeof window.DDAndroid?.postMessage==='function'){
        function button(text,label,type){
            const action=document.createElement('button');action.type='button';action.className='outline';
            action.textContent=text;action.setAttribute('aria-label',label);
            action.addEventListener('click',()=>window.DDAndroid.postMessage(JSON.stringify({type})));return action;
        }
        const hero=document.querySelector('#discover > .hero'),explore=document.getElementById('ddExploreTitle');
        if(!hero||!explore)return false;
        addStyle('dd-android-research-inbox-style',
            '.dd-android-research-inbox{display:flex;gap:8px;margin:10px 0 14px}'+
            '.dd-android-research-inbox button{min-height:44px;padding:8px 14px}'+
            '.dd-android-research-inbox button:first-child{flex:1;text-align:left;font-weight:700}'+
            '.dd-android-research-inbox button:last-child{min-width:44px;padding:8px;font-size:19px}');
        function shortcut(id){
            const row=document.createElement('div');row.id=id;row.className='dd-android-research-inbox';
            row.append(button('Research Inbox','Open Research Inbox','open_research_inbox'),button('ⓘ','How to use Research Inbox','open_research_inbox_help'));return row;
        }
        if(!document.getElementById('ddAndroidResearchInbox'))hero.before(shortcut('ddAndroidResearchInbox'));
        if(!document.getElementById('ddAndroidResearchInboxExplore'))explore.after(shortcut('ddAndroidResearchInboxExplore'));
        const settings=document.getElementById('ddProfileSettings');
        if(settings&&!document.getElementById('ddAndroidAlertsSettings')){
            const panel=document.createElement('details');panel.id='ddAndroidAlertsSettings';
            panel.className='dd-profile-card dd-profile-fold dd-android-alert-settings';
            const summary=document.createElement('summary'),label=document.createElement('span'),chevron=document.createElement('span');
            label.textContent='🔔 App notifications';chevron.className='dd-profile-chevron';chevron.setAttribute('aria-hidden','true');chevron.textContent='⌄';summary.append(label,chevron);
            const note=document.createElement('p');note.textContent='News and video alerts. Chat push notifications are being prepared.';note.className='muted small';note.style.cssText='margin:10px 0 12px';
            const action=button('Notification settings','Open Android notification settings','open_notification_settings');action.style.cssText='min-height:44px;padding:10px 15px;margin-bottom:12px';
            panel.append(summary,note,action);
            const meta=settings.querySelector('.dd-profile-settings-meta');if(meta)meta.after(panel);else settings.append(panel);
        }
    }
    header.style.setProperty('display', 'none', 'important');
    document.documentElement.style.setProperty('--dd-header-height', '0px');
    // Keep the familiar contextual help, but let the native Desk menu open it.
    // Only the homepage row is removed; help on other sections remains visible.
    if (typeof window.DDPageHelp?.open === 'function') {
        window.DDNativePageHelp = () => {
            if (document.querySelector('dialog[open]')) return 'blocked';
            const section = window.DDPageHelp.topics.find(id => {
                const panel = document.getElementById(id);
                return panel && !panel.hidden && !panel.classList.contains('hidden') && panel.getClientRects().length;
            });
            const research = document.getElementById('originalResearchPage');
            const topic = section || (research && !research.classList.contains('hidden') ? 'investigations' : 'discover');
            const embeddedPeople=document.getElementById('peopleDirectory');
            window.DDPageHelp.open(embeddedPeople&&!embeddedPeople.classList.contains('hidden')?'people':topic);
            return 'opened';
        };
        if (!document.getElementById('ddAndroidDeskHelpStyle')) {
            const style = document.createElement('style');
            style.id = 'ddAndroidDeskHelpStyle';
            style.textContent = '#discover > .dd-help-bar { display: none !important; }';
            document.head.append(style);
        }
    }
    document.documentElement.dataset.ddAndroidHomeReady='true';
    return true;
})();
