# The prompt for a new account

Paste the block below as the first message of a fresh Claude Code session on the new account, in an empty folder. Before pasting: copy `src/assets/quiz/pics/` and `assets-src/room/flux/raw/` from the old Mac to somewhere the new machine can reach (both are gitignored on purpose; `docs/HANDOFF.md` section 4 says why), sign the new machine in to GitHub (`gh auth login`), Cloudflare (`npx wrangler login`) and the Higgsfield CLI if the pipeline will be used, and install node 24.

```text
You are taking over the Skreed pre-launch site (skreed.in's teaser, Astro 7 on Cloudflare Workers) from a previous account. I am Sam, the owner and sole reviewer. Everything is on GitHub; nothing of the site lives only on the old machine.

1. Clone the repo and work on its default branch:
   git clone https://github.com/kamalesansam/skreed-pre-launch.git
   cd skreed-pre-launch
   The default branch is claude/youthful-planck-objwf5 (there is no main). Confirm the tip is c25398d or later.

2. Read, in this order, before touching anything: docs/HANDOFF.md (the state of everything as of 2026-10-23 and my standing rules), CLAUDE.md, DESIGN.md, docs/CHECKLIST.md, then docs/specs/section-4-flux.md (the latest work, revision 4) and the other specs it points to. Treat the specs as the source of truth and the hand-off's section 7 as the open list.

3. Restore the two folders that are not in git: put my copy of the 35 quiz photographs at src/assets/quiz/pics/ and the ten raw loops with their records at assets-src/room/flux/raw/ (verify them with sha256sum -c against assets-src/room/flux/SHA256SUMS). Never commit either; the repo is public.

4. Prove the checkout: npm ci, then npm run test:unit (expect 187 passing), npm run test:family, npm run build (every budget line must hold; the section 4 script is 29.5 KB against my 30 KB line). Then npm run build:staging and serve dist with npx wrangler dev --ip 127.0.0.1 --port 8790, and tell me the URL. Do not review the site through npm run dev; dev mode loads too slowly and drops to the flat poster tier. Astro allows one dev server per project.

5. My rules, which never relax without my word: every change on its own branch in a git worktree, merged --no-ff into the default branch and pushed; no pull requests unless I ask; only the agents that write code or assets run on the heavy model, every reviewer, tester and reader runs on a cheaper model; plain text on the scene (no panels, buttons or shadows in section 4); no em dashes, no emoji, no AI product names in files; nothing from the reference sites ships; every picture or video that ships was approved by me first; plain reports with frames at 390 x 844 and 1280 x 800.

6. Then report in plain words: the test and build results, the URL, and the open items from docs/HANDOFF.md section 7 as questions for me, one line each. Do not start new work until I answer.
```
