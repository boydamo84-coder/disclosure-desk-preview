'use strict';
/* M02 release-lock contract: no live third-party request, consent independent of analytics.
 * This test intentionally does NOT load a live advertising script.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('assets/site-adsterra-m02.js');
const layout=read('assets/site-ad-layout-m01.js');
const html=read('index.html'),privacy=read('privacy.html');
const build=read('scripts/build_public_release.cjs');
assert.match(js,/const RELEASE_ENABLED=false;/,'Live ad provider MUST remain locked');
assert.match(js,/advertising-consent-v1/);
assert.match(js,/choice!=='accepted'/);
assert.doesNotMatch(js,/createElement\\(['"]iframe|srcdoc|setAttribute\\(['"]sandbox/,'No additional publisher-created iframe is allowed');
assert.match(js,/script\\.src=LOCAL_TEST\\?/);
assert.match(js,/ad-m04-direct-banner-test\\.html/);
assert.match(js,/window\.top!==window/);
assert.match(js,/['"]\/privacy['"]/);
assert.match(js,/newsGrid/);
assert.match(js,/archiveList/);
assert.match(js,/clipsFeed/);
assert.match(js,/discussionsPage/);
assert.match(js,/W\.NE/);
for(const key of ['6e71e0ae33c20d811ac3ff6e51c016a5','583ba41b4ca944fbeb2ae6136eec2cdd','4e32127ce7b1af4bb948957fe0015e97'])
 assert(js.includes(key),'Publisher code missing '+key);
assert.match(js,/https:\/\/bicea\.org\/22\//);
assert.match(html,/site-adsterra-m02\.js\?v=staged-disabled-m02/);
assert.match(privacy,/site-adsterra-m02\.js\?v=staged-disabled-m02/);
assert.match(privacy,/id="advertising-settings"/);
assert.match(privacy,/Adsterra advertising is not yet enabled/);
assert.match(privacy,/data-dd-advertising-open/);
assert.match(build,/'site-adsterra-m02\.js'/);
assert.match(layout,/providerEnabled:false/);
for(const p of ['research/wne.html','research/index.html','research-edition.html']){
 assert(!read(p).includes('site-adsterra-m02'),'Ad provider must never be in '+p);
}
const context={window:{top:null},location:{pathname:'/',hostname:'uapdisclosuredesk.com',search:''}};
context.window.top=context.window;
vm.runInNewContext(js,context,{filename:'site-adsterra-m02.js'});
assert(context.window.DDAdsterraM02,'No safe export for release state');
assert.equal(context.window.DDAdsterraM02.releaseEnabled,false);
assert.equal(context.window.DDAdsterraM02.units.mobile.width,320);
assert.equal(context.window.DDAdsterraM02.units.tile.height,250);
assert.equal(context.window.DDAdsterraM02.units.wide.width,728);
assert.equal(context.window.DDAdsterraM02.advertisingConsentSeparateFromAnalytics,true);
console.log('ADS M04 PASS: 3 provider units staged direct, zero extra iframe, vendor disabled, 0 pre-consent requests, W.NE excluded');
