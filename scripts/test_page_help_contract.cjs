'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const pages=['index.html','guide.html','who-is-who.html','investigations.html','rendlesham-forest-1980.html','roswell-1947.html','sources.html','research-edition.html','community-rules.html','privacy.html','terms.html'];
const src=fs.readFileSync('assets/page-help.js','utf8');
for(const path of pages){
 const s=fs.readFileSync(path,'utf8');
 assert(s.includes('/assets/page-help.js?v=r2-m10-help01'),'Contextual help included in '+path);
 assert(s.includes('</body>'),'Existing page preserved '+path);
}
const home=fs.readFileSync('index.html','utf8');
const guide=fs.readFileSync('guide.html','utf8');
const bundler=fs.readFileSync('scripts/build_public_release.cjs','utf8');
assert(bundler.includes("'page-help.js'"),'Public bundle explicitly permits page help');
for(const tab of ['discover','archivePage','researchStudio','mapPage','livePage','clips','boards','witness','watchRead','profilePage','hub','discussionsPage','chatPage','cases','rabbitHole','resources','podcasts','about'])
 assert(src.includes(tab+':')||src.includes("'"+tab+"'"),'All main app tabs have help content: '+tab);
for(const section of ['evidence-dna','source-lineage','people']){
 assert(guide.includes('id="'+section+'"'),section+' guide section exists');
 assert(guide.includes('href="#'+section+'"'),section+' is in guide navigation');
}
assert(home.includes("{id:'evidence',label:'Follow the Evidence'"),'Evidence-specific tour section exists');
assert(home.includes('data-start-tour="evidence"'),'Visible focused-tour control exists');
assert(home.includes('window.DDStartTour=openTour'),'Popup can launch existing tour function');
assert(!src.includes('localStorage')&&!src.includes('fetch(')&&!src.includes('iframe'),
 'No tracking, external calls or embedded remote guide within help popup');
assert(src.includes('modal.showModal()')&&src.includes("modal.addEventListener('close'"),
 'Native keyboard-focused modal and return focus supported');
console.log('PASS M10 contextual help: 18 main tabs, 10 public research pages, guide chapters and new evidence tour; no external access or tracking');

// Runnable M10 acceptance suite. [skip netlify]
