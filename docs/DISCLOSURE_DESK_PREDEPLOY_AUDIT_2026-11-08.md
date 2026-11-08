# Disclosure Desk — pre-deployment website audit, 8 November 2026

**Scope:** Current `fix/compact-writing-popover-mobile-desktop-nov08` source branch. **NO Netlify build/deploy; LIVE SITE NOT UPDATED.** Owner stated only 198 Netlify credits remain until 29 November. The audit and changes are deliberately bundled for a later single deployment.

## Verified fixes staged for the next release

1. **Research Studio mobile screen space:** the always-visible grammar review strip was eating manuscript space on Samsung. Moved Previous/Next to compact `‹ / ›` controls **inside the suggestion popup on mobile and desktop**. Writing settings still fold away. Replacements remain explicit, Undo/autosave unaffected. Real Chromium: 18 checks at 393px, 852px landscape and 1280px desktop.
2. **Google Analytics 4**: confirmed existing property `G-ZWJQMK8JSW`; previously absent from published source. Added `assets/analytics-consent.js` only to public informational pages and the public root. No Google request or tag before explicit Allow; No thanks available; persistent browser choice; change preference in Privacy page. Only allowlisted public page names are counted, without URLs' query parameters, account data, document titles, private Chat content or report text. GA4 consent is separate from advertising consent; `privacy.html` updated. Chromium synthetic consent test: 12 checks, Google endpoint mocked and never accessed.
3. **Real bug caught by broad homepage smoke:** initial fixed consent banner intercepted the News ticker's Hide button on mobile. Reworked consent panel into **normal document flow above the header** so it cannot block the ticker, dock or navigation buttons. The full site browser smoke confirmed the corrected position.
4. **QA test reliability:** real profile photos auto-upload; the old browser smoke clicked Remove before automatic upload completed. Added wait for visible/enabled Remove control rather than change the production feature.

## Page audit (local Chromium only)

| Screen | Portrait 393px | Landscape 852px | Desktop 1280px | Scope |
|---|---|---|---|---|
| Home / News (`/index.html`) | checked | checked | checked | Visible anchors, layout |
| Guide and FAQ (`/guide.html`) | checked | checked | checked | Links, layout, heading/alt notes |
| External sources (`/sources.html`) | checked | checked | checked | Links, layout |
| Community rules (`/community-rules.html`) | checked | checked | checked | Links and in-page anchors |
| Privacy (`/privacy.html`) | checked | checked | checked | Consent text, link/anchor, layout |
| Research edition landing (`/research-edition.html`) | checked | checked | checked | Entry links, layout |
| Research guest preview | checked | checked | checked | Basic entry/navigation |
| Research entry `/research/index.html` | checked | checked | checked | Public guest/auth-gate shell only |
| Research Library `/research/research-bible.html` | checked | checked | checked | Guest shell only; signed-in functions separately tested offline |

- The page audit checks each document's title, horizontal overflow tolerance, rendered links, local targets and static anchors, blank link safeguards and nonempty link labels. Latest homepage-inclusive audit: **112 geometry/link checks, zero warnings**. These are **local-file/DOM validations**; they cannot establish that every third-party source website currently responds or that every button is correct.
- Existing full homepage Chrome smoke checks ticker and hide/off, 12-tab mobile navigation, onboarding tour and Escape, Chat/Discussions deep links, avatar guest state and auto-save, and W.NE navigation with synthetic save/unconfirmed-save responses. These are browser checks with local fake account data, **not** production authenticated journeys.
- Existing Research suite also tests save/reopen and version safety via fakes, DOCX source pathways, ZIP restore-as-new, document sanitisation, 16 editor Chromium checks, 18 Research Library Chromium checks, and the new compact spelling QA.

## Still required BEFORE the one deployment

