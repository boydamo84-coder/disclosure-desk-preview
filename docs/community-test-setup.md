# Community test project setup — no production changes

This DEV branch intentionally disables Comments, My Comments, moderator tools, and Watch & Read voting unless a **separate** Supabase test project is configured.

## Set up safely
1. In Supabase, create a new **test** project. Do not copy actual users or Investigation Boards into it.
2. From the test project's Settings → API, copy **Project URL** and **publishable / anon key only**. Never use service_role or secret keys in the app.
3. Edit `assets/community-test-config.js` on this DEV branch to set `url` and `publishableKey`. Leave `environment: 'test'`.
4. Apply `supabase/migrations/20261031_case_comments_foundation.sql` and `supabase/migrations/20261031_watch_read_ratings.sql` in **that test project only** via Supabase SQL Editor.
5. Create two new, disposable and confirmed test user accounts in the test project's Authentication area. Existing production account sessions and password are NOT automatically valid in test.
6. Before full testing, build a **test-project sign-in UI** or use Supabase-authenticated test sessions. The existing Boards sign-in is tied to production and does not sign you into the test project. **Do not assume it can test community permissions.**
7. Create moderator allowlisting only for the chosen test admin via trusted SQL editor.

## Verification
- Post in a case, video and news thread with user A; confirm visible to B.
- Account A's My Comments should contain A's posts only; B should see B's only.
- Flag a comment as B and verify only moderator can review it.
- Confirm 5 posts / 10 min and 40 / day caps.
- Give a documentary a score as A, sign out, sign in as B, confirm A's vote doesn't appear as B's choice, and check aggregates.
- Verify the DEV Android app and production app have distinct package IDs.
- Only after those tests, plan the controlled production migration separately.

**Current status:** Config prepared, migrations committed, but no test project configured or live database tests performed.
