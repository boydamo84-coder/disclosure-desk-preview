# Disclosure Desk — combined beta preview release

- Source: pull request #2, feature branch `feature/research-studio-bds-production-based`.
- **Preview deployment only**. Do not merge into `production` or publish the public domain until Samsung and real-account QA pass.
- Combined scope: news/archive/video/Watch & Read discussions, five-distinct-flag community moderation, witness map and reports, private public-alias opt-in, W.NE Research Studio, My Research Hub, and restricted Admin Centre.
- Profile is last in bottom navigation. Top-right shortcut is hidden on W.NE; W.NE navigation away from open reports stays save-guarded.
- Supabase community backend migration and `dd-witness-submit` Edge Function version 1 are already installed; preview uses registered accounts in the existing project. No test reports should be left public.
- Pending human tests: signup/login on Samsung, comments and vote flows across sections, five unique report flags, moderator restore, town/city geolocation and privacy, local/cloud research documents, backups, and Admin Centre; no Google traffic data embedded yet.
- Do not enable production release or independent branch builds as part of this request.
- Netlify deploy credits: one intentional combined PR Deploy Preview after all GitHub QA passed, not repeated per feature.
