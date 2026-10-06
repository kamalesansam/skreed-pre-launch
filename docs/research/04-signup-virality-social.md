# Lead Capture, Virality & Social-Follow Mechanics (research agent output, 2026-10-01)

## 1. Signup form for India mobile

- **Phone-first.** Indian D2C practice is phone-first with WhatsApp opt-in, email optional. WhatsApp open rates 85–95% vs 20–25% email, 3–5× the conversion (growwwtech; frameleads; enzodigital). Recommendation: one required field (10-digit mobile, fixed "+91" prefix, `type="tel" inputmode="numeric" autocomplete="tel-national" pattern="[6-9][0-9]{9}"`), email as optional second step after the "you're in" moment or on the share screen. Store E.164 `+91XXXXXXXXXX`.
- **OTP: no.** SMS OTP abandonment is 20–30%, >50% if a second OTP is needed; 43% abandon onboarding over verification friction (ipification; prove.com; zyphe). OTP costs ₹0.10–0.25 each via DLT. Verify lazily: the first WhatsApp template on Nov 1 is the verification (undelivered = dead lead). For referral rewards, count a referral only after the friend's number receives one message.
- **Consent (DPDP Act 2023 + Rules 2025).** Rules notified 13/14 Nov 2025; Consent Manager framework from 13 Nov 2026; substantive obligations from 13 May 2027. Nothing enforceable during the teaser, but build to the standard now since leads will be used past May 2027. Requirements: free, specific, informed, unambiguous, affirmative action; no pre-ticked boxes; marketing is not a "legitimate use" so consent is the only lawful basis; itemised notice separating purposes; withdrawal as easy as giving consent; store timestamp, IP, text shown, channel. Minimal notice: "We collect your mobile number (and email if given) to (1) send you Skreed launch updates and your early-access code on WhatsApp/SMS/email, and (2) run the referral leaderboard. Unsubscribe anytime by replying STOP or via the link in any message. See Privacy Notice." Two unticked boxes if you want promotional comms beyond launch. Sample forms: dpdpactindia.in; easydp.in.

## 2. Lead storage and launch-day use

**Architecture:** Supabase `leads` table is the system of record (raw, with consent evidence, referral code, referrer, UTM, share events). A sync job upserts into Shopify Customers with tags; Shopify Email sends on Nov 1. Google Sheets only as a read replica. Do not make Shopify primary (US-configured, rate-limited, strict about phone/email uniqueness).

**Shopify Admin GraphQL `customerCreate` (2026-10).** CustomerInput supports `email`, `phone` (E.164; duplicates rejected "Phone has already been taken"), `tags`, `emailMarketingConsent`, `smsMarketingConsent`, `whatsAppMarketingConsent` (phone required; also `customerWhatsAppMarketingConsentUpdate`). customerCreate upserts by unique key per 2025+ docs.

```graphql
mutation customerCreate($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer { id email phone tags
      emailMarketingConsent { marketingState marketingOptInLevel consentUpdatedAt }
      smsMarketingConsent { marketingState marketingOptInLevel consentUpdatedAt } }
    userErrors { field message }
  }
}
```
```json
{"input":{
  "firstName":"Priya","email":"priya@example.com","phone":"+919876543210",
  "tags":["prelaunch","waitlist-oct26","shade:midnight","ref:AB12CD"],
  "note":"Source: skreed.in teaser; consent text v1; IP 1.2.3.4; 2026-10-12T10:00:00Z",
  "emailMarketingConsent":{"marketingState":"SUBSCRIBED","marketingOptInLevel":"SINGLE_OPT_IN","consentUpdatedAt":"2026-10-12T10:00:00Z"},
  "smsMarketingConsent":{"marketingState":"SUBSCRIBED","marketingOptInLevel":"SINGLE_OPT_IN","consentUpdatedAt":"2026-10-12T10:00:00Z"},
  "metafields":[{"namespace":"prelaunch","key":"referral_code","type":"single_line_text_field","value":"AB12CD"}]
}}
```
marketingState: SUBSCRIBED / NOT_SUBSCRIBED / UNSUBSCRIBED / PENDING; marketingOptInLevel: SINGLE_OPT_IN / CONFIRMED_OPT_IN / UNKNOWN. Omit smsMarketingConsent unless the promotional-SMS box was ticked; WhatsApp consent goes in `whatsAppMarketingConsent`. Later updates via `customerEmailMarketingConsentUpdate` / `customerSmsMarketingConsentUpdate` (consent cannot be set via customerUpdate).

