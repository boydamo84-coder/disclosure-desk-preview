# Disclosure Desk — Community Research M06: Existing Supabase Project, Locked Foundation

Date: 18 November 2026 (Europe/London)
Branch: prep/community-research-m06-existing-supabase-locked-20261118
Status: DATABASE FOUNDATION INSTALLED IN EXISTING LIVE SUPABASE, BUT FEATURE DISABLED / NOT PUBLICLY LAUNCHED.

## Owner decision

Owner requested reuse of the existing Disclosure Desk Supabase project rather than creating a third billable project. The new research feature is hosted within the EXISTING project, using unique `dd_cr_` table names and an unexposed `dd_cr_private` schema. No new Supabase project, separate paid resource, login identity or third-party service was created.

Existing project: `omqxizswzcwgzqaczlhe` (Disclosure Desk, eu-west-1). This is the live database used by existing website features; special production safeguards apply. All preexisting social/forum/chat/W.NE data and tables remained untouched.

## Actions actually completed (not just planned)

1. Read-only introspection confirmed the live project is ACTIVE_HEALTHY, PostgreSQL 17.11, and no Community Research tables or private schema existed. We inspected public table inventory and security advisor warnings before making any change.
2. Executed M02+M03+M04 schema in a transaction that ended with ROLLBACK, proving SQL compatibility in the actual managed Supabase environment; verified the tables and internal schema were absent after rollback.
3. Verified two previously approved test identities exist in the existing Auth system. Used their real existing UUIDs ONLY to set simulated JWT claims inside a second ROLLBACK transaction: source-linked private draft, explicit publication, cross-account RLS read block, cross-account withdrawal block, owner withdrawal and other-account hidden history all passed. No real login sessions, emails, account changes or persisted papers resulted.
4. Created `docs/COMMUNITY_RESEARCH_M06_LOCKED_EXISTING_PROJECT.sql` as a new production-compatible additive migration, with an object-collision guard, transaction, only new namespace/table/function creation, explicit REVOKE ALL sealing of ALL newly created tables, internal schema and API functions, and SQL assertions refusing to commit unless the API is inaccessible.
5. The **exact** migration passed disposable PostgreSQL 17 GitHub Actions checks before installation. Applied it once to the EXISTING Supabase project; it reported **six new public research tables and two private tables**, with draft read, public publish RPC and internal schema access all CLOSED to normal authenticated and anonymous roles.
6. Verified all eight installed tables have RLS enabled and ZERO rows. Direct read/write grants for normal members remain disabled. Post-installation security advisors did not flag any new anonymously executable Community Research privileged functions. The two private tables intentionally have RLS but no direct client policies, producing two INFO advisor notices.
7. Ran a further test against the newly installed live schema: granted only temporary model privileges inside BEGIN/ROLLBACK, used the two existing Auth UUIDs as simulated JWT claims, and successfully tested owner draft, consent publish, cross-user isolation, own-paper recovery/withdrawal. Final query confirmed ZERO private drafts, ZERO publications and all TEMPORARY permissions rolled back.

No production website deployment, Netlify build, APK release or public community activation took place. Previous M01–M05 UI code remains staged. No W.NE document was copied or made public. No account emails, passwords or identifiers were committed to the repository.

## Exact new objects

Public tables:
- `public.dd_cr_drafts` — versioned private author copies, RLS
- `public.dd_cr_publications` — publication registry, RLS
- `public.dd_cr_editions` — immutable historic editions, RLS
- `public.dd_cr_votes` — individual vote identities, RLS
- `public.dd_cr_comments` — research feedback, RLS
- `public.dd_cr_reports` — moderation reports, RLS

Private schema `dd_cr_private` (NOT exposed to Data API):
- `draft_papers` — mapping between private copies and public papers
- `publication_events` — protected internal audit events

Private functions implement publication/revision/withdrawal and owner recovery; public SECURITY INVOKER RPC wrappers are installed but **EXECUTE revoked from both anonymous and authenticated roles**. All newly created public research tables have SELECT, INSERT, UPDATE and DELETE revoked for ordinary application roles. They will remain unusable from the live site unless an explicit, audited pilot unlock is deployed later.

## Existing security-advisor findings — separate backlog

The pre-installation project contained a range of existing Supabase security advisor notices, including publicly callable SECURITY DEFINER functions in existing features. Post-installation advisor groups included 15 anonymous SECURITY DEFINER warnings and 65 authenticated function warnings; these were **not newly introduced for Community Research**. Supabase also flagged one leaked-password-protection configuration issue and 23 RLS-without-policy INFO records, two of which are the intentionally inaccessible new private Community Research tables. Do NOT modify existing forum/chat functionality merely to clear these warnings without independent audit and regression tests. See Supabase dashboard security advisors and official remediation pages. No claim is made that the whole existing project is free of security issues.

## Before public enablement

- Add a **server-enforced beta allowlist** for the two QA accounts, plus role-checked RLS and controlled RPC access. Do not simply restore `GRANT` to all authenticated users; that would prematurely expose the feature.
- Independently audit every M02–M04 function and RLS policy against the real Supabase project before opening privileges. Ensure unexposed private schema, correct EXECUTE privileges and explicit anti-spam/moderation/rights policies.
- Run real browser-based Auth sessions (not only simulated JWT SQL) for two distinct accounts and a guest. Verify owner isolation, API access, cross-account denial, consent publishing/revision/withdrawal, lost session, signed-out behaviour, account deletion, throttling, and draft/archive paging.
- Implement/source-review research moderation, copyright/privacy complaint path, usefulness-only vote aggregation and accurate correction labels. Don't display truth percentages.
- Only then enable limited features on existing site with deliberate owner-controlled release and Samsung Android navigation/keyboard QA. Keep all public launch flags false until passing checks.

## Source and verified checks

- Migration: `docs/COMMUNITY_RESEARCH_M06_LOCKED_EXISTING_PROJECT.sql`.
- No-deploy workflow: `.github/workflows/community-research-m06-locked-existing-db-no-deploy.yml`.
- CI run: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44309782097 (both jobs success, exact migration tested on disposable PG17).
- Database verification was performed through connected Supabase SQL and security advisers. Existing DB showed six public + two private research tables, zero content and closed member/guest API privileges.
- Prior handover: `docs/COMMUNITY_RESEARCH_M05_HANDOVER_2026-11-18.md`.

## Release gate

**Database installed, website feature OFF.** Never describe this milestone as public research publishing having launched, or as real browser sessions having passed. The next safe milestone is server-enforced pilot-account gating on the existing project, followed by actual two-session Android/Chrome QA.
