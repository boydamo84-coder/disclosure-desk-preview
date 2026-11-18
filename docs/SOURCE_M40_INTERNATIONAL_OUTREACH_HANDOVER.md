# Source M40 — Public Data Requests & Source Verification Register
_Date: 18 November 2026 (Europe/London) · Branch: `prep/source-m40-public-outreach-register-20261118` · STAGED, NOT DEPLOYED_

## Scope
Extends the already staged `/sources#sourceVerification` research tracker from two enquiries to five. The existing premium main/site navigation, 13-source directory, production site, production Supabase and Android APK are unchanged. No inbox polling, scraping, website deployment or public sharing of original private correspondence.

## Outgoing/source requests and what is actually known
1. **US WHS/OSD, Navy referral DON-NAVY-2020-007231** — A 17 November 2026 email enquired about the seven OSD-referred Navy documents totalling 151 pages in NAVAIR's 8 July 2025 letter. WHS FOIA analyst Bronwyn M. Burke replied 17 November 2026, confirming office receipt of the email and explaining that FOIA requires identifiable existing records, not answers to general questions. **No referral disposition, original OSD number, release, denial, or FOIA case number for a new formal request was supplied or confirmed.** The next action is the owner's submission of a distinct records-specific FOIA request through the official WHS portal, potentially following a polite email reply. No fees are authorised.
2. **Germany — GEP independent UFO research association** — Permission for commercial reuse of its UFO/UAP dataset was declined; website may link to the original Zenodo catalogue but must not bulk import/copy/map the dataset. Not a government FOIA request. By 1 November this outcome was documented; the actual correspondence send/reply timestamps must be checked before publication as exact dates.
3. **Brazil — Arquivo Nacional** — Staff directed us to SIAN, explained the OVNI fonds and attribution by archive, collection and **individual** item reference. Access/catalogue guidance is not blanket rights clearance to mirror digital files. Project status documented by 3 November; original mail timestamps must be verified separately.
4. **Canada — Library and Archives Canada (LAC)** — Copyright Services asked for item-by-item reproduction review including description, title/collection/reference ID and archive URL. A proposed 5–10-work sample permission request remains pending; no blanket reuse permission. Status documented by 4 November; original mail timestamps not re-verified.
5. **US — NARA MJ-12 revision** — Separate enquiry sent 17 November 2026 about an alleged 1988 revised reference report. The project has not confirmed any NARA reply or authenticated the disputed scan. Keep this distinct from the WHS enquiry.

## Changed files and safeguards
- `data/public-source-verification.json`: public **summaries only**; unknown original dates use `null` instead of fabricated dates; named source/rights limitation and dated last-documentation.
- `assets/source-verification.js`: allowlisted original-source hosts, acknowledgement/response statuses, explicit unknown dates; untrusted JSON rendered with DOM `textContent`, no HTML injection.
- `sources.html`: readable research register heading and disclaimer; official GEP September 2026 record/DOI `10.5281/zenodo.23117630` verified; preserve 13 curated sources.
- `who-is-who.html`: cross-link summary no longer falsely says there has been no agency reply.
- Updated isolated `scripts/test_who_m39_source_tracker_contract.cjs` and Chromium test for five records, two known/three unknown sent dates and non-inference boundaries.
- New no-deploy GitHub Action `.github/workflows/source-m40-public-outreach-no-deploy.yml` runs exact-code Node contracts and real Chrome at 320/393/820/1280 where supported. It creates only a local, allowlisted site candidate. Check the latest run's exact SHA, steps and conclusion before claiming green.

## Publishing / data integrity constraints
- **NO production publish without explicit owner approval** and a separate integration QA pass.
- No raw emails, personal correspondence headers, original requester details, message IDs, private attachments or phone numbers on the public page.
- Replies are not formal FOIA acknowledgements/decisions, source endorsement, evidence of extraordinary activity, copyright licences or blanket permission.
- Source organisation GEP must not be mislabelled as the German government.
- Revisit all international send/reply timestamps against original correspondence before adding exact dates.
- If the user's revised US FOIA request is formally filed and a trackable case ID received, add it as its own dated subsequent event — do not mark as already submitted.

## Next actions
Confirm the branch CI is green at exact head, review mobile and website link behaviour with owner, inspect original German/Brazil/Canada response headers for exact dates and any publishing restrictions, and obtain explicit approval to merge into the next significant deployment window. The site's existing broad source index and privacy/rights policy remain authoritative.
