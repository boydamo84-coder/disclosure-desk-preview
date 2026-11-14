'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const { getInjectedJs } = require('./test_m81_native_research_contract.cjs');
const BASE = 'http://127.0.0.1:4173';

(async () => {
 const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
 });
 try {
  for (const width of [320, 393, 820]) {
   const context = await browser.newContext({ viewport: { width, height: 820 }, serviceWorkers: 'block' });
   await context.route('**/*', route => (
    new URL(route.request().url()).origin === BASE ? route.continue() : route.abort()
   ));
   const page = await context.newPage();
   await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
   await page.evaluate(getInjectedJs());
   assert.equal(await page.locator('.dd-android-research-inbox').count(), 0, 'Web browsers have no Android controls');

   await page.evaluate(() => {
    window.__inboxMessages = [];
    window.DDAndroid = { postMessage: value => window.__inboxMessages.push(JSON.parse(value)) };
   });
   await page.evaluate(getInjectedJs());
   await page.evaluate(getInjectedJs());
   assert.equal(await page.locator('.dd-android-research-inbox').count(), 2, 'Repeated injection keeps one shortcut per page');
   assert.equal(await page.locator('#ddProfileSettings .dd-android-research-inbox').count(), 0);
   assert.equal(await page.locator('#discover > #ddAndroidResearchInbox + .hero').count(), 1);
   assert.equal(await page.locator('#ddExploreTitle + #ddAndroidResearchInboxExplore').count(), 1);

   for (const id of ['ddAndroidResearchInbox', 'ddAndroidResearchInboxExplore']) {
    if (id.endsWith('Explore')) await page.locator('.nav .tab[data-tab=hub]').click();
    const shortcut = page.locator('#' + id);
    for (const name of ['Open Research Inbox', 'How to use Research Inbox']) {
     const button = shortcut.getByRole('button', { name });
     await button.waitFor({ state: 'visible' });
     const rect = await button.boundingBox();
     assert(rect.height >= 44 && rect.width >= 44, 'Both controls have 44px touch targets');
     assert(rect.x >= 0 && rect.x + rect.width <= width, 'Controls fit without horizontal overflow');
     await button.click();
    }
   }

   assert.deepEqual(await page.evaluate(() => window.__inboxMessages), [
    { type: 'open_research_inbox' }, { type: 'open_research_inbox_help' },
    { type: 'open_research_inbox' }, { type: 'open_research_inbox_help' }
   ], 'Each button sends only its own native action');

   await page.goto(BASE + '/guide.html#android-research-inbox');
   const topic = page.locator('#android-research-inbox');
   const faq = page.locator('.faq-item').filter({ hasText: 'How do I save a link from Chrome to Research Inbox?' });
   assert.match(await topic.innerText(), /Disclosure Desk Beta/);
   assert.equal(await topic.evaluate(el => el.matches(':target')), true);
   await page.getByRole('searchbox').fill('research inbox');
   assert.equal(await topic.isVisible(), true);
   assert.equal(await faq.isVisible(), true);
   await faq.locator('summary').click();
   assert.equal(await faq.getByRole('link', { name: 'Research Inbox guide' }).getAttribute('href'), '#android-research-inbox');
   console.log('PASS M83 Android Inbox shortcuts, help actions and searchable guide at ' + width + 'px');
   await context.close();
  }
 } finally {
  await browser.close();
 }
})().catch(error => {
 console.error(error);
 process.exitCode = 1;
});
