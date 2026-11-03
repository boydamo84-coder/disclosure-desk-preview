# BDS Finance F2 — dedicated private security architecture (REVIEW ONLY)
Updated 2026-11-03. **No production, preview, banking or Supabase changes.**

## Choice and hard boundary
- The Finance Centre is a separate BDS administrative product; **do not reuse the live Disclosure Desk project's Auth, community tables, or Supabase service-role key**. Proposal: a dedicated private finance Supabase project with a separate owner identity, then a private authenticated origin/PWA with MFA. This avoids a single disclosure/community configuration mistake exposing financial records.
- The current single-file F1 example in \`docs/prototypes/\` is **not** a secure accounts page. Never enter real income there, despite its offline/network-disabled behaviour. It is part of the unreleased site repo solely for synthetic tests.
- F2 SQL in \`finance-review/finance-f2-review.sql\` is intentionally **not** in any migration directory; it is a candidate for isolated review. It must never be executed against the live Disclosure Desk project. An isolated PostgreSQL 17 service exercises it in GitHub Actions.

## Authorization
- Owner is provisioned from a verified server-side admin process into \`bds_finance_private.owner_accounts\`. The review candidate contains **no actual user UUID, personal data or initial owner grant**.
- A finance ledger row is accessible only if ALL are true: Supabase signed-in \`auth.uid()\`, corresponding private allowlist row enabled, \`auth.jwt().aal == "aal2"\` after MFA, \`is_anonymous==false\`, and entry owner_id equals verified session user. This is enforced with PostgreSQL RLS in a **dedicated project**, not with a hidden URL.
- \`bds_finance_private.is_owner_mfa()\` is SECURITY DEFINER only to read the private allowlist, has fixed empty search_path, no dynamic SQL, and is outside Data API exposed schemas. Its limited boolean EXECUTE permission is for authenticated RLS evaluation. A role without MFA or one disabled in the allowlist cannot pass policy.
- Only SELECT/INSERT are allowed for owner sessions in the candidate. No UPDATE/DELETE to enforce an append-only audit/event approach. Provider transaction identity unique by owner+provider+kind+ref; writes must be idempotent under retries. Later true accounting adjustments will require reviewed reversible correction/void links, not editing past data.
- Real implementation MUST add a server-side session check, rate limit, MFA enrollment/reauth, secure cookies, CSRF protection for browser mutation endpoints, strict CSP, logging without PII, and checks that service-level secrets never reach browser/Android.
- Publishing app files behind 'private links' alone is not authorization. Separate production origin with server-side auth before delivering the finance UI and data, plus backup of encrypted records, is required.

## Scope and limitations
- Ledger candidate assumes GBP-only amount_pence and a deliberately small set of product/provider/type values. It has **no legitimate FX conversion implementation**, tax calculations, payouts sync, donor/customer PII, business receipts, provider tokens, or real-money reconciliation yet.
- No financial data at rest encryption beyond database platform defaults is guaranteed by this candidate. F2 requires separate key management and verified encrypted backups before real data. OAuth refresh tokens should be server-side secret storage only.
- Product-level income must be categorized once (estimated vs finalised vs payout), with original payout date and provenance. The candidate uses signed accounting categories in the read-model; no billing amount must be treated as personal tax until eligible expense classification and PAYE details are reviewed.
- Database admin/operator provisioning/revocation and separate project configuration are not yet done. MFA via AAL2 in JWT needs real device/session expiry validation. The SQL alone cannot verify authentic tokens on a real Supabase project.
- Consider UK GDPR retention, confidentiality, device lock, finance exports, owner account recovery, and a documented incident/restore procedure before live rollout.

## Test matrix (disposable only)
- Isolated synthetic owner with AAL2 can INSERT and SELECT own row.
- Authenticated non-owner with AAL2 cannot read or forge owner row.
- Owner AAL1 and anonymous Auth identity cannot read.
- Anonymous database role cannot select.
- Authenticated role cannot access private owners table or update/delete ledger.
- Unique provider reference rejects duplicate receipt.
- Removing operator approval immediately prevents further ledger reads for owner.
- Every test runs in independent PostgreSQL 17 service; **no access to production credentials, tokens, Supabase or Netlify**.

## Milestone gates still OPEN
1. GitHub CI must pass after staging this SQL (the result must be recorded in MASTER_HANDOVER.md).
2. Security review against real Supabase project creation and current RLS/AAL docs; independent test project, not DD's existing backend.
3. Owner-authorised provision of new private project, MFA account, signed-in desktop + Samsung cross-account rejection, actual backup/restore with synthetic test record.
4. Provider-specific consent (Ko-fi, AdSense, Google Play), paid/free quota verification, secure webhook and OAuth token handling.
5. Only then allow actual income entry; tax estimator requires PAYE context, reviewed HMRC rules and explicit accountant caveat.

Documentation: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/auth/auth-mfa and https://supabase.com/docs/guides/api/securing-your-api
