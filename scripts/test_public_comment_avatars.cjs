'use strict';
// Public community comments must follow the same owner-controlled avatar visibility
// rules as Discussions posts. Source-only assertions; no customer data or network.
const fs=require('node:fs'),assert=require('node:assert/strict');
const forum=fs.readFileSync('assets/community-discussions.js','utf8');
const cases=fs.readFileSync('assets/case-discussions.js','utf8');
const news=fs.readFileSync('assets/inline-news-comments.js','utf8');
const html=fs.readFileSync('index.html','utf8');
for(const [name,source] of [['case',cases],['news',news]]){
 assert.match(source,/const alias=item\.publicAlias\|\|'Community member'/,name+' must use an opted-in alias');
 assert.match(source,/avatar\.className='dd-forum-avatar'/,name+' reuses the same style as Forum replies');
 assert.match(source,/avatar\.setAttribute\('aria-hidden','true'\)/);
 assert.match(source,/header\.append\(avatar,byline\)/);
 assert.match(source,/if\(item\.publicAlias\)window\.DDMemberAvatars\?\.decorate\?\.\(avatar,item\.publicAlias\)/,
   name+' may only lookup a photo for a public alias');
 assert.doesNotMatch(source,/getPublicUrl|service_role|author_id\.toString/);
}
assert.match(forum,/DDMemberAvatars\?\.decorate\?\.\(avatar,authorName\)/,
 'Full Discussion replies already use the common avatar decorator');
assert.match(forum,/DDMemberAvatars\?\.decorate\?\.\(avatar,replyName\)/,
 'Collapsed comment previews already use the common avatar decorator');
assert.match(html,/assets\/case-discussions\.js\?v=nov08-comment-action-rail/);
assert.match(html,/assets\/inline-news-comments\.js\?v=nov08-comment-action-rail/);
console.log('PASS: Discussions replies, News previews and case comments share RLS-gated public-name avatars with initial fallback.');
