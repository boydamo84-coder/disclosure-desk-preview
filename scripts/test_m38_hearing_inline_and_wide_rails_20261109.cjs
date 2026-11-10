'use strict';
// M38 no-deploy contracts. Hearing Comments use the existing secure thread
// backend and appear under each video, not in a separate discussion menu.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const hearing=read('assets/live-hearings.js'),schedule=read('assets/live-schedule.js'),
 caseDiscussion=read('assets/case-discussions.js'),home=read('index.html');
for(const p of ['assets/live-hearings.js','assets/live-schedule.js','assets/case-discussions.js'])
 new vm.Script(read(p),{filename:p});
assert.match(hearing,/function addInlineComments\(target,event\)/);
assert.match(hearing,/addInlineComments\(card,event\)/);
assert.match(hearing,/commentsHost=addInlineComments\(box,event\)/);
assert.match(hearing,/window\.ddOpenInlineCaseDiscussion\?\.\('hearing:'\+event\.id/);
assert.doesNotMatch(hearing,/window\.ddOpenCaseDiscussion\?\.\('hearing:/,
 'Hearing entry must not bounce into a separate modal');
assert.match(schedule,/video\.append\(discussionButton,discussionHost\)/);
assert.match(schedule,/window\.ddOpenInlineCaseDiscussion\?\.\('hearing:'\+event\.id/);
assert.match(caseDiscussion,/window\.ddOpenInlineCaseDiscussion=\(id,title,host\)=>/);
assert.match(caseDiscussion,/host\.append\(root\)/);
assert.match(caseDiscussion,/host\.ownerDocument!==document/);
assert.match(caseDiscussion,/window\.ddCloseInlineCaseDiscussion=\(host\)=>/);
assert.match(caseDiscussion,/former\.dispatchEvent\(new Event\('dd-inline-discussion-closed'\)\)/);
assert.match(caseDiscussion,/form\.hidden=false;form\.reset\(\)/);
assert.match(caseDiscussion,/panel\.removeAttribute\('aria-modal'\)/);
assert.match(caseDiscussion,/new window\.URL\('\/',location\.origin\)/);
assert.match(caseDiscussion,/dd_public_comments/);
assert.match(caseDiscussion,/dd_case_comments/);
assert.match(caseDiscussion,/dd_case_comment_flags/);
const styles=home.match(/<style id="dd-m35-one-action-rail">([\s\S]*?)<\/style>/)?.[1]||'';
assert.match(styles,/M38 final audit: responsive compact rails and inline hearing comments/);
assert.match(styles,/@media\(min-width:760px\)/);
assert.match(styles,/justify-content:flex-end!important;gap:6px!important/);
assert.match(styles,/\.dd-hearing-comments-toggle/);
assert.match(styles,/#ddCaseDiscussionDialog \.dd-case-discussion-actions/);
assert.match(styles,/margin-left:0!important/);
assert.match(home,/class="clip-utility-actions dd-action-rail"/);
assert.match(home,/class="immersive-tools dd-action-rail"/);
assert.match(home,/#clips \.clip-utility-actions\.dd-action-rail/);
assert.match(home,/#clips \.immersive-tools\.dd-action-rail/);
assert.match(home,/dd-immersive-inline-comments/,'Immersive videos now use shared inline comments, not a separate modal');
assert.match(home,/data-news-comments="video:/,'Video feed still mounts real inline comments');
assert.match(home,/data-clip-action="board"/);
assert.match(home,/data-clip-action="share"/);
assert.match(home,/feed\.insertAdjacentHTML\('beforeend'[^\n]+refreshBookmarkStars\(\)/);
assert.match(home,/clipsObserver\.observe\(x\)\)\}refreshBookmarkStars\(\)/);
console.log('PASS M38 source: same moderated hearing thread opens immediately beneath video; wide action rails right-aligned; NO DEPLOY');
