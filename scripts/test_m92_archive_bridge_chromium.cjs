'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const source = fs.readFileSync('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java', 'utf8');
const method = source.split('private void openPendingArchiveCase(){')[1].split('private LinearLayout createDeskBar')[0];
const literals = [...method.split('String script=')[1].split('+JSONObject.quote(id)')[0].matchAll(/"(?:[^"\\]|\\.)*"/g)];
const prefix = literals.map(match => JSON.parse(match[0])).join('');
const local = 'http://127.0.0.1:4173';

(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    try {
        for (const width of [320, 393, 820]) {
            const page = await browser.newPage({ viewport: { width, height: 780 }, serviceWorkers: 'block' });
            await page.route('**/*', route => route.request().url().startsWith(local + '/') ? route.continue() : route.abort());
            await page.goto(local + '/', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => typeof window.archiveCaseOpen === 'function');
            const script = prefix + JSON.stringify('featured-rendlesham-1980') + ')';
            assert.equal(await page.evaluate(script), true);
            const dialog = page.locator('#archiveCaseDialog');
            await dialog.waitFor({ state: 'visible' });
            assert.match(await dialog.locator('#archiveCaseTitle').textContent(), /Rendlesham Forest/);
            assert.equal(await page.evaluate(() => history.state.ddArchiveCaseId), 'featured-rendlesham-1980');
            await page.goBack();
            await dialog.waitFor({ state: 'hidden' });
            assert.equal(await page.locator('#archivePage').isVisible(), true);
            await page.close();
        }
        console.log('PASS M92: native Full case bridge and Archive browser Back at 320, 393 and 820 px.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
