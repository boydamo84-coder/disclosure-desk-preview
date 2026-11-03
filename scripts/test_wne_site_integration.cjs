'use strict';
/* W.NE Research Studio preserves the original Disclosure Desk navigation plus W.NE and Profile.
 * Source and behaviour guards only — no deployments or account data required.
 */
const fs=require('node:fs');const assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html');
const liveTabs=['discover','archivePage','mapPage','livePage','clips','boards','witness','watchRead','hub','profilePage'];
const expectedTabs=['discover','archivePage','researchStudio','mapPage','clips','livePage','boards','witness','watchRead','hub','profilePage'];
const actual=[...html.matchAll(/<button class="tab[^>]*data-tab="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(actual,expectedTabs,'Keep original tabs, W.NE third, and Profile last');
for(const id of liveTabs)assert.ok(html.includes('data-tab="'+id+'"'),id+' must survive');
assert.match(html,/<section id="researchStudio" class="hidden"/);
assert.match(html,/<button class="tab" data-tab="researchStudio"><span class="ico">✎<\/span>W\.NE<\/button>/);
assert.match(html,/\['discover','archivePage','mapPage','cases','clips','rabbitHole','witness','about','resources','podcasts','hub','boards','watchRead','livePage','researchStudio','profilePage'\]/);
for(const id of ['hub','about','researchStudio','ddExploreContact','ddExplorePrivacy','startAppTour'])assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
assert.match(html,/data-start-tour="studio"/);assert.match(html,/data-start-tour="research"/);assert.match(html,/data-start-tour="safety"/);
for(const id of ['basics','research','studio','safety'])assert.match(html,new RegExp("\\{id:'"+id+"',label:"),'Missing tour '+id);
const tours=html.slice(html.indexOf('const tourSections=['),html.indexOf('let tourSection=',html.indexOf('const tourSections=[')));
const studios=(tours.match(/page:'researchStudio'/g)||[]).length;assert.ok(studios>=3,'Include W.NE in full and investigator tours');
assert.match(tours,/page:'hub',target:'#ddExplorePrivacy'/);
for(const snippet of ['How to assess a report','Trace the source','Check the context','Separate evidence from interpretation','Contact &amp; enquiries','Privacy Policy'])assert.ok(html.includes(snippet),'Missing practical Explore content: '+snippet);
assert.ok(!html.includes('Version 0.5 is a functional pre-release prototype'),'Do not expose obsolete About status');
assert.ok(!html.includes('<<div class="card"'),'No malformed About tags');
assert.match(html,/By Boyd Digital Studios/);assert.match(html,/Created by <strong>Boyd Digital Studios<\/strong>/);
assert.match(html,/mailto:support@uapdisclosuredesk.com/);
assert.match(html,/href="\/privacy\.html"/);
const privacy=read('privacy.html');
for(const snippet of ['Last updated: 3 November 2026','Optional accounts, private Boards and W.NE Research Edition','Spelling and grammar assistance','Supabase','Oracle Cloud','support@uapdisclosuredesk.com','Google AdSense','Google AdMob'])assert.ok(privacy.includes(snippet),'Privacy disclosure missing: '+snippet);
assert.match(privacy,/<section><h2>Your choices and rights<\/h2>/);
assert.ok(fs.existsSync('research/index.html')&&fs.existsSync('research/guest-preview.html')&&fs.existsSync('research/wne.html'));
const researchFiles=['research-entry.js','research-auth-guard.js','wne-cloud-bridge.js','research-library-cloud-bridge.js','import-cloud-bridge.js','wne-research-live-spelling.js','wne-export-integration.js','docx-tools.js','restore-copy.js'];
for(const filename of researchFiles){const full='research/'+filename;assert.ok(fs.existsSync(full),full+' missing');assert.doesNotThrow(()=>new Function(read(full)),full+' invalid JS')}
for(const filename of ['index.html','research-workspace.html','wne.html','research-bible.html','import.html','guest-preview.html','restore-copy.html']){
 const file='research/'+filename;assert.ok(fs.existsSync(file),file+' missing');const doc=read(file);
 const embedded=[...doc.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
 for(const [i,code] of embedded.entries())assert.doesNotThrow(()=>new Function(code),file+' script '+i);
}
for(const [i,code] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).entries())assert.doesNotThrow(()=>new Function(code),'Production site inline script '+i);
for(const filename of ['research-workspace.html','wne.html','research-bible.html','import.html'])assert.match(read('research/'+filename),/src="\.\/research-auth-guard\.js"/,filename+' guard missing');
assert.match(read('research/wne.html'),/wne-research-live-spelling\.js/);
assert.match(read('research/wne.html'),/::highlight\(wne-grammar\)/);
assert.match(read('research/wne-cloud-bridge.js'),/research_save_document/);
assert.match(read('research/research-entry.js'),/wne-research-last-document:/);
const guest=read('research/guest-preview.html');
assert.doesNotMatch(guest,/supabase|research_documents|investigation_boards|fetch\s*\(|XMLHttpRequest|contenteditable|localStorage|sessionStorage/i);
assert.ok(fs.existsSync('research/data/curated-public-cases.json'));

for(const name of ['index.html','research-workspace.html','wne.html','research-bible.html','guest-preview.html','import.html','restore-copy.html']){
 const source=read('research/'+name);
 assert.match(source,/<a\b[^>]*href="\/"[^>]*>/,'Research screen must provide a direct back-to-main-site link: '+name);
 assert.match(source,/Disclosure Desk/,'Back link must identify destination: '+name);
}
const fullEditor=read('research/wne.html');
assert.match(fullEditor,/<a class="button dd-return-to-site dd-return-desktop" href="\/" target="_top"/,'Editor toolbar exit must escape iframe');
assert.match(fullEditor,/<a class="dd-return-to-site dd-return-mobile" href="\/" target="_top"/,'Mobile editor exit must be visible in mobile bar');
assert.match(fullEditor,/window\.addEventListener\('beforeunload',e=>\{if\(gen!==savedGen\)/,'Retain original unsaved-writing warning');
assert.match(read('research/research-workspace.html'),/class="dd-workspace-site-return"[^>]*>← Disclosure Desk/,'Outer workspace must have direct exit');
assert.match(read('research/guest-preview.html'),/href="\/" target="_top"/,'Guest preview must return to main site');
assert.match(read('research/import.html'),/href="\.\/research-workspace\.html"/,'Importer must return to valid local workspace, not broken root endpoint');


const integratedNav=read('research/research-site-nav.js');
const integratedCss=read('research/research-site-nav.css');
assert.doesNotThrow(()=>new Function(integratedNav),'Integrated navigation has invalid JavaScript');
assert.match(integratedNav,/wneSaveBeforeNavigation/,'Navigation must call W.NE existing verified save hook');
assert.match(integratedNav,/if\(ok!==true\)/,'Only an explicit confirmed save should allow navigation');
assert.match(integratedNav,/if\(!await verifySaved\(tab\)\)return false/,'Prevent navigation on failed or unavailable save');
assert.match(integratedNav,/window\.top\.location\.assign\(destination\(tab\)\)/,'Return to whole website, not just an iframe');
assert.match(integratedNav,/localStorage\.setItem\(STORAGE_KEY/,'Menu visibility persists per browser');
assert.match(integratedNav,/if\(isFrame\)return/,'Do not double-mount bottom navigation inside iframe');
assert.match(integratedNav,/window\.parent\.ddResearchNavigateTo/,'Child editor return links must delegate save gating to parent');
assert.match(integratedCss,/\.dd-site-dock-track/,'Use swipeable navigation layout');
assert.match(integratedCss,/\.dd-site-dock\.is-hidden/,'Hideable navigation must have persistent reveal button');
assert.match(integratedCss,/body\.dd-site-nav-workspace>main/,'Preserve writing space by resizing workspace around dock');
const tabs=[...integratedNav.matchAll(/\['(?:discover|archivePage|researchStudio|mapPage|livePage|clips|boards|witness|watchRead|hub)','[^']+','[^']+'\]/g)];
assert.equal(tabs.length,10,'Preserve all ten original navigation entries in Research Edition');
assert.match(integratedNav,/\['profilePage','👤','Profile'\]/,'Include Profile as final W.NE dock tab');
assert.ok(integratedNav.indexOf("['clips','▶','Videos']")<integratedNav.indexOf("['livePage','●','LIVE']"),'Research Edition Videos must precede LIVE');
for(const path of ['index.html','guest-preview.html','research-workspace.html','wne.html','research-bible.html','import.html','restore-copy.html']){
 assert.match(read('research/'+path),/<script src="\.\/research-site-nav\.js" defer><\/script>/,path+' must receive shared navigation and return guard');
}
const indexableSite=read('index.html');
assert.match(indexableSite,/ddResearchReturnTab=new URLSearchParams\(location\.search\)\.get\('dd_tab'\)/,'Main site must restore tab chosen from W.NE');
assert.match(indexableSite,/navigateTo\(ddResearchReturnTab\)/,'Directly select destination after leaving W.NE');


const rules=read('community-rules.html');
for(const marker of ['<title>Community Rules','id="accounts"','id="witness"','id="voting"','id="flagging"','id="comments"','id="research"','id="privacy"','3 new public witness reports','5 flags from distinct registered accounts','rolling 24-hour period','sign','town or city','automatically','temporarily hidden','private drafts only']){
 assert.ok(rules.toLowerCase().includes(marker.toLowerCase()),'Missing community rules explanation: '+marker);
}
for(const link of ['href="/community-rules.html"','href="/community-rules.html#flagging"']){
 assert.ok(html.includes(link),'Site should link from Explore, Witness and Footer: '+link);
}
assert.ok((html.match(/href="\/community-rules.html"/g)||[]).length>=3,'Link Community Rules from Explore, Witness and Footer');
assert.match(rules,/Some community features described below are still being built or tested/,'Do not claim witness publication or voting works until activated');

console.log('PASS: all original live tabs and Profile preserved, W.NE third, 4 guided tours, Explore, About, contact, privacy, canonical editor, guest isolation, scripts');