1. **Complete signed-in functional audit:** Profile/account deletion flow, account privacy/public username settings, Chat invitations/messages, Discussions create/edit/report/moderation, source submission, site admin views, and actual secure report save/reopen. The current site has an email link for account-deletion requests; that is not a verified in-site deletion implementation. Do not implement a privileged user deletion without full per-owner authorization and tests.
2. **External availability/content audit:** Official/source outbound links (USGS/NASA/EUMETSAT and community references) can change independently; automated local tests don't establish their current availability. Check the actual source paths and dates before final release.
3. **Real-device acceptance:** Samsung S24 Ultra Chrome and iPhone Safari, keyboard interactions with formatting, long scrolling and preference changes, physical DOCX/PDF previews, device Boards backup, ZIP restore, logout/login and cross-account RLS. Do not use valuable documents.
4. **Privacy and consent review:** Check UK/EU requirements for Analytics and advertising independently, account data deletion wording, consent revocation and live AdSense settings. GA4 does not collect private content in our instrumented page events; broader third-party embeds may have separate cookies.
5. **No Netlify preview or deploy until owner agrees the batch is complete.** Keep the `production` and `main` branches unchanged. GitHub no-deploy CI can run without a Netlify publish.

## Current release policy

Use **one** production Netlify deployment when all agreed fixes have passed source/browser tests and owner approves. A green GitHub check is **not** the same as physical Samsung acceptance or a live Netlify publication. The current public site remains on the previously verified Milestone 17 deployment until then.

## Milestone 19 — Signed-in / owner-security audit (8 November 2026)

**Scope:** Source and local synthetic account flows, plus strictly read-only Supabase catalog/advisor queries. No live database mutations, no real account login, no Netlify build.

### New remediation staged

- `assets/discussions-admin.js`: **fixes stale owner-only moderation data after account switching**. When the Supabase identity changes, the admin details close and the queue/section stewardship DOM clears immediately. The loading function records session revision and initial user ID, and rejects delayed RPC results once the user has switched or signed out. A completed action never falsely reports success for a different account. Database owner allowlist enforcement is unchanged.
- New `scripts/test_discussions_admin_account_switch_20261108.cjs` executes the actual admin module under a synthetic browser with intentionally delayed owner A RPC, then signs out/signs in owner B. Verifies the first user's report never displays, the second user's completed moderation marker remains, and logout clears queue and stewardship. All **3 runtime assertions passed**.
- Extended the existing no-Netlify GitHub Actions unit gate to run synthetic account-switch tests for Chat, queued private message cancellation, Discussions roles/feeds, avatar element races, public usernames, case comments, witness moderator restrictions and Research account Profile.
- Corrected **two obsolete test contracts**, without changing the production-approved behavior: new signup usernames are public and Chat-discoverable **after explicit signup disclosure**, while pre-existing Hide/Chat-off choices remain untouched; and the approved twelve-tab navigation places **Explore after Profile**, not before.
- Fixed the offline Chromium avatar test stub to retain synthetic uploaded image bytes during a follow-up read, matching actual Storage persistence; the test waits for its async auto-save before selecting Remove. This is test-only; no live photos touched.

### Read-only database checks (live project)

