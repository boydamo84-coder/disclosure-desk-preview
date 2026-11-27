'use strict';
/* GA4 retirement source contract — locally inspect all published pages only. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','guide.html','sources.html','community-rules.html','research-edition.html',
 'investigations.html','terms.html','roswell-1947.html','rendlesham-forest-1980.html',
 'who-is-who.html','privacy.html','world-uap-programmes.html','first-investigation.html','site-updates.html'];
const activeGa=/<script\b[^>]*\b(?:src\s*=\s*["'][^"']*(?:analytics-consent\.js|googletagmanager|google-analytics|gtag\/js)[^"']*["'])[^>]*>|(?:\bgtag\s*\(|window\.DDAnalyticsConsent|data-dd-analytics-open|id\s*=\s*["']dd-analytics-consent["'])/i;
for(const p of pages){
 const html=read(p);
 assert.doesNotMatch(html,activeGa,'Legacy Google tracking or consent control in '+p);
 assert.doesNotMatch(html,/G-ZWJQMK8JSW/,'GA4 measurement ID in '+p);
}
const homepage=read('index.html'),privacy=read('privacy.html'),bundle=read('scripts/build_public_release.cjs');
assert.match(homepage,/>Netlify dashboard<\/a>/);
assert.match(homepage,/>Search Console<\/a>/);
assert.doesNotMatch(homepage,/>Google Analytics<\/a>/);
assert.match(privacy,/id="website-analytics"/);
assert.match(privacy,/Netlify Web Analytics/);
assert.match(privacy,/advertising-settings/);
assert.match(privacy,/data-dd-advertising-open/);
assert.match(privacy,/site-adsterra-m02\.js\?v=staged-disabled-m02/);
assert(!fs.existsSync(path.join(root,'assets/analytics-consent.js')),'Deleted GA script must not exist');
assert(!bundle.includes("'analytics-consent.js'"),'Deprecated asset must be removed from release allowlist');
assert(bundle.includes("'site-adsterra-m02.js'"),'Separate advertising consent adapter must remain staged');
const adapter=read('assets/site-adsterra-m02.js');
assert.match(adapter,/const RELEASE_ENABLED=false;/);
assert.match(adapter,/advertising-consent-v1/);
assert.match(adapter,/choice!=='accepted'/);
console.log('GA4 RETIREMENT PASS: 14 public HTML pages clean; Netlify and Search Console retained; independent Adsterra consent locked');
