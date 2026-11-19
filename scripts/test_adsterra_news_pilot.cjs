'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');

const root = path.join(__dirname, '..', '.release-staging', 'adsterra-news-pilot');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const headers = Object.fromEntries(fs.readFileSync(path.join(root, '_headers'), 'utf8')
    .trimEnd().split('\n').slice(1).map(line => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim()];
    }));
const website = 'https://uapdisclosuredesk.com';
const pilot = 'https://news.uapdisclosuredesk.com';
const vendor = 'https://bicea.org';
const replay = process.env.DD_ADSTERRA_VENDOR_FIXTURE;
const vendorScript = replay ? fs.readFileSync(replay, 'utf8') :
    'if(atOptions.width!==300||atOptions.height!==250)throw Error("Unexpected tag");' +
    'document.write("<iframe title=\\"Banner fixture\\" width=\\"300\\" height=\\"250\\" ' +
    'src=\\"https://bicea.org/mock-creative\\"></iframe>");';

(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.DD_CHROME || '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox']
    });
    try {
        for (const width of [320, 393, 820, 1280]) {
            const context = await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
            const calls = [];
            await context.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.origin === website && url.pathname === '/member-fixture') {
                    return route.fulfill({contentType:'text/html',
                        body:'<script>localStorage.setItem("dd-member-fixture","visible only on member origin");' +
                        'document.cookie="dd_member_fixture=private; Secure; Path=/";</script>'});
                }
                if (url.origin === pilot || url.origin === 'https://unapproved.example') {
                    return route.fulfill({headers:{...headers,'content-type':'text/html; charset=utf-8'},body:html});
                }
                calls.push([url.origin, url.pathname, route.request().resourceType()]);
                if (url.origin === vendor && url.pathname.startsWith('/22/')) {
                    return route.fulfill({contentType:'application/javascript',body:vendorScript});
                }
                if (url.origin === vendor && route.request().resourceType() === 'document') {
                    return route.fulfill({contentType:'text/html',body:'<p>Synthetic creative. No ad traffic.</p>'});
                }
                return route.abort();
            });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(website + '/member-fixture');
            assert.equal(await page.evaluate(() => localStorage.getItem('dd-member-fixture')),
                'visible only on member origin');
            await page.goto(pilot);
            assert.equal(await page.evaluate(() => localStorage.getItem('dd-member-fixture')), null);
            assert.doesNotMatch(await page.evaluate(() => document.cookie), /dd_member_fixture/);
            assert.equal(await page.locator('article').count(), 6);
            assert.deepEqual(calls, []);
            await page.getByRole('button', {name:'Continue without ads'}).click();
            assert.deepEqual(calls, []);
            await page.getByRole('button', {name:'Allow the banner'}).click();
            await page.locator('#advertisement iframe').waitFor({state:'attached',timeout:12000});
            assert.equal(await page.locator('#advertisement iframe').count(), 1);
            assert.equal(await page.locator('article').count(), 6);
            assert.equal(await page.locator('main > :last-child').getAttribute('id'), 'advertisement');
            assert.equal(calls.filter(([o,p,type])=>o===vendor && p.startsWith('/22/') && type==='script').length,1);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            const loaded = calls.length;
            await page.getByRole('link',{name:'Stop showing ads'}).click();
            assert.equal(await page.locator('#advertisement iframe').count(), 0);
            assert.equal(calls.length, loaded);
            await page.goto('https://unapproved.example');
            assert.equal(await page.getByRole('button',{name:'Allow the banner'}).isEnabled(), false);
            assert.equal(calls.length, loaded);
            await context.close();
            console.log('PASS ' + width + 'px: consent, placement, origin separation, withdrawal and wrong-host protection.');
        }
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
