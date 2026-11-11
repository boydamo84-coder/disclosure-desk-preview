'use strict';
/* M74 static contract: no production data or hosted services. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const moduleSource=read('assets/confirmation-dialog.js'),hub=read('assets/research-hub.js');
const publicComments=read('assets/community-votes.js'),avatars=read('assets/profile-avatars.js');
const html=read('index.html'),css=read('assets/community-polish.css'),bundle=read('scripts/build_public_release.cjs');
for(const name of ['assets/confirmation-dialog.js','assets/research-hub.js','assets/community-votes.js','assets/profile-avatars.js']){
 assert.doesNotThrow(()=>new Function(read(name)),name+' valid JavaScript');
}
for(const source of [hub,publicComments,avatars]){
 assert.match(source,/window\.DDConfirm\?\.show\?\.\(/,'Mutations require branded confirmation');
 assert.doesNotMatch(source,/\b(?:window\.)?confirm\(|\bprompt\(/,'No Chrome-native confirm or prompt on user profile and public comments');
}
assert.match(moduleSource,/aria-modal/);
assert.match(moduleSource,/aria-labelledby/);
assert.match(moduleSource,/aria-describedby/);
assert.match(moduleSource,/addEventListener\('cancel'/,'Escape cancels');
assert.match(moduleSource,/addEventListener\('close'/,'Browser close cancels');
assert.match(moduleSource,/accept\.disabled=true/,'Typed permanent deletion not enabled by default');
assert.match(moduleSource,/if\(busy\|\|!document\.body\)return resolve\(false\)/,'Concurrent confirmations fail closed');
assert.doesNotMatch(moduleSource,/innerHTML|outerHTML|insertAdjacentHTML/,'User supplied copy is rendered as text');
assert.match(hub,/requiredPhrase:'DELETE'/,'Permanent document deletion retains typed approval');
assert.match(hub,/c\.rpc\('dd_delete_my_comment'/,'Profile uses existing owner deletion RPC');
assert.match(publicComments,/callOwner\('dd_delete_my_comment'/,'Public menu uses verified owner RPC');
assert.match(avatars,/if\(!await window\.DDConfirm/,'Profile photo deletion requires an affirmative response');
const scriptPos=html.indexOf('assets/confirmation-dialog.js?v=m74');
assert(scriptPos>=0&&scriptPos<html.indexOf('assets/research-hub.js?v=m74-branded-confirm'));
assert(scriptPos<html.indexOf('assets/community-votes.js?v=m74-branded-confirm'));
assert(scriptPos<html.indexOf('assets/profile-avatars.js?v=m74-branded-confirm'));
assert.match(html,/assets\/community-polish\.css\?v=m74/);
assert.match(bundle,/'confirmation-dialog\.js'/,'Public release must include confirmation module');
assert.match(css,/dialog\.dd-confirm-dialog/);
assert.match(css,/\.dd-confirm-actions \.dd-confirm-danger/);
assert.match(css,/@media\(max-width:360px\)/);
console.log('PASS M74 branded confirmation integration, fail-closed cancel, typed permanent delete, owner actions, accessible mobile CSS and release packaging');
