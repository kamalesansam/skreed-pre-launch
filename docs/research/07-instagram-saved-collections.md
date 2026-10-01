# Sam's Instagram saved collections: "claude", "devv", "web design"

Source: Instagram data export from @kamalesan_sam (saved_collections.json), 2026-10-01. 149 posts across the three collections. Every caption was read. Where a caption only says "comment X for the link", the named tool is recorded and, where it matters for this project, verified by web search. Other collections in the export ("skreed " 34, "marketing" 5, "projects" 7, "to apply" 185, "resume" 14, "build and learn and look " 14) were not requested and are untouched; the "skreed " and "marketing" ones are probably worth a pass later.

## What we take into the Skreed build (the short list)

**Claude Code setup for the build (install on day 1)**
- A single taste layer: `impeccable` (pbakaus, 18 skills, `/impeccable`) or `taste-skill` (Leonxlnx, DESIGN_VARIANCE / MOTION_INTENSITY dials). Pick one. Posts 17, 45, 123 all converge on this.
- `web-design-guidelines` from vercel-labs/agent-skills: audits UI code against Vercel's 100+ interface and accessibility rules, file:line output. Run before every push.
- `animate` skill for motion that doesn't look cheap (post 45).
- From Owl-Listener/designer-skills (post 8): the `ui-design` plugin (`color-palette`, `type-system`), `visual-critique` (`critique-screen`) and `designer-toolkit` (UX writing). Not the research or ops plugins.
- Playwright MCP / CLI so Claude screenshots what it built and grades its own work (posts 17, 45). This is the feedback loop that makes the "loop engineering" idea in posts 28 and 30 real.
- 21st.dev MCP for 12,000+ React/Tailwind components when a section needs a polished primitive (posts 17, 92).
- Graphify (Graphify-Labs/graphify) to cut token use once the repo grows; Context7 MCP for current library docs (posts 4, 92).
- A security pass before launch: a security skill (StackHawk agent-skills or UnitOneAI SecuritySkills stand in for the "never-get-hacked" skill named in post 92), plus the vibe-coder checklist from posts 43, 113, 116, 141: no hard-coded keys, verify webhook signatures, reject unexpected content types, rate limit, no public DB.
- PostHog MCP so Claude can read the funnel numbers during the campaign and suggest fixes (post 71). Matches the PostHog choice already in the stack.
- Remotion with Claude Code for the shade-cycle loops and social teasers (posts 42, 112). Already in the assets plan.

**Component and animation libraries worth pulling from**
- The three libraries Sam flagged to try (sites are blocked from the build sandbox, so these notes come from search results and the post captions; verify on the sites):
  - **Skiper UI** — https://skiper-ui.com/ — 70+ motion-ready React components on shadcn/ui, Framer Motion + GSAP, open source with a $129 premium pack. Look for: scroll-stacked cards, pricing/feature sections, text reveals. Candidate source for the quiz card stack and the "Basic vs Beyond Basic" comparison slider.
  - **Animaster Lib** — https://animmasterlib.dev/ — 300+ animated components launched July 2026: WebGL + GSAP, 3D shaders, scroll animations, mouse tracking. Look for: a mesh-gradient or liquid background, a grid reveal, an image-tilt card. Candidate reference for the Wall stagger and the tilt gloss/matte card. Check bundle size per component before copying anything.
  - **Three UI** — https://threeui.com/browse — Three.js / WebGL components. Look for: a product turntable, a material/colour switcher, a shader background. Only relevant if the 3D case upgrade is picked after the spine ships; still worth a look for the shader background idea.
  - Posts 9, 10, 95, 137, 140, 143, 147, 149 are all variations of "these libraries make a site feel premium". Use them as reference for the Wall, the splitter hero and the tilt card, not as a dependency pile; the stack stays Astro + GSAP. Anything copied in gets ported to vanilla GSAP or lives inside one of the two React islands.
- endlesstools.io for quick 3D key visuals (type + materials + lighting, exports GLB/USDZ/web embed, 8K, commercial use). Useful for a hero visual or social assets without Blender (post 148).
- Free texture packs (post 147) for the matte grain layer.

