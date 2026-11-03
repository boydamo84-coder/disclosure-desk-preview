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
