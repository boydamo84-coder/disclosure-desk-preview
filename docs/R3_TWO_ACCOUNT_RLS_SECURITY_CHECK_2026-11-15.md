# Disclosure Desk R3 — two-account database isolation security checkpoint
_Date: 15 November 2026 · Real Supabase project, transaction-only synthetic fixtures · Not a live deployment_

## Scope and privacy
The owner authorised using two existing Disclosure Desk accounts as **Account A** and **Account B**. Both identities were confirmed to exist in the **Disclosure Desk** Supabase Auth project, each with confirmed email and a non-anonymous user record. Their email addresses, user IDs, passwords and any session tokens are intentionally **not recorded in this public repository document**. The unrelated Our Cinema Supabase project is untouched.

These tests ran directly against the existing `public.dd_r3_private_notebooks` table using the Postgres `authenticated` role and **transaction-local request JWT claim values derived from the two actual registered account IDs**. They are a real Postgres row-level-security (RLS) policy test, **not** a test of signed access tokens, user login, or actual browser REST calls. Synthetic JSON ciphertext-shaped rows were used only to exercise access controls; they do not contain real notebook content and are not decryptable notebooks.

## Results — PASS
- Both accounts can create and read only their own synthetic notebook.
- Under Account B's authenticated claim, reading, updating and deleting A's row returns no rows. Symmetrically A cannot read, update or delete B's row.
- Attempted transfer of B's row ownership to A was rejected by RLS `WITH CHECK`.
- Attempted creation of a notebook with another user's ownership was rejected with a permissions error, with no primary-key collision.
- A JWT bearing `is_anonymous: true` has neither notebook read nor insert access, even though Supabase anonymous sessions use Postgres role `authenticated`. The `anon` database role has no SELECT grant.
- Optimistic generation compare-and-swap: first conditional update applied; later update using stale generation returned zero rows, leaving the newer generation unchanged.
- `row_security_active(...)` returned **true while executing as `authenticated`**; table `relrowsecurity` and `relforcerowsecurity` remain true.
- All fixture writes ran in explicit `BEGIN ... ROLLBACK` transactions. Independent post-test read verified **0 R3 cloud notebook rows**. No production research, user accounts, passwords, user sessions, or other application tables were changed.
- Supabase security advisor returned **no findings mentioning the R3 notebook table** at this checkpoint. It reported existing warnings elsewhere in the wider app, which are not erased or considered audited by this focused test.

## Outstanding gates — NOT YET PASSED
1. Actual end-to-end login and verified **signed-JWT** REST/PostgREST requests for both accounts, including cross-account read/write/delete attempts, invalid/expired tokens, guest and signout.
2. Full two-browser Samsung/desktop account switch: decrypted DOM/key clearance, unique local vault slots, manual encrypted backup to account, login on a second device, passphrase-based restore, and no accidental overwrite of a local notebook. A live browser build/Netlify preview is not presently confirmed.
3. Security review of malformed/oversized encrypted data, CSP, dependency/version integrity, network errors, replay and rollback scenarios, account deletion, concurrency under simultaneous devices, and independent encryption audit.
4. Real-device owner acceptance and exact release-candidate CI before any production GitHub merge/Netlify deployment.

**Release state:** isolated R3 branch; PostgreSQL account-isolation checks PASS, end-to-end identity/security checks PENDING. R2 production website unchanged.
