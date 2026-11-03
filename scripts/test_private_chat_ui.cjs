'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('assets/profile-private-chat.js','utf8');
const cfg=fs.readFileSync('assets/community-test-config.js','utf8');
const sql=fs.readFileSync('supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql','utf8');
assert.doesNotThrow(()=>new Function(js),'Profile Chat JS must parse');
assert.match(html,/id="ddProfileChatPanel"/);
assert.match(html,/id="ddProfileChatApp"/);
assert.match(html,/assets\/profile-private-chat\.js\?v=/);
assert.match(html,/#ddProfileChatPanel\{grid-column:1\/-1\}/);
assert.match(cfg,/privateChat:false/,'No private messaging until consent/backend QA complete');
assert.match(cfg,/discussions:false/,'12th tab not yet implemented or activated');
assert.match(js,/flags\.privateChat===true/);
assert.match(js,/if\(!enabled\)\{entry\(host,/,'Disabled mode does not access any private RPC');
for(const rpc of ['dd_chat_request','dd_chat_respond','dd_chat_my_pairs','dd_chat_history',
'dd_chat_send_message','dd_chat_report','dd_chat_block']){
 assert.ok(js.includes("'"+rpc+"'"),'Missing reviewed chat RPC '+rpc);
 assert.ok(sql.includes('public.'+rpc+'('),'Server SQL contract missing '+rpc);
}
assert.match(js,/row\.status==='pending'/,'Invitation preview only until acceptance');
assert.match(js,/if\(row\.status==='accepted'\)/,'Only accepted chats mount message composer');
assert.match(js,/p_accept:true/);
assert.match(js,/p_accept:false/);
assert.match(js,/dd-chat-history/);
assert.match(js,/\.textContent=String\(content\)/,'Untrusted text must render through textContent');
assert.doesNotMatch(js,/\.innerHTML\s*=/,'No direct HTML injection of messages');
assert.match(html,/@media\(max-width:630px\)\{\.dd-chat-layout/);
assert.match(html,/id="ddProfileChatApp"/);
assert.doesNotMatch(html,/data-tab="discussionsPage"/,'No premature 12th tab');
assert.match(sql,/dd_chat_unique_unordered_pair/,'Denied invitations cannot be spam-resubmitted in reverse');
assert.match(sql,/p\.invitee_id=actor and p\.status='pending'/,'Only recipient can accept');
assert.match(sql,/status='accepted'/,'Only accepted chat may contain messages');
console.log('PASS: private Profile Chat frontend is accessible and server-contract aligned, off by default, no HTML injection, no twelfth tab.');
