# BDS Backup Drive — public OAuth information site

These files contain no OAuth client IDs, secrets, access tokens, private key
material, customer database data or account identifiers.

Planned website:
- https://backups.uapdisclosuredesk.com/
- https://backups.uapdisclosuredesk.com/privacy/

Status as of 6 Nov 2026: **source staged only — not published or DNS configured**.

This is a standalone static HTML website to explain Boyd Digital Studios'
internal Google Drive backup utility and its privacy practices. It is not
the Disclosure Desk production application or the Our Cinema application.

## Separate GitHub Pages deployment

Source branch: `bds-backup-oauth-pages` in
`boydamo84-coder/disclosure-desk-preview`, deliberately separate from
the live `production` branch, current unpublished development branch
and the private `boydamo84-coder/bds-private-backups` runner.

The source branch contains **only** the standalone public HTML/CSS files.
Never merge this branch into the site production/development branches.
The live Disclosure Desk website is hosted outside GitHub Pages; enabling
GitHub Pages to point at this branch must not redeploy or modify Netlify.

**Existing repository reports GitHub Pages enabled.** Before changing
Settings → Pages, check whether any other site currently uses the
repository's Pages publishing source. Switching the source can replace
that existing Pages website. If it does, instead use a newly created,
dedicated PUBLIC repository (and move/copy these static files into it).

If no other site depends on existing GitHub Pages source:
1. In this repository Settings → Pages, select Deploy from branch, branch
   `bds-backup-oauth-pages`, folder `/(root)` and Save.
2. Under Custom domain, enter `backups.uapdisclosuredesk.com` and Save.
   Confirm GitHub has accepted it **before** adding DNS to avoid a
   dangling-record takeover.
3. In the domain's authoritative DNS provider, add ONE record:
   type `CNAME`, name/host `backups`, target `boydamo84-coder.github.io`.
   Do NOT edit existing apex `@`, www, MX, TXT, NS or Netlify DNS.
4. Wait for GitHub Pages to detect DNS and provision HTTPS, enable
   Enforce HTTPS when offered. Confirm both the home page and privacy
   policy are reachable over HTTPS from outside GitHub.
5. Verify ownership of `uapdisclosuredesk.com` in Google Search Console
   from the Google Cloud project owner's account, using the DNS TXT
   challenge Google gives you (never guess its value); then Google
   Auth Platform → Branding → Authorized domains:
   `uapdisclosuredesk.com`, homepage and privacy URL above.
6. Follow Google OAuth production/verification steps honestly; hosting
   these pages does not automatically grant broad Google Drive scope.
   Keep the private backup rclone OAuth config only in the PRIVATE
   repository's encrypted Actions secret.

## Publication review

Ensure the privacy text matches the actual deployed backup implementation,
retention and sharing. It is a draft legal/privacy statement for owner
review, not professional legal advice.

GitHub Pages custom domain:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

Google OAuth branding:
https://support.google.com/cloud/answer/15549049?hl=en-GB
