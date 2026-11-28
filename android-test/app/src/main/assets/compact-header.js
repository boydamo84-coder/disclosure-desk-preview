(function () {
    'use strict';
    if (location.origin !== 'https://uapdisclosuredesk.com' || location.pathname !== '/') return false;

    const header = document.querySelector('.shell > header.top');
    const profile = header?.querySelector('#ddProfileShortcut');
    const support = header?.querySelector('a.dd-header-support');
    if (!profile || typeof window.navigateTo !== 'function' ||
        support?.href !== 'https://ko-fi.com/disclosuredesk') return false;

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
            window.DDPageHelp.open(topic);
            return 'opened';
        };
        if (!document.getElementById('ddAndroidDeskHelpStyle')) {
            const style = document.createElement('style');
            style.id = 'ddAndroidDeskHelpStyle';
            style.textContent = '#discover > .dd-help-bar { display: none !important; }';
            document.head.append(style);
        }
    }
    return true;
})();