**Double opt-in.** Shopify: Settings > Notifications > Customer notifications > Marketing double opt-in. India has no statutory double opt-in; leave it off and rely on recorded single opt-in.

**Email tools.** Shopify Email: 10,000 emails/month free, then $1/1,000. Klaviyo free: 250 profiles, 500 emails/month; SMS not available for India. Mailchimp free cut to ~250 contacts/500 sends from Feb 2026. Verdict: Shopify Email for email; a WhatsApp BSP for phone; skip Klaviyo/Mailchimp.

## 3. Referral / waitlist tooling

LaunchList: free to 100 submissions, then one-time $19 (500) / $39 (2K) / $79 (10K); leaderboard built in. Waitlister: free, $15/mo Launch, $49/mo Growth. GetWaitlist: free tier closed Jun 2025; $15/mo Basic, $50/mo Advanced (leaderboard). KickoffLabs: $19/mo (500 leads), ~$69 (2,500), ~$141 (10K). Viral Loops: $49/mo for 1,000 participants; Shopify app. Prefinery: $39–399/mo, strongest fraud tooling. All bill in USD; none is phone-first or WhatsApp-native; none stores DPDP consent evidence or pushes Shopify tags the way you need.

**Build vs buy:** custom is 1–2 days since Supabase and Shopify are wired. `leads(id, phone, email, shade, referral_code unique, referred_by, consent_json, ip, ua, utm_*, created_at)`, `share_events(lead_id, channel, ts)`, `referrals` view computing position = base rank minus 10 per verified referral; edge function `join` (Turnstile + rate limit + insert + Shopify upsert); edge function `r/:code` redirect setting a cookie and UTM. LaunchList ($19 one-off) only if you want zero backend.

## 4. Incentives that are legal in India

Legal frame: lottery is a state subject (Lotteries (Regulation) Act 1998). Prize Competitions Act 1955 caps puzzle/number-based competitions at ₹1,000/month and 2,000 entries, but games of substantial skill are outside it (RMD Chamarbaugwala). Tamil Nadu Prize Schemes (Prohibition) Act 1979 bans draws/lots for purchasers; big brands exclude TN from lucky draws. Safe pattern: no purchase required; winner by skill or objective ranking (most referrals, judged caption) or deterministic rewards; publish T&Cs (18+, India resident, dates, prize value, judging criteria, TDS note: prizes over ₹10,000 attract 30% TDS under s.194B; "residents of Tamil Nadu may participate only in skill-based components"). Instagram Promotion Guidelines (2025): you may not require like/follow/share/tag as a condition of entry; include the "not sponsored, endorsed or administered by Instagram" release; you can invite follows. Meta's Spam standard prohibits requiring engagement to access exclusive content, so an enforced "follow to unlock" is a policy risk.

Five incentives, ranked by conversion vs risk:
1. **Early access + launch code** (deterministic): every signup gets a unique code valid Nov 1–10; queue position determines access hour. Highest conversion, zero legal risk. (Brand rule: avoid discount language; frame as early access.)
2. **Reserve your shade** (scarcity, deterministic): first N reservations per shade get it guaranteed on day one; free, non-binding. Strong share hook.
3. **Referral ladder** (milestones): 3 friends = free screen guard, 10 = free case, 25 = named in launch post. Verified count, not chance. Medium fraud risk.
4. **Leaderboard top-10 win a limited drop** (ranking = effort, not chance). Legal across states incl. TN.
5. **Random-draw giveaway**: highest viral pull, riskiest (TN ban, Meta entry rules). If used: no purchase, judged rather than drawn, exclude TN from any draw element, rules at skreed.in/rules.

## 5. Instagram follow mechanics

- Links: `https://www.instagram.com/skreedofficial/`; app scheme `instagram://user?username=skreedofficial`. Pattern: attempt the scheme, fall back to https after ~800 ms. Detect in-app webviews by `Instagram` or `FBAN/FBAV` in the UA; keep the form stateless; Android intent URL with `S.browser_fallback_url`. Threads: `https://www.threads.net/@skreedofficial`.
- **Verifying a follow is not possible.** The Graph API exposes only your own `followers_count` and aggregates; no followers list or "does X follow me". Scrapers violate Meta terms. "Follow to unlock" is honour-system only; treat as a nudge. Measure by follower-count delta per day vs site traffic.
- **Broadcast channel.** Joining requires following, so a channel join link is a legitimate follow driver: non-followers who tap "Join" are prompted to follow first. Creators get an invite link from channel settings and a "join channel" sticker. Make it the primary CTA after signup ("Join the launch channel"). Close Friends drops as the milestone reward for top referrers.
- **WhatsApp.** Channel (`https://whatsapp.com/channel/<id>`): one-way, unlimited, no number needed; fits launch announcements as a secondary CTA. Community: two-way, 5,000 cap, moderation load; not for pre-launch reach. Neither gives you phone numbers, so the form stays primary.

