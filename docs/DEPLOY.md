# Deploying the teaser

How skreed.in's pre-launch site goes live, what Sam has to set up for it, and how every later change reaches the live site. The plan it follows is `docs/specs/hero-architecture.md` sections 14 and 15; the hosting decision is `docs/research/01-stack-and-hosting.md` section 2. Written 2026-10-26, when nothing had been deployed yet.

## 1. What is already built

- The site is static: `npm run build` writes `dist/` (about 22 MB, 257 files), appends the Content Security Policy to `dist/_headers`, and stops on any broken byte budget or a stray reference asset. On 2026-10-26 the production build, the wrangler dry run, the 192 unit tests and the 61 family page tests all pass.
- `wrangler.jsonc` names two Workers on Cloudflare Workers + Static Assets, with no bindings and nothing to provision: `skreed-teaser` (production) and `skreed-teaser-staging` (staging). Each serves `dist/` with the 404 page and trailing slashes handled by the platform.
- The security headers (`public/_headers`) and the CSP ship with every build. HSTS is one year without `includeSubDomains`, because skreed.in redirects to skreed.com after 14 November.
- Two builds. `build:staging` turns the test hooks and the Tune panel on and marks every page `noindex`, so a staging URL can be shared without being indexed. `build` is production: no hooks, no Tune, indexable, the gift form off (`PUBLIC_LEADS` stays off until its Worker exists).
- `.github/workflows/deploy.yml` runs the gate on every push and deploys as section 4 describes. `.github/dependabot.yml` proposes weekly bumps for the pinned packages and actions.

## 2. What Sam has to do, in order

Nothing here can be done from the repository. Each item is a dashboard step on an account only he (or Prem, for the domain) can open.

