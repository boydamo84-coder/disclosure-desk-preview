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
    return true;
})();
