# Disclosure Desk — Milestone 28 full website audit
8 November 2026 · Development branch ONLY · No live accounts, deployment or external network calls

## Verified breadth
This milestone supplements, rather than repeats, the existing Research, Chat, Community, Privacy and basic site-browser suites.

- 39 tab journeys: 13 destinations (11 main dock tabs, dynamically inserted Chat, Explore-linked Discussions) at 393px portrait, 852px landscape and 1280px desktop.
- 42 route loads: 14 distinct public/Research paths at each of the same three sizes.
- 16 additional direct real-Chromium action checks: News Top 100 / Read / Latest / Full Archive transitions, Archive Case Files ↔ Satellite mode, Videos Browse and Swipe mode selection, at mobile and desktop widths.
- 176 literal static published links across 14 packaged HTML pages inspected; zero missing static published targets after removing JavaScript-generated HTML false positives. Bundle includes 72 checked static HTML/JSON dependencies.
- All visible navigation tabs successfully selected their section; no visible unnamed action buttons or broken aria-controls targets in the guest surfaces scanned; no horizontal overflow remaining after one mobile fix.
- The 112-check existing geometry/link suite remains green.

## Page-by-page matrix
| Area | Audited in isolated Chromium | Boundary |
|---|---|---|
| News | Tab, view switching, Top 100, Read, Latest, Full Archive, existing ticker | Live publisher articles and feeds blocked |
| Archive | Case Files and Satellite research tab visibility, aria-selected | Remote imagery and actual satellite results not tested |
| W.NE Research | Guest entry and guarded private-route handoff | Signed-in editor/import/recovery untested here |
| Map | Navigation, responsive shell, controls and labels | Remote geocoding and external map tiles blocked |
| Videos | Tab, Browse focus, Swipe handler | Actual external playback not tested |
| LIVE | Navigation and responsive shell | Live recordings and private chat untested |
| Boards | Guest shell and navigation | Signed-in Boards, cloud backup not tested |
| Witness | Public reporting shell, controls and labels | Submissions and moderation need signed-in QA |
| Watch & Read | Public tab and visible controls | Remote media untested |
| Profile | Guest presentation and previous avatar contracts | Upload, change, delete need signed-in QA |
| Explore | Public tools, Guide/FAQ/tour; existing native tour tests | Content backed by accounts not exercised |
| Chat | Dynamically inserted tab and visible public shell | Actual requests, send/read require two owned accounts |
| Discussions | Explore-linked deep link and page visibility | Posts/replies/reports require owned accounts |
| Guide, Sources, Rules, Privacy | Real page loads and geometry, local link scan | External publisher destinations untested |
| Research landing and guest preview | Static entry, responsive common dock | Authenticated cloud work not tested |
| Research Import, Bible, Workspace, Writer | All four direct routes correctly redirect guests to Research entry | 12 redirected loads are NOT functional tests of private tools |
| Restore Copy and Restore Library | Static guest-available pages and mobile geometry | Live restoration requires signed-in, owner-controlled test |

## Confirmed fixed issues
**M28-01 — MEDIUM, fixed: Research Restore a Copy overflow at 393px.**
The first audit measured 416px scroll width in a 393px viewport on /research/restore-copy.html. Updated main and section box sizing, responsive JSON picker width, long-text wrapping, compact phone padding and heading. Subsequent 39-tab/42-page audit reported no remaining overflow.

**M28-02 — QA HARNESS, fixed: false broken-link results.**
A dormant static audit mistook link-like strings assembled inside inline scripts for literal HTML anchors, generating 17 false errors. It now excludes script and style contents, has become a no-deploy CI gate, and finds no missing literal published targets.

## Outstanding watchlist
**M28-W01 — LOW: Hidden Writer-only Reader and Remote links.** The Research Edition source still retains two hidden legacy anchors to /reader and /remote. CSS explicitly hides them; they are not functional public release routes. Their presence is tracked as audit warnings and should be cleaned only with careful Writer regression tests.

**M28-W02 — NEEDS SIGNED-IN CHECK: Legacy /home links in Research Writer.** Multiple imported Writer anchors target /home, which is not part of the allowlisted static release. The static link audit now warns rather than treating virtual routes as verified. Confirm which, if any, are visible after sign-in, and replace with a valid Cloud Library/backup workflow that verifies saving before navigating away. Do not risk losing unsaved research by blindly changing a link.

**M28-W03 — HIGH: Private workflows not end-to-end verified in this audit.** Guest Research Import, Bible, Workspace and Writer paths redirect to /research/index.html as designed; this does not validate private DOCX import, recovery, emergency copy, cloud sync, avatars, Chat, Discussions submissions, witness reporting or self-service deletion. Older mock and code-level tests remain green, but live signed-in acceptance remains pending.

**M28-W04 — External providers deliberately offline.** Videos, satellite frames, remote maps, article origins, connected backups and Google AdSense were not tested over the network. Do not extrapolate offline UI success to external provider availability.

**M28-W05 — Delete-account security is separate.** Profile self-delete remains a support request. The M26 write-fence and deletion SQL drafts are unapplied, and any Boydamo test deletion still requires a fresh verified encrypted backup, actual disposable restore and protected independent users. Do not use the unfamiliar Yandex visitor as a fixture.

## CI evidence and files
- scripts/audit_full_site_chromium_20261108.cjs: 39 tab journeys, 42 page route loads at three viewport sizes and explicit Auth redirects.
- scripts/test_m28_public_workflows_chromium_20261108.cjs: 16 new real-browser click assertions at phone and desktop widths.
- scripts/audit_public_pages_20261108.cjs: packaged HTML link audit, repaired false-positive parser, warns on legacy virtual links.
- research/restore-copy.html: responsive mobile fix.
- .github/workflows/research-resume-check.yml: all new audits run in the original no-deploy verification pipeline without dropping prior tests.
- Green source run: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42536390259 ; all three jobs successful, including all 16 direct click tests. Later documentation-only commits must get their own final CI result.

No changes to live Supabase, users, administrator, visitor account, Forum sections, production branch, or Netlify site. No Netlify build credits spent.

Next: safe authenticated owner-account testing (especially the legacy W.NE /home links and file recovery) and the still-separate security gates before any destructive account-deletion test. Bundle M27 comment polish and M28 Restore Copy fix in ONE later owner-approved live release.
