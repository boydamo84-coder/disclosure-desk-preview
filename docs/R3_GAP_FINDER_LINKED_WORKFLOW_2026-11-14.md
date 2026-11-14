# Disclosure Desk R3 — source-linked Research Gap Finder ↔ Hypothesis Lab milestone
_Date: 14 November 2026 (Europe/London) · Branch: `queue/dd-web-r3-from-r2-nov14` · Offline alpha, not deployed_

## User direction and scope

Owner accepted the corrected Android/Termux R3 build and said **“Lets do it”** in response to the two next milestones: *connect Research Gap Finder with Hypothesis Lab* and *design proper account-level privacy*. We completed source-linked, deliberate local research-question recording in the standalone R3 UI, plus **only a written server-side account-security architecture design** (no real user-account data or Supabase writes).

### Exact public catalogue coverage

Reopened `data/curated-historical-cases.json` from the current R3 branch. It has **12 public curated records**: **3 explicitly labelled `Featured investigation` incident entries** (Rendlesham 1980; Nimitz 2004; Roswell 1947) and **9 public archive/research guide or index entries**. We do NOT present the nine guides as individual incident investigations. Running the source field-based Gap Finder yields **12 tentative prompts across the 3 incidents**, limited to what the structured catalogue itself indexes. This does NOT mean the original documents are globally missing any data, establish an unusual event explanation, or verify independent witness accounts or primary evidence. Every displayed gap has reason, proposed next check, catalogue source link, source scope and an explicit unverified status. A catalogue link may point to an index page, not a specific primary sighting document.

### Implementation (isolated, no network)

- Created `experiments/r3/research-gap-bridge.cjs`, a pure injected adapter using **the actual** existing `research-gap-finder.cjs` and `hypothesis-lab.cjs`; validates named incident, matching notebook case/workspace, a publicly linked HTTPS source, bounded note, a valid optional existing hypothesis link, timestamp order, no duplicate additions and 100-question limit.
- An explicitly accepted suggestion is saved in `book.gapReviews` as an **append-only `research-question-not-evidence`** record with original catalogue field, indexed-gap explanation, next action, source URL/label, dataset/scope, reviewed UTC timestamp and optional linked hypothesis ID. It is never auto-saved, never marked verified and never rewrites earlier hypothesis revisions. Legacy schema-version-1 notebooks without `gapReviews` remain readable.
- Extended `experiments/r3/hypothesis-vault.js` validation for **optional** encrypted research questions. Stored notes are encrypted in the existing local AES-GCM notebook ciphertext, with no change to the vault's format, passphrase derivation parameters or IndexedDB origin. Existing encrypted notebooks should remain unlockable with the previous passphrase. No server permissions are implied.
- Added a public-curated-incident dropdown at notebook creation, plus **Gaps** tab next to Write / Compare / History. Displays original HTTPS source links (open only when user taps), tentative explanations and next checks, `Record research question` action and optional association with an existing hypothesis. Accepted questions appear separately in a read-only ledger and remain non-evidence. For fictional/manually entered cases outside the **three incident entries**, shows honest `not covered by this local catalogue`, not `no gaps exist`.
- Packager `scripts/build_r3_lab_preview.cjs` reuses tested gap analysis source, embeds a bounded, selected-fields copy of the 12 public catalogue entries in **static** `curated-public-cases.js` and adds `research-gap-finder.js` and `research-gap-bridge.js`. It does not fetch a live website, private cases or witness information, and does not add R3 to public release allowlist. It preserves the original navy/gold 14-tab approved R2 dock CSS, custom confirmation and isolated localhost origin.
- Fixed the mobile focus/keyboard transition to avoid a bottom navigation redraw stealing **Create notebook**, Save or Add source taps. The standalone alpha now prevents creation of a competing unsaved notebook while an already encrypted vault is locked, since current local storage supports one encrypted notebook per browser profile/localhost origin; deleting to test a case is discouraged. Incomplete editor text still not autosaved.
- Updated `experiments/r3/README_TESTING.txt` with the `R3_Research_Gaps_Android` extraction folder, one-vault/Incognito limitations, source caveats, explicit acceptance and confirmation checks. Existing `BUILD_INFO.txt` and cache-busted CSS/JS files enable unambiguous source verification without clearing Chrome site data.

### Verified independent tests

**Current exact application and workflow SHA:** `59faf7bb27955c7cf08f425f05b20f70274bdc37`.

[GitHub Actions no-deploy run 43655344183](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43655344183) **SUCCESS, both jobs**:
- Existing public-catalogue Gap Finder tests PASS.
- Existing private versioned Hypothesis Lab model tests PASS.
- New `scripts/test_r3_gap_bridge.cjs` PASS: 3 source-linked incidents, 12 prompts, only user-accepted notes, intact earlier version/revisions, no cross-case/workspace mixing, no dangerous HTTP/private URL candidates and no fabricated evidence claims.
- `scripts/test_r3_hypothesis_ui_chromium.cjs` PASS on 393px and 1280px Chromium, including the original encrypted backup, tampered backup/recovery, wrong passphrase, premium nav and branded dialogs, new public-case dropdown, source-linked Gaps tab, explicit question saving, optional hypothesis link, encrypted refresh/unlock of those questions, single-vault lock guard, no horizontal overflow, and **zero external requests**.
- The exact no-deploy workflow produced artifact ID **`14137708452`**, name `disclosure-desk-r3-hypothesis-lab-offline-prototype`, GitHub download `https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43655344183/artifacts/14137708452` (expiry **28 November 2026** per GitHub). Downloaded as `/mnt/data/R3_Research_Gaps_Android.zip` in this conversation and independently verified with `unzip -t`: **17 entries**, SHA-256 **`142ea82621d6cccf4edb138cef075db126f6a6e732e4a21d88125a6a3ac3de66`**. `BUILD_INFO.txt` and page UI stamp both show **`c547f0553876`**. ZIP includes engine/bridge JS, standalone HTML/CSS, testing guide and six fictional comparison/confirmation/gaps screenshots.

### Account-security follow-on — design only

`docs/R3_PRIVATE_ACCOUNT_BOUNDARY_DESIGN_2026-11-14.md` outlines verified user identity, owner-only RLS read/write/delete checks, client-encrypted data and minimal metadata, no direct public research permissions, publication as a reviewed separate operation, stale-device conflict rejection, and two-user cross-account negative QA. **No authenticated R3 notebook service has been implemented**. Existing website Boards reference a separate Supabase project, but its exact account code, policy and schema need independent inspection before any migration. No Supabase migration, login changes, private cloud saves, production access-policy changes or real account browsing occurred.

### Outstanding release gates

Owner real Samsung testing of the new **source-linked Gaps tab** is **pending**; prior “Perfect” covered the preceding ZIP/folder-launch milestone, not the current gap integration. Offline local encryption remains **unaudited** and supports one notebook per Chrome profile and localhost origin; Incognito is temporary. Do not enter sensitive research. Secure authenticated workspace isolation requires separate real implementation, source/privacy review, staged two-account permissions tests, iPhone/Android acceptance and owner-approved production release.

**Live site:** R2 remains published at `8af0a5a`. No R3 or R4 production merge, Netlify deploy/credit use, Android APK release, real-user data action, or AdSense action.
