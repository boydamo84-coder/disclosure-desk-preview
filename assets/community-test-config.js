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
// M07 pilot stays server-allowlisted to two Auth identities; only production URLs
// can activate the real project, never browser query parameters or local storage.
const researchPilot=production;
window.DD_COMMUNITY_TEST_CONFIG=Object.freeze({
 url:enabled?'https://omqxizswzcwgzqaczlhe.supabase.co':'',
 publishableKey:enabled?'sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X':'',
 environment:production?'production':enabled?'test':'disabled',
 communityResearchTestDatabase:false, // Legacy separate-project development mode stays disabled
 communityResearchPilot:researchPilot // This existing-project pilot is exclusively guarded by database membership and RLS
});
window.DD_COMMUNITY_FEATURES=Object.freeze({
 witnessPublic:enabled,
 voting:enabled,
 privateChat:enabled, // Approved public social release: only known hostnames; server enforces identity and consent
 discussions:enabled, // Approved public social release: guest reads, members post through controlled RPCs
 profileAvatars:enabled, // Approved public visible-by-default photo with server-enforced Hide
 researchPublishing:false,
 communityResearchBackend:researchPilot, // Testers only: database roster and RLS provide the real authority
 communityResearchPublishing:researchPilot, // Restricted M07 researcher pilot; NOT general public publishing
 communityResearchRecovery:researchPilot, // Pilot portfolio only, checked by server on each action
 communityResearchPreview:local||preview // No live publishing, only the non-submitting design/author copy prototype
});
})();
