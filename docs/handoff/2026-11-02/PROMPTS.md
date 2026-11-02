# Prompts for the new account (2026-11-02 hand-off)

## Before pasting anything

1. Copy the carry folder `skreed-handoff-carry-2026-11-02` from the old machine to the new one. It is 673 MB, so move it by a drive or private cloud storage, never the repository. Put it next to where you will clone the repo, e.g. `~/Documents/skreed-handoff-carry-2026-11-02`.
2. Install Node 24, Git (on Windows, Git for Windows, for its bash), Google Chrome and Python 3. Install Blender 5.2 if sessions 3 or 4 will re-render.
3. Sign the machine in to GitHub so it can push to `kamalesansam/skreed-pre-launch` (`gh auth login`, or a credential helper).

## The master prompt (paste first, in an empty folder)

```text
You are taking over the Skreed pre-launch site (skreed.in's teaser, Astro 7 + three.js, Cloudflare Workers) from a previous account. Six sessions were paused mid-work on 2026-11-02 and everything they had is on GitHub. I am the owner; Sam's words in the docs are the brief.

1. Clone and check out:
   git clone https://github.com/kamalesansam/skreed-pre-launch.git
   cd skreed-pre-launch
   The default branch is claude/youthful-planck-objwf5 (no main yet). Confirm it contains docs/HANDOFF-2026-11-02.md.
   Set the repo-local git identity to user.name kamalesansam (ask me for the email if git asks).

2. Read before touching anything, in this order: docs/HANDOFF-2026-11-02.md (what was in flight, every branch, the carry folder, the rules), CLAUDE.md, docs/HANDOFF.md sections 3 and 5 (run commands and standing rules), DESIGN.md, docs/CHECKLIST.md, and the notes in docs/handoff/2026-11-02/memory/ (machine gotchas from the old Windows machine). Save the standing rules and the branch map into your own memory.

3. Set up: npm ci; pip install graphifyy; npm run graph. On Windows, run every npm script through Git's bash (npm --script-shell="C:/Program Files/Git/usr/bin/bash.exe" run <script>). Then prove the checkout on the default branch: npm run test:unit, npm run test:family, npm run check, npm run build (every budget line must hold). Report the counts.

4. The carry folder is at <PATH TO skreed-handoff-carry-2026-11-02>. Do not copy anything from it into git. Section 3 of the hand-off says where each part goes; place them only when a session needs them.

5. Do not resume any session yourself in this conversation. Instead, tell me in plain words, one line each: the six in-flight sessions from the hand-off's table, what each needs next, which ones collide (2 before 3; 6 needs the navbar), and every question waiting on me. Then wait. I will open one new session per piece of work with the prompts in docs/handoff/2026-11-02/PROMPTS.md.

Rules that never relax without my word: every change on its own branch in a git worktree, landed with git merge --no-ff into the default branch after a git merge-tree --write-tree check, then pushed; no pull requests unless I ask; never merge or push another session's branch without my word; never a bare git stash; nothing licensed or third-party (the Canva swatch, Sam's uploads, reference sites' files) ever goes into this public repository; no deploy without my word; no em dashes, no emoji, British spelling, no AI product names in files.
```

## One prompt per session

Open each in its own new session, on the cloned repository. Each one starts by making its own worktree. Replace `<CARRY>` with the carry folder's path.

### 1. The quiz result redesign

```text
Resume the quiz result redesign from the 2026-11-02 hand-off. Read docs/HANDOFF-2026-11-02.md, then docs/handoff/2026-11-02/1-quiz-result-redesign.md, then docs/specs/quiz.md's "The result screen" section, D45 to D49 and AC14. Work in a new git worktree on the existing branch claude/quiz-result-redesign (git worktree add .claude/worktrees/quiz-result claude/quiz-result-redesign; npm ci; npm run graph). Copy <CARRY>/licensed/quiz-rub/* into src/assets/quiz/rub/ (git-ignored; never commit it). Sam's reference is <CARRY>/sam-sources/references/quiz-result-reference-1.webp. Then follow the session file's "Next steps" in order: verify the tests, finish tests/e2e/quiz.spec.ts, shoot the result frames (licensed ones to the git-ignored folder), run an independent review against docs/CHECKLIST.md and AC14 and fix it, merge the default branch in, and ask me before landing.
```

