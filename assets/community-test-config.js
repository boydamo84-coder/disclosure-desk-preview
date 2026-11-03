/* Approved Disclosure Desk community backend activation.
 * Enable only for known site hostnames: preview, local, and our public domain.
 * No query parameter or editable browser storage can turn on community access.
 * All writes still require the database RLS, signed-in JWT and rate limits.
 */
(()=>{
'use strict';
const preview=/^deploy-preview-[0-9]+--uap-disclosure-desk\.netlify\.app$/.test(location.hostname);
const local=['localhost','127.0.0.1'].includes(location.hostname);
const production=/^(?:www\.)?uapdisclosuredesk\.com$/.test(location.hostname)
  ||location.hostname==='uap-disclosure-desk.netlify.app';
const enabled=preview||local||production;
window.DD_COMMUNITY_TEST_CONFIG=Object.freeze({
 url:enabled?'https://omqxizswzcwgzqaczlhe.supabase.co':'',
 publishableKey:enabled?'sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X':'',
 environment:production?'production':enabled?'test':'disabled'
});
window.DD_COMMUNITY_FEATURES=Object.freeze({
 witnessPublic:enabled,
 voting:enabled,
 privateChat:false, // Keep off until SQL/RLS, opted-in identity and phone QA are approved
 discussions:false, // Future Discussions tab is not live
 researchPublishing:false
});
})();
