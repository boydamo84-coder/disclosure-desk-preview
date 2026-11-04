# Disclosure Desk — account and owner-action acceptance plan (4 November 2026)

**State: SYNTHETIC CI STAGED, NO LIVE USER MUTATIONS.** The website remains unpublished. All account A/B fixtures are fabricated. This plan is deliberately independent of the paused Finance Centre.

## What exists and was inspected
- The live Disclosure Desk project has an authenticated-only owner DELETE policy on witness reports; the client requests deletion only when both report ID and current account ID match, and it expects exactly one returned ID. The three-in-24-hours quota remains after deletion.
- Real database definitions for comment edit/delete and research trash/restore/purge require registered authenticated owners via auth.uid(). Comment editing also needs approved status, within 30 minutes, with no flags. Document permanent purge rejects media-linked records.
- Public usernames have a database unique index (dd_public_names_unique_key); duplicate-name error UX is not yet phone-tested.
- The synthetic test scripts/test_research_hub_owner_runtime.cjs executes the actual browser Profile Hub code in a mocked DOM/Supabase client. It checks old account A actions after swapping to B, cancellation of a witness delete, exact author + report constraints, new-account comment editing, and document trash RPC. It never reaches a network, real login, Edge function, or database.

## Owner-approved real browser acceptance (NOT yet performed)
1. With two disposable accounts, verify a private cloud research document and Board made in A cannot be read by B; after returning to A, trash then restore that expendable document and check its original content.
2. Create a disposable public comment only after user approval; A can edit it during the first 30 minutes, then delete it after confirmation. B cannot edit or delete A's comment; guests can only view public-approved text.
3. With two deliberately chosen unique disposable aliases, verify one account cannot claim the other's chosen username (index exists); verify the UI displays a useful error without showing account emails or auth UUIDs.
4. Do not create publicly visible witness-test reports until separately approved. Once approved, verify authenticated POST, city-only map projection, the signed-in author's Delete report button, removal from the public map, and preservation of 3/24h quota. Do not bypass public five-distinct-flags rules for convenience.
5. Test Recently deleted cloud document restoration, and permanently purge only a separately backed-up disposable no-media document after explicit confirmation. Media-linked purge should refuse, without losing data.
6. Test guest/signout behaviour, account switching, collapsed sections, privacy and accessibility on Samsung and desktop. End with a cleanup check and no public fake records.

## Rules and release gates
No real user records were created or altered for this QA plan. Mocked CI does not prove RLS, Edge POST, token boundary or multi-account HTTP results. Before any actual live test records, obtain the owner's approval to use expendable test data and document cleanup. No Supabase permission migration or Netlify/public deployment. Future private Chat and public Discussions remain feature-gated.