**Launch hygiene checklist (devv)**
- Before launch: Google Search Console, Bing Webmaster, sitemap, IndexNow, OG tags (posts 36, 119).
- Polish: skeleton loaders, caching, optimistic UI, tooltips (posts 103, 120). For the teaser: skeleton the Wall and the counters.
- Design every UI state: empty, loading, error, offline, slow network, no results, permission denied, session expired, validation, success (post 139). The reserve form and the camera/upload flow need all of these.
- DB basics before the leads table takes traffic: indexes, pagination, connection pool, no `SELECT *` (post 135). Supabase handles pooling; add the unique indexes and an index on referral_code.
- Deploy via GitHub → Vercel/Cloudflare, previews per PR (posts 114, 127). Already the plan.
- "20 things to tell Claude before launching" (post 136) and "16+ things you still own after AI wrote the code" (post 126): no captions, but the pattern is the day-14 QA matrix in the build plan.

**Content and growth tooling (relevant to the campaign, not the site)**
- Higgsfield via MCP / ChatGPT plugin for UGC-style product video and photography (posts 13, 84). Caveat from the assets report stands: never let a generator draw the case.
- Sandcastles.ai plugin + "Topic Leaderboard" skill for outlier detection on competitor reels into Notion/Slack (post 27). Useful for the IG content system that went dark in September.
- Humanizer skill (posts 12, 82) for captions; "LinkedIn OS" 11-skill repo (post 12) as the model for a Skreed caption skill.
- Seedance single-prompt 12-second film (post 11) and Qwen / Hunyuan / LM Arena free generation (post 14) for teaser video experiments.
- DAPI (diffusionstudio/dapi): open-source video editing CLI for agents (post 26).

## Animation library list from post 9 (pinned comment)

| Library | The comment's pitch | Our verdict for the teaser |
|---|---|---|
| GSAP | cinematic scroll effects | **Yes, the backbone.** ScrollTrigger, SplitText and Flip are free since 3.13. Covers the hero, the Wall, the manifesto and every scroll beat. See report 02 for the iOS pinning fixes. |
| Motion (motion.dev) | animations that just happen | **Only inside a React island, mini build (~5 KB).** Astro keeps the page static; Motion is for the quiz cards and the share sheet, not page-wide. |
| React Spring | natural-feeling interactions | **No.** Overlaps Motion; two spring libraries in one bundle is waste. Motion's springs do the same job. |
| Three.js | real 3D | **Not in the spine.** Report 02 and the assets report agree: a procedural R3F case is the upgrade path, loaded on tap and gated by GPU tier, after the five spine sections ship. |
| anime.js | tiny details | **No.** GSAP already covers micro-timing; anime v4 is a fine MIT alternative but adds 25 KB for nothing new. |
| Trig JS | scroll animations without slowdown | **No, but the idea is right.** Trig JS is a tiny class-toggling scroll library (iDev-Games/Trig-JS). We get the same zero-JS win from CSS scroll-driven animations (`animation-timeline: view()`) where supported, with GSAP as the fallback. |
| Lenis | premium scrolling | **Desktop only.** Load it behind `(hover: hover) and (pointer: fine)`; never on phones, where native momentum scroll is better and Lenis adds jank risk. |

Net: GSAP + CSS scroll-driven animations do 90% of the work. Motion mini in the two React islands. Lenis on desktop. Nothing else.

## Collection: claude (91 posts)

