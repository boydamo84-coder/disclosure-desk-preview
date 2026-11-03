# Disclosure Desk — voluntary support via Ko-fi
**Prepared 3 November 2026. No Ko-fi creator account exists yet. Donation link remains disabled.**

## Decision
- Use Ko-fi Free for one-off voluntary community contributions under the public page name Disclosure Desk; credit Boyd Digital Studios on the public profile.
- Ko-fi Free charges 0% Ko-fi service fees on one-off tips ONLY after turning off Standard/Contributor mode in Settings → Payment. New accounts start with 5% Standard/Contributor on one-off tips. Stripe or PayPal processing charges still apply.
- A Ko-fi account can be created before connecting PayPal/Stripe, but cannot receive payments until one is connected. Use GBP if available and a user-chosen unique page handle, NOT an invented slug.
- Payments take place on Ko-fi; no payment forms, card data or credentials in Disclosure Desk or GitHub. Explain that creators may receive the payer's contact details via the processor.
- Support must remain optional, never linked to ranking, post visibility, research tools, account privileges or favouritism.

## Website code already staged
- assets/support-site.js has an intentionally blank VERIFIED_KOFI_PAGE_URL.
- When owner provides the actual https://ko-fi.com/<handle> page, after it is verified, source update can activate a discreet About card and footer link. Link opening is external with noreferrer/noopener; no app tab added.
- No link will be shown until it exists, and no website deploy without coordinated release permission.

## Owner setup
1. Open https://ko-fi.com/ and register a new creator profile.
2. Choose Disclosure Desk display name and available user handle. Credit Boyd Digital Studios.
3. Under Settings → Payment turn off Standard/Contributor for zero Ko-fi one-off tip fees; connect PayPal or Stripe.
4. Test the public page/payment destination; then share the exact actual creator page URL for integration.

Sources:
https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee
https://help.ko-fi.com/hc/en-us/articles/360014098514-Getting-started-on-Ko-fi
https://help.ko-fi.com/hc/en-us/articles/360009392953-What-information-do-supporters-share-Public-private-options

## Header placement decision — 3 November 2026

- The Ko-fi support link is now also prepared in the **sticky header**, beside the Profile shortcut, styled as a discreet gold/blue `☕ Support` item on desktop. On mobile widths up to 430px the label is visually shortened to the coffee icon, with accessible `aria-label` and tooltip. The About and footer versions are retained for discovery.
- **Still not public:** the creator has not yet created a Ko-fi account; `VERIFIED_KOFI_PAGE_URL` remains blank, so NO Support button is rendered anywhere. No invented handle or third-party payment embed.

### Suggested Ko-fi creator bio

**Disclosure Desk — Where curiosity meets evidence.**

An independent platform exploring UFOs, UAPs and the unexplained through historical archives, worldwide sightings, breaking news and powerful research tools.

Built for curious minds who believe every mystery deserves a closer look—and every claim deserves evidence.

Created by Boyd Digital Studios. Independent research. Open minds. No predetermined answers.

**Short option (for smaller Ko-fi profile fields):** Independent UFO/UAP research, global sightings, historical archives and evidence-led investigation tools. Follow the mystery. Check the sources. Support curiosity.

## 3 November 2026 — Ko-fi URL now supplied and integrated (unpublished)

The owner created Ko-fi, completed the Stripe connection and showed **Standard OFF** in account settings. They supplied their public creator address as **https://ko-fi.com/disclosuredesk**. The website development branch now sets this URL in `assets/support-site.js`, with exactly the same validated external link in the small sticky header, About card and footer. Header remains compact and gold/navy (small screens show a cup icon but accessible label says Support).

**Release boundary:** this is source-only staging. The public Disclosure Desk website still runs the earlier `production` branch; no Netlify build or published donor link yet. Verification of actual page opening/checkout is a manual step because an independent external fetch could not be confirmed. Ko-fi tips remain voluntary and do not unlock research privileges.
