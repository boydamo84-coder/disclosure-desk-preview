# Disclosure Desk — AdSense low-value content recovery audit
Date: 2026-11-13
Status: preparation only; no production deployment or resubmission authorised.

## Confirmed issue
The publisher's signed-in AdSense screenshot shows **Needs attention**, **policy violations**, **Low-value content**, and a **Request review** action. Do not assert approval or tick the confirmation until changes are verified.

## Release safety
This branch is isolated from main and the existing November release branches. Before implementing any site change, reconcile the latest integrated website branch and pending M86–M96 fixes. Preserve navy/gold styling, user data, community features, archive, news, W.NE and Android app. Avoid Netlify builds until explicit approval.

## Audit / implementation checklist
- [ ] Review live site and mobile logged-out journey; identify thin, empty, repetitive, broken or inaccessible public pages.
- [ ] Inspect news items for source attribution, repeated event coverage, scraped excerpts, and lack of independently written context. Do not manufacture reporting or automatically paraphrase copyrighted full articles.
- [ ] Introduce a visible **Original Investigations** landing page with substantial human-reviewed case analysis: evidence, provenance, chronology, alternative explanations, uncertainty and primary-source citations. No invented case facts.
- [ ] Prepare 3–5 fully researched editorial case studies for human review before publication; no filler or AI-only bulk publishing.
- [ ] Clarify editorial standards, corrections process, author/about information, contact and content sourcing; keep existing privacy and terms intact.
- [ ] Highlight archive provenance, research boards, comparisons and W.NE in public navigation, without disguising login-gated features as publicly readable editorial content.
- [ ] Check robots, sitemap, canonical URLs, mobile rendering, 404s, public crawlability, ads.txt and any policy-specific account notices.
- [ ] Test logged-out and logged-in flows, desktop and Android; document actual evidence and limitations.
- [ ] Obtain owner approval before merging, deploying, or requesting AdSense review.

## Important distinction
AdSense does not provide a guaranteed approval checklist. Original research and better navigation are risk-reduction measures, not proof of compliance or guaranteed approval.

## Next step
Inspect latest integrated source and live URLs, produce evidence-backed page-level findings, then implement isolated reviewed changes. Do not modify the public website until the appropriate integration base is confirmed.
