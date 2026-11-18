'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const config=read('assets/community-test-config.js');
const draft=read('assets/community-research-private-drafts.js');
const publish=read('assets/community-research-publication.js');
const recovery=read('assets/community-research-recovery.js');
const dashboard=read('assets/community-research-dashboard.js');
const author=read('assets/community-research-author-workflow.js');
const sql=read('docs/COMMUNITY_RESEARCH_M07_TWO_ACCOUNT_PILOT.sql');
const status=read('docs/COMMUNITY_RESEARCH_M07B_STATUS_RPC.sql');
assert(sql.includes('dd_cr_private.pilot_members'));
assert(sql.includes('alter table dd_cr_private.pilot_members enable row level security'));
assert(sql.includes('create policy dd_cr_m07_pilot_member'));
assert.equal((sql.match(/create policy dd_cr_m07_pilot_member/g)||[]).length,6);
assert(sql.includes('or not dd_cr_private.is_pilot()'));
assert.equal((sql.match(/or not dd_cr_private.is_pilot\(\)/g)||[]).length,3);
assert(sql.includes('grant execute on function dd_cr_private.publish_saved_copy'));
assert(!/grant (?:select|insert|update|delete) on (?:table )?public\.dd_cr_(?:votes|comments|reports)/i.test(sql));
assert(!/\b(garyboyd@|boydamo84@)/i.test(sql),'Never store account emails in public repository migration');
assert(status.includes('public.dd_cr_pilot_status()'));
assert(status.includes('security invoker'));
assert(status.includes('revoke all on function public.dd_cr_pilot_status() from public,anon,authenticated'));
assert(config.includes('const researchPilot=production'));
assert(config.includes('communityResearchPilot:researchPilot'));
assert(config.includes('communityResearchBackend:researchPilot'));
assert(config.includes('communityResearchPublishing:researchPilot'));
assert(config.includes('communityResearchRecovery:researchPilot'));
assert(config.includes('researchPublishing:false'));
assert(config.includes('communityResearchPreview:local||preview'));
for(const s of [draft,publish,recovery]){
 assert(s.includes('const productionPilot=productionHost'));
 assert(s.includes('cfg.url==='));
 assert(s.includes('dd_cr_pilot_status'));
 assert(s.includes('return check?.error==null&&check.data===true'));
 assert(!/service_role|secret_key|localStorage\.setItem/.test(s));
}
assert(dashboard.includes("typeof recovery.isPilot==='function'"));
assert(author.includes("typeof publish.isPilot==='function'"));
assert(dashboard.includes("if(!(await recovery.isPilot()))")||dashboard.includes("!(await recovery.isPilot())"));
for(const p of ['community-research.html','my-research.html']){
 const s=read(p);
 assert(s.includes('@supabase/supabase-js@2.76.1/dist/umd/supabase.min.js'));
 assert(s.includes('community-test-config.js?v=cr-m07'));
}
const packageSrc=read('scripts/build_public_release.cjs');
assert(!packageSrc.includes('COMMUNITY_RESEARCH_M07_TWO_ACCOUNT_PILOT.sql'));
assert(!packageSrc.includes('COMMUNITY_RESEARCH_M07B_STATUS_RPC.sql'));
console.log('PASS M07 static: restrictive six-table pilot, three gated definer routines, read-only status RPC, production-host-only UI, and no unapproved third-party or public permissions.');
