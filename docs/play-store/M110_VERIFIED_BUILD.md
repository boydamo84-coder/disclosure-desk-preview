# M110 verified Android build — 28 November 2026

- Executable commit: 56b4de00ef23b680668f75d9470fafecd89e5774
- Branch: android/m110-shared-navigation
- Successful CI run: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/46102978045
- Version 0.16.12-preview, versionCode 46; private package .beta.m110; production bundle unsigned.
- Feedback: M109 device recording showed W.NE → standalone Who's Who → Desk reload and duplicated header/blank moment. Hypothesis Lab screenshot showed obsolete wrapping glyph menu.
- Hosted Lab now uses shared SVG five primary destinations plus More, no visible internal build stamp, Research selected, safe navigation confirmation for unsaved/session-only notebooks, guarded system Back. Offline isolated prototype source remains distinct. No change to encrypted storage or account boundaries.
- W.NE and public secondary-page docks use shared Android directory routing. After returning from W.NE one Desk document load is still required, but Who's Who and Research then share the retained Desk. Early Android route CSS shows the selected static page rather than hiding the complete shell during initialization.
- M109 directory filter capture hardened at profile open; embedded child popstate isolated. Regression now waits for dialog closure and actual active filter before opening a profile. Prior runs 46102412626, 46102614999 and 46102805869 caught fixture and startup timing issues; final run passed all tests.
- Verified browser layouts 320/393/768px for Lab, More/Back, session-only cancellation, W.NE failed-save protection, direct directory return without standalone page request, retained directory, plus all existing news, archive, case, discovery, tour, W.NE and SEO regressions. Source tests for R3 hypothesis/gap engines, cloud owner identity and uncertain writes also passed locally.
- Artifact ZIP hashes matched GitHub. All 161 staged site files and native navigation scripts matched in all three packages. Release format and native library alignment passed.

| File | SHA256 |
|---|---|
| DisclosureDesk-M110-private-beta.apk | d9724bc2b6699a6c123fbb3ee35340b0eff1fb11be532c051ca0847206c1ca57 |
| DisclosureDesk-M110-release-UNSIGNED.apk | 3a0ed493fe725754fc25f01df3f39c12316023a5e67e57898ca548b0fd4ba4e1 |
| DisclosureDesk-M110-UNSIGNED.aab | 1c8ec4d7366bc4f079aca9da26e1281b5aae764033558c18f67ffa4cec178fbf |

No Netlify deployment or Play upload. Physical device retest remains necessary for actual frame transitions, keyboard interactions and speed. The unsigned bundle needs release signing and remaining Play acceptance; offline W.NE, continued offline news and gated community publishing are not completed by this navigation change.
