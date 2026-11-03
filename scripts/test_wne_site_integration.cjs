'use strict';
/* W.NE Research Studio on the nine-tab Disclosure Desk production base.
 * Source and behaviour guards only — no deployments or account data required.
 */
const fs=require('node:fs');const assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html');
const liveTabs=['discover','archivePage','mapPage','livePage','clips','boards','witness','watchRead','hub'];
const expectedTabs=['discover','archivePage','researchStudio','mapPage','livePage','clips','boards','witness','watchRead','hub'];
const actual=[...html.matchAll(/<button class="tab[^>]*data-tab="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(actual,expectedTabs,'Keep all nine live tabs and place W.NE third');
for(const id of liveTabs)assert.ok(html.includes('data-tab="'+id+'"'),id+' must survive');
assert.match(html,/<section id="researchStudio" class="hidden"/);
assert.match(html,/<button class="tab" data-tab="researchStudio"><span class="ico">✎<\/span>W\.NE<\/button>/);
assert.match(html,/\['discover','archivePage','mapPage','cases','clips','rabbitHole','witness','about','resources','podcasts','hub','boards','watchRead','livePage','researchStudio'\]/);
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

console.log('PASS: all 9 live tabs preserved, W.NE third, 4 guided tours, Explore, About, contact, privacy, canonical editor, guest isolation, scripts');
