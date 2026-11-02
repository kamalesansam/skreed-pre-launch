---
name: deployment-not-yet-live
description: "As of 2026-10-26 nothing is deployed; the deploy workflow and docs/DEPLOY.md exist, Sam must create the Cloudflare account, token and GitHub secrets; no gh CLI and no wrangler login on this Windows machine"
metadata:
  node_type: memory
  type: project
  originSessionId: ab239039-01ef-4341-9526-978fda93ab9c
  modified: 2026-10-26T11:42:16.753Z
---

On 2026-10-26 the deployment setup was built (`.github/workflows/deploy.yml`, `docs/DEPLOY.md`, `npm run deploy:staging` and `deploy:production`) but nothing has been deployed: wrangler is not logged in on this machine, and the GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` do not exist yet. Sam's steps are `docs/DEPLOY.md` section 2 (account, workers.dev subdomain, API token, secrets, then skreed.in's nameservers via Prem).

**Why:** the site's "live" look depends on Sam's dashboard steps, which no session can do; knowing the state avoids re-deriving it.

**How to apply:** before promising a live URL, check `npx wrangler whoami` and whether the Actions secrets exist. The repo is public and the 35 licensed quiz pictures are tracked in git (to decide before production). This machine has no `gh` CLI: read GitHub state with `curl https://api.github.com/repos/kamalesansam/skreed-pre-launch/...` (public, unauthenticated). The GitHub MCP connector failed to connect in that session. See [[windows-machine-no-blender]] for the npm script-shell note.
