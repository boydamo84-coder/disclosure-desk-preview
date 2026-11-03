'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const config=fs.readFileSync('assets/community-test-config.js','utf8');
function check(hostname){
 const window={};
 vm.runInNewContext(config,{window,location:{hostname}}, {timeout:1200});
 return JSON.parse(JSON.stringify({config:window.DD_COMMUNITY_TEST_CONFIG,flags:window.DD_COMMUNITY_FEATURES}));
}
for(const name of ['uapdisclosuredesk.com','www.uapdisclosuredesk.com','uap-disclosure-desk.netlify.app']){
 const result=check(name);
 assert.equal(result.config.environment,'production',name);
 assert.equal(result.flags.witnessPublic,true,name);
 assert.equal(result.flags.voting,true,name);
 assert.equal(result.flags.researchPublishing,false,name);
}
assert.equal(check('deploy-preview-2--uap-disclosure-desk.netlify.app').config.environment,'test');
for(const name of ['evil-uapdisclosuredesk.com','uapdisclosuredesk.com.evil.example','random.netlify.app','example.com',''])assert.equal(check(name).config.environment,'disabled','Reject '+name);
for(const path of ['assets/case-discussions.js','assets/witness-community.js','assets/community-votes.js','assets/inline-news-comments.js','assets/watch-read.js','assets/public-profiles.js','assets/research-hub.js','assets/case-comment-moderation.js']){
 const code=fs.readFileSync(path,'utf8');
 assert.match(code,/\['test','production'\]\.includes\(cfg\.environment\)/,'Production API gate missing from '+path);
 assert.doesNotMatch(code,/cfg\.environment[!=]==?'test'/,'Old preview-only gate in '+path);
}
assert.doesNotMatch(config,/service_role|sb_secret_/,'Never include Supabase service keys in website config');
console.log('PASS: explicit official host allowlist, public comments/votes/witness enabled, research publishing remains off');
