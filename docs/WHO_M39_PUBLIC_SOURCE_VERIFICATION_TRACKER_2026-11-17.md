# M39 — Public Source Verification Tracker (candidate, no deployment)

**Date:** 17 November 2026 (Europe/London)  
**Branch:** `prep/who-m39-source-verification-tracker-20261117`  
**Purpose:** Make Disclosure Desk's original-source research transparent without overstating email delivery, FOIA status, source authenticity, object identity or evidence ratings.

## Why this differs from merely claiming credibility

A credible research status must publish a **specific factual question**, **original evidence** that motivates it, **dated human-checked steps**, and the **missing evidence needed to resolve the question**. We must be transparent about non-replies as well as replies, distinguish first-party government documents from third-party mirrors, and say precisely what a received answer would prove.

M39 adds a **Source Verification Tracker directly to the existing [Sources & Archives page](/sources#sourceVerification)** and a small link/callout on **Who's Who**. It deliberately does **not** add a new overcrowded dock tab. The premium existing navy/gold design and Who's Who 14-tab mobile navigation are preserved. The tracker displays two individual records; every status is marked **as of 17 November 2026**.

### Record 1 — Office of the Secretary of Defense (OSD)

- **Question:** Did OSD assign a public tracking reference or issue a disposition for **seven documents, 151 pages**, referred from Navy `DON-NAVY-2020-007231` in the government's 8 July 2025 letter?
- **Source:** [Navy FOIA letter, official authorship but a third-party hosted copy](https://documents2.theblackvault.com/documents/navy/2020-007231.pdf).
- **Scope limit:** OSD `19-F-1420` and `20-F-1095` are **different FOIA matters**. A matching media page-count shorthand or an attached email is NOT sufficient to prove referral closure. Current disposition remains unverified.
- **Enquiry:** Sent on **17 November 2026** using the connected Gmail account to the referral-specific address printed by the Navy, copying the current OSD/JS FOIA service desk. The sending service confirmed the outgoing message. **Actual destination delivery, OSD acknowledgement, an OSD case ID or an OSD response have not been confirmed.** Neither this entry nor the tracker claims a new formal FOIA request was accepted.
- **Next proof:** a verifiable agency acknowledgement, tracking number, decision or official released document matching **that specific seven-document referral**.

### Record 2 — National Archives (NARA)

- **Question:** Can NARA authenticate the **9 May 1988 revised** Reference Report on MJ-12 attributed to Jo Ann Williamson, with item 9 changing a civil-defence folder date **1954 → 1956**?
- **Sources:** [current NARA webpage](https://www.archives.gov/research/military/air-force/ufos), [official Reagan Presidential Library 1987 reproduction](https://reaganlibrary.archives.gov/public/2021-06/40-654-209237726-004-008-2021.pdf), and [third-party historic 1988 scan](https://projectaquarius.mufon.com/wp-content/uploads/pcg-bill-moore-files-collection/ARCHIVES-NATL.pdf). The May 1988 scan was visually inspected in M36 but is **not** yet a direct NARA-certified reproduction.
- **Enquiry:** Sent on **17 November 2026** to NARA Textual Reference from the connected Gmail account. The sending service accepted the message. **Delivery, agency acknowledgement and authentication have not been verified**. No scan or paid service has been ordered.
- **Next proof:** original agency-supplied index, certified scan or reply confirming which revision was officially issued.
- **Case boundary:** even confirmation of the original reference report does **not** authenticate any alleged extraterrestrial MJ-12 programme.

## Trust and security model

- Public JSON `data/public-source-verification.json` is **manually maintained** and shows `lastUpdated` and `lastVerified` dates. It is **not a live FOIA portal, automated Gmail monitor, RSS proxy or proof of delivery**.
- Client-only `assets/source-verification.js` fetches that JSON without credentials, builds cards with **`textContent` (never `innerHTML`)**, rejects unexpected status values and dates, and only links to a narrow HTTPS domain allowlist. Sources open in new tabs with `rel="noopener noreferrer"`.
- The page includes **two individual event timelines** with expandable links and caveats, fallback text if JS is disabled, and a **fail-closed state** if the status JSON cannot be fetched. It never silently substitutes an assumed "pending" or "completed" status.
- The public JSON **contains no sender address, recipients' private details, Gmail message IDs, thread IDs, credentials, response bodies or internal research drafts**. Only government agency names, public source URLs, question summaries and dates.
- All enquiries include "**I do not authorise chargeable work without prior written agreement**"; the tracker says **no fees authorised**. Sending an ordinary email is not a guarantee an agency will not suggest a paid service. The user must approve any paid work separately.
- The tracker **does not assign a human honesty/believability rating, a claim evidence percentage, an agency-endorsement label or a document authenticity verdict**. No independent human editorial signoff has been invented.
- **Stage only:** modifying `scripts/build_public_release.cjs` explicitly allows the **new public-status JSON and renderer** into the candidate package, while M31–M38 internal research JSON/docs, SQL, test accounts and unpublished verdicts remain blocked. **No new Netlify deployment or `production` branch modification.**

## Files and QA

| File | Purpose |
| --- | --- |
| `data/public-source-verification.json` | Two separate status entries, dated email-send records, source types, restrictions and links |
| `assets/source-verification.js` | Safe mobile-friendly accessible card/timeline rendering, error/invalid-state handling |
| `sources.html` | Premium navy/gold inline status section on the existing Sources page |
| `who-is-who.html` | Brief link above directory to public dated tracker, no score/vote changes |
| `scripts/build_public_release.cjs` | Explicit allowlist for exactly two new public asset files |
| `scripts/test_who_m39_source_tracker_contract.cjs` | Source timestamps, safe statuses, no private messages/fees/scores, source-to-page and release boundary |
| `scripts/test_who_m39_source_tracker_chromium.cjs` | Real Chrome at 320/393/820/1280px, full source links and timelines, Who link/nav, no-fabricated-response when JSON fails |
| `.github/workflows/who-m39-source-verification-no-deploy.yml` | Inherited M26–M38 checks and no-deploy package + Chromium M39 tests |

## Publishing and maintenance

**Candidate only:** No live site change has been made. The final rendered tracker needs a reviewed, approved significant release/Netlify deployment. An on-site "Enquiry sent" message should always include the last manual verification date to avoid being mistaken for a real-time government case status. After an agency replies, confirm its actual origin and scope, compare with public sources and update this log; do not copy private correspondence or release a full government email without reviewing consent and privacy.

When there is an actual answer, distinguish **agency acknowledgement**, **status provided**, **partial disclosure**, **no records found**, **redactions**, and **source/case authenticity not established**. None of those imply extraordinary physical claims or personal believability.

**M40 next:** Keep working on the 23 unsigned claim evidence dossiers and reader safeguards independently; prepare a careful source-first editorial method for the two policy-only entries that cannot be meaningfully graded as incident evidence. If/when the user approves the public tracker release, test the deployed page and update the pinned research news item with a plain-language introduction and source transparency link, without asserting that NARA or the Pentagon have answered.