| # | Post | What it names | Take for Skreed |
|---|---|---|---|
| 1 | reel/Ddo1N7ks4sZ | "comment Claude" only | None |
| 2 | reel/DdAucU_Aynm | Client video made with Krea | Krea for upscaling composites (already in assets report) |
| 3 | reel/Dc_-4BiJuDI | Top 10 SEO tools (gated) | None for a 1-month teaser |
| 4 | reel/DdAThwWjOKb | Graphify, Ponytail, Find Skills, OmniRoute; Graphify halves code read, OmniRoute ~1.5B free tokens/month | Graphify if the repo grows; OmniRoute as a free-token router, verify terms |
| 5 | reel/Dc8SR6hqzs4 | "Did I miss anything?" | None |
| 6 | reel/Dc6ea6URPXr | Building a brand with no marketing budget | Mindset only |
| 7 | reel/Dc6BAeAThkx | Tutorial series, link in bio | None |
| 8 | reel/Dc6GhevhCQN | github.com/Owl-Listener/designer-skills (MIT, 2.8k stars): 273 skills, 76 commands, 33 plugins. Install: `/plugin marketplace add Owl-Listener/designer-skills`, then `/plugin`. Plugins: design-research, design-systems, ux-strategy, ui-design, interaction-design, prototyping-testing, design-ops, designer-toolkit, visual-critique | Install three plugins only: `ui-design` (`color-palette`, `type-system`) to formalise the 240-shade tokens and the catalog type scale, `visual-critique` (`critique-screen`) as a second pair of eyes on each section, `designer-toolkit` for the UX-writing skill on microcopy. Skip the research and ops plugins for a 15-day build. |
| 9 | reel/DbybYnVo7yn | Pinned comment lists: GSAP (gsap.com), Motion (motion.dev), React Spring (react-spring.dev), Three.js (threejs.org), anime.js (animejs.com), Trig JS (github.com/iDev-Games/Trig-JS), Lenis (lenis.dev) | Verdicts below in "Animation library list from post 9" |
| 10 | reel/DcyYJIjBEQr | Skiper UI, Animaster Lib (250+ animated components), ThreeUI (3D/WebGL) | Reference for Wall and hero motion |
| 11 | reel/Dcnk4FoIvUk | Seedance one-prompt 12 s film with time-freeze | Teaser video experiment |
| 12 | reel/DczDlj4qQjI | "LinkedIn OS" for Claude: 11 skills incl. hook formulas and Humanizer | Model for a Skreed caption skill |
| 13 | reel/Dcu-eVENtnj | ChatGPT + Higgsfield plugin for commercials, UGC, product photography | Campaign content |
| 14 | reel/DcQerXqPKO9 | Qwen, Hunyuan, LM Arena free | Video experiments |
| 15 | reel/DcrqbqZRVvC | "Does your site have any of these" (gated) | None |
| 16 | reel/DcsokaUzbEw | Job applications | Off-topic |
| 17 | reel/DcrVYL1xjEX | Five Claude Code design plugins: Taste Skill (76k stars), Web Design Guidelines (Vercel), full design-system skill, 21st Dev MCP (10k+ components), Playwright CLI | Core of the day-1 setup |
| 18 | reel/DcjEohigobV | Claude Code built the frontend with a better setup + browser testing; mentions Three.js | Confirms the loop: setup, test across cases, feel it in the browser |
| 19 | reel/DZpySOnOCxI | github.com/affaan-m/ECC (Everything Claude Code: 28 agents, 119 skills, 60 commands) | Optional harness; heavy for a one-pager |
| 20 | reel/DcG9fwESEuB | "Code like GenZ" | None |
| 21 | reel/DcEtkSDsKw- | Netflix architecture, Open Connect CDN, bitrate ladder | Supports the video codec ladder in the stack report |
| 22 | reel/DcEcRGWBRQn | gbrain: free repo, persistent memory for your AI | Optional |
| 23 | reel/DcBJi5svr1f | Whop ad | None |
| 24 | reel/Db0_61Ez2nv | No caption | None |
| 25 | reel/DcEJDHBTyPY | Vibe-coded site mistakes (gated) | None |
| 26 | reel/Db-yqRcpuAq | DAPI by Diffusion Studio, github.com/diffusionstudio/dapi | Programmatic video for social |
| 27 | reel/DaxdLQbOJXR | Sandcastles.ai plugin + Topic Leaderboard skill, Notion leaderboard, Slack ping | IG content research |
| 28 | reel/DZsVsK_DaTn | Loops: plan / build / review skills, self-grading | Build method; pair with Playwright MCP |
| 29 | reel/DatXEjbI3G2 | Lead-gen "system" (gated) | None |
| 30 | p/DamUUJxjJDC | Loop engineering: DOER + CHECKER | Same as 28 |
| 31 | reel/DadVHTQsCu6 | "Brain" guide (gated) | None |
| 32 | reel/DaF1jc_BZ90 | "Design" link (gated) | None |
| 33 | p/DagEREpuHKc | Leaked system prompt claim | Ignore |
| 34 | reel/DY90HYmBdBc | "Comment Bathroom" | None |
| 35 | reel/DaeoTqXIqwt | Claude Code for free | None |
| 36 | reel/DU0IjA6gnmg | Launch SEO checklist: Search Console, Bing, sitemap, IndexNow, OG tags | Day-15 checklist |
| 37 | reel/DaYRg1FMbf0 | Referral credits site | None |
| 38 | reel/DaRu78VODZM | Meme | None |
| 39 | reel/DaUBmo_BqFu | zenmux.ai free model access | Ignore |
| 40 | reel/DaU_Lz6zVas | Free model claims | Ignore |
| 41 | reel/DW_c9jixcGz | "Marketing" link (gated) | None |
| 42 | reel/DZSJJ9DoPnF | Claude Code + Remotion for promo videos and social animations | Shade-cycle loops |
| 43 | reel/DaN0qLNiE2l | Webhook: verify the request came from the provider, not just the event type | Security checklist |
| 44 | reel/DaN7gavx6CO | Job search repo | Off-topic |
| 45 | p/DaNYCILlDgO | 42 design skills in 6 layers; stack 3-4: frontend-design / impeccable / taste-skill + animate + playwright-mcp | The recommended skill stack |
| 46 | reel/DaNlmaoEofm | "AI builds a site from a name and a colour" (gated prompt) | None |
| 47 | reel/DaNmIwdvLNo | Site to find animated components (part 1056) | Likely 21st.dev / Aceternity-style; see libraries |
| 48 | reel/DZ7izKAu0Pv | Obsidian critique, "second brain" (gated) | None |
| 49 | reel/DaJW_-6RFch | Desk setup: Claude Cowork, Wispr Flow voice, Clicky | Personal workflow |
| 50 | reel/DaLTp7-O-h4 | Matt Pocock skills (mattpocock/skills, in Claude Code marketplace): grills you first, writes failing test, builds to green | Install; useful for the signup edge function |
| 51 | reel/DYBSB8NsFYE | "Pulse" orchestration system | None |
| 52 | reel/DXUUTk8Dh-n | PDF guide (gated) | None |
| 53 | reel/DXpsxCtD-tU | "Jarvis" | None |
| 54 | p/DZxICVGGZAw | 4 LLM projects for jobs | Off-topic |
| 55 | reel/DW7EeMtk-3g | Token usage via "graph" | Graphify again |
| 56 | reel/DXmM2wLkf92 | GitHub links (gated) | None |
| 57 | reel/DYZs9FiDIii | 147 specialist business agents in ~/.claude/agents (90k stars): tax, AI citation strategist, behavioural nudge engine | The nudge-engine agent could review the reserve flow |
| 58 | p/DZSYkKwDAFn | caveman (token cutter), claude-mem (memory), + design/writing/marketing plugins | Optional |
| 59 | reel/DYTJRE6oRwP | Obsidian setup (gated) | None |
| 60 | reel/DYxYwb9xWTm | "OS" setup (gated) | None |
| 61 | reel/DaG44qfPKjS | Internships | Off-topic |
| 62 | reel/DZ1BSCyRtD0 | "system" (gated) | None |
| 63 | reel/DZ0A-1UMEEv | Anthropic hackathon winner's setup: 180+ skills, 47 subagents, 79 commands | Likely ECC again |
| 64 | reel/DaI1UCNCPWw | Claude connectors via the + button | Already using them |
| 65 | reel/DZScXUVtq4I | /council skill: five advisors + chairman (credit @aiwithremy) | Use once on the spine decision |
| 66 | reel/DYtDe8qN-S5 | "Craziest prompt" | None |
| 67 | reel/DWoxW7pjjkH | "brain" PDF (gated) | None |
| 68 | reel/DaIonT1MEsz | planetscale/database-skills (MySQL, Postgres, Vitess, Neki), `npx skills add` | Postgres skill for the leads schema |
| 69 | reel/DaC2XOazNoF | Free model claims | Ignore |
| 70 | reel/DaIVixfRxwk | AI influencer models | Not for Skreed voice |
| 71 | reel/DaIZjwvOgwX | PostHog MCP: product analytics into Claude Code | Install during the campaign |
| 72 | reel/DZ_f-VHqbQM | Stack: Lovable, GitHub, Kiro, Opencode, Claude Code, OpenWork, Paperclip (Jira for agents) | Not needed for one dev |
| 73 | reel/DWd-rFlyGRV | "Repo" (gated) | None |
| 74 | reel/DYFCNqQhAIU | Goose: open-source local agent | None |
| 75 | p/DZpQO0MjSIu | Claude projects (gated) | None |
| 76 | p/DZqPPmiiFxx | "Billionaire AI team" skill (Hormozi, Godin, Brunson...) | Could draft offer/positioning copy; voice must stay Skreed's |
| 77 | reel/DYnNHOMskJT | 5 skills: Renotion, UI UX Pro Max, Dev Browser, Context Engineering, GStack (YC) | UI UX Pro Max is another taste layer; Dev Browser overlaps Playwright |
| 78 | reel/DYnjFMho5xP | Free skills library | None |
| 79 | reel/DYyBYFCIc2h | Cowork repo (gated) | None |
| 80 | reel/DYyThy_obb9 | Anthropic's official plugin that scans the project and recommends MCPs, hooks, subagents | Run once on day 1 |
| 81 | reel/DZdOasQIjia | "AI team" (gated) | None |
| 82 | reel/DZ3AuKBoP6d | Humanizer skill: removes 33 AI patterns | Captions and site copy pass |
| 83 | p/DZsw8pGCFdn | Content automation with Claude (gated) | None |
| 84 | reel/DaGSGxbxgZh | Higgsfield through MCP recreated a reel from one photo | Lifestyle imagery experiments; keep the real case |
| 85 | reel/DZ_x2RiB4gK | Jobs | Off-topic |
| 86 | reel/DYrnfUyxeL8 | "BRAIN" setup (gated) | None |
| 87 | reel/DZKfop6R30d | "Design" website (gated) | None |
| 88 | reel/DZXieCdRnGH | "Sales" link (gated) | None |
| 89 | reel/DZm0Me_R_Yw | "Skills" link (gated) | None |
| 90 | reel/DZ447d8TQY3 | "REPO" (gated) | None |
| 91 | reel/DXZRTR6isu8 | "Github" (gated) | None |

