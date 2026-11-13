'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const assets = path.resolve('android-test/app/src/main/assets');
const snapshot = path.join(assets, 'dd-site');
const files = new Set(JSON.parse(fs.readFileSync(path.join(snapshot, 'snapshot-manifest.json'))).files);
const avatarBridge = fs.readFileSync(path.join(assets, 'native-shell.js'), 'utf8') + '(95)';
const compactHeader = fs.readFileSync(path.join(assets, 'compact-header.js'), 'utf8');
const activity = fs.readFileSync('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java', 'utf8');
const gradle = fs.readFileSync('android-test/app/build.gradle.kts', 'utf8');
assert.match(gradle, /applicationIdSuffix = "\\.beta\\.m95"/);
assert.match(gradle, /versionCode = 27/);
assert.match(activity, /installCompactHeader\\(\\);\\s*installNativeShell\\(url\\)/);
assert.doesNotMatch(activity, /savedNews\\.setText\\("News and saved stories"\\)/);
const app = 'https://uapdisclosuredesk.com';

(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    try {
        for (const width of [320, 393, 820]) {
            const page = await browser.newPage({ viewport: { width, height: 780 }, serviceWorkers: 'block' });
            await page.addInitScript(() => localStorage.setItem('dd-welcome-tour-choice-v2', 'dismissed'));
            await page.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.origin !== app || route.request().method() !== 'GET') return route.abort();
                const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
                return files.has(file) ? route.fulfill({ path: path.join(snapshot, file) }) : route.abort();
            });
            await page.goto(app + '/', { waitUntil: 'load' });
            const nav = page.locator('nav.nav');
            assert.equal(await nav.isVisible(), true, 'Original website nav is visible');
            const originalTicker = await page.locator('#ddNewsTickerHubToggle').getAttribute('aria-expanded');
            assert.equal(await page.evaluate(avatarBridge), false, 'No Android bridge means no native replacement');
            await page.evaluate(() => {
                window.shellMessages = [];
                window.DDAndroid = { postMessage: msg => shellMessages.push(JSON.parse(msg)) };
            });
            assert.equal(await page.evaluate(avatarBridge), false, 'Avatar bridge must not enable M94 native shell');
            assert.equal(await page.evaluate(avatarBridge), false, 'Repeated injection must stay in restored mode');
            assert.equal(await nav.isVisible(), true, 'Original navigation must not disappear');
            assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dd-native-shell')), false);
            assert.equal(await page.evaluate(() => !!window.DDNativeShell), false);
            assert.equal(await page.evaluate(() => document.querySelector('nav.nav').inert), false);
            assert.equal(await page.locator('#discover').isVisible(), true, 'Full website News remains visible');
            assert.equal(await page.locator('#ddNewsTickerHubToggle').getAttribute('aria-expanded'), originalTicker);
            assert.equal(await page.evaluate(compactHeader), true, 'Compact Android header still removes duplicated web header');
            assert.equal(await nav.isVisible(), true, 'Compact header must not hide original navigation');

            await page.waitForFunction(() => shellMessages.some(msg => msg.type === 'shell_avatar' && msg.photo === ''));
            await page.evaluate(async () => {
                const profile = document.getElementById('ddProfileShortcut');
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 96;
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                const photo = document.createElement('img');
                photo.src = URL.createObjectURL(blob);
                profile.replaceChildren(photo);
            });
            await page.waitForFunction(() => shellMessages.some(msg => msg.type === 'shell_avatar' && msg.photo.length > 100));
            await page.evaluate(() => { document.getElementById('ddProfileShortcut').textContent = 'Profile'; });
            await page.waitForFunction(() => shellMessages.filter(msg => msg.type === 'shell_avatar').at(-1).photo === '');
            assert.equal(await page.evaluate(() => shellMessages.every(msg => msg.generation === 95)), true);
            await page.unrouteAll({ behavior: 'wait' });
            await page.close();
        }
        console.log('PASS M95: restored original nav + complete News, compact header, native avatar reset at 320/393/820px.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
