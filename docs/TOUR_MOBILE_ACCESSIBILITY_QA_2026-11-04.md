# Disclosure Desk — Guided Tour & Mobile Navigation QA (4 November 2026)

**State:** CODE STAGED for 11-tab website batch. GitHub-only VM/static tests added. **Not** browser/Samsung tested or published.

## Findings and targeted fixes

The current full tour contains 10 "Getting Started" steps and focused tours with 7 investigation, 4 community, 4 Research Studio and 5 safety steps — **30 total**. All 30 target selectors exist in current source. It originally used non-modal HTML `dialog.show()` and automatically sent visitors to Explore when closed, regardless of the starting page. The first-visit welcome banner visually impersonated a modal using a `div role=dialog` but did not trap keyboard focus or provide Escape semantics.

The development fix retains all original tour copy and 11-tab navigation, but uses the native `showModal()` dialog for both the tour and first-visit welcome, adds heading/description semantics and step-title focus, restores the originating tab and prior focus after Close **or Escape**, and makes Escape dismiss the welcome with the existing local "dismissed" preference. The tour buttons have 44px minimum hit targets; the tour becomes vertically scrollable within a phone-sized viewport and the bottom dock's selected tab stays scrolled into view. `aria-current="page"` follows the selected of 11 nav buttons, including Explore subpages.

The source also avoids reopening the welcome prompt over another open dialog. Existing W.NE research workspace save guards and all auth/cloud logic remain unchanged, as do original LIVE, witness, comment and published page content.

## Verification and remaining gates

- Static checks verify the original 11-tab order, all 30 real tour targets, modal and first-visit accessibility contracts, bottom-nav semantics.
- A network-free Node VM test executes the **actual tour functions extracted from `index.html`**, confirming tour starts from Videos, closes back to Videos with focus restoration, opens from Profile and native Escape restores Profile.
- Before release, visually inspect an Android/Samsung Internet screen and Chrome/mobile browser at narrow viewport and landscape, focus trapping, Android Back/Escape, safe-area bottom controls, reduced-motion behaviour, Voice Assistant/TalkBack announcements, and both complete/focused tour content. Verify private W.NE documents are not interrupted and all 11 tabs remain accessible by swipe or keyboard.
- GitHub-only tests cannot prove browser positioning, actual focus order, or zero horizontal overflow. Final one-batch preview requires owner's deliberate approval. The live site's tour and menu are unchanged.

**Safety:** no live backend SQL, public witness records, Netlify deployment, production merge, Play release, original W.NE, Cinema or paused Finance edits.

## CI verification after integration — 4 November 2026

The actual-source tour test and legacy guided-tour checks passed **GitHub-only Actions [41809892108](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41809892108)** at test-fix commit `4aba1a7da3ec12a740faae3b048a46e4eb468624`. Earlier run 41809773679 failed solely because an old test asserted the previous non-modal welcome guard. It was updated, and the full no-deploy staging suite passed. This proves code/synthetic runtime behavior, **not actual Samsung visual QA, landscape safe areas, Android Back, TalkBack, or real browser focus order**. Original production website and Netlify remain unchanged.