## Collection: devv (44 posts)

| # | Post | What it names | Take for Skreed |
|---|---|---|---|
| 92 | reel/DczvUteRsGJ | 21st.dev, Lighthouse, Context7 MCP, Graphify, never-get-hacked skill | All five are in the day-1 setup list |
| 93 | reel/Dc8cNKASdV2 | Material 3 Expressive web UI builder → prompts for agents (lnkiai/m3e-canvas and forks) | Not our design language |
| 94 | reel/Dctqa5ih5in | "Stop vibecoding fake sites" | None |
| 95 | reel/DaDRFEezrOP | Top 3 UI libraries for premium animated sites | Same as 10 |
| 96 | reel/DcrcgmppKbY | Manus sponsored tools list | None |
| 97 | reel/DccLLkoPCT1 | God's Eye View V1: open-source 3D globe with real plane/ship/satellite data, voice | Reference for a "City Shade" globe if that bench concept is picked |
| 98 | reel/DcEtkSDsKw- | Netflix (duplicate of 21) | As above |
| 99 | reel/DcBhby3sl7_ | Spotify: 4 encodes, CDN, prefetching, precomputed recs, midnight-drop caching | Prefetch the next family's tiles while the user looks at one |
| 100 | reel/DcDqCmTO5qO | AI projects guide (gated) | None |
| 101 | p/DavAU_5iQlh | Meme | None |
| 102 | reel/DZ5Kh_mIRBS | RAG explainer | Not needed |
| 103 | reel/DbJc-RQNN1C | Skeleton loaders, caching, optimistic rendering, tooltips, polish | Polish checklist |
| 104 | reel/DbBqjVNpwTE | Hardware | None |
| 105 | reel/DbA_d13yHcj | "All-in-one resources" site (gated) | None |
| 106 | reel/Da7zM_GpD_S | Deadline reminder | None |
| 107 | reel/Da6-gMhSlHx | LeetCode stats on GitHub | Off-topic |
| 108 | reel/Da5pdmQMeO_ | JS Promises explainer | None |
| 109 | reel/DVQ0yBtjPB2 | Algorithms | None |
| 110 | reel/DaXx10QTKi_ | No caption | None |
| 111 | reel/DanhIzGB_Jx | ASCII GitHub profile with daily GitHub Action | None |
| 112 | reel/DZA31ltv7ml | Claude + Remotion / Antigravity / TradingView / Figma / Apify | Remotion and Figma pairings |
| 113 | reel/DYSSA36Ce8v | Launch failures: no backups, leaked secrets, no rate limiting, public DB, desktop-only UI | Security checklist |
| 114 | reel/Dal04VZILP4 | Deploy with GitHub + Vercel/Netlify | Already the plan |
| 115 | reel/DZLDPGExR-1 | No caption | None |
| 116 | reel/DY54QHoiKlR | Hard-coded keys, AI-generated auth, never asking AI to attack its own code | Add an "attack your own form" pass on day 14 |
| 117 | reel/DUJaAZ7APuS | Dashboard tool + prompt (gated) | None |
| 118 | reel/Dah-YuJzB0- | Better onboarding screens (gated) | None |
| 119 | reel/DU0IjA6gnmg | SEO launch checklist (duplicate of 36) | As above |
| 120 | reel/DYYLYKrC8ZZ | Same polish list as 103 | As above |
| 121 | reel/DXhfJgGkwEY | No caption | None |
| 122 | reel/DZI1ok5Ss4b | 100 free production-ready apps | None |
| 123 | p/DaNYCILlDgO | 42 design skills (duplicate of 45) | As above |
| 124 | p/DaB26ERq-Eu | Hole punch joke | None |
| 125 | reel/DaJuLaWB1-t | Meme | None |
| 126 | reel/DZU89WShuig | 16+ responsibilities you still own after AI writes code | QA mindset |
| 127 | reel/DaIhVI7y52a | Vercel, Fly.io, Render, Railway | Cloudflare already chosen; Vercel Pro is the fallback |
| 128 | reel/DW4bsiLiKzQ | Early-access tool (gated) | None |
| 129 | reel/DaBZc3oJAR7 | 2026 stack: Claude, Claude Code, GitHub, Vercel, Supabase, n8n, trigger.dev, DigitalOcean | Matches ours; n8n could run the Shopify mirror if the edge function is skipped |
| 130 | reel/DXxQS0AO1Km | RuFlow: 60+ agent system with routing | Overkill |
| 131 | reel/DZqoexnsh0w | "Pulse" again | None |
| 132 | reel/DV6FYgbE2_a | Zero-investment startup resources (gated) | None |
| 133 | reel/DZ-Qc6tSxhH | 5 rare projects | None |
| 134 | reel/DZWfFS4xWqP | No caption | None |
| 135 | reel/DaDPJM4x1qM | DB at 500 users: N+1, pagination, indexes, pool, SELECT * | Leads table hygiene |

