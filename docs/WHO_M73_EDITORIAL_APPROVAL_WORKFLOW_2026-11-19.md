# Disclosure Desk M73 — original-source claim approval workflow (DESIGN/QA ONLY)
Date: 19 November 2026 (Europe/London)

Status: STAGED. No real editor has signed a claim, the registry is empty, and no member vote is allowed.

## Scope
This milestone builds the **editorial gate** ahead of possible five-criterion, claim-specific community evidence worksheets. It is not a credibility score for people and does not presume a UAP claim is true. The claim's original attribution and public underlying evidence must be distinguished.

There are 23 source-linked claim dossiers in the M67 editorial directory. Five have the explicit classification incident_or_observation with an original primary source. The initial review queue contains only those five; other institutional allegations, reporting, retrospective interpretations, technical analyses and policy statements remain browsable but are **not auto-approved or eligible for this initial vote pilot**.

## Review intake process (never automated fact-checking)
1. Run **node scripts/who-m73-editorial-approval.cjs queue** to list the five eligible-to-review claim drafts. It reads only existing public source dossiers and writes no files.
2. For one exact claim/version, record the original attributed statement and HTTPS primary source, locator within that source, and existing documented uncertainty/limitations. The candidate is checked byte-for-byte against the current public dossier; changes require updated research, a new version, and fresh signatures rather than silently editing an approved claim.
3. A **lead** reviewer and an **independent** second reviewer must individually inspect the original, check precise attribution and version, consider alternatives and conflicts, and sign an identical SHA-256 candidate digest. The signed attestation includes each person's explicit yes/no findings, role, date and conflict status. A rejection, uninspected source, future date or conflicting reviewer fails.
4. Each reviewer must have a **different, pre-enrolled Ed25519 public key**, independently validated in a private editorial trust store. A signature is verified with the corresponding active public key. Do not put actual private keys, access tokens, passwords, email addresses or unpublished source material in GitHub. Physical identity, independence, source inspection and any conflicts **still require human/offline verification**; cryptography alone cannot establish those facts.
5. The offline verifier **never writes or enables** the site's public registry: a valid review produces only a proposed row with enabled:false. A separately authorised curator must review full source lineage and policy decision, obtain owner signoff and revalidate against exact production records before any future migration/registry population. Enabling voting needs a separately tested production-derived website release, live backend access control and at least two real independent test accounts.
6. If the underlying source link, attributed words, claim version, uncertainty record or key validity changes, re-run the editorial process. Revocation, source dispute and correction/withdrawal procedures need dedicated audit/communications policy before launch.

## CLI and packet contract
- CLI queue: node scripts/who-m73-editorial-approval.cjs queue
- Offline verification: node scripts/who-m73-editorial-approval.cjs verify /local/private/signed-packet.json /local/private/enrolled-public-keys.json
- Packet (private): schemaVersion:1, candidate fields exactly personId, claimId, claimVersion, statement, originalSourceUrl, sourceLocator, limitations, claimType, and approvals array of exactly two.
- Signed approval fields: reviewerId, role ('lead' or 'independent'), decision='approve', claimDigest, signedAt (UTC seconds), originalInspected=true, statementVerified=true, alternativesReviewed=true, conflictOfInterest=false, signature (base64 Ed25519).
- Trust-store schema: schemaVersion:1, reviewers array with reviewerId, role, status ('active' or 'revoked'), publicKeyPem. A separate identity and conflict-of-interest enrollment process is required. Never treat a self-declared reviewer name as proof of independent human review.
- The input approval must be signed over DD-WHO-M73-EDITOR-V1 plus the exact JSON payload returned by the helper attestationMessage. **Do not sign using an online browser or store private keys in the app.** For now the CI suite generates fake keys in memory solely to prove verification and rejection; no real signatures/keys are enrolled.

## Security and publication gates
- Public registry data/who-community-approvals-m64.json remains approvedClaims:[].
- assets/community-test-config.js remains whoEvidenceBallots:false.
- Actual source verdicts, reviewer keys/signatures and RLS drafts are not distributed in any public bundle.
- M72's irreversible withdrawal remains a proposal pending owner policy acceptance; a member withdrawal after aggregate publication would retire the whole aggregate under the present draft. Public screenshots cannot be retrieved.
- A separate nonproduction Supabase environment, two genuine user accounts and independent database security review are still required. **No production Supabase write is authorised.**
- Experimental M67/M72/M73 branch history is not based on current live M70. Never wholesale-merge these branches into production. Carry only separately accepted features onto an M70/M71-derived curated candidate.

## Synthetic QA
scripts/test_who_m73_editorial_approval.cjs uses ephemeral test-only Ed25519 keypairs and challenges missing/duplicate/forged/revoked approvals, false attestations, changed sources, version drift and premature site voting. Actions workflow who-m73-dual-editor-no-deploy.yml runs offline tests and strict public-bundle checks.

There are **zero actual human editorial approvals** until real independent reviewers are enrolled and complete a review. No claim rating, honesty judgment, or novel extraordinary evidence conclusion has been created by this milestone.
