# Bouncer server-side protocol candidate — offline synthetic QA only

26 November 2026 · Issue #18 · **Do not deploy**

This directory is a test harness, not a service, public endpoint, HTTP client or production scanner. It constructs the documented Bouncer protocol using an in-memory `ScriptedTransport` only; there is deliberately no network transport, live API key, incoming user file, storage service, release receipt or configuration change. `candidate_clean_only` always carries `release_eligible: false`. The existing isolated official ClamAV worker, qpdf structural check, renderer, quota ledger, publication approvals and package exclusions are unchanged. Do not use this to circumvent any earlier refused publication action.

## Verified in this stage

Run in this directory: `python -m unittest -v test_adapter`. All 15 test groups (including multiple case variants) passed locally on Python 3.12. No live provider calls were made in this stage.

- Simulated v1 direct multipart for files up to 4,000,000 bytes, within the documented ~4.5 MB *request* ceiling. Simulated v2 pre-signed POST for 4,000,001–5,000,000 bytes; no change to existing 5 MB pilot ceiling or 100-page/250 MB combined quota. The large synthetic buffers test transport framing only, not PDF validity.
- Free-plan account quota checked before starting, no automatic retries; 401/403, 413, 429, 404, 5xx, redirects, malformed/duplicate JSON, missing or incomplete results, network errors, timeout, changed plan/quota, untrusted origins and mismatching input/receipts all block. Suspicious or malicious verdicts reject. The mock storage address is deliberately fictional and cannot be used as a production allowlist.
- Exact scan ID, file SHA-256, size, MIME and generic filename are checked; no API credential forwarded to storage. Signature/pattern engine results must explicitly be clean and no threats reported. This is a conservative *proposed* schema: the true clean engine response and any signature freshness guarantee remain to be verified against authenticated real API output. Eight polls at two-second simulated intervals bound the mock wait; a real transport requires independently enforced connect/read/wall-clock limits and no redirects.
- Even a fully clean mocked result is only evidence of protocol handling, never PDF parsing or trusted scan clearance. The live dashboard tests are in the previous `BOUNCER_SYNTHETIC_QA.md` (4 real synthetic verdicts). Malformed PDF was clean at the vendor; original qpdf validation and safe renderer remain mandatory. No claim of live API or production end-to-end acceptance.

## Privacy and provider assessment — unresolved release gate

The provider's published privacy policy (checked 26 Nov 2026) identifies AWS Mumbai (India), file deletion within 24 hours, and long-term scan metadata retention during account life. Metadata includes original filename, type, size, SHA-256 and verdict. A generic filename minimizes metadata but cannot remove personal information inside a PDF. Even research intended for publication can include private or third-party data before approval. Provider terms do not provide sufficient verified evidence of an Article 28 processor agreement, approved UK international transfer arrangement, exact scan engine/freshness guarantees or paid-plan/non-overage arrangements for this intended deployment. No real research is to be transmitted while these are unresolved.

ICO's current adequacy guidance (checked 26 Nov 2026) does not list India. If UK GDPR restricted transfer rules apply, identify the provider legal entity and controller/processor roles, onward processing and transfer mechanism; obtain a suitable Article 28 contract and applicable transfer safeguard, e.g. IDTA or UK Addendum with transfer risk assessment/data protection test if applicable, and assess high-risk processing/DPIA and privacy notice. Never assume uploader consent alone supplies the necessary legal basis or international transfer mechanism. Confirm permission for the ad-supported use case and provider security, retention/deletion, breach response and subprocessors. This checklist is not legal clearance; owner should obtain appropriate advice if unsure. Do not send real users' PDFs without reviewed arrangements and explicit approval.

## Remaining integration acceptance

1. Ask provider for legal entity, DPA and transfer mechanism, permitted production use on free tier, actual engine names/versions and verified definition update/freshness, skipped/partial scans/errors and deletion guarantees. No external message sent in this stage.
2. With authorized securely stored evaluation credentials and permissible network, run a separately scoped authenticated server-to-server test using only fixed synthetic content. Do not log or commit keys/presigned fields. Confirm exact clean/flagged responses, actual storage origin (pinned allowlist), v2 max-size behavior, quota and failure semantics, server-only credentials. Current evaluation key's one-time secret has not been retained; no credential is in this code. Do not add to production or recreate without approval. Do not trigger CI merely to evade a restricted network/authentication boundary.
3. If provider cannot supply adequate assurance, keep original official-ClamAV gate and evaluate dedicated free host as documented. No approval to downgrade scanner signature requirements or change public packaging.
4. Separately validate atomic scan budget/reservations across concurrent workers and users, request limits and anti-abuse, immutable quarantine bytes, trusted signed receipt provenance, final structure/render/storage/consent/approval/deletion/withdrawal, real accessibility/Android and strict production exclusion tests. Keep all existing flags OFF until explicit release approval. No live uploads, deployment, production DB/Storage, paid services or changes to W.NE.

References:
- https://usebouncer.dev/docs/
- https://usebouncer.dev/terms/
- https://usebouncer.dev/privacy/
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/is-the-restricted-transfer-covered-by-adequacy-regulations/
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/
