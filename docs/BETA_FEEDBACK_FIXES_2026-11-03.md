# 3 November 2026 beta feedback fixes — pending website batch

## Witness reports Edge CORS

Actual Supabase function_edge_logs 07:10:39 UTC: a mobile browser sent only `OPTIONS /functions/v1/dd-witness-submit` (HTTP 204), no follow-up POST. Deployment was active. It returned `Access-Control-Allow-Headers: authorization, apikey, content-type` but Supabase browser SDK includes `x-client-info`. Exact narrow fix: include `x-client-info` in OPTIONS header. Never weaken `verify_jwt=true`, never broaden allowOrigin, and do not issue real witness submissions in automated tests. Edge deployment is independent of Netlify preview and can be applied immediately.

## Watch & Read

Change visible category chip `Podcast Episodes` to `Podcasts`. Keep episode-specific descriptive copy where content is indeed individual episodes. This is a website code change and should **not** be deployed separately while Netlify builds are enabled; bundle with further feedback.

## Pending acceptance

After Edge Function v2 is active, ask a signed-in beta tester to resubmit a deliberately fake disposable report, verify browser receives proper API response, city geocoding, visible map marker, and remove any test report from public map. Real HTTP with valid Auth JWT is not yet verified.

## Staging safety

The accompanying Git commit must remain a *prepared, unreferenced commit* until the next deliberate combined website update. It has not been moved to the PR branch and will not trigger Netlify builds. No Cinema or original W.NE changes.

## Verification update — 4 November 2026 (read-only)

The deployed **Disclosure Desk** Edge Function `dd-witness-submit` is **ACTIVE version 2**, with `verify_jwt=true`. Its published `index.ts` source was compared byte-for-byte to `supabase/functions/dd-witness-submit/index.ts` on the unpublished feature branch and **matched exactly**. Both contain the specific preflight allowance `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`, an allowlisted Origin, and explicit POST-only handling. A dedicated no-deploy GitHub test now locks down those contracts.

This is **DEPLOYED CONFIG/SOURCE PARITY**, not proof that a signed-in mobile browser sends the POST, that Open-Meteo returns a valid UK town, or that the report publishes under a real user's JWT. **Do not submit or delete live reports as an automated test.** When manually accepted later, use owner-approved disposable data and confirm any test marker removal under owner RLS. Finance and Our Cinema Supabase projects remain untouched.
