# Disclosure Desk — Boyd Digital Studios official-domain link milestone
Date: 19 November 2026 (Europe/London)
Status: EXACT-HEAD NO-DEPLOY CI GREEN — NOT PROMOTED, NOT PUBLISHED

## Scope
- Branch: `prep/bds-official-domain-link-nov19`, based on the actual `production` branch, not old `main` or stale release branches.
- Add a clear, clickable `https://boyddigitalstudios.com/` in the existing Explore → About the Studio card and in the main site's Boyd Digital Studios footer credit.
- Preserve exact Disclosure Desk home origin `https://uapdisclosuredesk.com/`, support address `support@uapdisclosuredesk.com`, Ko-fi link, sign-in, W.NE, source citations, Google Drive and navigation.
- No `wixsite.com` string was found in the checked current home page; this is an official-link addition and not an unsafe blanket search-and-replace.
- Footer gold styling adjusted only for the new official hyperlink; no navigation redesign.

## QA and release gates
- Added `scripts/test_bds_official_link.cjs` (two official links, old Wix absent, preserved Disclosure Desk URLs) and `.github/workflows/bds-official-domain-no-deploy.yml` running that contract on staging pushes. GitHub Actions uses no Netlify release or credits.
- Inspect exact-head workflow outcome; test real mobile/desktop browser external hyperlink and return/back flow before the next approved site deployment.
- Verify `https://boyddigitalstudios.com/` loads the intended Boyd Digital Studios site in the owner's browser; the external site's live HTTP status is not yet independently verified.
- Merge/promote the isolated link change into the next curated approved release. Do NOT fast-forward `production`, trigger Netlify or re-enable advertising as part of this staging milestone.
- The dormant Adsterra vendor script remains disabled, and Community Research, Who voting and Android APK release have separate gates.
- Android beta companion: `android/m96m-bds-official-link-nov19`. An independent native Desk menu link and the Android web snapshot are staged there, not released.

## Device acceptance reported by owner
- On 19 November 2026 the owner confirmed on their Galaxy that M96L Profile login stays on Profile and works.
- The owner also confirmed the M96K Chat/Gboard latest-message keyboard fix works.
- These two specific user-accepted behaviours are **PASS**. Do not infer account-swap, background push, password recovery or every other Android scenario passed.

## Next handover
Run exact-head no-deploy workflow, then preserve this official domain addition for the next approved website release. No production or APK publish has been requested for this isolated change.

## 19 Nov 2026 QA checkpoint
- [Website exact-head GitHub Actions run 44459470448](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44459470448) passed on `57cedffc3c56aa5b5dbb314841ccc90bf312365a` (both official links, previous Wix host absent in inspected HTML, Disclosure Desk origin and support unchanged).
- Android M96M separate private APK built green on `da8cdf51d4a6a180bac92bceafde77719a0d297c`: [full Android build 44472987172](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44472987172). This is NOT a website deployment.
- Independent browser/network attempts to the new `https://boyddigitalstudios.com/` failed from the current research runtime; cannot claim the external destination is publicly working. Ask site owner to verify on their device before approving a live link change.
- Scope remains exactly the 5 files in the domain-link website branch; no M69 auth/voting/site-ad branches were merged and `production` was not changed.

## 19 Nov 2026 — owner accepted studio link on phone
Following the M96M beta installation and quick test, the owner confirmed "All working ok" on their Galaxy. The requested checks included the native Desk website link, About/footer studio links and returning to the app. Therefore the studio destination and new APK navigation are **owner-accepted on device**. Browser/Netlify production publishing is still separate; not claim a production deployment from this test.
The original website link-only exact-head CI remains green. Integrate this small delta into the next curated, user-approved website release, not by blindly merging the unrelated closed voting or advertising prototypes.
