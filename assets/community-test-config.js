/* Community write features are deliberately test-only until the RLS migrations,
 * human moderation tools and preview QA pass. Never enable from a query parameter. */
(()=>{
'use strict';
const preview=/^deploy-preview-[0-9]+--uap-disclosure-desk\.netlify\.app$/.test(location.hostname);
const local=['localhost','127.0.0.1'].includes(location.hostname);
const enabled=preview||local;
window.DD_COMMUNITY_TEST_CONFIG=Object.freeze({
 url:enabled?'https://omqxizswzcwgzqaczlhe.supabase.co':'',
 publishableKey:enabled?'sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X':'',
 environment:enabled?'test':'disabled'
});
window.DD_COMMUNITY_FEATURES=Object.freeze({
 witnessPublic:enabled,
 voting:enabled,
 researchPublishing:false
});
})();
