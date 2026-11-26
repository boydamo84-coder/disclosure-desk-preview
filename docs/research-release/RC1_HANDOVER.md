# Research & Collaboration RC1

26 November 2026 · Owner review candidate · Website and Android

GitHub branch `feature/research-collaboration-20261126` starts from production `910d755916cdf72ea7c7df39bbf7a5c76832d649`. The production-context baseline rebuilt byte for byte against the live release manifest. The live manifest SHA-256 was `64a515c450918a6ef368b05920e2cf7664728436290282ee8ffa0bb871855768`. The M76 rollback reference is `backup/production-pre-m76-20261119`.

## Website

| Area | Candidate |
| --- | --- |
| Research & Collaborations | Guest access through Home, Explore and About. Enquiry composer opens a draft in the reader’s email app. The draft stays under the reader’s control. |
| Original Research | Existing reviews remain accessible. A new evidence review traces the Navy video decision and subsequent Pentagon referral. |
| PURSUE | 521 records, Releases 01–08. Search by identifier, title, agency and location. Filter by release or file type, follow original URLs and documented relationships, or download a browsable HTML index of the results. |
| FOIA Tracker | Dated entries for WHS administrative case 27-F-0917 and Pentagon case 25-F-3215. The existing Sources enquiry and programme digests now reflect the administrative release. |
| Investigation Boards and W.NE | Choose a Board through the existing picker, or explicitly save a citation in the current browser or Android installation’s W.NE references. |
| Drive | Load older Word copies through Drive pagination. Existing uploads still use owner-scoped, memory-only tokens and verified byte read-back. The APK offers a browser handoff for Google OAuth. |
| Android | M98 Android source plus research routes and tour, bundled offline catalogue, FOIA extracts through a read-only cache file grant and the staged Chat keyboard improvement. Version 0.16.0, build 34, separate beta application ID `com.boyddigitalstudios.disclosuredesk.beta.researchrc1`. |

The packaged WHS evidence is three image extracts. The final-decision extract preserves the relevant portion of page 1. The referral extracts preserve agency evidence from original packet pages 11 and 13. Rendering, cropping and pixel masks removed underlying requester and contact text, identities and unrelated paperwork before new PDFs were created. Text extraction, OCR and attachment/annotation checks covered the three publication pages. The 14-page administrative release itself remains distinct from the seven documents totalling 151 pages pending as of the WHS decision.

Regenerate the reviewed PURSUE data with `python scripts/build_pursue_index.py <snapshot.csv>`. It expects the [pinned catalogue capture](https://raw.githubusercontent.com/BPSAI/pursue-index/main/data/raw/csv/bae7455d6b5dff3ab84beb22607bc119db27cfb45a2746cec3c39e8a7662b247.csv) and validates its checksum. See the [ten-record comparison](PURSUE_RELEASE_04_COMPARISON.md) for file access limits.

## Issue 17 · Discussion Hosts

[The 42-prompt editorial queue](discussion-host-queue.json) spans 14 days, at 09:00, 13:30 and 19:00 UTC by default. The suggested sections match published subject keys observed through read-only inspection. The five profiles are labelled automated. Scheduled threads use no human account or votes. Replies and DMs are left to people.

The Profile owner dashboard previews and edits drafts, sets the start date and slot time, approves and cancels posts, pauses and resumes the trial, removes published posts, and shows recent actions. The staged SQL requires the existing site-owner allowlist for admin commands. Public badge lookup confirms a published system thread on the server. The worker has no Data API execute grant. A transaction lock and stable thread IDs protect publication from retries. Only an approved, timely slot can publish, with a 30-minute minimum spacing. The worker stops publishing at the end of day 14 and expires remaining drafts and approvals.

The website and APK include `discussionHosts:false`. The SQL remains a draft outside `supabase/migrations`. Its private trial defaults to disabled and paused, and the repository installs no scheduled job. No AI endpoint, model credit or external message is involved.

If separately approved, test the exact draft and the manual scheduler setup in an isolated Supabase project with genuine guest, member and owner sessions. Then choose whether to use the existing project’s available but currently uninstalled `pg_cron` extension. The proposed setup is one database job, with operator cancellation after the trial or earlier if needed. Confirm the project plan and quotas at activation. [Supabase Cron](https://supabase.com/docs/guides/cron).

## Acceptance and remaining gates

- The candidate was exercised locally with real Chromium at 320, 393, 820 and 1280 px, keyboard navigation, automated accessibility checks, research filters, offline export, Board picker, FOIA states and source links. The admin dashboard browser test uses fictional RPC data. The separate PostgreSQL test executes the draft SQL with simulated claims, including retries, owner checks, removal and expiry.
- Existing W.NE owner-verified document resume, save guards, DOCX import, ZIP recovery and manual Google backup paths were reconciled against current production. Their automated regression fixtures do not establish successful live Google account or live Supabase acceptance.
- A real Galaxy installation, TalkBack, iPhone Safari, Google consent and backup restore on a test account still need acceptance. Background Google backups and the scheduled seven-day news pack are outside this build. The candidate delivers the offline research index and the existing Android offline facilities.
- Source verification remains open for direct access to the ten files on War.gov and record-level duplicates across external archive catalogues. Discuss joint publication only after mutual agreement.
- The M71 build guard and the candidate-specific Netlify ignore rule are included. GitHub branch protection and Netlify dashboard branch and rollback controls are separate from these source checks. The protected status of the production branch still needs action under [issue 14](https://github.com/boydamo84-coder/disclosure-desk-preview/issues/14). [Issue 15](https://github.com/boydamo84-coder/disclosure-desk-preview/issues/15) retains its separate voting acceptance gate.
- Production and its rollback refs stay in place pending explicit approval. Allow only one approved production build, then verify the live manifest against the reviewed bundle. The automated Hosts activation is a separate approval.

## Nightfall homepage follow-up (owner preference)

The homepage runtime, theme controls and conditional media packaging tests are staged. Nightfall is the default once enabled; Classic, Eclipse and Orbital are selectable. Motion is paused or unloaded out of view, when the document is hidden, when data saving or reduced motion applies, or when manually paused. Preferences are local to the installation. Existing static hero remains unchanged while the media gate is false.

**Not yet release-ready:** the six binary files are supplied separately in the private owner transfer ZIP, not in GitHub. Confirm exact source/license for each, particularly Orbital (192936-893872014.mp4); Nightfall likely Pixabay 339335, Eclipse likely Pexels 5322668. Add the three compressed H.264 MP4s and three first-frame JPGs under data/home-themes/, then change only the homepage hero data-media-ready flag to true. Do not distribute the transfer ZIP publicly. Run full no-deploy package, browser and Android WebView acceptance before release. No new runtime/browser acceptance claimed yet. Existing hosts, voting, advertising and deployment restrictions remain in force.
