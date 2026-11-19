'use strict';

// This is a separate static site. The main Disclosure Desk release never calls this builder.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.release-staging', 'adsterra-news-pilot');
const origin = 'https://news.uapdisclosuredesk.com';
const unit = '6e71e0ae33c20d811ac3ff6e51c016a5';
const vendor = 'https://bicea.org/22/' + unit;
const enableBanner = process.env.DD_ADSTERRA_NEWS_PILOT_LIVE === '1';
const escape = s => String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

const news = JSON.parse(fs.readFileSync(path.join(root, 'data/news-alerts.json'), 'utf8'));
const stories = news.filter(row =>
    row && typeof row.headline === 'string' && typeof row.source === 'string' &&
    typeof row.url === 'string' && URL.canParse(row.url) &&
    new URL(row.url).protocol === 'https:' && Number.isFinite(Date.parse(row.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 6);
if (stories.length !== 6) throw Error('The public News data must contain six articles');
const markup = stories.map(row => {
    const date = new Intl.DateTimeFormat('en-GB', {dateStyle:'medium', timeZone:'UTC'}).format(new Date(row.date));
    return '<article><h2><a rel="noreferrer" href="' + escape(row.url) + '">' + escape(row.headline) +
        '</a></h2><p class="meta">' + escape(row.source) + ' · ' + escape(date) + '</p></article>';
}).join('\n');

const choices = enableBanner ?
    '<section class="preferences" aria-labelledby="choice-heading"><h2 id="choice-heading">Optional advertising</h2>' +
    '<p>One Adsterra banner can appear below the stories. Adsterra and its advertising partners may receive ' +
    'your IP address and use cookies or similar technologies to show and measure ads and help prevent fraud. ' +
    'Your choice applies to this visit. <a href="https://adsterra.com/privacy-policy/" rel="noreferrer">Adsterra privacy policy</a></p>' +
    '<div class="choices"><button id="allow" type="button" disabled>Allow the banner</button>' +
    '<button id="decline" type="button">Continue without ads</button></div><p id="ad-status" role="status" hidden></p></section>' :
    '<p>Advertising is off for this preview.</p>';

const tag = '<span class="ad-label">Advertisement</span><script>atOptions={' +
    "key:'" + unit + "',format:'iframe',height:250,width:300,params:{}};" +
    '</script><script src="' + vendor + '"></script>';
const bootstrap = enableBanner ? '<script>(' + function choose(publisherOrigin, oneTag) {
    const allow = document.getElementById('allow');
    const decline = document.getElementById('decline');
    const status = document.getElementById('ad-status');
    decline.onclick = () => {
        status.hidden = false;
        status.textContent = 'Advertising is off.';
    };
    if (location.origin !== publisherOrigin || window.top !== window) return;
    allow.disabled = false;
    allow.onclick = () => {
        if (document.documentElement.clientWidth < 320) {
            status.hidden = false;
            status.textContent = 'The banner does not fit this screen.';
            return;
        }
        const copy = document.documentElement.cloneNode(true);
        copy.querySelector('script').remove();
        copy.querySelector('#advertising-choices').innerHTML =
            '<p><a href="/">Stop showing ads</a></p>';
        copy.querySelector('#advertisement').innerHTML = oneTag;
        // Reparse once so the unchanged provider tag behaves like ordinary HTML.
        const page = '<!doctype html>' + copy.outerHTML;
        document.open();
        document.write(page);
        document.close();
    };
}.toString() + ')(' + JSON.stringify(origin) + ',' +
    JSON.stringify(tag).replace(/</g, '\\u003c') + ');</script>' : '';

const page = fs.readFileSync(path.join(root, 'experiments/adsterra-news-pilot/index.html'), 'utf8')
    .replace('__CHOICES__', () => choices)
    .replace('__STORIES__', () => markup)
    .replace('__BOOTSTRAP__', () => bootstrap);
const contentPolicy = [
    "default-src 'none'",
    "script-src 'unsafe-inline' " + vendor,
    "style-src 'unsafe-inline'",
    'frame-src https://bicea.org',
    'connect-src https://bicea.org',
    'img-src https://static.nresystems.com',
    "worker-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
].join('; ');
const headers = '/*\n' +
    '  Content-Security-Policy: ' + contentPolicy + '\n' +
    '  Cross-Origin-Opener-Policy: same-origin\n' +
    '  Referrer-Policy: strict-origin\n' +
    '  X-Robots-Tag: noindex, nofollow\n' +
    '  Cache-Control: no-store\n';

fs.mkdirSync(path.dirname(out), {recursive:true});
fs.mkdirSync(out);
fs.writeFileSync(path.join(out, 'index.html'), page, {flag:'wx'});
fs.writeFileSync(path.join(out, '_headers'), headers, {flag:'wx'});
console.log('Built separate Disclosure Desk News pilot (banner option ' +
    (enableBanner ? 'restricted to ' + origin : 'disabled') + ').');
