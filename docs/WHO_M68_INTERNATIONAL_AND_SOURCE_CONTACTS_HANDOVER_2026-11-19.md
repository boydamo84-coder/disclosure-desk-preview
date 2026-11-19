# M68 — International UAP Programme and Public Enquiry Directory Inside Who's Who
Date: 19 November 2026 (Europe/London)
Branch: `prep/who-m68-world-programme-directory-20261119`
Status: **STAGED / NO DEPLOY / NO DATABASE CHANGE**

## User request and scope
Reuse (do not recreate) the already researched M58 worldwide UAP programme register inside Who's Who, including the full Vatican Observatory / Apostolic Archive original-source research and alleged 1933 Italy/Grusch comparison. Also make our Pentagon, Brazil, Germany, Canada and NARA request/response status directly visible. Keep Who evidence voting closed.

## Implementation
- Who's Who now adds an independently labelled **Agencies, UAP programmes & original archives worldwide** area inside the people-directory view, not as false individual human profiles. Reader opens it on demand; 23 records from the existing canonical `data/programmes-places-m58.json` across 18 jurisdictions, 14 additional explicitly unverified country leads. It distinguishes dedicated active offices, historic investigation programmes, reporting processes, declassified archives, government case records and institutional research.
- Original-source links, source scope notes, cases and associated individual public profiles are accessible. No institution/individual ratings. A prominent Vatican quick link opens full Vatican research, original Observatory/Apostolic Archive sources, attributed Grusch allegation, published archival response, cautious status and public comparison; never calls the Vatican a confirmed UAP investigation bureau.
- Another read-only component lists five already recorded enquiries from **`data/public-source-verification.json`** rather than a duplicate status file: Pentagon/WHS 151-page Navy referral response without resolution; Germany GEP permission refusal; Brazil Arquivo Nacional SIAN citation guidance; Canadian limited file-specific copyright permission with web format unresolved; NARA MJ-12 enquiry sent, agency acknowledgement not verified.
- Direct links to the full canonical Sources tracker use `/sources#dd-enquiry-{id}`; source cards now have those stable anchors. No live inbox integration, private messages or fabricated source dates.
- Added `assets/who-world-programmes-m68.js`, `.css`, `assets/who-source-status-m68.js`. Updated `who-is-who.html`, `assets/source-verification.js` and the explicit `scripts/build_public_release.cjs` allowlist. Increased the strict public package count cap only to permit these three reviewed files; source and private-file leakage tests remain.
- This branch inherits M67 closed five-criterion voting `whoEvidenceBallots:false` and empty approvals registry. No Who member ballots, production Supabase migration or real votes. GA4 retired code and site ad-release lock unchanged. No changes to W.NE or the Android APK.

## Verification and remaining checks
- Source contract `scripts/test_who_m68_programmes_contract.cjs` verifies 23 sourced entries, 18 jurisdictions, 14 verification leads, Vatican's 1933/denial nuance, 5 genuine canonical correspondence statuses and disabled voting.
- Chromium `scripts/test_who_m68_programmes_chromium.cjs` runs on Who and Sources with all third-party code blocked across 320/393/820/1280 widths, asserts Vatican search/comparison, Brazil filter, 23 cards, 14 leads, five public enquiries and deep links, 14-tab navigation and zero horizontal overflow.
- GitHub Actions no-deploy workflow `.github/workflows/who-m68-international-and-sources-no-deploy.yml` run 44433538465 **passed both static/immutable package and real Chromium jobs** at commit `8573ab6b9f871373d81c95ea04fd7d4f0f7486b8`.
- This handover document does not alter website behavior; verify exact HEAD CI before any controlled release.
- All original-source research is a snapshot, not a claim of real-time programme status. If source statuses change after dated correspondence or agencies update positions, modify the canonical dataset with a verification date and clear source attribution. No publication of private emails.
- **No Netlify build, production ref change, Supabase writes, new tabs or APK**. Future release requires owner's explicit approval of a consolidated release with preservation of premium navigation and staging smoke.

## Separate active email issue
Adsterra publisher support request was originally sent from connected `boyddigitalstudios@gmail.com`. Owner wants resend from the registered `boydamo84@gmail.com`; connected Gmail profile still points to Boyd Digital Studios so **no resend was made**. Reconnect/select registered Google account in ChatGPT before attempting again. Adsterra scripts remain RELEASE_ENABLED=false.
