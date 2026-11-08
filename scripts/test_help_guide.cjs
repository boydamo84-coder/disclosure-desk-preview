'use strict';
// Public research Help + FAQ content and navigation regression, synthetic and network-free.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const guide=fs.readFileSync('guide.html','utf8');
const home=fs.readFileSync('index.html','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const build=fs.readFileSync('scripts/build_public_release.cjs','utf8');
assert.match(guide,/<!doctype html>/i);
assert.match(guide,/<html lang="en">/);
assert.match(guide,/name="viewport"/);
assert.match(guide,/<main class="content">/);
assert.match(guide,/<a class="skip" href="#main">/,'Accessible skip link');
const topics=[...guide.matchAll(/<section class="card guide-topic" id="([^"]+)" data-help-search>/g)].map(x=>x[1]);
assert.deepEqual(topics,['news','archive','map','videos','studio','boards','witness','profile','community','satellite']);
assert.equal((guide.match(/class="pathway" data-help-search/g)||[]).length,4,
  'Four real-world start-to-finish workflows, not slogans');
assert.equal((guide.match(/class="faq-item" data-help-search/g)||[]).length,31,
  '31 independent native details/summary FAQ answers');
assert.equal((guide.match(/<details class="faq-item" data-help-search><summary>/g)||[]).length,31);
assert.equal((guide.match(/<\/details>/g)||[]).length,31);
for(const section of [...topics,'start','workflows','faq','glossary']){
 assert.ok(guide.includes('id="'+section+'"'),'Help anchor missing '+section);
 assert.ok(guide.includes('href="#'+section+'"'),'Sidebar guide link missing '+section);
}
for(const p of ['discover','archivePage','mapPage','clips','livePage','watchRead',
'researchStudio','boards','witness','profilePage','hub']){
 assert.ok(guide.includes('/?dd_tab='+p),'Missing existing public route '+p);
}
assert.match(guide,/Phone beta — not public/);
assert.match(guide,/not yet available on the public website/);
assert.match(guide,/public witness-submission function is feature-controlled/i);
assert.match(guide,/No matching satellite photograph is guaranteed/);
assert.match(guide,/no nearest historical frame exists|not.*verified that a matching nearest historical frame exists/i);
assert.match(guide,/not the same as a native Play Store/i);
assert.match(guide,/Some Board material is stored in your current browser/);
assert.match(guide,/LanguageTool service/);
assert.match(guide,/not proof that every interpretation/i);
assert.match(guide,/historical satellite image|satellite image/i);
assert.doesNotMatch(guide,/not.*end-to-end encrypted|fully encrypted chat|guaranteed\s+cloud\s+backup|verified\s+UFO\s+proof/i);
assert.match(guide,/id="helpSearch"/);
assert.match(guide,/role="status" aria-live="polite"/);
assert.match(guide,/search\.addEventListener\('input',update\)/);
assert.match(guide,/item\.hidden=!found/);
assert.match(guide,/prefers-reduced-motion:reduce/);

const persistentNav=guide.match(/<nav class="dd-guide-bottom-nav"[\\s\\S]*?<\\/nav>/)?.[0]||'';
assert.match(persistentNav,/Disclosure Desk main site navigation/);
for(const tab of ['discover','archivePage','researchStudio','mapPage','clips','livePage','boards','witness','watchRead','hub','profilePage'])
 assert.ok(persistentNav.includes('href="/?dd_tab='+tab+'"'),'Guide dock must navigate to existing tab '+tab);
assert.equal((persistentNav.match(/class="dd-guide-tab"/g)||[]).length,13,'11 public tabs plus two local-only beta links');
assert.equal((persistentNav.match(/data-guide-beta hidden/g)||[]).length,2,'Chat and Discussions hidden on public guide');
assert.match(guide,/location\\.hostname/);
assert.match(guide,/position:fixed;bottom:0;left:0;right:0/,'Guide dock remains on-screen during mobile FAQ scrolling');

const script=[...guide.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
assert.equal(script.length,1,'A single dependency-free accessible search script');
assert.doesNotThrow(()=>new vm.Script(script[0],{filename:'guide.html inline'}));
assert.ok(guide.indexOf('id="helpSearch"')<guide.indexOf('<div class="layout" id="main">'),
 'Search must be visible at top before the long guide, not hidden deep inside FAQ');
const searchInput={value:'',handlers:{},addEventListener(event,cb){this.handlers[event]=cb}};
const searchCount={textContent:''},notFound={hidden:true};
const mockRows=[
 {textContent:'UAP News and current sources',hidden:false},
 {textContent:'Satellite archive 1976 Landsat imagery',hidden:false},
 {textContent:'Private witness drafts and privacy',hidden:false}
];
const fakeDocument={
 getElementById(id){return ({helpSearch:searchInput,helpCount:searchCount,noMatches:notFound})[id]||null},
 querySelectorAll(selector){assert.equal(selector,'[data-help-search]');return mockRows}
};
vm.runInNewContext(script[0],{document:fakeDocument,console},{timeout:1000});
assert.match(searchCount.textContent,/All 3 help topics/);
searchInput.value='satellite';searchInput.handlers.input();
assert.deepEqual(mockRows.map(x=>x.hidden),[true,false,true]);
assert.equal(notFound.hidden,true);
assert.match(searchCount.textContent,/1 matching topic/);
searchInput.value='no_such_case_987';searchInput.handlers.input();
assert.deepEqual(mockRows.map(x=>x.hidden),[true,true,true]);
assert.equal(notFound.hidden,false);
searchInput.value='';searchInput.handlers.input();
assert.deepEqual(mockRows.map(x=>x.hidden),[false,false,false]);
assert.equal(notFound.hidden,true);
const guideLinks=(home.match(/href="\/guide\.html"/g)||[]).length;
assert.ok(guideLinks>=3,'How-to reachable from Explore, About and footer');
assert.match(home,/id="startAppTour"/,'Existing 30-step guided tour preserved');
assert.match(home,/href="\/sources.html"/);
assert.match(home,/data-go="about"/);
assert.match(build,/const top=\['index.html','guide.html',/,'Guide must be shipped in strict public allowlist');
assert.match(sitemap,/https:\/\/uapdisclosuredesk\.com\/guide\.html/);
const nav=home.match(/<nav class="nav"[\s\S]*?<\/nav>/i)?.[0]||'';
assert.equal((nav.match(/class="tab(?: active)?"/g)||[]).length,11,
 'Help cannot become an extra bottom-navigation tab');
assert.doesNotMatch(guide,/<script[^>]+src="https?:/,'Guide must not load unapproved remote JS');
console.log('PASS: searchable 31-question FAQ, ten accurate sections, four workflows, accessible controls, release allowlist and unchanged 11-tab navigation.');
