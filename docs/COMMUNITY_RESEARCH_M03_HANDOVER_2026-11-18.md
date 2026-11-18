# Disclosure Desk — Community Research M03 Handover

_Date: 18 November 2026 (Europe/London)_  
_Branch: `prep/community-research-m03-consent-publish-20261118`_  
_Status: STAGED, TESTED OFFLINE, NOT DEPLOYED — publishing unavailable on the live website._

## M03 delivery

Built the first consent-first publish/revise/withdraw foundation on top of verified M02 private drafts and M01 W.NE author-copy preview.

**Database design only:** `docs/COMMUNITY_RESEARCH_M03_PUBLICATION_SQL_DRAFT_ONLY.sql` adds non-exposed `dd_cr_private` draft↔paper mapping and consent audit tables. The narrow publication/withdrawal engines are `SECURITY DEFINER` functions **inside a non-exposed schema**, not `public`. The exposed `public.dd_cr_publish_copy` and `public.dd_cr_withdraw_paper` RPC wrappers are `SECURITY INVOKER` and explicitly granted only to the `authenticated` role, not guest/anon. Both engines re-check the signed-in user's `auth.uid()`, reject anonymous sign-ins, and check exact owner and requested edition. They never access W.NE's private `research_documents` or `research_document_revisions` tables.

The publish RPC locks and reads the *saved private draft*, requires explicit approval and its exact server revision, at least one source link and a complete title/abstract/body. It copies that content into a separate immutable public edition transactionally. Another author cannot link to or withdraw the paper. Revisions require the exact existing edition, original linked draft, an updated source revision and a five-minute cooldown; the original edition is preserved. Withdrawals require a separate exact-edition approval and hide **all** editions from public reading without deleting the author's history or automatically republishing. Publication events record actor and consent in a private audit table. Three new papers per author per rolling 24 hours and ten revisions per paper per day are enforced; a per-author advisory transaction lock prevents concurrent quota bypass. Public tables have no direct author write grants.

Source links are validated again at the publication boundary, rejecting bad protocols, missing public hostname, credential-bearing URLs and local/private-network-looking addresses. The page uses text-only rendering and does not interpret uploaded HTML. No images are copied from W.NE at this stage.

**Client:** `assets/community-research-publication.js` is a restricted RPC-only client. `assets/community-research-author-workflow.js` builds a guarded two-step author experience inside the existing research preview: private save and re-read, explicit final consent for the exact reviewed edition, separate corrected-edition publication and typed WITHDRAW confirmation. The M02 owner draft client now supports `getMine(id)` for exact read-back. This does not alter the original W.NE document or any saved private research unless the owner explicitly saves the separate draft.

**Strong activation gates:** `researchPublishing:false`, `communityResearchBackend:false`, `communityResearchPublishing:false` and `communityResearchTestDatabase:false` remain false. All M03 controls are hidden/disabled by default. Even if a flag is mistakenly changed locally, the clients refuse the existing Disclosure Desk production Supabase URL `omqxizswzcwgzqaczlhe.supabase.co` and only recognise local or approved deploy-preview test hosts with an explicitly configured separate test project. Production domains are denied outright. Existing member social features are unaffected.

**No release action:** No Supabase production DDL or rows, Netlify builds, live accounts, Play Store APK, website deployment, private file copy or new bottom tab. SQL and tests remain out of the static public bundle. No real user is able to publish from this milestone.

## Tested

GitHub Actions `.github/workflows/community-research-m03-consent-no-deploy.yml` has three jobs:

- Node/static contract and release-package checks, including M01/M02 regressions and isolated client tests.
- Disposable PostgreSQL 17 with M02 bootstrap/schema followed by M03 SQL and synthetic A/B/anon/guest tests. Verified positive consent, exact draft and edition compare, first publication and duplicate rejection, history immutability, revisions, cooldown, cross-account denial, withdrawn-paper privacy, protected audit trail, malformed/private source rejection and 3-paper daily quota.
- Real local Chromium at widths 320, 393, 820 and 1280, including the original M01 preview and injected **mock** member publisher controls: save/re-read, explicit consent, linked revision/edition 2, separate typed withdrawal, and horizontal-overflow checks.

A successful tested code run was [GitHub Actions run 44301581795](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44301581795). Check **latest exact HEAD** after this documentation update before marking the final handover green.

## Remaining blockers / M04 candidate

1. Review the SQL with an independent security pass, especially `SECURITY DEFINER` ownership, default function privileges, internal-schema exposure and live project advisor warnings. Never add `dd_cr_private` to Supabase Data API exposed schemas.
2. Provision a genuinely isolated **nonproduction** Supabase project and apply M02+M03 only there after owner approval. Its URL/key must be separate from the existing production project. Run two real test accounts, guest and anonymous sign-ins, actual RPC, sign-out/relogin, cross-account, concurrency and correction/withdrawal scenarios.
3. Build the 'My Research' published papers/drafts dashboard so a lost browser response or closed session can recover links and current editions without duplicate publications; connect public reading/search to approved paper editions and archive/Who’s Who cases.
4. Add report moderation/copyright/privacy workflow, permissioned author deletion/retention and abuse review; enforce verified accounts and spam controls. Community voting must remain on *usefulness* rather than claim truth, and cannot be released before independent vote/aggregate tests.
5. Verify mobile Samsung Android keyboard, back navigation, dark theme, deep links and account deletion. Consolidate WHO M63 and Source M40 with other staged changes only at a separately approved significant Netlify deployment.

## References

- Prior development milestones: `docs/COMMUNITY_RESEARCH_M02_HANDOVER_2026-11-18.md` and `docs/COMMUNITY_RESEARCH_M01_HANDOVER_2026-11-18.md`
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase privileged RPC review: https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0029_authenticated_security_definer_function_executable
