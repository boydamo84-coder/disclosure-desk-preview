# Disclosure Desk — community image hosting, emoji and GIF costs
**Reviewed 3 November 2026. Status: roadmap only; no uploaded-image feature is live or deployed.**

## Current state
- Discussions (future 12th tab) supports text posts, text replies and one optional source URL in the disabled staging client. It does not currently upload or render user media attachments.
- Consent-first private Chat in Profile is still OFF. Its accepted message composer uses a normal Unicode textarea; native phone keyboard emojis can be sent as text. GIF keyboard items, stickers and shared pictures are usually media payloads and are NOT currently accepted as attachments. A pasted GIF link is just text, not playable media.
- Satellite case links are staged to NASA Worldview/EUMETSAT; no actual nearest timestamped satellite image retrieval, integrated live map overlay or historical time slider has been implemented. These provider datasets are separate from user-uploaded media hosting.

## Hosting comparison, verified with provider docs on 3 November 2026
| Service | Free allowance and limitations | Recommendation |
| --- | --- | --- |
| Imgur | UK site and third-party embeds unavailable since 30 September 2025. Terms disallow commercial website image hosting. | Do not integrate or hotlink. |
| Existing Supabase Storage | Free: 1 GB file storage and 5 GB uncached + 5 GB cached egress across services; quotas shared by projects in the account/organization. Authentication and RLS already in use. | Good simplest trial for very small public images. |
| Cloudflare R2 Standard | Free: 10 GB-month stored, 1 million Class A operations and 10 million Class B operations; zero direct egress fee; paid overage above free tier. Requires separate bucket, secure token handling and Worker/upload backend. | More storage headroom as community scales, but operationally more complicated. |

Official sources:
- https://help.imgur.com/hc/en-us/articles/41592665292443-Imgur-access-in-the-United-Kingdom
- https://help.imgur.com/hc/en-us/articles/26509006740891-FAQ-for-Forum-Users
- https://supabase.com/pricing
- https://supabase.com/docs/guides/storage/security/access-control
- https://developers.cloudflare.com/r2/pricing/

## Safe low-cost feature proposal (not approved for live activation)
1. Public Discussions: one or two images per post, resize to a maximum 1280px edge and ~0.5 MB target/1 MB absolute file cap, JPG/PNG/WebP only; prevent GIF/executable/SVG/HTML bypass. Signed-in, non-anonymous users only; per-account daily quota and global storage/bandwidth cap.
2. Re-encode uploaded photos to remove EXIF including GPS; enforce image format and dimensions on the server as well, avoid trusting a browser file extension. Keep all witness/public-map positions approximate town/city.
3. Quarantine new uploads until suitable anti-abuse and safety processes are operational; moderator remove/flag tools, urgent privacy complaints, clear user media ownership, copyright and appeal procedures. 5 distinct flags for normal content, immediate escalation for serious privacy/safety threats.
4. Store image metadata separately from image bytes, enforce owner-only deletion with secure RPCs/RLS, orphan cleanup and strict restrictions so private W.NE documents or Boards never share public media buckets.
5. A measured small Supabase Storage beta could cost £0 additional within free quotas; before broad release compare Cloudflare R2 total operating cost, monitoring and available moderation tools. Set spend/usage alerts and never silently upgrade.
6. Private Chat GIF/sticker support requires separate licensed media picker or restricted uploads; no implied support just because Android or iPhone keyboard shows GIF option. Native text emoji already fits the 2000-character plain-text composer.

## Activation and tests needed
- Build, secure and verify uploads, format sniffing, EXIF removal, rate-limit bypass prevention, media removal and admin moderation using disposable authenticated security tests.
- Test 2-device Android/iPhone browser preview with private profiles, confirmed account deletion and data export policy; keep the upload flag OFF until a coherent site release is approved.
- Avoid copying/modifying NASA/EUMETSAT imagery into user-image storage without checking source-specific reproduction licences and acquisition metadata.
