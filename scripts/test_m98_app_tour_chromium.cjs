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
            await page.waitForTimeout(1200);
            assert.equal(await page.locator('#ddWelcomeDialog, #appTourDialog[open]').count(),0,'No first-visit interruption');
            if(android) await page.evaluate(() => window.DDStartTour());
            else await page.getByRole('button',{name:'Take the tour',exact:true}).click();
            await page.locator('#appTourDialog').waitFor({ state: 'visible' });
            await page.locator('#tourClose').click();
            await page.locator('#appTourDialog').waitFor({ state: 'hidden' });
            await context.close();
        }
        console.log('PASS M98: Neither platform interrupts the visitor, and both can still open the research tour on demand.');
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
