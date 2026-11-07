'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const forum=fs.readFileSync('assets/community-discussions.js','utf8');
const config=fs.readFileSync('assets/community-test-config.js','utf8');
const dock=fs.readFileSync('research/research-site-nav.js','utf8');
assert.doesNotThrow(()=>new Function(forum),'Staged Discussions client must parse');
assert.match(config,/discussions:false/,'Forum stays OFF until privacy & backend approval');
assert.match(forum,/if\(!enabled\)return; \/\/ No tab, requests/,'Disabled module must return before any RPC or DOM nav');
assert.match(forum,/flags\.discussions===true/);
assert.match(html,/id="discussionsPage" class="hidden" hidden/,'Unpublished section remains non-navigable');
assert.match(html,/assets\/community-discussions\.js\?v=/);
assert.match(html,/if\(id==='discussionsPage'&&window\.DD_COMMUNITY_FEATURES\?\.discussions!==true\)return/,'Direct routing guarded');
assert.match(html,/if\(id==='discussionsPage'\)window\.DDDiscussions\?\.refresh\?\.\(\)/);
assert.match(forum,/witness\?\.after\(tab\)/,'Proposed new tab follows Witness when enabled');
for(const id of ['ddForumSections','ddForumSectionCreate','ddForumPostList','ddForumPostCreate','ddForumReplyPane','ddForumReplyCreate','ddForumStatus','ddForumSearch'])assert.match(html,new RegExp('id="'+id+'"'),'Forum control '+id);
for(const fn of ['dd_discussions_sections','dd_discussions_threads','dd_discussions_replies','dd_discussions_create_section','dd_discussions_create_thread_v2','dd_discussions_reply','dd_discussions_pin','dd_discussions_escalate','dd_discussions_vote','dd_discussions_flag'])assert.match(forum,new RegExp("'"+fn+"'"),'Missing guarded RPC '+fn);
assert.match(forum,/is_steward/,'Steward-specific organisation actions');
assert.doesNotMatch(forum,/banUser|ban_member|kickUser|removeOtherPerson|\.innerHTML\s*=/,'No gatekeeper powers or HTML injection');
assert.match(forum,/\.textContent=String\(text\)/,'Untrusted user content rendered as text');
assert.match(forum,/noopener noreferrer nofollow ugc/,'External links untrusted and safe');
assert.match(forum,/\['https:','http:'\]/,'Reject javascript: links');
assert.match(forum,/async function registered\(\)/);
assert.match(forum,/data\.user\.is_anonymous/);
const nav=html.match(/<nav\s+class="nav"[\s\S]*?<\/nav>/i)?.[0]||'';
assert.equal((nav.match(/class="tab(?: active)?"/g)||[]).length,11,'No twelfth tab when disabled');
assert.doesNotMatch(nav,/data-tab="discussionsPage"/,'No early public Discussions tab');
assert.match(dock,/if\(window\.DD_COMMUNITY_FEATURES\?\.discussions===true\)/,
 'Research dock requires the same source-controlled Discussions approval');
assert.match(dock,/TABS\.splice\(afterWitness,0,\['discussionsPage','☷','Discussions'\]\)/,
 'Only insert Discussions after Witness when feature enabled');
console.log('PASS: staged Discussions layout/section/thread/replies; disabled gate; no premature 12th tab; safe URLs and limited steward actions.');

/* Only owner actions on their own content, and limited steward organisation. */
assert.match(html,/id="ddForumStewardPanel"/);
assert.match(html,/id="ddForumStewardForm"/);
assert.match(forum,/section\?\.is_steward/);
assert.match(forum,/dd_discussions_update_section/);
assert.match(forum,/if\(row\.is_mine\)/,'Only own posts/replies receive edit and withdraw buttons');
assert.match(forum,/dd_discussions_edit_own/);
assert.match(forum,/dd_discussions_withdraw_own/);
assert.match(forum,/Number\(row\.my_vote\)===value\?0:value/,'Vote can be removed by choosing the same button');
assert.match(forum,/aria-pressed/,'Accessible voting state');
assert.match(forum,/result===false/,'Server rejection is never presented as successful');
assert.match(forum,/ddForumPostList'\)\.hidden=true/,'Thread view hides background topic list');

// Rich discussion features are feature-gated, with source-level input validation.
for(const id of ['ddForumFeedSearch','ddForumPrev','ddForumNext','ddForumPageStatus'])assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/name="post_tone"/);
assert.match(html,/name="image_url"/);
assert.match(html,/DDSaveForumToBoard/);
assert.match(forum,/dd_discussions_threads_v2/);
assert.match(forum,/p_limit:20,p_offset:feedPage\*20/);
assert.match(forum,/dd_discussions_thread_v2/);
assert.match(forum,/dd_discussions_create_thread_v2/);
assert.match(forum,/dd-forum-post-card/);
assert.match(forum,/safeImage/);
assert.match(forum,/referrerPolicy='no-referrer'/);
assert.match(forum,/window\.DDSaveForumToBoard/);
assert.doesNotMatch(forum,/\.innerHTML\s*=/);

assert.match(html,/id="ddForumNewSection"/);
assert.match(html,/id="ddForumSectionDialog" class="dd-forum-dialog"/);
assert.match(html,/id="ddForumPostDialog" class="dd-forum-dialog"/);
assert.match(html,/id="ddForumNewPost"/);
assert.match(forum,/dialog\.showModal\(\)/);
assert.match(forum,/if\(saved\)\{form\.reset\(\);\$\('ddForumSectionDialog'\)\.close\(\)\}/);
assert.match(forum,/if\(saved\)\{form\.reset\(\);\$\('ddForumPostDialog'\)\.close\(\)\}/);
assert.match(forum,/Delete my /);
assert.match(forum,/dd_discussions_withdraw_own/);
assert.match(html,/\.dd-forum \.dd-forum-dialog::backdrop/);
console.log('PASS: mobile modal section/post creation, owner-confirmed author deletion and button styling.');