## 6. Share mechanics

Web Share API: `navigator.share({title, text, url, files})`, HTTPS + user gesture; `navigator.canShare({files})`. Chrome Android, Safari iOS 12.2+ (files from iOS 15); not Firefox Android for files. Generate the "my shade" PNG client-side as a `File`; on iOS text may be dropped when files are present, so put the referral URL in the image and offer copy-link. Fallback: `https://wa.me/?text=<encoded>`; URL-encode (space %20, newline %0A, & %26). Example: "I reserved Midnight on Skreed before launch. Grab yours: https://skreed.in/r/AB12CD". Rich preview: server-rendered page per referral URL with `og:image` 1200×630 under ~300 KB; WhatsApp caches per URL so put the code in the path, not a query string; per-shade or per-user images via Satori/@vercel/og or pre-rendered per shade. Attribution: `/r/<code>` appends `?utm_source=referral&utm_medium=whatsapp|ig|copy&utm_campaign=prelaunch&ref=<code>`, sets a 30-day first-party cookie, stores `referred_by` on signup; log `share_events` when `share()` resolves or the wa.me link is clicked.

## 7. Launch-day sequence and tools

WhatsApp Business API BSPs (India): AiSensy from ₹1,500/mo (Pro 3,200); Wati from ₹1,999/mo; Interakt from ₹2,499/quarter. Meta rates ≈ ₹0.97–1.09 marketing, ₹0.145 utility/auth; 10,000 marketing messages ≈ ₹10.9K–13.4K. Interakt is Shopify-native; AiSensy cheapest for broadcasts. Template approval: minutes to 30 min typical; marketing up to 24 h; human review up to 48 h. Budget 1–3 days for WhatsApp Business verification and display-name approval; DLT registration for any SMS. Submit all templates by Oct 22.

Nov 1 plan: 07:00 IST WhatsApp template "You're in: your early-access code {{1}} works now at skreed.com/{{2}}" with CTA URL button + UTM; 07:05 Shopify Email to the `prelaunch` segment; 12:00 IST Instagram broadcast channel post + story; Nov 2 reminder to non-clickers; Nov 8 "48 hours left". Pre-launch: 1 WhatsApp update per week max (Oct 20 shade reveal, Oct 31 "3 days"); referral milestone messages triggered by Supabase.

## 8. Spam and bot protection

Cloudflare Turnstile free (1M/month), invisible; official Supabase edge-function example verifies at `siteverify` with secret, token, `x-forwarded-for`. Layer: honeypot + minimum 3–5 s fill time; rate limit per IP and per phone (Supabase + Upstash example, or a Postgres `attempts` table 3/IP/day); disposable-email blocklist (`disposable-email-domain` npm); normalise phones to E.164 and emails (lowercase, strip Gmail dots/plus) before unique indexes. Referral fraud: block self-referral by phone/email/IP/cookie; flag device-fingerprint/IP clusters; count a referral only after the friend's number receives a message; minimum 2–3 verified referrals before any reward; manually review the top 20 before announcing.

## Summary
- Phone-first single field (+91), email optional later, no OTP; two unticked consent boxes; DPDP-style itemised notice; store consent evidence.
- Supabase as source of truth; edge function upserts to Shopify `customerCreate` with tags + SINGLE_OPT_IN; Shopify Email for Nov 1 email; AiSensy or Interakt for WhatsApp; no Klaviyo.
- Build referral custom (1–2 days); deterministic rewards + ranked leaderboard, no random draw.
- Instagram: cannot verify follows; nudge via profile deep link and especially the broadcast-channel join link. Keep "follow to unlock" honour-based.
- Share: Web Share API with generated shade image, wa.me fallback, per-code OG pages, UTM + cookie attribution.
- Protect with Turnstile, honeypot, rate limits, disposable-domain blocklist, referral-verification rules.
