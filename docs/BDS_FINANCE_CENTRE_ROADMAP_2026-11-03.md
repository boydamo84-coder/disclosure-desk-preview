# BDS Finance Centre — owner-only earnings and tax dashboard roadmap
**2026-11-03 — PLAN ONLY, not implemented or authorised for deployment.**
**Project:** Boyd Digital Studios, spanning Disclosure Desk, Our Cinema, W.NE and future apps. This is NOT a public Disclosure Desk page.

## Recommendation
Create a separate private, mobile-first Finance Centre with secure owner login, summary dashboard and annual/monthly ledger. A PWA can show opted-in cached offline summaries, but LIVE automatic income sync requires a connected server. Keep it completely outside public navigation and independent of public account/Board/community data. Hidden links are NOT access controls. No live configuration, data collection, accountant filing or provider connection has been created.

## Automation feasibility
- **Ko-fi:** Verified server-side payment webhook for new support payments. Validate Ko-fi's verification token; store transaction id and minimal details, dedupe replay. Webhooks do not provide a complete historic archive: allow manual past-period exports, and reconcile payout from Stripe/PayPal without counting it twice. Official: https://help.ko-fi.com/hc/en-us/articles/360004162298-Does-Ko-fi-have-an-API-or-webhook
- **Google AdSense:** Read-only OAuth2 AdSense Management API for daily estimated earnings and separate paid/unpaid settlements. Do NOT count estimated/finalised earnings PLUS payout as three separate revenues. Requires approved account, OAuth connection, clear sync status. Official: https://developers.google.com/adsense/management/getting_started and https://developers.google.com/adsense/management/reference/rest/v2/accounts.payments/list
- **Google Play:** Earnings financial report CSV (download or private Google Cloud Storage ingestion), app/product attribution, platform fees, refunds, withholding/settlement, estimated sales separately. Reports may lag; estimated sales are not final accounting. Do NOT mix buyer gross total with developer payout. Official: https://support.google.com/googleplay/android-developer/answer/2482017?hl=en-GB and https://support.google.com/googleplay/android-developer/answer/6135870?hl=en-GB
- **Future providers:** Apple App Store, Stripe, PayPal, platform advertising, other sales; prefer import fallback where a supported API cannot be accessed. Never collect payment credentials or owner bank passwords in client pages.

## Ledger and reporting
Record source, source-account ID, unique transaction reference, BDS product, earned date, transaction/settlement date, GBP and original currency with documented FX conversion, gross amount, platform fee, refund, recognised revenue, deposit/transfer and reconciliation status. Support manual **business expenses**, receipt/hosting/domain/app-store costs, recurring expenses, tax-year/year/month charts, profit and accountant-ready CSV/JSON export. Support a change/audit log and corrected items without erasing original facts. Missing provider syncs and offline mode must be clearly visible. Payouts transferred to a bank account are not additional revenue.

## UK Northern Ireland tax estimation (do NOT call a final HMRC liability)
- UK personal tax year: **6 April–5 April**; 2026/27 = 6 April 2026–5 April 2027.
- **Determine legal form first.** Sole-trader Income Tax and self-employed NI are not the same as limited-company Corporation Tax, payroll and dividend tax. Never show a personal tax number until form is known.
- Sole trader: compare annual trading profit and gross turnover. Check whether the **£1,000 gross trading allowance** may be used *instead of*, not in addition to, trading expenses; Self Assessment registration and other sources of income. Annual PAYE employment pay/tax already deducted, allowable expenses, pensions and tax code/reliefs may alter how much extra tax is owed. Do not assume a flat 20% rate correctly captures it.
- 2026/27 self-employed Class 4 (if applicable): **6%** on profits between **£12,570 and £50,270**, **2%** above. Rules must be versioned per tax year and reviewed against HMRC, including employed + self-employed NI interactions. Regular Ko-fi tips are not necessarily legally tax-free charitable donations.
- Show **estimated additional Income Tax / NI to reserve**, assumptions, incompleteness warning and optional user-set cash reserve. Do NOT imply a paid tax amount or Self Assessment filing. Support accountant review.
- Making Tax Digital for Income Tax applies in phases to qualifying trading/property income: over £50k from Apr 2026, over £30k from Apr 2027, over £20k from Apr 2028, subject to HMRC criteria. This dashboard is NOT MTD-compatible filing software.
- Official sources: https://www.gov.uk/become-sole-trader/register-sole-trader ; https://www.gov.uk/self-employed-national-insurance-rates ; https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past ; https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax

## Security and cost constraints
Owner-only server-authorised allowlist with MFA; least-privilege service access; provider OAuth tokens in server secret storage; no credentials in GitHub, public JavaScript or user_metadata. Any Supabase tables need RLS and privilege checks (not client-only filters), ideally logically separated from community research. Treat PWA local cache as opt-in and secured against shared-device disclosure, with explicit lock/logout and an encrypted backup story. Never display donor PII in public tools. Confirm free-tier quotas for webhooks, storage, reports and API calls; do not promise £0 hosting cost.

## Milestones (update MASTER_HANDOVER.md after every completed milestone)
**F0 — Decision:** Confirm sole trader vs limited company; desired BDS project coverage; accounting start year; PAYE annual summary optional; private portal vs standalone offline-first; whether user approves proceeding.
**F1 — Local ledger prototype:** Synthetic example entries only, manual entry/import, £GBP profit and income/expense/month filters, JSON/CSV backup; test refunds, duplicate import and tax-year dates. No external accounts.
**F2 — Private backend:** Scoped tables and owner-only server access, cross-user/anonymous rejection tests, secure token store, backup/recovery and audit.
**F3 — Real connectors:** Owner-consented Ko-fi webhook, AdSense read-only OAuth after account approval, Play earnings reports after sales; idempotency, retries, reconciliation. Provider-by-provider status.
**F4 — Reviewed tax estimator:** Configure individual/company mode, versioned HMRC rules, PAYE/NI inputs, thresholds, assumption flags and accountant audit. No direct tax filing.
**F5 — Mobile PWA/offline:** Secure cached snapshots, owner unlock, export and loss-of-connection handling; opt-in acceptance and separate release approval.

## Acceptance / release gate
[ ] All actual figures attributable to an authorised source and correct date, currency, fee and finalisation status.
[ ] Duplicate webhooks/CSV, payment settlement, refunds and taxes cannot double-count money.
[ ] Guest, unrelated registered accounts and public links cannot see Finance Centre data or OAuth secrets.
[ ] Tax estimates disabled until business type/PAYE inputs sufficient; tax-year boundaries correct.
[ ] No Netlify deploy, public page, Supabase migration, Play release or change to original W.NE and Our Cinema until separately approved.
