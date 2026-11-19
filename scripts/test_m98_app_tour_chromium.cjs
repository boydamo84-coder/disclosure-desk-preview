'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const origin = 'http://127.0.0.1:4173';

(async () => {
    const browser = await chromium.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    try {
        for (const android of [false, true]) {
            const context = await browser.newContext({ viewport: { width: 393, height: 780 } });
            await context.route('**/*', route =>
                new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
            if (android) await context.addInitScript(() => { window.DDAndroid = { postMessage() {} }; });

            const page = await context.newPage();
            await page.goto(origin, { waitUntil: 'load' });
            await page.waitForFunction(() => typeof window.DDStartTour === 'function');
            await page.evaluate(() => offerFirstVisitTour());
            const welcome = page.locator('#ddWelcomeDialog');
            assert.equal(await welcome.count(), android ? 0 : 1);
            if (!android) await welcome.getByRole('button', { name: 'Not now' }).click();
            await page.evaluate(() => window.DDStartTour());
            await page.locator('#appTourDialog').waitFor({ state: 'visible' });
            await page.locator('#tourClose').click();
            await page.locator('#appTourDialog').waitFor({ state: 'hidden' });
            await context.close();
        }
        console.log('PASS M98: Android skips the website welcome, and both platforms can still open the research tour on demand.');
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