1. **A Cloudflare account.** Sign in at dash.cloudflare.com, or create the account on the free plan. Workers + Static Assets costs nothing at this site's size: static requests are unlimited on the free plan.
2. **The account id and the workers.dev subdomain.** In the dashboard open Workers & Pages. The Account ID is on the right of the overview page (also the long hex string in the dashboard's URL). On the same page, under "Your subdomain", register one (for example `skreed`). Every Worker then answers at `<name>.<subdomain>.workers.dev`; a deploy from a machine with no subdomain registered fails asking for one.
3. **An API token for the deploys.** My Profile, API Tokens, Create Token, the "Edit Cloudflare Workers" template. Scope it to this one account and to all zones (skreed.in joins later). Copy the token once; Cloudflare never shows it again. If a later deploy with the custom domain says the token lacks a permission, add Zone, DNS, Edit to it.
4. **The two GitHub secrets.** On github.com/kamalesansam/skreed-pre-launch open Settings, Secrets and variables, Actions, and add `CLOUDFLARE_API_TOKEN` (the token) and `CLOUDFLARE_ACCOUNT_ID` (the id). Never put either in the repository, a commit message or a chat.
5. **The production environment, optional but recommended.** Settings, Environments, New environment, `production`, Required reviewers, add himself. From then on a production deploy waits for his approval in the Actions tab before it runs. The `staging` environment needs nothing.
6. **For skreed.in itself (A1 in `docs/01-NEXT-STEPS.md`, Prem).** In the Cloudflare dashboard add the site skreed.in (free plan). Cloudflare shows two nameservers; set them at the registrar in place of the current ones. Propagation takes minutes to a day. Until this is done the production Worker is reachable only on its workers.dev address, and the site is "live" on staging.
7. **Two decisions before production.** First, the 35 licensed Envato pictures the quiz shows are tracked in git on his word of 2026-10-23, in a public repository; the licence allows them in the built site, not shared as files. Before production either the repository goes private (then they can stay) or they come out of git and the build machine keeps them (`docs/HANDOFF.md` section 4). Second, the open spec questions that touch the live site (`docs/specs/section-4-flux.md` section 11, `docs/specs/quiz.md` section 10) stay open; production can go out with the defaults the build already ships.

## 3. The first live look (staging)

Two ways. Either works once step 2 is done.

**From this machine, today.** In a terminal at the repository root:

```bash
npx wrangler login
```

A browser tab opens; allow wrangler on the account. Then

```bash
npm --script-shell="C:\Program Files\Git\usr\bin\bash.exe" run deploy:staging
```

(on a Mac or Linux, plain `npm run deploy:staging`). Wrangler builds nothing itself: the script runs `build:staging`, then uploads `dist/` and prints the address, `https://skreed-teaser-staging.<subdomain>.workers.dev`. A second deploy uploads only the files that changed. `npx wrangler logout` ends the login.

**From GitHub, once steps 3 and 4 are done.** Open the repository's Actions tab, the "deploy" workflow, "Run workflow", target `staging`. Or merge to the default branch and push: every push to it deploys staging after the gate passes.

After the first staging deploy, check from any machine:

```bash
curl -sI https://skreed-teaser-staging.<subdomain>.workers.dev/ | grep -iE "content-security-policy|strict-transport|x-frame|cache-control"
```

Every header of `public/_headers` is present and the CSP line is one line. The Playwright specs can run against it too: `BASE_URL=https://skreed-teaser-staging.<subdomain>.workers.dev npx playwright test --project e2e`. Then Sam's look on his phone and laptop, and the real-device trace of `hero-architecture.md` section 16.

## 4. The workflow, run by run

`.github/workflows/deploy.yml`, three jobs.

- **verify**, on every push and pull request: the secret scan of the whole history (gitleaks, security checklist row 4), `npm ci`, the dependency audit (row 18, reported but not blocking, because its advisories sit in Astro's build toolchain and nothing of that ships), the unit tests, the family page tests, the production build with its CSP, budget and guards, a grep of `dist/` for anything shaped like a key (row 1), and the wrangler dry run. The built `dist/` is kept seven days as a run artifact. A newer push to the same branch cancels an older verify run.
- **staging**, after verify, on a push to the default branch or a manual run with target `staging`: `build:staging`, then `wrangler deploy --env staging`. One at a time.
- **production**, after verify, only on a manual run with target `production`: `build`, then `wrangler deploy --env=""`, behind the `production` environment. One at a time.

The actions are pinned to commits; Dependabot opens a pull request when one moves. A missing secret fails the deploy job with a message naming it, and nothing is uploaded.

## 5. Production on skreed.in

Once step 6 is done (the zone on Cloudflare):

1. Add the custom domains to `wrangler.jsonc` at the top level, as its comment already says, and turn the workers.dev address off for production so the site has one host:

   ```jsonc
   "routes": [ { "pattern": "skreed.in", "custom_domain": true }, { "pattern": "www.skreed.in", "custom_domain": true } ],
   "workers_dev": false,
   ```

   A Workers custom domain creates the DNS records and the certificate itself; nothing is typed into DNS by hand.
2. In the zone's SSL/TLS settings turn on "Always Use HTTPS", and set the encryption mode to Full (strict).
3. Run the workflow with target `production` (or `npm run deploy:production` from a logged-in machine). The first deploy may follow the plan's two-step CSP: build with `node scripts/csp.mjs --report-only` in place of the enforcing line, run `BASE_URL=https://skreed.in npx playwright test tests/e2e/csp.spec.ts`, then deploy again enforcing. Staging already enforces the same CSP, so the step is a precaution, not a requirement.
4. `www.skreed.in` serves the same site. A redirect from www to the apex is a Cloudflare Single Redirect rule, if Sam wants one host in the address bar.

Later, not now: Cloudflare Web Analytics (CHECKLIST G18) needs its beacon allowed in the CSP (`script-src` and `connect-src`), so it is its own change. The gift form's Worker (`/api/quiz-lead`) adds `main` and `assets.run_worker_first` to `wrangler.jsonc` when it exists.

## 6. Rollback

`npx wrangler rollback --env=""` (or `--env staging`) returns to the previous version in seconds; `npx wrangler versions list --env=""` shows what was deployed when. From GitHub, re-run the workflow on an earlier commit (Actions, pick the run, "Re-run all jobs") or dispatch it from an earlier branch. The old hashed files stay on the previous version, so a rollback is complete.

## 7. The cutover, 14 November 23:59 IST (CHECKLIST G20)

Not a deploy. A Single Redirect rule on the zone, `skreed.in/* -> https://skreed.com/$1`, 302 for about ten minutes of testing, then 301. Rehearse it a week earlier on a staging hostname. The teaser's Worker stays deployed for rollback. Whether `/r/<code>` and `/thanks` are excepted is still undecided.

## 8. Day to day

- A change is built on its own branch, merged `--no-ff` into the default branch and pushed (Sam's standing rule, `docs/HANDOFF.md` section 5). The push runs the gate and updates staging. Nothing reaches production without the button.
- Before any merge to the default branch: `/web-design-guidelines` and the security checklist rows that apply (1, 4 and 18 for a static change), as `CLAUDE.md` says. The workflow runs rows 1, 4 and 18 itself.
- On Windows every `npm run` takes Git's bash: `npm --script-shell="C:\Program Files\Git\usr\bin\bash.exe" run <script>`.
- The licensed quiz pictures: a machine that builds without `src/assets/quiz/pics/` ships the five visual questions as words only. The workflow's runner has them while they are tracked in git (step 7 above).
