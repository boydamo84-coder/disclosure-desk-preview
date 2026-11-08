# Disclosure Desk — Original Research/mobile polish request checklist (8 November 2026)

**Source of truth:** owner’s full request from 8 November 2026, verified against `fix/compact-writing-popover-mobile-desktop-nov08`. **No items in this file are proof of Samsung acceptance or Netlify publication.** All new changes remain on the NO-DEPLOY branch; production still runs the preceding approved release. The owner reports 198 Netlify credits remaining until 29 November, so batch for ONE subsequent approved deployment.

| Requested behaviour | Source status at this milestone | Actual QA / limitation |
| --- | --- | --- |
| Self-service **delete profile/account** | **NOT DONE.** Profile includes a `Delete my account` support-email request only | Full authenticated server-side deletion, related private data cleanup, confirmation, retention/backup safeguards and reversible request cancellation need separate implementation; do not claim this is a real delete action |
| External sources page | **ALREADY PRESENT** (`sources.html`) | Local link/layout audit done. Full outbound third-party freshness/availability still pending |
| Replace verbose photo intro with circled information button | **ALREADY PRESENT** (`dd-avatar-information` details popup) | User can expand `ⓘ`; physical iPhone/Samsung visual acceptance pending |
| Profile photo in profile tab and header | **ALREADY PRESENT ON MAIN SITE** (`assets/profile-avatars.js` sets both shortcut and tab avatar for owner, even if public visibility off) | Actual device photo upload/display previously tested by owner; Research dock uses a separate static emoji, **not yet personalised** |
| W.NE DOCX import causes 404 / cannot get back | **NEW FIX STAGED**: `research/research-docx-import.js`, `research/wne.html` menu route | File picker opens synchronously from touch; after selecting DOCX, current report save must be confirmed; imports as **new** private cloud document, never overwrites old one; remains in editor on cancel/failure. Uses Mammoth/DOMPurify. Synthetic test verifies flow; real Samsung DOCX still pending |
| File → Backup Library does nothing | **IMPLEMENTED IN EXISTING CLOUD ADAPTER**: owner-specific ZIP; File menu invokes `makeLibraryZip()` | Synthetic tests validate owner isolation and ZIP manifest. ZIP does not include device-only Board copies, notes or Google Drive data. Physical file/share/download and ZIP restore need testing |
| File → Recovery History shows cloud adapter error | **IMPLEMENTED IN EXISTING CLOUD ADAPTER**: checkpoints, safe previews, restore as **new** owner document, plus direct `recoveryList/Preview/Copy` entry points | Synthetic owner-only test passes. Do not claim live account history verified on physical device |
| File → Emergency Copy does nothing | **IMPLEMENTED IN EDITOR**: `window.wneEmergencyCopy()` syncs current unsaved editor HTML into JSON export | Source checks pass; Android download/sharing sheet acceptance remains pending |
| Remove Proofread | **HIDDEN** in Research Edition scope, preserving original standalone W.NE behaviour/code | No Proofread toolbar or quick-tool action should show in Research UI |
| Remove redundant “Back to Disclosure Desk” links | **NEW FIX STAGED** across W.NE editor, Research Workspace, Library, guest preview, Research entry, import, recovery restore pages | Standalone Research site-nav already provides global navigation, save-guarded for an open document. Original static return links removed; internal `← Research Studio` may remain for utility routes |
| Research navigation title “Disclosure Desk” | **ALREADY REMOVED** from dock heading | Nav has compact status/Hide control, without repeated site title |
| Remove Reader from Tools | **HIDDEN** in Research Edition scope | Original W.NE feature retained but invisible in Research |
| Remove Show/Hide Quick Tools and obsolete Tools | **NEW FIX STAGED**: all old launchers, quick-setting and Tools toolbar hidden in Research edition | They remain in DOM for unrelated legacy listeners but not visible; no changes to standalone W.NE |
| Replace Tools with Insert → Compare / Image | **ALREADY IMPLEMENTED** in `research/research-insert-menu.js` | Original Image and Compare click handlers moved to popup; tested by real Chromium, not recreated |
| Grammar/spelling popup obscured by bottom tabs | **COMPACT POPUP STAGED** in M18 and dock-height CSS in place | Tiny `‹ ›` controls inside suggestion popup, no permanent full-height reviewer strip. Offline Chromium passed; real Samsung with keyboard/tab bar still pending |
| Highlighted-word font size, separate from document size | **ALREADY IMPLEMENTED** (`research/research-text-size.js`): restricted 10–24 px text selection | Real Chromium Undo/Redo and export source tests passed. Real DOCX/PDF and Android long-selection still pending |
| Hide “Sync across devices · account needed” and “Publish research · account needed” after sign-in | **HIDDEN FOR ALL USERS** via Research Library CSS, because these controls are not functional | Do not present either as a working signed-in feature. Actual cloud W.NE documents have a separate functioning save/recovery adapter |
| References too complicated | **PARTIALLY SIMPLIFIED**: advanced References folded under optional `<details>`; basic Notes and Board import front-facing | User-facing completeness/usability still needs physical acceptance; device-only refs and notes are not automatically cloud synced |
| Research section overwhelming | **PARTIAL**: simple notes/Boards first, advanced controls tucked away, duplicated site returns removed | Broader copy, screen density and navigation polish still needs real phone walkthrough |
| Bottom navigation covers Research content | **RESPONSIVE DOCK CLEARANCE ALREADY PRESENT** with measured height plus safe-area padding | Real mobile, keyboard opening, landscape and long scroll require device testing |
| Research top “Back to Disclosure Desk” link | **NEW FIX STAGED** | Removed in Research home, workspace, editor, library and utilities; bottom navigation remains |
| Google Analytics / combined release | **STAGED SEPARATELY IN SAME BRANCH**: opt-in public-only GA4, no pre-consent requests, consent preference control in Privacy | Netlify still untouched. Do not track private docs/messages; separate advertising consent and pending UK privacy review |

## Testing and release gate

- Source-level original-request assertions: `scripts/test_research_original_request_audit_20261108.cjs`.
- New DOCX direct-picker non-overwrite tests: `scripts/test_research_docx_inline_import_20261108.cjs` (save fail, cancel, cloud fail, invalid file, success).
- Existing owner-only recovery/ZIP tests: `scripts/test_research_backup_recovery_20261108.cjs`.
- Real Chromium QA: editor Insert/size/Undo, compact spelling, Research Library, Analytics consent and public homepage navigation.
- A green synthetic test **does not prove** a signed-in production transaction, a successful Android file download or legal compliance. Never place private user material in test fixtures.
- **Still needed before owner’s single deployment:** secure account deletion design, confirm external-source uptime and signed-in account/privacy workflows, then one reviewed release candidate. After that use disposable documents for Samsung/Apple physical acceptance.
