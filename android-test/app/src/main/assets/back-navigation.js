(function () {
    'use strict';
    try {
        if (location.origin !== 'https://uapdisclosuredesk.com') return 'history';
        const visible = el => !!el && !el.hidden && el.getClientRects().length > 0;
        // Close the top-most overlay before navigating any page, including
        // canonical dossier pages, help, and embedded archive readers.
        const more = document.querySelector('#ddDockMore[open]');
        const dialog = more || Array.from(document.querySelectorAll('dialog[open]')).pop();
        if (dialog) {
            if (typeof dialog.requestClose === 'function') dialog.requestClose();
            else dialog.close();
            return 'handled';
        }
        const immersive = document.getElementById('immersiveViewer');
        const closeImmersive = document.getElementById('closeImmersive');
        if (visible(immersive) && closeImmersive) {
            closeImmersive.click();
            return 'handled';
        }
        // W.NE has its own save-before-navigation guard. Never bypass it on
        // a native gesture; focus mode exits without reloading either iframe.
        if (location.pathname.startsWith('/research/')) {
            const writer = document.getElementById('writer');
            const inner = writer?.contentDocument;
            const innerDialog = inner && Array.from(inner.querySelectorAll('dialog[open]')).pop();
            if (innerDialog) {
                if (typeof innerDialog.requestClose === 'function') innerDialog.requestClose();
                else innerDialog.close();
                return 'handled';
            }
            if (window.ddResearchExitWritingFocus?.()) return 'handled';
            if ((writer || document.getElementById('editor')) && typeof window.ddResearchNavigateTo === 'function') {
                void window.ddResearchNavigateTo('discover');
                return 'handled';
            }
        }
        if (location.pathname !== '/' && location.pathname !== '/index.html') return 'history';

        const active = Array.from(document.querySelectorAll('.shell > section')).find(visible);
        if (!active) return 'history';
        if (active.id === 'originalResearchPage') {
            const reader = document.getElementById('ddOriginalReader');
            const back = document.getElementById('ddReaderBack');
            if (visible(reader) && back) {
                back.click();
                return 'handled';
            }
        }
        if (active.id === 'discussionsPage') {
            for (const [paneId, backId] of [
                ['ddForumReplyPane', 'ddForumBackThreads'],
                ['ddForumThreadPane', 'ddForumBackSections']
            ]) {
                const back = document.getElementById(backId);
                if (visible(document.getElementById(paneId)) && back) {
                    back.click();
                    return 'handled';
                }
            }
        }
        const theme = document.querySelector('#discover #ddHomeThemeMenu[open]');
        if (active.id === 'discover' && visible(theme)) {
            theme.open = false;
            return 'handled';
        }
        if (active.id === 'discover') return 'root';
        // Actual web history when a user changed tabs, rather than creating a
        // new homepage history entry that would bounce them back on Back.
        if (history.state?.ddSiteHop && history.state.ddSection === active.id) return 'history';
        if (typeof window.navigateTo !== 'function') return 'history';
        window.navigateTo('discover');
        history.replaceState({...history.state, ddSection: 'discover', ddArchiveCaseId: null, ddSiteHop: false}, '', location.href);
        return 'home';
    } catch (_) {
        // The native handler falls back to WebView history or a safe Desk route;
        // an unavailable DOM is never interpreted as permission to exit.
        return 'history';
    }
})()
