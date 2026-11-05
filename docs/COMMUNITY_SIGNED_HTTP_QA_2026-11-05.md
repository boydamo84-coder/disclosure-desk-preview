# Disclosure Desk — verified signed-JWT HTTP security QA (2026-11-05)

**Scope:** unpublished canonical website branch `feature/sources-archives-next-batch-nov03`, **not** the public website or production Supabase.

## What is new, and not duplicate testing

Before this milestone, each backend candidate had passed its own isolated PostgreSQL direct-SQL tests (Private Chat run `41711107391`; Discussions run `41692441123`). These do **not** exercise a web HTTP gateway with signed bearer tokens and `anon` / `authenticated` database role assignment.

The new workflows run **PostgreSQL 17 plus PostgREST v16.5** in short-lived GitHub-hosted containers on localhost port 3000. A separate disposable HS256 test key signs fictional user JWTs (NOT Supabase Auth JWTs). They execute the **existing, unapplied** candidate schema files and do not connect to any actual Supabase project, register accounts or read customer messages.

| Test workflow | Final successful run | Verified count | Source |
| --- | --- | --- | --- |
| Private Chat JWT HTTP | [42025369219](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42025369219) | **22 / 22** | `scripts/test_private_chat_http_jwt.cjs`, `scripts/community-http-jwt-fixture.sql`, `.github/workflows/validate-private-chat-http-isolated.yml` |
| Discussions JWT HTTP | [42025810582](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42025810582) | **33 / 33** | `scripts/test_discussions_http_jwt.cjs`, `scripts/forum-http-jwt-fixture.sql`, `.github/workflows/validate-discussions-http-isolated.yml` |
| **Total** | | **55 / 55** | Distinct new HTTP tests, NOT cumulative site test count |

### Private Chat tests
- Forged/expired JWT rejects; unauthenticated/anonymous requests reject.
- Consented intro and pending request; only recipient may accept; sender cannot follow up until acceptance.
- The two participants receive history; unrelated third user cannot read or send.
- Direct private table access denied; blocking removes access to history and messaging.

### Discussions tests
- Forged/expired/guest/anonymous token checks and safe public section/topic/reply projections.
- Member can post without steward preapproval; only actual section creator steward may pin.
- No guest vote or direct table access; outsiders denied owner moderation.
- The server explicitly returns `false` for an unauthorised section edit (a valid refusal, not a 200-success action); runtime assertions verify `false`.
- Four independent flags leave a topic public, the fifth hides it, and only owner can review and restore it.

### Failed interim runs and correction
- Private Chat first run `42025227462` failed due to a **test harness GET/POST mix-up** that caused malformed request error `PGRST102`. HTTP method fixed in `1f519c6d90a9655ff05494e4df3360f5d0a75388`; final run **PASS**.
- Discussions first run `42025653542` expected unauthorised steward edit to raise HTTP 4xx, but the existing SQL function correctly returned HTTP 200 with JSON `false`. The assertion was corrected in `b442436e6f129ecb7897d1d352ceeaba459dac90`; final run **PASS**.
- Existing SQL schema and authorisation logic **not changed** as a result. No test result was hidden.

### Source commits
- Private HTTP setup: `6ad42d5a9dfc99a9854120b08b996fe2a5dca6a7` and corrected assertion `1f519c6d90a9655ff05494e4df3360f5d0a75388`.
- Discussions HTTP setup: `d8596ced2bc1739bf7fa15832fecc438126886dd` and corrected assertion `b442436e6f129ecb7897d1d352ceeaba459dac90`.

## What is and is not release-ready

**Proven in an isolated replica:** signed tokens, HTTP role mapping, guest/registered participant boundaries, consent, server authorisation, private table grants, moderation and flag lifecycle.

**Not yet proven:** actual Supabase Auth-created test users or authenticated sessions on a genuinely separate Supabase staging project, same-origin production frontend/browser, Samsung UI and W.NE save-before-navigation under real user conditions, Android, live data restore/backups, release rollout and rollback. The connected Supabase account contains a live Disclosure Desk project and another unrelated project, **no separate Disclosure Desk staging project**; never repurpose the unrelated project for tests.

### Live-site testing proposal / user instruction
On 2026-11-05 the owner said that **live-site deployment to `uapdisclosuredesk.com` may be used if simpler for HTTP testing**, since the site has not been advertised. The new HTTP acceptance runs have now demonstrated that live deployment is **not necessary for these backend test cases**, so avoid unnecessary Netlify credits and risk. No live deployment was performed. A later **single combined owner-accepted live beta** may make sense when candidate SQL migrations, data safety, page UX and rollout/rollback have been reviewed. Even if not advertised, treat all public accounts and documents as potentially real; never wipe or seed production.

**Current feature gates unchanged:** `privateChat:false`, `discussions:false`, `researchPublishing:false`. Both candidate SQL files remain unapplied to Supabase.

## Next actual gaps
1. Real phone/manual user acceptance for the existing 11-tab site and hidden prospective 12th tab, with safe W.NE writer navigation and no loss of unsaved work.
2. Review staging/deployment architecture, credential/SMTP policy and the exact SQL changes to enable the two gated features, including rollback and backup. Then make one deliberate release decision, not partial automatic production SQL.
3. In a dedicated staging project or approved disposable test-only public-site environment, test two *real Supabase Auth sessions* (account A/B/owner) on the same web app before opening features publicly. Distinguish this from disposable signed JWTs used in this milestone.