## Collection: web design (14 posts)

| # | Post | What it names | Take for Skreed |
|---|---|---|---|
| 136 | reel/Db15Zn0hSmH | "20 things to tell Claude before launching" (no list in caption) | Pattern matches the day-15 checklist |
| 137 | reel/DbQmuGhTRTq | 6 animations that make sites look premium (no list in caption) | Likely: text reveal, magnetic buttons, smooth scroll, parallax, hover morph, page transitions; all covered in report 02 |
| 138 | reel/DbA3q18Sp5u | Portfolio tools for 2026 (no list) | None |
| 139 | reel/DbIncYZPisu | 10 UI states checklist | Apply to form, upload, camera and counters |
| 140 | reel/Da2uUOhMGis | "Your site needs better animation, not a redesign" | Thesis for the spine |
| 141 | reel/DaYHzBVj35H | Reject non-JSON content types on the API | Add to the signup worker |
| 142 | reel/DaWuiBsTrh3 | Portfolio resources (gated) | None |
| 143 | reel/DaNmIwdvLNo | Animated components site (duplicate of 47) | As above |
| 144 | reel/DZ9mmeIyt3s | polygram.dev: AI app/website builder with an infinite design canvas | Not for a hand-crafted teaser |
| 145 | p/DZkPlHeE_L7 | 5 hidden-gem design sites (no list in caption) | None |
| 146 | reel/DZalHLZM2FT | Simple components that upgrade UI (Framer; gated) | None |
| 147 | p/DOInYxDkvrs | Free texture packs | Matte grain layer |
| 148 | reel/DO1H-IsiOm6 | endlesstools.io: no-code 3D visuals, materials, effects, interactive embeds | Hero visual / social assets without Blender |
| 149 | reel/DSWCBYCDevb | "Elements to make $10k websites" library (gated) | None |

## Honest read of the collections

Roughly a third of the posts carry no usable content in the caption because the resource is gated behind a comment. Of the rest, the signal is consistent and points one way: give Claude Code a taste layer, a design-guidelines audit, an animation skill and a browser feedback loop, then build with a small set of premium motion patterns rather than a pile of libraries. That is already how the plan is written; these posts confirm it and name the specific tools to install.