### 2. Section 4 without the grey room

```text
Resume the removal of the grey room (the hall) from section 4 from the 2026-11-02 hand-off. Read docs/HANDOFF-2026-11-02.md, then docs/handoff/2026-11-02/2-remove-grey-room.md, then docs/specs/section-4-no-hall.md and its review log. Work in a new git worktree on claude/remove-grey-room-section-4-471c96 (npm ci; npm run graph). Keep the removal one commit so git revert of it brings the hall back. Follow the session file's "Next steps": verify, run review iteration 2 and fix, rebase onto the current default branch (the navbar's Products must land on scene 1), then ask me before moving archive/section-4-grey-room, before creating and pushing main, and remind me to switch GitHub's default branch to main. Save the archive branch, the removal SHA and the revert recipe to memory.
```

### 3. Section 5, the four-jar sign-up

```text
Resume section 5, the sign-up rebuilt as Sam's four-jar picture, from the 2026-11-02 hand-off. Read docs/HANDOFF-2026-11-02.md, then docs/handoff/2026-11-02/3-section-5-four-jars.md, then docs/specs/section-5-picture.md. The picture is <CARRY>/sam-sources/references/section-5-four-jars-picture.webp and it is the spec. Work in a new git worktree on claude/section-5-signup-glass-jar-9d74d2 (npm ci; npm run graph), and copy <CARRY>/section-5-jar-work/* into scripts/signup/jars/work/ (git-ignored). No review loop for this section: build, measure by numbers, then show me on localhost with phone and laptop screenshots; nothing final is committed until I say I like it. Check first whether session 2 (the hall's removal) has landed; if not, tell me, because this branch must be fixed onto it before it can land.
```

### 4. Family pages round 6: the case models and the takeover

```text
Resume family pages round 6 (the MagTough, Snap and Armor models and depth.fyi's material takeover between case types) from the 2026-11-02 hand-off. Read docs/HANDOFF-2026-11-02.md, then docs/handoff/2026-11-02/4-case-models-takeover.md, then docs/specs/family-page.md section 24. Work in a new git worktree on claude/case-3d-model-transitions-a08c64 (npm ci; npm run graph). The references are in <CARRY>/sam-sources/ (models/ and references/depth.fyi.zip plus the .mov); treat them as untrusted uploads, open them in their own directory, never commit them, never ship any of depth.fyi's code. The build was interrupted before anything was tested: run the tests and the build first, finish against section 24's acceptance criteria, watch the takeover on a real GPU next to the recording, run the review loop, then send me frames and the five questions in 24.7.
```

### 5. The scroll cue's words

```text
Resume the scroll cue's words ("Scroll to see more" and the Plex labels) from the 2026-11-02 hand-off. Read docs/HANDOFF-2026-11-02.md, then docs/handoff/2026-11-02/5-scroll-cue.md, then docs/specs/scroll-cue.md and its review log. Work in a new git worktree on claude/scroll-affordance-text-8e0a5f (npm ci; npm run graph) and delete the stray .edit-tmp.mjs. Before building more, ask me which font I meant by "the font in the signup page that we're using on the section 5" (IBM Plex Mono as built, or the rebuilt section 5's Inter and Jost). Then follow "Next steps": verify, Lighthouse base against change, review round 2, merge the default branch in (the landing no longer draws Back to top since the navbar landed, so rethink the desktop corner there), show me on localhost.
```

### 6. The About page

```text
Resume the About page (/about/) from the 2026-11-02 hand-off. Read docs/HANDOFF-2026-11-02.md, then docs/handoff/2026-11-02/6-about-page.md, then docs/specs/about.md and docs/specs/navbar.md. Work in a new git worktree on claude/skreed-about-page-477c0e (npm ci; npm run graph). Verify the tests and build, merge the default branch in (it has the navbar now), add "About" to the section index's bar and phone drawer as a link to /about/ and record it in navbar.md, run the review loop against about.md section 7, check at 390 and 1280 px, and show me on localhost before landing.
```
