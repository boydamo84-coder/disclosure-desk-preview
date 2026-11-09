# Disclosure Desk — Milestone 29: Research Home, safe saving and recovery
**8–9 November 2026 · development source and isolated Chromium · not deployed**

## Safety and scope
Continued directly from M28: legacy Writer Home links, Research cloud document switching, and single JSON / ZIP recovery. Tests use original staged website scripts, actual Chromium at mobile and desktop sizes, and fictional two-account Supabase clients. All off-origin requests are blocked. No live credentials, user content, Auth/Storage/Forum/database mutation, Netlify build or website deployment took place.

This is a mock authenticated browser acceptance, **not** an actual signed-in test of the owner's production Boydamo account. Live Samsung login, cloud insert, actual encrypted backup restore and full authenticated account isolation remain pending.

## M29-01: Unsaved editor could be replaced by Home actions — FIXED IN DEV
The research-workspace Home dialog previously replaced the Writer iframe after a cloud document Open or New without requiring a completed save. A failed or in-flight save could lose work.

Updated the exact Home event handlers in research/research-workspace.html to call the current child editor's wneSaveBeforeNavigation and demand TRUE before any document switch or create call. A per-dialog in-flight lock prevents double operations. Failed saves leave the iframe, active document and original writing untouched; a first-time account without any selected document can still create its initial report.

## M29-02: Research-only /home anchors — FIXED IN DEV
All three clickable legacy /home anchors in research/wne.html were replaced by in-app Research Home actions. research/research-site-nav.js now exposes ddResearchOpenHome and intercepts those clicks. In a same-origin embedded editor it delegates to the parent workspace and opens its real in-page Home dialog, without changing URLs or discarding unsaved work. A standalone editor must first confirm a save before navigating to the Research Workspace Home. Missing parent or failed save blocks navigation.

Note that older **hidden Writer-only runtime code** still contains /home?open_drive=1, /home?wne_action=kindle and /home?wne_action=export calls. Normal Research controls hide those original Writer functions and the Research export menu overrides export, but their all-state reachability has not been exhaustively proven. Do not claim that every underlying legacy route has been removed; keep separate QA.

## M29-03: JSON/ZIP recovery links could leave an unsaved report — FIXED IN DEV
The Home dialog's direct Restore JSON and Restore ZIP links now prevent their original browser navigation until the active document save is confirmed. The same guarded helper handles touch and keyboard activation. If saving fails, the Home dialog remains open and no recovery page loads. On confirmed save, the actual recovery route opens.

## M29-04: Single JSON restore did not validate active HTML — FIXED IN DEV
research/restore-copy.js previously checked JSON shape only before writing chapters, unlike the ZIP restore, which has a DOMParser-based safe HTML allowlist. Exported validateDocument from the already-vetted research/restore-library-core.js and explicitly included that script on the single-copy restore page. Script tags, executable event handlers and unsafe markup now fail closed before database writes.

The JSON restore verifies the account before insertion, rechecks it immediately before writing, and checks identity again after the cloud confirms an inserted UUID. All inserts are new owner-scoped documents; no update/delete path exists. After an ambiguous network timeout, the selected file is consumed and the button disabled with an instruction to inspect Home before retrying, avoiding accidental duplicates. A mid-operation account swap or sign-out fails closed.

## Real Chromium verification

- scripts/test_research_home_navigation_chromium_20261108.cjs: **20 checks passed** (10 each at 393px and 1280px). Validates save failed vs succeeded for switching A→B, creating C, in-frame Home action, first document for an empty account, JSON and ZIP recovery link denial on unsaved content and confirmed JSON recovery navigation.
- scripts/test_research_json_restore_chromium_20261108.cjs: **12 checks passed** (six each at 393px and 1280px). Unsafe HTML rejected, A/B copy owner isolation, pre-insert account switch rejected, ambiguous insert timeout requires check-before-retry, signed-out state creates no copy.
- The existing ZIP restore validation, Recovery History, DOCX inline import, Chat/Discussion/public profile mocks, offline Chromium UI and disposable PostgreSQL write-fence tests remain part of no-deploy CI and were not duplicated.
- The last source commit before writing this document passed all three CI jobs: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42537987395 . The documentation-only commit will trigger CI again; confirm exact final head before labeling it green.

## Release watchlist
1. Owner-controlled, genuine signed-in Boydamo account and a second **owned** test account on Samsung; verify successful and rejected Research saves, Home opening, browser restart/reopen, DOCX/JSON input, Recovery History, account switches and no loss of unsaved text. Do not inspect or repurpose an unfamiliar Yandex visitor account.
2. Fresh actual encrypted backup and **verified disposable restoration of that real archive** before any irreversible test or claim of disaster recovery.
3. Real Supabase Storage/Auth account isolation and signed-in JSON/ZIP new-copy insert; the automated Chromium tests deliberately mock backend identity and RLS.
4. Hidden Writer-only legacy service routes, Google Drive integration claims and physical file picker/download acceptance should be reviewed before public launch.
5. Profile self-delete remains support-request-only; all M26 write-fence/account-deletion SQL is unapplied and gated separately.

No Netlify credits consumed. Bundle M27 comment polish, M28 Restore Copy mobile fix and these M29 safeguards into one later owner-approved production release.
