# Disclosure Desk — M30 Samsung first-document failure — verified source diagnosis and fix

**9 November 2026 · Owner's real Samsung screenshot · Development branch only**

## What the owner reported

While signed into the live Disclosure Desk website, opening W.NE Research Studio showed a legacy blocking native alert:

> W.NE could not connect to its local Python server. Make sure you started wne_server_v07.py, not python -m http.server.  
> Open a research document from your cloud library first.

The screenshot clearly shows the Research Studio header with a **Home** button, Editor / Research Library / Side by side tabs, and the old Writer's alert. This is **not** evidence that the user needs Python or Termux installed: the hosted Research Studio is intended to use Supabase. Milestone 30's prior read-only database audit found **Boydamo had zero cloud Research documents**.

### Root cause

1. `research/research-workspace.html` originally rendered an eager iframe with `src="./wne.html"` even if there was no selected owner-verified cloud document ID. Its startup script only replaced that URL when an ID was present.
2. The original Writer's `boot()` fetched `/api/manuscript` immediately.
3. The hosted cloud bridge's `ensureLoaded()` requires a document `?id=` and intentionally rejects a missing ID with `Open a research document from your cloud library first`.
4. The Writer's legacy catch block incorrectly assumed **every** startup exception came from a missing *local Python* server, disabled editing, and presented a misleading native alert.

The user's first-account screenshot is consistent with this exact path; it does **not** prove a production Supabase outage.

## Development fix

- `research/research-workspace.html`: initial Writer iframe now uses `src="about:blank"` and `hidden`, so first-time accounts never boot W.NE without an opened cloud document. A responsive, accessible **Create or open a document** state appears, and the existing **Research Studio Home** modal opens automatically when no active document ID exists. When owner selects or creates a cloud report, the shared `ddResearchShowEditor()` unhides the editor, hides the placeholder, and only then loads `./wne.html?id=<verified cloud selection>`. Existing `?id=` sessions still proceed directly to the editor. No unsigned auto-created document is ever written on page load.
- `research/wne.html`: removed the outdated `wne_server_v07.py` native alert from the **Research Edition** Writer. Standalone navigation to Research Writer without a document ID redirects to the guarded Research Workspace Home. Embedded missing-ID error now displays non-modal cloud-document guidance. Other errors show an accurate cloud document failure, preserve editing restrictions, and advise returning to Home; no unsupported success claim.
- `scripts/test_m30_first_document_chromium_20261109.cjs`: **offline, synthetic-account Chromium regression** at Samsung-sized 393px and desktop 1280px. Checks no Writer request until a document is chosen, auto-opening Home and first-report input, no Python alert, creating a fictional cloud report through a mocked library API, correctly revealing the editor afterwards, and existing `?id` sessions skipping the first-time wizard.
- Existing M29 save-before-switch/import/recovery controls are retained. Other Research and full-site, Chat, Forum and disposable PostgreSQL tests remain in the same no-deploy CI.
- No Netlify/production branch change, Auth/Storage/Data write, or new Supabase project. The unfamiliar independent visitor, admin and all site data are untouched.

## Owner's immediate live workaround

**Tap OK → Research Studio Home (top right) → My documents → New research document.** Name it `M30 Boydamo save test` and create it. If the editor opens, continue the M30 Save & Reopen test. If the button fails or the warning reappears, stop and send a screenshot. Do not install Python on your Samsung, and do not test with the unfamiliar visitor's account.

**Important:** The new first-document UI only exists in the **development branch**. The live screenshot cannot be fixed until the owner reviews and authorises the later **single bundled Netlify deployment**. Live authentication, real PDF/DOCX import and two-account browser tests remain open; this report only diagnoses the screenshot and verifies offline source changes.

## Verification

GitHub no-deploy workflow `research-resume-check.yml` runs real local-only Chromium checks and existing verification. Record the exact **final verified commit SHA and CI run** once it completes; until then do not claim green.
