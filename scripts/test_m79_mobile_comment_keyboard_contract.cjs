'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),read=p=>fs.readFileSync(p,'utf8');
const shared=read('assets/community-votes.js');
const inline=read('assets/inline-news-comments.js');
const cases=read('assets/case-discussions.js');
const forum=read('assets/community-discussions.js');
const build=read('.github/workflows/android-test-apk.yml');
const gradle=read('android-test/app/build.gradle.kts');
const manifest=read('android-test/app/src/main/AndroidManifest.xml');
for(const required of [
 'function commentViewportBounds()','window.visualViewport','function commentScrollContainer(element)',
 'function keepCommentComposerVisible(form)','function revealPostedComment(card)',
 'visualViewport?.addEventListener(\'resize\',update)',
 'document.addEventListener(\'focusin\',update,true)',
 'document.addEventListener(\'input\',update,true)',
 'Math.min(bounds.bottom-18,containerBottom)',
 'const selector=\'.dd-news-inline-comments form,#ddCaseDiscussionForm,#ddForumReplyCreate\'',
 'window.setTimeout(restore,240)',
 'scrollCommentBy(card,dy,true)',
 'Math.min(185,Math.max(90,(bounds.bottom-bounds.top)*0.22))',
 'keepCommentComposerVisible,revealPostedComment'
 ])assert(shared.includes(required),'Shared keyboard/viewport guard missing: '+required);
assert(!shared.includes('window.location.reload()'),'No page reload on successful comment');
for(const [label,src] of [['News/Archive/Watch/Videos',inline],['Case/Hearing',cases],['Discussions',forum]]){
 assert(src.includes('keepCommentComposerVisible?.(form)'),label+' composer adjusts to keyboard');
 assert(src.includes("blur()"),label+' dismisses keyboard after successful post');
 assert(src.includes('revealPostedComment?.('),label+' reveals newly rendered comment');
 assert(src.includes('priorIds=new Set('),label+' identifies new comment rather than moving to existing');
}
assert(inline.includes('!priorIds.has(String(item.id)) && item.is_mine'),'News only scrolls to new own comment');
assert(inline.includes("String(item.parent_id||'')===String(replyingTo?.id||'')"),'News reply matching uses actual parent_id');
assert(cases.includes("String(item.parent_id||'')===String(parent?.id||'')"),'Case reply matching uses actual parent_id');
assert(forum.includes('.then(saved=>{'),'Discussions scrolls only after successful async RPC refresh');
assert(forum.includes('if(!saved||thread?.id!==originalThread)return'),'Discussions does not reveal if thread changes');
assert(build.includes('scripts/test_m79_mobile_comment_keyboard_contract.cjs'),'APK CI runs M79 static test');
assert(build.includes('scripts/test_m79_mobile_comment_keyboard_chromium.cjs'),'APK CI runs M79 real mobile test');
assert(build.includes('android/m94-native-navigation-news-nov13'),'M79 build isolated branch');
assert(build.includes('DisclosureDesk-M94-PRIVATE-BETA'),'M79 separately named APK artifact');
assert(Number(gradle.match(/versionCode = (\d+)/)?.[1]) >= 17);
assert.match(manifest,/android:windowSoftInputMode="adjustResize"/,'Android WebView requests keyboard resize, not pan');
assert(!/\bnetlify deploy\b/.test(build),'No Netlify publish in APK workflow');
console.log('PASS M79 keyboard-safe comment composers + post-only scroll across News/Archive/Videos/Watch & Read/Case/Hearing/Discussions');
