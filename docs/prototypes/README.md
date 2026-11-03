# BDS Finance Centre — offline, fictional-only F1 demo

**Not the real accounts system.** The prototype contains invented transactions and does not secure real finances. It has no sign-in, encryption, persistent storage, payment API or tax estimate. Do NOT type real bank account numbers, donor details, earnings, employer payroll data or personal tax details.

## Open on your own Android device (no live website deploy)
1. Open the private GitHub repository on the unpublished branch `feature/sources-archives-next-batch-nov03`.
2. Navigate to `docs/prototypes/bds-finance-demo.html` and use the GitHub raw/download option to save that **single .html file** to your device.
3. Open the downloaded file with a browser that supports local HTML files (availability depends on Android/file-manager/browser permissions). No network requests are made by the HTML page itself. Alternatively open it in any desktop browser from a saved local file.
4. Use the Tax year, Product and Month selectors; add an **imaginary** income/refund/expense, reset or remove examples, and export fictional JSON/CSV. On a new load, samples reset. JSON reimport only accepts `mode: "synthetic-demo"`, and duplicate provider references are skipped or flagged if conflicting.
5. Do not upload this file as a public finance page or use it as a store of record. Any downloaded example exports are ordinary unencrypted files.

## Verified
- GitHub Actions staging QA [run 41721383656](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41721383656) **SUCCESS** on code SHA `d6106c975fddacf5081bc30ae80029fafa91cdae`.
- Pure arithmetic and import test verified (not a visual/phone/browser acceptance test).
- 2026/27 sample recognised gross income **£337.00**, refunds **£19.00**, processing fees **£28.50**, hosting expenses **£12.00**, fictional profit **£277.50**. Estimated advertising **£120.00** and payout transfer **£175.00** are excluded from profit.
- 2026-04-05 belongs to UK tax year 2025/26; 2026-04-06 belongs to 2026/27.

## Next security release gate
F2 requires separate private BDS admin origin, verified owner-only server authorization/MFA, minimum-privilege account separation, protected durable storage/backups, reconciled accounting, token vault and real-device QA. F3 adds provider reports/webhooks only after user consent. F4 adds reviewed real tax rules and PAYE context. Never treat F1 HTML as an authenticated finance admin site.
