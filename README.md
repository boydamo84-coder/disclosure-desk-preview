# Disclosure Desk — website and Android source

## START HERE — authoritative continuity

**[MASTER_HANDOVER.md](MASTER_HANDOVER.md)** is the single current source of truth for every new chat, milestone and release decision. Read it **before changing code**; update it **after EVERY milestone**, with exact branch/SHA, what was verified, what is still pending and the next action.

**Correct website branch:** `production` (11 tabs), not outdated `main`. **Current unpublished next batch:** `feature/sources-archives-next-batch-nov03`. Read the master file on that branch; don't use the older default-branch README as a release authority.

Historical details remain in [LIVE/community handover](docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md), [community QA](docs/COMMUNITY_BACKEND_QA_2026-11-03.md), [W.NE integration handover](docs/WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md), [research roadmap](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md) and [release readiness](RELEASE_READINESS.md). Where these conflict with later verified facts, **MASTER_HANDOVER.md wins**.

**Deployment:** do not merge, run a Netlify preview, change live Supabase, publish the site or release an Android app merely because this documentation was updated. Finish agreed website roadmap in a combined batch, then reconcile Android and prepare signed Play internal testing.
