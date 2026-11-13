'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const main = 'android-test/app/src/main/';
const headerScript = fs.readFileSync(main + 'assets/compact-header.js', 'utf8');
const activity = fs.readFileSync(main + 'java/com/disclosuredesk/preview/MainActivity.java', 'utf8');
const openProfile = activity.split('private void openProfile(){')[1].split('web.evaluateJavascript')[0];
const profileScript = [...openProfile.split('String script=')[1].matchAll(/"(?:[^"\\]|\\.)*"/g)]
    .map(match => JSON.parse(match[0])).join('');
const local = 'http://127.0.0.1:4173';
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
            await page.route('**/*', async route => {
                const url = new URL(route.request().url());
                if (url.origin !== app || route.request().method() !== 'GET') return route.abort();
                const response = await route.fetch({ url: local + url.pathname + url.search });
                return route.fulfill({ response });
            });
            await page.goto(app + '/', { waitUntil: 'domcontentloaded' });
            const header = page.locator('.shell > header.top');
            const support = header.locator('.dd-header-support');
            await support.waitFor({ state: 'visible' });
            assert.equal(await support.getAttribute('href'), 'https://ko-fi.com/disclosuredesk');
            assert.equal(await page.evaluate(() => typeof window.navigateTo), 'function');

            // In the browser the header occupies space and its normal controls still work.
            const inboxArea = page.locator('#discover');
            assert.equal(await inboxArea.isVisible(), true);
            const before = await inboxArea.boundingBox();
            const headerBounds = await header.boundingBox();
            await header.locator('#ddProfileShortcut').click();
            await page.locator('#profilePage').waitFor({ state: 'visible' });
            await page.evaluate(() => window.navigateTo('discover'));

            // A missing action must leave the website header available.
            await support.evaluate(node => { node.href = 'https://ko-fi.com/elsewhere'; });
            assert.equal(await page.evaluate(headerScript), false);
            assert.equal(await header.isVisible(), true);
            await support.evaluate(node => { node.href = 'https://ko-fi.com/disclosuredesk'; });

            assert.equal(await page.evaluate(headerScript), true);
            assert.equal(await page.evaluate(headerScript), true);
            assert.equal(await header.isVisible(), false);
            const after = await inboxArea.boundingBox();
            assert.ok(before.y - after.y >= headerBounds.height - 1, 'Website header leaves no spacer');
            for (const selector of ['.news-sticky-controls', '.archive-toolbar']) {
                assert.equal(await page.locator(selector).first().evaluate(node => getComputedStyle(node).top), '0px');
            }
            assert.equal(await page.evaluate(profileScript), true);
            assert.equal(await page.locator('#profilePage').isVisible(), true);
            assert.equal(await header.isVisible(), false);

            await page.goto(app + '/guide.html', { waitUntil: 'domcontentloaded' });
            assert.equal(await page.evaluate(headerScript), false);
            await page.close();
        }
        console.log('PASS M93: duplicate header removed with no spacer, profile accessible, website fallback intact at 320/393/820 px.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
