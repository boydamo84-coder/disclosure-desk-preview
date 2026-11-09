# Disclosure Desk — Milestone 30: Live Research backend preflight and owner Samsung acceptance

**9 November 2026 — development branch documentation; production app unchanged.**

## What was actually verified

The owner authorised **Boydamo / test-01** for disposable Research testing. We did not access passwords, Auth tokens, real private text, Storage files or the unfamiliar visitor's data. The protected primary administrator **test-02** was not used as a test subject.

Using the connected Supabase administrative SQL facility, a privileged operator verified **actual current production PostgreSQL schema and RLS** while temporarily setting the authenticated role and **simulating** the target user's JWT claims. This is a more meaningful real-database permission check than a fake data store, but **is not a genuine signed-in browser session and does not validate browser Auth, network refresh, Drive, file chooser or signed-in UI**.

### Initial and final protected data counts

| Account alias | Research cloud docs | Saved revisions | Boards |
| --- | ---: | ---: | ---: |
| Boydamo / test-01 | 0 | 0 | 0 |
| Protected administrator / test-02 | 7 | 0 | 3 |

Both counts were preserved after testing. In the final verification, **zero M30-marked test documents** remained in production.

### Successful live SQL checks — all test transactions ROLLED BACK

| Check | Observation |
| --- | --- |
| Boydamo SELECT RLS | 0 Research docs visible; administrator's seven docs invisible |
| Owner INSERT into research_documents | 1 synthetic row accepted inside a temporary transaction |
| research_save_document RPC | Same synthetic row saved with revision increment **1 → 2** |
| Optimistic revision collision | Calling RPC again with expected revision **1** was rejected with SQLSTATE **40001** |
| Other owner's INSERT | A simulated Boydamo session could not create a row with protected administrator ownership; denied with SQLSTATE **42501** |
| Final transaction and persistence checks | Explicit `ROLLBACK` applied; 0 M30 rows, 0 Boydamo docs and 7 protected administrator docs remained |

The tests used only invented text and temporary rows in the current production database, not real account browser sessions. The existing `research_save_document` function is `SECURITY DEFINER` but includes a checked `auth.uid()`, target `user_id`, and expected revision in its UPDATE predicate; the observed collision and ownership checks corroborate this behavior. No schema, production source, Auth users, Storage objects or role assignments were changed.

**Caution:** A successful SQL transaction does not prove real network-side JWT signing, browser persistence, CDN scripts, file-picker permissions, real Office import fidelity or Google Drive backup. Do not call this a completed live signed-in browser acceptance test.

## Owner-operated Samsung test pack

A synthetic ZIP test pack was generated during the conversation, containing:

- `M30_Boydamo_DOCX_Import_Test.docx`: rendered and inspected as a clean one-page Word file with Heading 1 sections **Observation Log**, **Source Notes**, **Follow-up Questions**, and text markers `M30-DOCX-MARKER` / `M30-END-MARKER`.
- `M30_Boydamo_JSON_Recovery_Test.json`: valid `version:2`, Georgia size 12, two harmless paragraphs-only chapters and `M30-JSON-MARKER`. ZIP content and source structure checked.
- `M30_Samsung_Test_Instructions.txt`: controlled procedures for saving, reopening, DOCX import, JSON recovery and reporting expected outcomes.

The pack is a conversation download artifact, **not committed as binary code to GitHub**. No real account secrets or personal content were put in it.

### Samsung acceptance steps (live site as currently published)

1. Sign into Disclosure Desk directly on the Samsung with **Boydamo's own test account**. Never provide the password or any access token to ChatGPT. Use W.NE Research Edition (from the website's W.NE tab).
2. Create a fresh `M30 Boydamo save test` document, type `M30-SAVE-MARKER — my latest sentence is visible`, press Save, verify actual success, then reopen the document from Research Studio Home. Fully close and reopen Chrome and repeat the visibility check.
3. Import the supplied DOCX **as a new document**; confirm all three headings, the two M30 markers and the previously saved report. Save and reopen.
4. Restore the JSON file **as a NEW recovered cloud copy** and verify `M30-JSON-MARKER`; previous documents and Boards must stay intact. Do not immediately retry a timed-out save/import; check the cloud document list first.
5. Capture PASS/FAIL and a screenshot only for failures. If a screen shows 404 or stops responding, record the exact route/button rather than importing any personal files to debug.

**DO NOT claim step 1–4 completed until owner actually performs them.** The site currently deployed is older than the M29 save/restore code; live-owner checks today verify only production's existing implementation. **M29-specific unsaved-work blocking and HTML validation can only be tested against a published build containing M29, after a later owner-approved bundled deployment.** No Netlify credits have been spent for M30.

## Backup and release readiness

The BDS private encrypted backup workflow was last manually run successfully on **6 November 2026**. It is currently **MANUAL ONLY**. The automated test that passed was an isolated synthetic PostgreSQL restore, not a proven recovery of the actual encrypted production archive. The GitHub connector exposed no workflow-dispatch action for initiating the private backup automatically. That is not a blocker to carefully creating fresh **disposable** Boydamo documents, but a verified actual restore is mandatory before user account deletion or other irreversible cleanup.

The unknown Yandex visitor and all other accounts are outside the test scope. The protected administrator, their seven Research documents, three Boards and role assignments remain untouched. M26 account deletion SQL/write fence remains **unapplied**, and profile deletion is only a support request.

## Pending owner-supplied sign-in results

| Test | Current status |
| --- | --- |
| Actual Samsung login and session refresh | **NOT TESTED** |
| Actual UI Save → Home → reopen after browser restart | **NOT TESTED** |
| Real Samsung DOCX picker/import and section fidelity | **NOT TESTED** |
| Real JSON recovery as a NEW copy | **NOT TESTED** |
| Cross-device/iPhone reopen | **NOT TESTED** |
| M29-only save guards on deployed build | **NOT DEPLOYED, NOT TESTED** |
| Real encrypted backup restore | **NOT VERIFIED** |

**Next:** owner tests on Samsung using the pack and reports results. If any fails, fix on the existing development branch and rerun no-deploy CI. Once all desired fixes are tested, owner explicitly approves a **single bundled** deployment (M27 comment rail, M28 overflow fix, M29 safety, any M30 fixes). Avoid claiming real user login was automated or requiring the owner to share their password.
