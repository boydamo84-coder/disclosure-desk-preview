'use strict';
// Explicit original-request audit. Tests the staged files, never a live server.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const pages=['research/wne.html','research/research-workspace.html',
 'research/research-bible.html','research/guest-preview.html','research/index.html',
 'research/restore-copy.html','research/import.html','research/restore-library.html'];
let count=0;
for(const path of pages){
 const s=read(path);
 assert(!/<a\b[^>]*>\s*←\s*(?:Disclosure Desk|Site)\s*<\/a>/i.test(s),path+' still has duplicated site-return link');
 count++;
}
console.log('PASS REQUEST AUDIT redundant Disclosure Desk return links absent on '+count+' Research pages');
const wne=read('research/wne.html'),bridge=read('research/wne-cloud-bridge.js');
assert.match(wne,/<script src="\.\/research-insert-menu\.js" defer><\/script>/);
assert.match(wne,/#wne-0988-tools-button\{display:none!important\}/);
assert.match(wne,/#wne-quick-setting,#wne-quick-tools/);
assert.match(wne,/id="wne-spell-panel"/);
assert.match(wne,/<script src="\.\/research-text-size\.js" defer><\/script>/);
assert.match(wne,/<script src="\.\/research-docx-import\.js" defer><\/script>/);
assert(!wne.includes("location.assign('/research/import.html')"));
assert.match(wne,/window\.DDResearchImport\.open\(\)/);
console.log('PASS REQUEST AUDIT compact Insert and text sizing; hidden obsolete Tools, inline DOCX and spelling');
assert.match(bridge,/makeLibraryZip/);
assert.match(bridge,/recoveryList:async/);
assert.match(bridge,/recoveryPreview:async/);
assert.match(bridge,/recoveryCopy:async/);
assert.match(wne,/window\.wneEmergencyCopy=async function/);
assert.match(wne,/data-file-action="lifeboat"/);
assert.match(wne,/data-file-action="history"/);
assert.match(wne,/data-file-action="emergency"/);
console.log('PASS REQUEST AUDIT Backup Library, recovery history and Emergency Copy all have mapped actions');
const lib=read('research/research-bible.html');
assert.match(lib,/<details id="ddReferencesSimple"/);
assert.match(lib,/#cloudSync,#publishResearch\{display:none!important\}/);
assert.match(lib,/id="easyBoardFile"/);
const dock=read('research/research-site-nav.js'),dockCss=read('research/research-site-nav.css');
assert(dock.includes('dd-site-dock-track'));
assert(dockCss.includes('--dd-research-dock-height'));
assert(!dock.includes('<span class="dd-site-dock-label">DISCLOSURE DESK</span>'));
console.log('PASS REQUEST AUDIT references folded, misleading sync/publish hidden, dock height reserved');
const home=read('index.html'),avatars=read('assets/profile-avatars.js');
assert.match(home,/class="dd-avatar-information"/);
assert.match(home,/id="ddProfileShortcut"/);
assert.match(avatars,/function updateOwnNavigation\(src\)/);
assert.match(avatars,/\.tab\[data-tab="profilePage"\] \.ico/);
assert(fs.existsSync('sources.html'));
console.log('PASS REQUEST AUDIT external Sources page, avatar info circle, avatar header and profile-tab wiring');
assert.match(home,/dd-profile-delete-request/);
assert.match(home,/support@uapdisclosuredesk\.com/);
// Deliberately do NOT assert account deletion is implemented: it is only a request.
console.log('PENDING DEVICE / BACKEND: signed-in recovery/ZIP/DOCX on Samsung, self-service account deletion, private account photo in Research dock');
console.log('PASS ORIGINAL REQUEST AUDIT TOTAL '+(count+5)+' non-destructive static checks; no live accounts or deploys');
