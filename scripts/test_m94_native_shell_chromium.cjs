'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const assets = path.resolve('android-test/app/src/main/assets');
const snapshot = path.join(assets, 'dd-site');
const files = new Set(JSON.parse(fs.readFileSync(path.join(snapshot, 'snapshot-manifest.json'))).files);
const script = fs.readFileSync(path.join(assets, 'native-shell.js'), 'utf8') + '(94)';
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
            assert.equal(await page.evaluate(script), false, 'Web dock remains without Android bridge');
            assert.equal(await page.locator('nav.nav').isVisible(), true);
            await page.evaluate(() => {
                window.shellMessages = [];
                window.DDAndroid = { postMessage: message => shellMessages.push(JSON.parse(message)) };
            });
            assert.equal(await page.evaluate(script), true);
            assert.equal(await page.evaluate(script), true);
            assert.equal(await page.locator('nav.nav').isVisible(), false);
            assert.equal(await page.locator('nav.nav').evaluate(node => node.getBoundingClientRect().height), 0);
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_state' && x.section === 'discover'));
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_news' && x.rows.length));
            assert.equal(await page.locator('#ddNewsTickerHubToggle').getAttribute('aria-expanded'), 'false');
            await page.locator('#ddNewsTickerHubToggle').click();
            assert.equal(await page.locator('#ddNewsTickerHubToggle').getAttribute('aria-expanded'), 'true');
            assert.equal(await page.evaluate(() => DDNativeShell.go('archivePage')), true);
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_state' && x.section === 'archivePage'));
            assert.equal(await page.evaluate(() => DDNativeShell.go('discussionsPage')), true);
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_state' && x.section === 'discussionsPage'));
            assert.equal(await page.evaluate(() => DDNativeShell.go('chatPage')), true);
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_state' && x.section === 'chatPage'));
            assert.equal(await page.locator('#chatPage').evaluate(node =>
                getComputedStyle(node).getPropertyValue('--dd-chat-bottom-space')), '0px');
            await page.evaluate(() => document.getElementById('appTourDialog').showModal());
            assert.equal(await page.evaluate(() => DDNativeShell.go('discover')), false);
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_state' && x.modal));
            await page.evaluate(() => document.getElementById('appTourDialog').close());
            assert.equal(await page.evaluate(() => DDNativeShell.go('discover')), true);
            const row = await page.evaluate(() => shellMessages.find(x => x.type === 'shell_news' && x.rows.length).rows[0]);
            assert.equal(await page.evaluate(({ id, url }) => DDNativeShell.story(id, url), row), true);
            assert.equal(await page.evaluate(({ id }) => DDNativeShell.story(id, 'https://example.com/'), row), false);
            await page.evaluate(row => DDNativeShell.read(row), row);
            assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('disclosure_desk_read_articles_v1'))[0].url), row.url);
            await page.evaluate(() => DDNativeShell.refresh());
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_refresh_done'));
            await page.evaluate(async () => {
                const profile = document.getElementById('ddProfileShortcut');
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 96;
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                const photo = document.createElement('img');
                photo.src = URL.createObjectURL(blob);
                profile.replaceChildren(photo);
            });
            await page.waitForFunction(() => shellMessages.some(x => x.type === 'shell_avatar' && x.photo.length > 100));
            await page.evaluate(() => { document.getElementById('ddProfileShortcut').textContent = 'Profile'; });
            await page.waitForFunction(() => shellMessages.filter(x => x.type === 'shell_avatar').at(-1).photo === '');
            assert.equal(await page.evaluate(() => shellMessages.every(x => x.generation === 94)), true);
            await page.unrouteAll({ behavior: 'wait' });
            await page.close();
        }
        console.log('PASS M94: Android-only navigation, Chat viewport, ticker, headline handoff, refresh and photo replacement at 320/393/820 px.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
