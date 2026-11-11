'use strict';
// M80 pending WEBSITE deploy acceptance: exact M77/M79 Android-test-proven
// public assets; no Android-native code, Netlify publish, or database access.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=path=>fs.readFileSync(path,'utf8'),html=read('index.html');
const expected=new Map([
 ['assets/community-polish.css','fb87106404d31233adfa86c55ba26ad66df5f734'],
 ['assets/inline-news-comments.js','088e90354118f7c828148497ca918720f0d86830'],
 ['assets/case-discussions.js','aa7b252567402e2073c5dce78dc5d23cd0cb449e'],
 ['assets/community-votes.js','e3d5fc3e59565fb037fef885a4d447ae5dc4c996'],
 ['assets/community-discussions.js','745e231c9a8bc44b10324a7ee398e8b7ab2b414a']
]);
for(const [path,knownApkBlob] of expected){
 const file=fs.readFileSync(path);
 const gitBlob=crypto.createHash('sha1').update('blob '+file.length+'\0').update(file).digest('hex');
 assert.equal(gitBlob,knownApkBlob,'Website includes exact M79 APK-tested file '+path);
}
const style=read('assets/community-polish.css');
const inline=read('assets/inline-news-comments.js');
const cases=read('assets/case-discussions.js');
const votes=read('assets/community-votes.js');
const forum=read('assets/community-discussions.js');
for(const [path,oldVersion] of [
 ['assets/community-polish.css','m74'],
 ['assets/community-votes.js','m74-branded-confirm'],
 ['assets/community-discussions.js','m73-owner-more'],
 ['assets/case-discussions.js','m73-reply-cancel'],
 ['assets/inline-news-comments.js','m73-reply-cancel']
]){
 const url=path+'?v='+oldVersion+'&m80=web-reply-parity';
 assert(html.includes(url),'Next website release busts cache for '+path);
 assert.equal(html.split(url).length,2,'Exactly one public URL for '+path);
}
for(const selector of ['#newsGrid','.dd-archive-card','#ddWatchRead','#clips','.dd-comment-card.dd-comment-nested']){
 assert(style.includes(selector),'Shared mobile website layout and nested reply CSS for '+selector);
}
assert(style.includes('width:calc(100% - var(--dd-comment-indent))!important'),'Nesting actually reduces card width');
assert(style.includes('.dd-comment-parent-label'),'Reply target label visibly presented');
assert(style.includes('--dd-chat-visual-height'),'Mobile Chat full-height website fix included');
for(const [section,code] of [['News, Archive, Watch & Read and Videos',inline],['Case / Hearing',cases]]){
 assert(code.includes("card.classList.add('dd-comment-nested')"),section+' nests replies by backend parent ID');
 assert(code.includes("card.style.setProperty('--dd-comment-indent'"),section+' uses WebView-safe pixel indent');
 assert(code.includes("item.parent_id||''"),section+' preserves server parent ID');
 assert(code.includes("keepCommentComposerVisible?.(form)"),section+' keeps submit above mobile keyboard');
 assert(code.includes("revealPostedComment?.("),section+' scrolls newly published reply after successful post');
 assert(code.includes("priorIds=new Set("),section+' matches a new row instead of existing replies');
}
assert(votes.includes('function keepCommentComposerVisible(form)'),'Shared keyboard helper available');
assert(votes.includes('function revealPostedComment(card)'),'Shared post-success scroll available');
assert(votes.includes("window.visualViewport?.addEventListener('resize',update)"),'Keyboard visual-viewport changes handled');
assert(votes.includes("threadedComments(items)"),'Shared threaded comments remains backend driven');
assert(forum.includes('revealPostedComment?.(fresh)'),'Discussions also reveals a new reply');
assert(forum.includes('keepCommentComposerVisible?.(form)'),'Discussions also keeps Post available');
assert(forum.includes('dd-forum-nested-reply'),'Discussions own nested reply style preserved');
for(const id of ['newsGrid','archiveList','ddWatchReadMount','clipsFeed','ddCaseDiscussionForm','ddForumReplyCreate']){
 assert(html.includes(id),'Actual website contains '+id);
}
assert(html.includes('assets/confirmation-dialog.js?v=m74'),'M74 branded delete confirmations included');
const stage=read('scripts/build_public_release.cjs');
for(const publicAsset of ['community-polish.css','community-votes.js','community-discussions.js','inline-news-comments.js','case-discussions.js'])
 assert(stage.includes("'"+publicAsset+"'"),'Public release allowlist includes '+publicAsset);
assert(!html.includes('installProfileNotificationControl'),'Android-only native Profile settings not added to website');
assert(!html.includes('FIRST_RUN_ALERTS_CHOICE'),'Android notification permission prompt is native-only');
assert(!style.includes('window.DDAndroid'),'CSS never uses native bridge');
console.log('PASS M80 website release: exact M77/M79 APK-verified reply/keyboard assets; all shared comment tabs; cache-busted public assets; Android-only features excluded.');
