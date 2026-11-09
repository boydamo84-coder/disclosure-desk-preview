'use strict';
// Milestone 34 owner-approved UI and document-safety contracts.
// Read-only local source checks: NEVER touches a real account or Netlify.
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('index.html'),forum=read('assets/community-discussions.js'),
 votes=read('assets/community-votes.js'),news=read('assets/inline-news-comments.js'),
 cases=read('assets/case-discussions.js'),writer=read('research/wne.html'),
 css=read('research/wne-polish-m34.css'),polish=read('research/wne-polish-m34.js'),
 bridge=read('research/wne-cloud-bridge.js'),studio=read('research/research-workspace.html'),
 live=read('assets/live-schedule.js'),build=read('scripts/build_public_release.cjs');

assert.match(forum,/dd_discussions_sections/);
assert.match(forum,/dd_discussions_threads_v2/);
assert.match(forum,/async function openThread/);
assert.match(forum,/\$\('ddForumReplyContent'\)/);
assert.match(forum,/\$\('ddForumReplyPane'\)\.hidden=false/);
assert.match(forum,/dd-forum-detail-open/);
assert.match(forum,/function chooseReply\(target,focusComposer=false\)/);
assert.match(forum,/p_parent_id:parent/);
assert.match(forum,/nodeAction\(tools,'↳ Reply'/);
assert.match(forum,/▲ /);
assert.match(forum,/▼ /);
assert.doesNotMatch(forum,/👍|👎/,'Discussing uses triangles, not thumbs');
assert.match(home,/#ddForumThreadPane\.dd-forum-detail-open \.dd-forum-pagination/);
assert.match(home,/#discussionsPage \[hidden\]\{display:none!important\}/);
console.log('PASS M34: sections → full posts → individual replies and nonduplicated detail');

assert.match(votes,/function threadedComments\(items\)/);
assert.match(votes,/function mountCommentCard\(card,header,body,flag,id,onReply\)/);
assert.match(votes,/▲ /);
assert.match(votes,/▼ /);
assert.doesNotMatch(votes,/👍|👎/);
assert.match(news,/parent_id:replyingTo\?\.id\|\|null/);
assert.match(news,/dd-comment-reply-context/);
assert.match(cases,/parent_id:parent\?\.id\|\|null/);
assert.match(cases,/dd-comment-nested/);
assert.match(home,/#newsGrid article\.news-row\{display:grid!important/);
assert.match(home,/#newsGrid article>\.dd-news-actions/);
assert.match(home,/dd-comment-action-rail/);
const newsTemplate=home.slice(home.indexOf("\$('newsGrid').innerHTML=results.map"),home.indexOf("document.querySelectorAll('.news-headline-link')"));
assert.match(newsTemplate,/\$\{newsRabbitHole\(s,i\)\}<\/div><div class="dd-news-actions"/,
 'News bar must follow body across full article width');
console.log('PASS M34: consistent full-width News actions, arrow voting and parent-linked comment replies');

assert.match(home,/id="mapItems" hidden aria-hidden="true"/);
assert.match(home,/id="ddMapArchiveShortcut"/);
assert.match(home,/id="mapArchiveResults" hidden aria-hidden="true"/);
assert.match(home,/#mapItems,#mapArchiveResults\\{display:none!important\\}/);
assert.match(home,/function renderArchiveMapResults\\(\\)\\{[\\s\\S]*?panel\\.hidden=true;/);

assert.match(live,/https:\/\/docs\.house\.gov\/Committee\/Calendar\/ByWeek\.aspx/);
console.log('PASS M34: Map pins retained, duplicate card list hidden, official House link');

assert.match(writer,/restore-library-core\.js/);
assert.match(writer,/result\?\.verified_copy/);
assert.match(writer,/Preview only — the restored copy keeps the FULL original text/);
assert.match(bridge,/function recoveryMatches/);
assert.match(bridge,/\.select\('id,user_id,title,content'\)\.eq\('id',created\.id\)\.single\(\)/);
assert.match(bridge,/verified_copy:true/);
assert.match(bridge,/manual-review\//);
assert.match(bridge,/needsManualReview:needsReview\.length/);
assert.match(polish,/id='dd-m34-new-document'/);
assert.match(polish,/DDRecoveryCopyNotice/);
assert.match(css,/\.dd-m34-dialog/);
assert.match(css,/#dd-word-ribbon-v1/);
assert.match(css,/#wne-findbar #wne-replace-all/,'Replace All must have branded action');
assert.match(css,/#wne-findbar #wne-find-close/,'Find must have a visible close control');
assert.match(css,/max-height:calc\(100dvh - 18px\)/,'Find panel must fit narrow phone viewport');
assert.match(css,/\.wne-m34-prompt menu button:last-child/,'Legacy branded dialogs must emphasise primary action');

assert.match(css,/#dd-image-edit #dd-crop-preview/);
assert.match(studio,/#dd-word-ribbon-v1,#dd-word-context-v1/);
assert.match(build,/'wne-polish-m34\.css','wne-polish-m34\.js'/);
console.log('PASS M34: W.NE safe readback, bounded preview, one branded ribbon/dialog, crop and public allowlist');
console.log('PASS M34 UI CONTRACTS: local only, no live data, no Netlify');
