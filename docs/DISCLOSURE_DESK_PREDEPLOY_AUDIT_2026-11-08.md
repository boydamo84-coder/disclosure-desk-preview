# Disclosure Desk — pre-deployment website audit, 8 November 2026

**Scope:** Current `fix/compact-writing-popover-mobile-desktop-nov08` source branch. **NO Netlify build/deploy; LIVE SITE NOT UPDATED.** Owner stated only 198 Netlify credits remain until 29 November. The audit and changes are deliberately bundled for a later single deployment.

## Verified fixes staged for the next release

1. **Research Studio mobile screen space:** the always-visible grammar review strip was eating manuscript space on Samsung. Moved Previous/Next to compact `‹ / ›` controls **inside the suggestion popup on mobile and desktop**. Writing settings still fold away. Replacements remain explicit, Undo/autosave unaffected. Real Chromium: 18 checks at 393px, 852px landscape and 1280px desktop.
2. **Google Analytics 4**: confirmed existing property `G-ZWJQMK8JSW`; previously absent from published source. Added `assets/analytics-consent.js` only to public informational pages and the public root. No Google request or tag before explicit Allow; No thanks available; persistent browser choice; change preference in Privacy page. Only allowlisted public page names are counted, without URLs' query parameters, account data, document titles, private Chat content or report text. GA4 consent is separate from advertising consent; `privacy.html` updated. Chromium synthetic consent test: 12 checks, Google endpoint mocked and never accessed.
3. **Real bug caught by broad homepage smoke:** initial fixed consent banner intercepted the News ticker's Hide button on mobile. Reworked consent panel into **normal document flow above the header** so it cannot block the ticker, dock or navigation buttons. The full site browser smoke confirmed the corrected position.
4. **QA test reliability:** real profile photos auto-upload; the old browser smoke clicked Remove before automatic upload completed. Added wait for visible/enabled Remove control rather than change the production feature.

## Page audit (local Chromium only)

| Screen | Portrait 393px | Landscape 852px | Desktop 1280px | Scope |
|---|---|---|---|---|
| Home / News (`/index.html`) | checked | checked | checked | Visible anchors, layout |
| Guide and FAQ (`/guide.html`) | checked | checked | checked | Links, layout, heading/alt notes |
| External sources (`/sources.html`) | checked | checked | checked | Links, layout |
| Community rules (`/community-rules.html`) | checked | checked | checked | Links and in-page anchors |
| Privacy (`/privacy.html`) | checked | checked | checked | Consent text, link/anchor, layout |
| Research edition landing (`/research-edition.html`) | checked | checked | checked | Entry links, layout |
| Research guest preview | checked | checked | checked | Basic entry/navigation |
| Research entry `/research/index.html` | checked | checked | checked | Public guest/auth-gate shell only |
| Research Library `/research/research-bible.html` | checked | checked | checked | Guest shell only; signed-in functions separately tested offline |

- The page audit checks each document's title, horizontal overflow tolerance, rendered links, local targets and static anchors, blank link safeguards and nonempty link labels. Latest homepage-inclusive audit: **112 geometry/link checks, zero warnings**. These are **local-file/DOM validations**; they cannot establish that every third-party source website currently responds or that every button is correct.
- Existing full homepage Chrome smoke checks ticker and hide/off, 12-tab mobile navigation, onboarding tour and Escape, Chat/Discussions deep links, avatar guest state and auto-save, and W.NE navigation with synthetic save/unconfirmed-save responses. These are browser checks with local fake account data, **not** production authenticated journeys.
- Existing Research suite also tests save/reopen and version safety via fakes, DOCX source pathways, ZIP restore-as-new, document sanitisation, 16 editor Chromium checks, 18 Research Library Chromium checks, and the new compact spelling QA.

## Still required BEFORE the one deployment

1. **Complete signed-in functional audit:** Profile/account deletion flow, account privacy/public username settings, Chat invitations/messages, Discussions create/edit/report/moderation, source submission, site admin views, and actual secure report save/reopen. The current site has an email link for account-deletion requests; that is not a verified in-site deletion implementation. Do not implement a privileged user deletion without full per-owner authorization and tests.
2. **External availability/content audit:** Official/source outbound links (USGS/NASA/EUMETSAT and community references) can change independently; automated local tests don't establish their current availability. Check the actual source paths and dates before final release.
3. **Real-device acceptance:** Samsung S24 Ultra Chrome and iPhone Safari, keyboard interactions with formatting, long scrolling and preference changes, physical DOCX/PDF previews, device Boards backup, ZIP restore, logout/login and cross-account RLS. Do not use valuable documents.
4. **Privacy and consent review:** Check UK/EU requirements for Analytics and advertising independently, account data deletion wording, consent revocation and live AdSense settings. GA4 does not collect private content in our instrumented page events; broader third-party embeds may have separate cookies.
5. **No Netlify preview or deploy until owner agrees the batch is complete.** Keep the `production` and `main` branches unchanged. GitHub no-deploy CI can run without a Netlify publish.

## Current release policy

Use **one** production Netlify deployment when all agreed fixes have passed source/browser tests and owner approves. A green GitHub check is **not** the same as physical Samsung acceptance or a live Netlify publication. The current public site remains on the previously verified Milestone 17 deployment until then.
