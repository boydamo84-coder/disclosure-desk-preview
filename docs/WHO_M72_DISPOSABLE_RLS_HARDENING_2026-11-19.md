# Disclosure Desk — M72 private Who's Who ballot security hardening
Date: 19 November 2026 (Europe/London)

**Status: THREE/GITHUB ACTIONS JOBS GREEN — SQL DESIGN DRAFT ONLY. ZERO LIVE DATABASE OR WEBSITE DEPLOYMENT.**

## Scope and parent
- Experimental branch: `prep/who-m72-disposable-rls-hardening-20261119`, from previous `prep/who-m67-production-voting-integration-20261119`. It is **NOT based on the M70 production tree**. Future release must copy only reviewed database-policy changes into a new candidate derived from current production; do not merge old snapshots blindly.
- Existing M63 evidence rubric remains five criterion maxima 25/30/25/10/10; unknown is distinct from zero. Source-backed claim/version remains the only voting subject, never overall individual credibility.
- `assets/community-test-config.js` keeps `whoEvidenceBallots:false`. The exact claim approval registry remains `approvedClaims:[]`. No live Supabase credentials, members, news, account records, website builds, or Netlify credits were touched.

## Security review finding
The previous M63 invoker trigger guarded owner identity, closed claims, 5-minute score-edit cooldown, version/points range and withdrawal, but lacked an explicit block on **post-withdrawal reactivation and editing** before an aggregate had been published. Because `is_withdrawn` is client-updatable, after the cooldown the owner could toggle `true → false` on their existing row. The M66 later-publication trigger protects published versions, but did not remedy the earlier state. The same M63 guard allowed an update to withdraw and change points together, and a user could insert a row with `is_withdrawn=true` as their initial ballot.

**M72 draft fix:** a withdrawn row becomes immutable; withdrawal must preserve all five criterion answers; new client ballot rows must start active. Exceptional correction would require a deliberately designed future, separately reviewed procedure rather than silently reactivating the same ballot. This irreversibility is a policy assumption requiring explicit owner approval before launch. No automatic votes or aggregate publication are introduced.

## Exact QA and evidence
Code commit: `f688ee8e36b9649bd300378d6d845e1427d9404d`.
[All-green Actions run 44536856497](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44536856497):
- `source-and-strict-package`: validated source-only M72 guards, M64 closed voter interface, empty two-editor registry and strict 129-file experimental package.
- `who-frontend-synthetic-chrome`: headless real Chrome 320/393/820/1280, synthetic A/B accounts, no real external traffic, no guest/anonymous vote, no claim-version substitution, null vs 0, revocation/withdrawal UI, no overflow.
- `voting-isolated-postgres`: isolated PostgreSQL 17 database with fictional users. M63 ownership, RLS, anonymous lockout, versioned ballots and caps; M65 two distinct reviewer identities and privacy-safe count bands; M66 frozen publication and retirement after member withdrawal; M72 irreversible withdrawn ballot, no score mutation during withdrawal, no phantom withdrawn insert, private schema/RPC inaccessible to public roles and retired aggregate not re-exposed.
- Adversarial fixtures are `scripts/fixtures/who-m72-m63-adversarial-test.sql` and `scripts/fixtures/who-m72-postpub-adversarial-test.sql`. The SQL draft was not migrated to Supabase; these fixtures run only against GitHub's disposable Postgres service.

## Important remaining risks and owner decisions
1. An independent qualified security audit must still review functions, row-level policy privileges, cross-account isolation, reviewer roles, concurrent write/publish/withdraw races, Data API exposure and retention obligations against the actual target Supabase project's settings. Synthetic fixture success alone is not production approval.
2. A **separate nonproduction Supabase project** and two real independent test accounts are needed for integration; the current production project must not be repurposed. No production migration has been applied.
3. Owner should approve or revise the proposed policy that a member withdrawal is irreversible for that claim version and, if an aggregate was publicly released, the first such withdrawal permanently retires that entire published aggregate. Public screenshots cannot be retracted.
4. Two real independent editors must record a matching, dated and exact-source-backed approval of at least two incident claims/versions (not people) before populating the still-empty claim registry.
5. Before actual live activation, use a fresh production-derived release incorporating the tested M71 deployment guard. Require complete browser regression and mobile Galaxy acceptance. Ads remain separate and disabled.

## Official references
Supabase RLS, grants and the difference between role authenticated and anonymous Auth users: https://supabase.com/docs/guides/database/postgres/row-level-security
Supabase database-function EXECUTE defaults, SECURITY INVOKER/DEFINER and safe search paths: https://supabase.com/docs/guides/database/functions

## Release status
**No user-facing change yet:** website remains M70 live, original M96M Android beta remains owner-accepted, no Supabase migrations, no member voting or Adsterra.
