# Pre-launch security checklist (20 checks)

Source: the "20 things Claude should check before you ship your app" reel in Sam's saved posts (the one post 136 in `07-instagram-saved-collections.md` had no caption for). Mapped to the teaser's actual surface: a static Astro site, one signup worker, a Supabase `leads` table, a Shopify mirror, optional photo upload handled on-device.

Run this on build day 14, and again after any change to the worker or schema. Where a check does not apply to the teaser it is marked so, with the reason, so nobody wastes time on it.

| # | Check | Applies | What it means for the teaser |
|---|---|---|---|
| 1 | Hide API keys | Yes | Turnstile secret, Supabase service-role key, Shopify Admin token and PostHog key live only in Cloudflare Worker secrets (`wrangler secret put`). The client bundle gets only the Turnstile site key and the PostHog public key. Grep the build output for `sk_`, `shpat_`, `service_role` before every deploy. |
| 2 | Enable RLS | Yes | Row Level Security on `leads`, `referrals`, `share_events`. No policy for `anon`. Inserts only via the service-role key from the worker. Verify by attempting an anon insert with the publishable key and expecting a 401. |
| 3 | Test IDOR attacks | Yes | The referral page `/r/<code>` must expose nothing but the shade and first name of the referrer. Never a sequential id, email or phone. Codes are random, 8+ chars. |
| 4 | Scan git secrets | Yes | `gitleaks detect` (or `trufflehog`) on the repo before the first push of the app code. Add a pre-commit hook. The Composio key pasted in chat earlier is the kind of thing this catches. |
| 5 | Lock admin routes | Partly | There is no admin UI in the teaser. The counters endpoint is read-only and aggregate. If a team dashboard is added, it sits behind Cloudflare Access, not a password in the page. |
| 6 | Test user isolation | Partly | No logged-in users. The only per-user state is the referral cookie; confirm one lead cannot read another's reservation by guessing a code. |
| 7 | Rate limit APIs | Yes | Cloudflare Rate Limiting rule on `/api/signup` (per IP) plus a per-phone attempt table in Postgres. Target: 5 submits per IP per 10 minutes. |
| 8 | Lock storage buckets | Yes if used | Photos for "find your shade" are processed in the browser and never uploaded. If a bucket is ever added for UGC, it is private with signed URLs and no public listing. |
| 9 | Validate all inputs | Yes | Zod schema in the worker: phone as E.164 after `libphonenumber-js`, email lowercased and length-capped, shade id must exist in `shades-240.json`, device and finish from fixed enums, consent fields boolean. Reject anything else with 400. |
| 10 | Block unauthenticated routes | Partly | Every write route checks the Turnstile token server-side. There are no routes that should be open and are not. |
| 11 | Test SQL injection | Yes | Only parameterised queries via supabase-js. Fuzz the signup endpoint with `'; DROP TABLE` style payloads and confirm a validation error, not a DB error. |
| 12 | Remove sensitive logs | Yes | The worker logs a request id and outcome, never the phone, email or IP in plain text. PostHog events carry the shade and device, not personal data. |
| 13 | Block field tampering | Yes | The client cannot set `referred_by`, `position`, `created_at` or `verified`. The worker derives them. Strip unknown keys before validation. |
| 14 | Restrict file uploads | Yes | The photo input accepts `image/*` only, is read with FileReader into a canvas, downscaled to 256 px, and the original is discarded. Nothing is sent to a server. |
| 15 | Secure server logic | Yes | The reservation counter increments inside a single Postgres function (`reserve_shade`) so it cannot be raced. The Shopify mirror is fire-and-forget and idempotent on duplicate errors. |
| 16 | Trim API responses | Yes | The counters endpoint returns `{shadeId, count}` only. The signup response returns `{ok, referralCode, position}` and nothing from the row. |
| 17 | Secure auth sessions | No | No sessions. The referral cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, 30 days, and holds only the code. |
| 18 | Scan dependencies | Yes | `npm audit --omit=dev` and Dependabot on the repo. Pin versions in `package.json`. |
| 19 | Test record access | Yes | Same as 2 and 3: from the browser, with the publishable key, try `select * from leads` and expect zero rows. |
| 20 | Attack your own app | Yes | On day 14, ask Claude (with a security skill loaded) to write and run an attack script against the deployed signup endpoint: tampered fields, oversized bodies, non-JSON content types, replayed Turnstile tokens, 100 requests in 10 seconds, unicode phones. Fix anything that gets through before cutover. |

Related: the vibe-coder failures already captured from posts 43, 113, 116 and 141 (verify webhook signatures, reject non-JSON content types, no public database, no desktop-only UI, backups on). Supabase's daily backups cover the last one on the free tier for 7 days; export the leads CSV daily during the final week anyway.
