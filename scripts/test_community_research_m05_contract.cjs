'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const adapter=read('assets/community-research-private-drafts.js'),
  dashboard=read('assets/community-research-dashboard.js'),
  page=read('my-research.html'),
  build=read('scripts/build_public_release.cjs'),
  config=read('assets/community-test-config.js'),
  fixture=read('scripts/fixtures/community-research-m05-private-pages-test.sql');
assert(adapter.includes('async function listMinePaged('));
assert(adapter.includes("const summary='id,title,abstract,paper_type,revision,created_at,updated_at'"));
assert(adapter.includes(".range(offset,offset+pageSize)"));
assert(adapter.includes(".eq('author_id',user.id)"));
assert(adapter.includes(".order('updated_at',{ascending:false})"));
assert(adapter.includes(".order('id',{ascending:false})"));
assert(adapter.includes('after.id!==user.id'));
assert(adapter.includes('items,hasMore:data.length>pageSize'));
assert(adapter.includes('listMine,listMinePaged,getMine'));
assert(dashboard.includes('draftApi.listMinePaged({page:0,pageSize})'));
assert(dashboard.includes('draftApi.listMinePaged({page:next,pageSize})'));
assert(dashboard.includes("const draftsTab=tab==='drafts'"));
assert(dashboard.includes('draftHasMore'));
assert(dashboard.includes('Private-draft page '));
assert(dashboard.includes("myResearchDraftText','myResearchDraftSources"));
assert(dashboard.includes('detailToken++'));
assert(dashboard.includes('if(requestToken!==detailToken) return;'));
assert(dashboard.includes('owner===null||owner!==user'));
assert(!/innerHTML\s*=|insertAdjacentHTML|localStorage/.test(dashboard));
assert(config.includes('communityResearchTestDatabase:false'));
assert(config.includes('communityResearchBackend:false'));
assert(config.includes('communityResearchPublishing:false'));
assert(config.includes('communityResearchRecovery:false'));
assert(config.includes('researchPublishing:false'));
assert(page.includes('id="myResearchBoard" hidden'));
assert(page.includes('noindex,nofollow,noarchive'));
assert(build.includes("'my-research.html'"));
assert(!build.includes('community-research-m05-private-pages-test.sql'));
assert(fixture.includes('generate_series(1,65)'));
assert(fixture.includes('Member B saw member A private archive'));
assert(fixture.includes('Anonymous auth account read member research'));
console.log('PASS M05 static contract: full draft pagination, owner identity checks, no hidden form text, no release or SQL inclusion.');
