'use strict';
// M12: no-network source regression for Android back gestures / premium navigation.
// Real Samsung Back and visual QA are separate release gates.
const fs=require('node:fs'),assert=require('node:assert/strict');
const main=fs.readFileSync('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java','utf8');
const nav=fs.readFileSync('android-test/app/src/main/java/com/disclosuredesk/preview/DeskNavigation.java','utf8');
const people=fs.readFileSync('assets/people-directory.js','utf8');
const page=fs.readFileSync('who-is-who.html','utf8');
const data=JSON.parse(fs.readFileSync('data/public-people-directory.json','utf8'));
const gradle=fs.readFileSync('android-test/app/build.gradle.kts','utf8');
for(const needle of ['isEmbeddedSecondaryPage(url)','isEmbeddedSecondaryPage(view.getUrl())',
  'nativeShell=false','installSecondaryEditorialNavigation();','isEmbeddedSecondaryPage(web.getUrl())',
  'web.loadUrl(HOME+"?dd_tab="+Uri.encode(section))','window.DDPeopleDirectoryBack',
  'if(web.canGoBack())web.goBack();','else web.loadUrl(HOME+"?dd_tab=hub");'])
 assert(main.includes(needle),'Secondary embedded Android app route and Back logic: '+needle);
for(const needle of ['case "/who-is-who":','case "/guide":','case "/investigations":',
  'case "/research-edition":','case "/sources":'])
 assert(main.includes(needle),'Approved secondary URL: '+needle);
assert(main.includes('if(!"https".equals(parsed.getScheme())')&&
 main.includes('!"uapdisclosuredesk.com".equals(parsed.getHost())'),
 'Only canonical secure origins are internal routes');
assert(nav.includes('MAIN = {"discover", "archivePage", "discussionsPage", "chatPage", "more"}'),
 'Legacy native bar kept only for compatibility; secondary pages use the real editorial nav');
assert(main.includes('nativeShell=false;')&&main.includes('installSecondaryEditorialNavigation();'),'Secondary pages must use the editorial nav, not the legacy native dock');
assert(gradle.includes('applicationIdSuffix = ".beta.m121"')&&
 gradle.includes('versionCode = 30'),'Unique non-production APK package and version');
assert(people.includes('window.DDPeopleDirectoryBack=backToDirectory')&&
 people.includes('history.back()')&&people.includes('history.replaceState'),
 'Directory uses browser history when available and safe direct-link fallback');
assert(people.includes('paintPortrait')&&people.includes('photo.source')&&people.includes('photo.license'),
 'Portrait source and licence checks preserved');
assert(page.includes('profilePhotoCredit'),'Portrait credit exposed for real users');
assert.equal(data.people.length,50,'Exactly fifty source-linked profile records');
assert(data.people.filter(p=>p.photo).length>=17,'Reviewed portraits appear where available');
assert(data.people.filter(p=>p.category.includes('Congress')).length>=10,'Congress members included');
assert(data.people.filter(p=>p.category.includes('NASA UAP study')).length===17,'NASA independent study covered');
assert(!main.includes('addJavascriptInterface('),'Do not weaken origin restricted Android bridge');
console.log('PASS M12 Android source contract: premium bottom nav on secondary public pages, safe Who\'s Who gesture Back, 50 people, portrait source policy and unique beta package');
