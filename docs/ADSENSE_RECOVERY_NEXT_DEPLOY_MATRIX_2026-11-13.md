# Disclosure Desk — next consolidated website release inclusion matrix
Prepared: 13 November 2026 · Owner intent: combine approved pending site changes and AdSense recovery into one Netlify deployment
Current status: **SOURCE ONLY; NOT DEPLOYED; NOT ADSENSE-RESUBMITTED**

## Scope rules
- Do not overwrite the current live site, production branch or Android APK with older files.
- Determine actual integrated website head and all newer approved changes immediately before release.
- Confirm what is included from each pending website branch and check user-facing differences, not merely commit history.
- Avoid Netlify preview builds; run source/static and disposable-account browser checks before the final owner-approved publish.
- Do not publish user research, private Boards, chat, witness precision or W.NE documents.

## Feature inclusion and verification ledger
| Workstream | Related pending branch/milestone | Release requirement | Current state |
| --- | --- | --- | --- |
| AdSense source-first editorial research | audit/adsense-low-value-recovery-nov13 | Research page /investigations, homepage/about/footer links, sitemap, strict allowlist and indexing/HTML contracts | Staged on recovery branch; 11 static source checks passed; editorial sign-off and browser acceptance pending |
| AdSense original case studies | Roadmap public cases, Phase A/D | Validate archival citations, publish document-level analyses and related-case methods without overclaiming | Three research briefs drafted on one page; dedicated case URLs, case links, fact review and depth assessment pending |
| Evidence completeness methodology | Research Phase D | Provenance, chronology, alternate explanations and missing evidence, clearly distinct from strangeness | Editorial methodology on /investigations staged; interactive per-case checklist not implemented |
| Case Intelligence | Research Phase A | Read-only source, timeline, nearby/relevant reports, verified vs suggested connections | Editorial foundation staged only; archive-level investigation controls pending |
| Opt-in public publishing | Research Phase E | User consent, redaction, review, revisions and no private-data leakage | **Deferred** until separately verified |
| News duplicate reduction | fix/m59, fix/m60 and newer approved work | Do not regress event-cluster dedupe, source links or live News usability | Reconcile latest version, tests pending |
| News/community replies and action rails | fix/m70–m80, fix/m86–m88 | Apply comments on demand, indent replies, compact cards and moderated owner actions across pages | Reconcile latest integrated branch; tests pending |
| Discussion feed and sections | fix/m89, fix/m90 | Popular/New/Top feed, tabbed Feed/Sections and favourite categories | Reconcile latest integrated branch; tests pending |
| Archive Android back behaviour | fix/m91 | Verify case back navigation on Android browser | Reconcile and test, pending |
| Favicon legacy fallback | fix/m96 | Preserve branded SVG and exact legacy icon fallback | Included in recovery branch base, release merge verification pending |
| W.NE Research Studio and Drive | M41–M45 and latest fixes | Preserve existing editor, safe document imports and backups; real OAuth and device QA must not be assumed complete | Regression/security/real account gates remain |
| AdSense trust and site integrity | Research recovery + existing compliance | Validate About/Privacy/Terms/Sources, attribution, corrections, mobile navigation, 404, ads.txt, crawlability | New corrections text staged; complete live audit pending |

## AdSense go/no-go
1. Editorial owner approves accuracy and substance of each first research brief. Do not claim human review before that.
2. Public source and website build tests pass on exact merged HEAD; use no-deploy CI, browser and phone checks.
3. Confirm public pages accessible without login and navigation works on mobile; check no thin/empty route remains.
4. Confirm analytics consent and private-research noindex/RLS are unchanged; verify real ads.txt route.
5. Publish one owner-approved Netlify production release and confirm the deployed SHA and public page contents.
6. Only after live verification consider ticking the account-specific AdSense correction confirmation and requesting another review. This is not guaranteed to pass.

## Separation: NOT silently included
- Phase B aviation/astronomy feeds, Phase C witness matching, full Phase E publication backend, pinned desktop Chat/Boards panel, automated social-platform publication and standalone Android APK changes are separate follow-up roadmap items, not required for AdSense recovery.

## Status at milestone
- Recovery branch already exists and only contains development source commits.
- No production deployment or AdSense review performed.
- 11 source-level checks passed (link targets, route metadata, branch packaging references, analytics consent module, markup balance); exact-head Node/Chromium CI and real live tests **not run yet**.
