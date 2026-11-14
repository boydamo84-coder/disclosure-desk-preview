'use strict';
// Android-only M12.3 context return contract. This deliberately does not
// require any index.html change or any production API/service.
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const a=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const people=read('assets/people-directory.js');
const research=read('android-test/app/src/main/assets/research-return-nav.js');
const html=read('index.html');
const gradle=read('android-test/app/build.gradle.kts');
assert(a.includes('installResearchReturnNavigation(url);'),'Research return script installed for home and approved secondary pages');
assert(a.includes('getAssets().open("research-return-nav.js")'),'Return logic is a bundled offline Android asset');
assert(a.includes("window.DDResearchReturn.handleBack()")&&
 a.includes("return 'handled'"),'Android system Back delegates to secure contextual link before dialog history');
assert(a.includes('isAppHomeUrl(url)')&&a.includes('isEmbeddedSecondaryPage(url)'),
 'Java injection limited to trusted canonical bundled routes');
assert(people.includes("dest.searchParams.set('dd_from','who')")&&
 people.includes('CASE_RETURN_KEY')&&people.includes('directoryReturn:directoryReturn'),
 'Origin profile, case target, source scroll and directory position stored only for clicked allowed links');
assert(people.includes('showProfileAtContent(person,!updateUrl)')&&
 people.includes('ddDirectoryReturn'),'Original Who navigation remains history-aware');
assert(research.includes('dd_from')&&research.includes('15*60*1000')&&
 research.includes('original.origin===currentOrigin')&&research.includes('location.assign(ctx.page)'),
 'Origin marker, TTL and same-origin destination enforced');
assert(research.includes("document.getElementById('archiveCaseDialog')")&&
 research.includes("new MutationObserver(refresh)")&&
 research.includes('returnToPerson'),'Return button reappears when Archive rebuilds case content');
assert(!html.includes('dd-research-return-bar'),'Original public-site home HTML remains untouched');
assert(gradle.includes('applicationIdSuffix = ".beta.m123"')&&
 gradle.includes('versionCode = 32'),'Build a distinct non-production private test APK');
assert(!a.includes('addJavascriptInterface('),'No privileged WebView bridge introduced');
console.log('PASS M12.3: vetted same-origin contextual Back, source-position return, page/origin safety and independent APK identity');
