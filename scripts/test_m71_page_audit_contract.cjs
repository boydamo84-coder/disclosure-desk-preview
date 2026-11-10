'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),comments=read('assets/inline-news-comments.js');
const live=read('assets/live-hearings.js'),liveSchedule=read('assets/live-schedule.js'),votes=read('assets/community-votes.js');
const witness=read('assets/witness-community.js'),caseComments=read('assets/case-discussions.js');
const rail=read('assets/unified-action-rails.js'),css=read('assets/community-polish.css');
const required=[
 ['News articles',/data-news-comments=\"\$\{esc\('news:/],
 ['Archive list cards',/data-news-comments=\"archive:/],
 ['Archive detail',/ddArchiveActionsHTML\(r,true\)\+\s*'\<div class="dd-news-inline-comments"/],
 ['Watch & Read',/watch-read\.js\?v=m67-actions/],
 ['Videos feed',/data-news-comments=\"video:/],
 ['Immersive video',/dd-immersive-inline-comments/],
 ['Featured case cards',/ddCaseCardActions\(r,true,true\)\+ddCaseInlineComments\(r\)/],
 ['Case full evidence',/ddCaseCardActions\(r,false,true\)\+ddCaseInlineComments\(r\)/],
 ['Rabbit Hole cards',/function renderRabbitHole\(/],
 ['Discussion posts',/community-discussions\.js\?v=m73-owner-more/],
 ['Witness signed-in public reports',/witness-community\.js\?v=nov3-community/],
 ['LIVE hearings',/live-hearings\.js\?v=m71-hearing-actions/]
];
for(const [name,pattern] of required)assert.match(html,pattern,'Missing shared action/comments coverage: '+name);
const observed=['newsGrid','ddWatchReadMount','archiveList','archiveCaseBody',
 'clipsFeed','immersiveFeed','caseList','rabbitList','evidenceBody'];
for(const root of observed)assert(comments.includes("'"+root+"'"),'No dynamic comment observer for '+root);
assert.match(comments,/\.immersive-tools/,'Immersive comments toggle uses existing rail');
assert.match(comments,/body\.rows=1/,'Same single-line reply composer on news/media/cases');
assert.match(caseComments,/rows="1"/,'Case and LIVE comments use one-to-three-line reply field');
assert.match(live,/dd-live-hearing-action-rail dd-action-rail/,'Hearing cards share common post rail');
assert.match(liveSchedule,/dd-live-hearing-action-rail dd-action-rail/,'Scheduled/live countdown hearing cards share action rail');
assert.match(liveSchedule,/rail\.append\(discussionButton,board,share\)/,'Scheduled hearings retain real Comments, Board, Share');
assert.match(live,/ddOpenInlineCaseDiscussion/,'Hearing comments are inline beneath recording');
for(const phrase of ['window.DDSavePublicLinkToBoard','window.DDSharePublicLink','dd-hearing-comments-toggle'])
 assert(live.includes(phrase),'Working hearing Board/Share/Comments controls remain: '+phrase);
assert.match(rail,/const ranks=Object\.freeze\(\{vote:0,comments:1,board:2,share:3,extra:4,reply:5,spacer:6\}\)/);
assert.match(rail,/appendChild\(item\.el\)/,'Existing node handlers preserved');
assert.match(rail,/\[data-dd-witness-vote\]/,'Witness vote host is ordered before Board/Share');
assert.match(html,/kind==='archive'[\s\S]*?dataset\.newsComments===ref/,'Profile Archive replies still link to correct inline source');
assert.match(html,/else \{navigateTo\('cases'\);const mount=\[/,'Profile case replies focus the new inline case source');

assert.doesNotMatch(rail,/dd_vote_set|\.rpc\(/,'Presentation cannot fabricate vote numbers or writes');
for(const name of ['dd-news-inline-comments','dd-immersive-inline-comments','dd-live-hearing-action-rail',
 'dd-comment-action-rail','dd-forum-actions','dd-media-actions','dd-archive-action-rail']){
 assert(css.includes(name),'Shared styles must cover '+name);
}
assert.match(html,/inline-news-comments\.js\?v=m73-reply-cancel/);
assert.match(html,/community-polish\.css\?v=m73/);
assert.match(witness,/dd-witness-action-rail dd-action-rail/,'Witness detail retains real votes/Board/share');
assert.match(witness,/DDCommunityVotes\.mount/,'Witness votes use existing actual backend');
assert.doesNotMatch(witness,/dd_case_comments|dd_discussions_reply/,'No invented public replies for witness reports');
const archive=html.slice(html.indexOf('function ddArchiveActionsHTML'),html.indexOf('function ddBindArchiveActions'));
assert(!archive.includes('data-discuss-archive'), 'Archive detail must not create a duplicate modal-only comments button');
assert.match(archive,/dd-archive-action-rail dd-action-rail/);
const cases=html.slice(html.indexOf('function ddCaseInlineComments'),html.indexOf('function renderRabbitHole'));
assert.match(cases,/inline\?'':'<button type="button" data-case-discussion/,'No modal-only button where inline host exists');
console.log('PASS M71 source audit: 12 public interaction surfaces and 9 dynamic roots verified; existing vote, profile and moderation backends untouched');
