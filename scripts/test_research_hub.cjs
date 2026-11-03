'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),hub=fs.readFileSync('assets/research-hub.js','utf8');
const names=fs.readFileSync('assets/public-profiles.js','utf8'),mod=fs.readFileSync('assets/case-comment-moderation.js','utf8');
assert.doesNotThrow(()=>new Function(hub));
assert.match(html,/data-tab="profilePage"/,'Profile is last nav tab');
assert.match(html,/data-tab="hub"[\s\S]{0,110}data-tab="profilePage"/);
assert.match(html,/id="ddProfileShortcut"/);
assert.match(html,/avatar\.hidden=\(id==='researchStudio'\)/,'W.NE hides top right shortcut');
const dock=fs.readFileSync('research/research-site-nav.js','utf8');
assert.match(dock,/\['profilePage','👤','Profile'\]/,'Research Edition dock has Profile without a top-right shortcut');
assert.match(html,/window\.DDResearchHub\?\.refresh\(\)/);
const reveal=html.indexOf("classList.toggle('hidden',k!==id)");
const load=html.indexOf("if(id==='profilePage')window.DDResearchHub?.refresh();");
assert.ok(reveal>=0&&load>reveal,'The Profile must become visible BEFORE refresh runs or both guest and account sections stay blank');
assert.match(html,/EVIDENCE ARCHIVE<\/div><\/div><\/div><\/div><button type="button" class="dd-profile-shortcut"/,'Profile shortcut must be outside logo brand wrapper for one-row header');
assert.match(html,/id="ddProfileGuest"/);
assert.match(html,/id="ddProfilePrivate"/);
assert.match(hub,/c\.from\('research_documents'\)\.select\('id,title,updated_at'/,'Cloud docs only');
assert.match(hub,/c\.from\('investigation_boards'\)\.select\('id,name,updated_at'/);
assert.match(hub,/c\.rpc\('dd_my_comments'/);
assert.match(hub,/c\.from\('dd_witness_reports'\)\.select\('id,category,event_date,city,country,status,created_at'/);
assert.match(hub,/c\.rpc\('dd_is_comment_moderator'\)/,'Admin must be server-authorised');
assert.match(hub,/moderator\?\.data===true/,'Do not infer admin from email/user metadata');
assert.match(hub,/c\.rpc\('dd_witness_moderation_queue'\)/);
assert.match(hub,/c\.rpc\('dd_case_comment_moderation_queue'\)/);
assert.match(hub,/auth\.updateUser\(\{password:one\.value\}\)/);
assert.match(hub,/auth\.signOut\(\)/);
assert.match(hub,/shownUser|userId/);
assert.doesNotMatch(hub,/service_role|sb_secret_|Google[_ ]?API[_ ]?KEY|client_secret/i,'No server secrets in client');
assert.match(names,/getElementById\('ddProfileUsername'\)/);
assert.match(mod,/querySelector\('#ddAdminModerationControl'\)/);
assert.match(html,/Search Console/);
assert.match(html,/Google Analytics/);
assert.match(html,/urgent%20community%20report/,'Actual urgent-report email path is present');
assert.doesNotMatch(html,/id="ddAdminHiddenComments">[0-9]+/,'No fake admin counts');
console.log('PASS: profile navigation, W.NE shortcut exclusion, owner-only account data, moderator-gated admin, no fake traffic data');

/* Research Hub accordion regression: collapses only the six personal sections, never auth/admin. */
const hubStart=html.indexOf('<section id="profilePage"'), hubEnd=html.indexOf('<section id="ddProfileAdmin"',hubStart);
assert.ok(hubStart>=0&&hubEnd>hubStart,'Profile section must precede Admin Centre');
const hubMarkup=html.slice(hubStart,hubEnd);
assert.equal((hubMarkup.match(/<details[^>]*class="dd-profile-card dd-profile-fold"/g)||[]).length,7,'Seven collapsible Hub sections including id-labelled Profile Chat');
assert.equal((hubMarkup.match(/<summary><span>/g)||[]).length,7,'Each section has a native keyboard-accessible summary');
assert.equal((hubMarkup.match(/<\/details>/g)||[]).length,8,'Seven Hub accordions plus one nested Recently deleted disclosure close correctly');
for(const id of ['ddProfileFilesList','ddProfileBoardsList','ddProfileCommentsList','ddProfileWitnessList','ddProfileUsername','ddProfilePasswordForm']){
 assert.match(hubMarkup,new RegExp('id="'+id+'"'),'Existing private destination '+id+' stays mounted');
}
assert.match(html,/\.dd-profile-fold>summary:focus-visible/,'Keyboard focus remains visible');
assert.match(html,/\.dd-profile-fold\[open\] \.dd-profile-chevron/,'Expandable arrow indicates open state');
assert.doesNotMatch(hubMarkup,/<details class="dd-profile-card dd-profile-fold" open/,'Hub remains tidy/collapsed by default');

/* Account-owned content management reuses already installed RLS/RPC permissions.
 * All operations are user-initiated, never automatic on refreshing Profile. */
assert.match(html,/id="ddProfileTrashList"/,'Recently deleted documents live in the existing W.NE Hub');
assert.match(hub,/from\('research_document_trash'\)\.select\('id,title,trashed_at'/);
assert.match(hub,/rpc\('research_trash_document',\{p_id:d\.id\}\)/);
assert.match(hub,/rpc\('research_restore_document',\{p_id:d\.id\}\)/);
assert.match(hub,/rpc\('research_purge_trashed_document',\{p_id:d\.id\}\)/);
assert.match(hub,/rpc\('dd_edit_my_comment',\{p_id:item\.id,p_body:body\}\)/);
assert.match(hub,/rpc\('dd_delete_my_comment',\{p_id:item\.id\}\)/);
assert.match(hub,/from\('dd_witness_reports'\)\.delete\(\)\.eq\('id',r\.id\)\.eq\('author_id',user\.id\)\.select\('id'\)/);
assert.match(hub,/async function runOwned\(ownerId/,'Mutation guard verifies a current registered owner session');
assert.match(hub,/data\.user\.id!==ownerId/,'Do not trust stale signed-in state during mutations');
assert.match(hub,/prompt\('This permanently removes the trashed cloud document/,'Permanent deletion requires typed confirmation');
assert.match(hub,/does NOT reset the three-per-day report limit/,'Witness quota is preserved after deletion');
assert.doesNotMatch(hub,/\.from\('dd_witness_reports'\)\.insert/,'No browser-controlled geocoded report creation');