- The identified connected project has owner-scoped row-level policies for `dd_public_names`, `investigation_boards`, `research_documents`, `research_document_revisions`, `research_document_trash`, `research_assets`, and `research_reference_backups`. Query inspected policy predicates **without fetching user rows or content**.
- Private Chat and Discussions base tables have RLS enabled and **no direct client-access RLS policies**, with reads/mutations mediated by dedicated server RPCs. Metadata confirmed Chat mutations require authenticated role and check `auth.uid()`; Discussions mutations invoke the registered-account helper; owner review endpoints independently check `dd_chat_owner_admins` or `dd_discussions_is_owner`. This is consistent with the intended design but **does not replace a signed-in two-account penetration test**.
- Supabase security advisor raised: **19 INFO** for RLS tables without policies (mostly intentionally RPC-only), **13 WARN** for anon-accessible `SECURITY DEFINER` functions (mostly intentionally public curated reads, plus the `rls_auto_enable` event-trigger helper), **60 WARN** for authenticated-executable definer functions that must be individually scoped, and **1 WARN** that **leaked-password protection is not enabled**. These are linter findings, not claims that data was exposed. Do not indiscriminately revoke public reads; audit individual function bodies and API clients first.
- The `rls_auto_enable` function is an event-trigger helper with restricted `search_path` and currently retains anon EXECUTE. Its actual direct invocation risk has not been established and should be reviewed before any privilege change.
- Relevant Supabase references: [RPC definer warnings](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [RLS-no-policy explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

### Product-level open items

- **Delete my account:** Profile currently opens a disclosure and a support-email request; it **does not perform self-service Auth account deletion**. It is honest in the UI but doesn't yet meet the owner's requested complete delete-account capability. That requires server-only identity verification, orderly cleanup of signed-in Research and Boards, moderation/audit retention policy, idempotency, confirmation and backup/rollback precautions. No unreviewed destructive Edge Function was deployed.
- **Real auth/permissions:** Existing synthetic browser fixtures and read-only SQL metadata cannot prove two actual distinct logins, per-account live private Chat/Discussions moderation, saved Cloud ZIP restore, mobile Gboard, or iOS Safari. These remain release gate items.
- **Unchanged release policy:** All changes stay on `fix/compact-writing-popover-mobile-desktop-nov08` until the owner's one combined production deploy approval. Site owner reported **198 Netlify credits** left until 29 Nov; **zero builds initiated here**.

### Exact CI evidence

- Signed-in mock/unit tests: `scripts/test_discussions_admin_account_switch_20261108.cjs`, `test_discussions_account_switch_runtime.cjs`, `test_private_chat_account_switch_runtime.cjs`, `test_private_chat_switch_mutations.cjs`, `test_member_avatar_race.cjs`, `test_public_profiles.cjs`, `test_comment_security.cjs`, `test_comment_self_moderation.cjs`, `test_witness_moderation.cjs`, `test_research_hub.cjs`.
- **Final reviewed source commit `68cd0bd1321f2e40616c638a27a74872d2582c57`**: [GitHub Actions run 42516950668](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42516950668), both jobs SUCCESS. Offline browser results: **16 editor**, **18 compact spelling**, **18 Research Library**, **12 Analytics consent**, **112 link/layout**, **29 site/navigation** checks; no real Google, Supabase or Netlify calls. Earlier intermediate failed runs exposed outdated test assumptions or a synthetic avatar-storage stub, not a production incident.

**Next:** complete owner-reviewed account deletion design, inspect remaining live external source links and modernise dated user-facing help text, plus site admin action test under synthetic account. Later, one user-approved deploy followed by disposable real Samsung authentication and recovery acceptance; don't confuse localhost fixtures with signed-in acceptance.

## Milestone 21 — Research navigation photo, source-link verification and account-deletion feasibility

- Real signed-in Research bottom navigation now has staged owner-only photo support, with immediate sign-out clearing and late-response isolation. Main-site account-avatar uploader remains unchanged.
- Verified current original source URLs in public web results; NARA's canonical research URL and GEP dataset v2026.10 (3 Nov 2026) now linked. GEP reuse still blocked pending licence, source schema and privacy review. Other sites may block bots; a failed fetch is not proof of a broken source.
- Read-only live database FK and bucket inventory confirmed the planned deletion route must redact authored Forum text rather than merely null `author_id`, and must remove two private Storage bucket assets separately. Design is documented in `docs/ACCOUNT_DELETION_SECURITY_DESIGN_2026-11-08.md`. **Self-service Delete account remains NOT implemented.**
- No production site or Supabase mutation; no Netlify deployment/preview generated. Signed-in Samsung acceptance and real two-account deletion acceptance remain outstanding.
