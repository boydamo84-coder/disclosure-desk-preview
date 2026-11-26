(function (generation) {
    'use strict';
    // M95: return to the original navy-and-gold editorial navigation and
    // full website News screen. Keep only the native profile photo bridge.
    if (location.origin !== 'https://uapdisclosuredesk.com' || location.pathname !== '/') return false;
    const profile = document.getElementById('ddProfileShortcut');
    if (!profile || !window.DDAndroid?.postMessage) return false;
    if (window.DDEditorialAvatarBridge) return false;
    window.DDEditorialAvatarBridge = true;

    const send = photo => window.DDAndroid?.postMessage(JSON.stringify({
        type: 'shell_avatar', generation, photo
    }));
    let avatarVersion = 0;
    async function syncAvatar() {
        const version = ++avatarVersion;
        const picture = profile.querySelector('img');
        // Only copy the already-authorised, same-origin local profile thumbnail.
        if (!picture || !picture.src.startsWith('blob:' + location.origin + '/')) {
            send('');
            return;
        }
        try {
            await picture.decode();
            if (version !== avatarVersion || !profile.contains(picture)) return;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 96;
            canvas.getContext('2d', { alpha: false }).drawImage(picture, 0, 0, 96, 96);
            send(canvas.toDataURL('image/jpeg', 0.82).split(',')[1]);
        } catch {
            if (version === avatarVersion) send('');
        }
    }
    new MutationObserver(syncAvatar).observe(profile, {
        subtree: true, childList: true, attributes: true, attributeFilter: ['src']
    });
    void syncAvatar();
    // Deliberately false: Java must NOT hide the website bottom navigation or
    // substitute the M94 native News feed, even though the avatar bridge runs.
    return false;
})
