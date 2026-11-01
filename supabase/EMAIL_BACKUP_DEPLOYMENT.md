# Email backup deployment checklist

This feature is built on the development branch but email delivery is **not active** until these steps are completed in the existing Supabase project.

1. Run `supabase/email_backup_rate_limit.sql` in the project's SQL editor to enable the persistent one-hour per-user rate limit. The SQL function is service-role-only.
2. Configure Supabase Edge Function secrets: `RESEND_API_KEY` and `BACKUP_FROM_EMAIL`. The sender must be an address on a domain verified in Resend (for example, `backups@<verified-domain>`). **Never put a Resend secret in browser JavaScript or commit secrets to GitHub.**
3. Deploy `supabase/functions/email-board-backup/index.ts` as the Edge Function named `email-board-backup`, with JWT verification enabled. The function independently verifies the user using Supabase Auth, limits deliveries to their verified account email, and refuses calls if the service/rate-limit configuration is missing.
4. Use a dedicated test account and Board containing a note, timeline event, video and connection. Press **Send backup to my email** and verify that the correct registered email receives a complete JSON attachment.
5. Test unverified/sign-out requests, large payload, one-hour cooldown, duplicate attempts and provider failure before production release.
6. Confirm the privacy notice explains that email attachments pass through the email delivery provider and may be retained in mailboxes. They are not end-to-end encrypted.
7. Consider a separate **Restore email backup** import flow before declaring this a complete account-recovery feature. Existing single-Board JSON import does not import an entire multi-Board email archive.

No automatic recurring emails or server scheduler is configured. This is user-triggered email delivery only.
