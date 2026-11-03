// Section 5, the sign-up, as Sam's picture of 2026-11-02 (docs/specs/section-5.md): the copy verbatim from the picture,
// the jar's state from any press order (a repeat adds nothing), the fill's reveal from jars.json's surfaces and its
// lengths, the ground held equal between the page and the island's config, the three follow columns as links to new
// tabs and the star column as none, the two font files and their @font-face rules, no IBM Plex Mono or decode on any
// line, the jars' renders read by name, the script's events and hooks, and the quiz gate's lock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { FILL_GATE, FILL_MS, FOLLOW_COUNT, JARS_DEFAULT, SIGNUP_COPY as C, SIGNUP_FOLLOWS, SIGNUP_JARS, SIGNUP_KEYS, SIGNUP_LEAD_ENDPOINT, SIGNUP_STATES, WORTH_TOTAL, addedLine, fill, fillMs, followAria, jarById, pressFollow, revealSpan, stateOf, yoursAlt, yoursLevel, type JarsManifest } from '../../src/config/signup.ts';
import { SIGNUP_GROUND } from '../../src/config/signup-ground.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const css = read('src/styles/signup.css'), astro = read('src/components/signup/Signup.astro'), dom = read('src/scripts/signup/signup.ts'), fonts = read('src/styles/fonts.css');
/** every order the follows can come in: 16 */
const ORDERS: string[][] = (() => {
  const ids = SIGNUP_FOLLOWS.map((f) => f.id), out: string[][] = [[]];
  const grow = (prefix: string[]) => { for (const id of ids) if (!prefix.includes(id)) { const next = [...prefix, id]; out.push(next); grow(next); } };
  grow([]);
  return out;
})();
const JARS_DIR = new URL('src/assets/signup/jars/', root);
const manifest = (): JarsManifest | null => (existsSync(new URL('jars.json', JARS_DIR)) ? JSON.parse(readFileSync(new URL('jars.json', JARS_DIR), 'utf8')) as JarsManifest : null);

test('the copy, verbatim from the picture top to bottom: the curly apostrophe everywhere, the footer\'s three full stops, no em dash, no emoji', () => {
  assert.equal(`${C.h1}\n${C.h2}`, 'YOU’VE MADE IT\nTHIS FAR.');
  assert.equal(C.subLead + C.subBold + C.subMid + C.subTail, 'All that’s left to do is save up to 20% off your first order. Click each icon below to visit and follow our page. Collect a colour with every follow, and unlock bigger discounts.');
  assert.equal(C.subBold, 'save up to 20% off your first order.', 'the bold run');
  assert.equal(C.jars, 'EVERY FOLLOW FILLS THE JAR');
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.label), ['5% OFF', '5% OFF', '10% OFF']);
  assert.deepEqual([C.starLead, C.starWorth], ['UP TO', '20% OFF']);
  assert.equal(C.got, 'GOT YOUR COLOURS?');
  assert.equal(C.gotLead + C.gotTail, 'Drop your email below. We’ll verify your follows and send your colour codes straight to your inbox when we launch.');
  assert.equal(C.email, 'Your email address');
  assert.equal(C.send, 'SAVE MY DISCOUNTS');
  assert.equal(C.keep, 'Pssst...keep following to keep your savings!');
  assert.doesNotMatch(C.keep, /…/, 'three full stops, not an ellipsis character');
  for (const [k, s] of Object.entries(C)) {
    assert.doesNotMatch(s, /'/, `${k}: the curly apostrophe U+2019, never a straight one`);
    assert.doesNotMatch(s, /[–—]/, `${k}: no em or en dash`);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${k}: no emoji`);
    assert.doesNotMatch(s, /\bcolor\b/i, `${k}: colour with a u`);
  }
  // the markup prints each line once, in the picture's order, the picture's breaks after "below" and "send"
  const order = ['{C.h1}', '{C.h2}', '{C.subLead}<strong>{C.subBold}</strong>{C.subMid}<br class="su-br">{C.subTail}', '{C.jars}', '{j.label}', '{C.starLead}', '{C.starWorth}', '{C.got}', '{C.gotLead}<br class="su-br">{C.gotTail}', 'placeholder={C.email}', '{C.send}', '{C.keep}'];
  let at = 0;
  for (const s of order) { const k = astro.indexOf(s, at); assert.ok(k > at, `${s} after the line before it`); at = k; }
  // nothing else shows: no credit line, no counts, no follow words; the one addition is the consent tick (DPDP Act, Sam
  // 2026-11-03: "yeah add that"), required, its words the quiz's, sent with the lead
  assert.doesNotMatch(astro, /su-credit|Pentristo|sketchfab|su-count|su-state|Follow on|Subscribe on/i);
  assert.match(astro, /<input type="checkbox" id="suConsent" name="consent" required/);
  assert.equal(C.consent, 'I’m happy to hear from Skreed by email.');
  assert.match(read('src/scripts/signup/form.ts'), /consent: 'yes'/);   // the form's own chunk since the email code (2026-11-03)
});

test('the follows (D6): the three addresses, Facebook a quarter of blue, YouTube a quarter of red, Instagram a half of the mixed lot, each column one link to a new tab named for assistive technology, the star column no link', () => {
  assert.deepEqual(SIGNUP_JARS.map((j) => j.id), ['facebook', 'youtube', 'instagram']);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => j.url), ['https://www.facebook.com/skreedofficial', 'https://www.youtube.com/@skreedofficial', 'https://www.instagram.com/skreedofficial']);
  assert.deepEqual(SIGNUP_FOLLOWS.map((j) => [j.letter, j.worth, j.colour]), [['f', 1, 'Blue'], ['y', 1, 'Red'], ['i', 2, 'Pink and purple']]);
  assert.equal(FOLLOW_COUNT, 3); assert.equal(WORTH_TOTAL, 4);
  assert.deepEqual(SIGNUP_FOLLOWS.map(followAria), ['Follow Skreed on Facebook, 5% off (opens in a new tab)', 'Subscribe to Skreed on YouTube, 5% off (opens in a new tab)', 'Follow Skreed on Instagram, 10% off (opens in a new tab)']);
  // the follow columns: one <a> each, target _blank and rel noopener, the column's accessible name; the star column a group, no link inside
  assert.match(astro, /<a class="su-col su-follow" href=\{j\.url\} target="_blank" rel="noopener" data-id=\{j\.id\} aria-label=\{j\.aria\}>/);
  assert.equal((astro.match(/<a\b/g) ?? []).length, 1, 'one link template, rendered once per follow');
  const star = astro.slice(astro.indexOf('<div class="su-col su-yours"'), astro.indexOf('{LEADS && (', astro.indexOf('<div class="su-col su-yours"')));
  assert.ok(star.length > 0, 'the star column');
  assert.doesNotMatch(star, /<a\b|href=/, 'the star column is not a link');
  assert.match(star, /role="group" aria-label=\{C\.yoursAria\}/);
  assert.equal(SIGNUP_KEYS.follows, 'skreed:signup-follows', 'the visit\'s follows under the existing key');
  assert.equal(SIGNUP_LEAD_ENDPOINT, '/api/signup');
});

test('the state (D6, C2): one name per press order, sixteen in all, a repeat press adds nothing, unknown ids are ignored', () => {
  assert.equal(ORDERS.length, 16);
  const names = ORDERS.map(stateOf);
  assert.equal(new Set(names).size, 16);
  assert.deepEqual([...names].sort(), [...SIGNUP_STATES].sort());
  assert.deepEqual([...SIGNUP_STATES], ['0', 'f', 'y', 'i', 'fy', 'fi', 'yf', 'yi', 'if', 'iy', 'fyi', 'fiy', 'yfi', 'yif', 'ify', 'iyf']);
  assert.equal(stateOf([]), '0');
  assert.equal(stateOf(['facebook', 'youtube']), 'fy', 'Sam\'s example: blue, then red on top');
  assert.equal(stateOf(['instagram', 'facebook', 'youtube']), 'ify');
  assert.equal(stateOf(['nobody', 'youtube', 'youtube']), 'y');
  // a press: the follows after it; the same array back when the platform was pressed already (its page opens again, nothing is added)
  const a = pressFollow([], 'facebook'), b = pressFollow(a, 'youtube'), c = pressFollow(b, 'facebook');
  assert.deepEqual([a, b], [['facebook'], ['facebook', 'youtube']]);
  assert.equal(c, b, 'a repeat press returns the follows unchanged');
  assert.equal(pressFollow(b, 'myspace'), b);
  for (const o of ORDERS) {
    let f: readonly string[] = [];
    for (const id of o) { f = pressFollow(f, id); f = pressFollow(f, id); }
    assert.equal(stateOf(f), stateOf(o), `${stateOf(o)} pressed twice each`);
  }
  assert.deepEqual([yoursLevel([]), yoursLevel(['facebook']), yoursLevel(['facebook', 'youtube']), yoursLevel(['instagram']), yoursLevel(['facebook', 'youtube', 'instagram'])], [0, 0.25, 0.5, 0.5, 1]);
  assert.equal(yoursAlt([]), 'Your jar, empty.');
  assert.equal(yoursAlt(['facebook', 'youtube']), 'Your jar, half full, from the bottom: blue, then red.');
  assert.equal(yoursAlt(['youtube', 'instagram', 'facebook']), 'Your jar, full, from the bottom: red, then pink and purple, then blue.');
  assert.equal(addedLine('facebook', false), 'Blue added to your jar.');
  assert.equal(addedLine('instagram', true), 'Pink and purple added to your jar. Your jar is full.');
  assert.equal(fill(C.done, { email: 'a@b.co' }), 'Done. Your colours are saved to a@b.co.');
});

test('the fill (D6): the reveal from the current state\'s seam (its surface top where there is none) to the new one\'s, read from jars.json, upward; 900 ms a quarter and 1400 ms a half; the gate 500 ms and 300 ms', () => {
  assert.deepEqual({ ...FILL_MS }, { quarter: 900, half: 1400 });
  assert.deepEqual([fillMs('facebook'), fillMs('youtube'), fillMs('instagram')], [900, 900, 1400]);
  assert.deepEqual({ ...FILL_GATE }, { afterPress: 500, afterVisible: 300 });
  // the span by itself
  const m = { states: { '0': { top: 0.83 }, f: { top: 0.72, seam: 0.78 }, fy: { top: 0.61 } } };
  assert.deepEqual(revealSpan(m, '0', 'f'), { from: 83, to: 72 }, 'no seam: from the surface top');
  assert.deepEqual(revealSpan(m, 'f', 'fy'), { from: 78, to: 61 }, 'from the seam, below which the two renders agree, so the start never jumps');
  assert.equal(revealSpan(m, 'fy', 'fyi'), null, 'an unknown surface: the fill is set at once');
  // against the renders' manifest, when it is in: every state's reveal from its prefix runs upward, inside the frame
  const j = manifest();
  if (!j) return;
  assert.deepEqual(Object.keys(j.frame).sort(), ['h', 'w']);
  for (const k of ['x0', 'x1', 'y0', 'y1'] as const) assert.ok(j.jar[k] >= 0 && j.jar[k] <= 1, `jar.${k} a fraction of the frame`);
  for (const s of SIGNUP_STATES) {
    if (s === '0' || !j.states[s] || !j.states[s.length === 1 ? '0' : s.slice(0, -1)]) continue;
    const prev = s.length === 1 ? '0' : s.slice(0, -1), span = revealSpan(j, prev, s);
    assert.ok(span, `${prev} to ${s}`);
    assert.equal(span!.from, Math.round((j.states[prev].seam ?? j.states[prev].top) * 10000) / 100);
    assert.equal(span!.to, Math.round(j.states[s].top * 10000) / 100);
    assert.ok(span!.to <= span!.from, `${prev} to ${s}: the surface rises`);
  }
  // C2's frame as the fallback when the manifest is missing
  assert.deepEqual(JARS_DEFAULT.frame, { w: 400, h: 480 });
});

test('the ground (D4, C1): --su-ground in signup.css is SIGNUP_GROUND, the island\'s flat ground lets the page leave it to the canvas, the falloff behind the jar row alone', () => {
  assert.equal(SIGNUP_GROUND, '#F2EAE1');
  assert.equal(read('src/config/signup-ground.ts').split('\n').filter(Boolean).length, 3, 'C1: three lines');
  const m = css.match(/--su-ground:\s*(#[0-9A-Fa-f]{6})/);
  assert.ok(m, '--su-ground in signup.css');
  assert.equal(m![1].toUpperCase(), SIGNUP_GROUND.toUpperCase());
  assert.match(css, /\.signup \{[^}]*background: var\(--su-ground\);/);
  assert.match(css, /\.signup\[data-ground="island"\] \{ background: transparent; \}/);
  assert.match(css, /--su-fall-0: #EFE8DF;.*--su-fall-4: #E7E0D5;/);
  assert.doesNotMatch(css, /box-shadow|backdrop-filter|text-shadow/, 'no shadows, no blur panels');
});

test('the type (D3): the two font files exist, unchanged sizes, their @font-face rules point at them; every line in Inter or Jost, none in IBM Plex Mono, no decode', () => {
  const inter = new URL('public/fonts/inter-opsz-wght-latin.woff2', root), jost = new URL('public/fonts/jost-wght-latin.woff2', root);
  assert.ok(existsSync(inter) && existsSync(jost));
  assert.equal(statSync(inter).size, 72920); assert.equal(statSync(jost).size, 26576);
  assert.match(fonts, /@font-face \{ font-family: "Inter"; font-weight: 100 900; font-style: normal; font-display: swap;\s+src: url\(\/fonts\/inter-opsz-wght-latin\.woff2\) format\("woff2"\) tech\("variations"\),\s+url\(\/fonts\/inter-opsz-wght-latin\.woff2\) format\("woff2"\); unicode-range: U\+0000-00FF,/);
  assert.match(fonts, /@font-face \{ font-family: "Jost"; font-weight: 100 900; font-style: normal; font-display: swap;\s+src: url\(\/fonts\/jost-wght-latin\.woff2\) format\("woff2"\) tech\("variations"\),\s+url\(\/fonts\/jost-wght-latin\.woff2\) format\("woff2"\); unicode-range: U\+0000-00FF,/);
  assert.doesNotMatch(css, /IBM Plex Mono|text-transform/, 'no section 5 line in Plex, nothing set in capitals by CSS');
  assert.doesNotMatch(astro, /data-dc/, 'no decode');
  assert.doesNotMatch(dom, /createDecoder|quiz\/decode/);
  // the faces per line (the picture's match)
  const face = (sel: string) => { const r = css.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{[^}]*font: (\\d+) [^/]+/ [^ ]+ var\\((--su-\\w+)\\)`)); return r ? `${r[2]} ${r[1]}` : null; };
  assert.equal(face('.su-sub'), '--su-inter 400');
  assert.equal(face('.su-every'), '--su-jost 400');
  assert.equal(face('.su-worth'), '--su-inter 300');
  assert.equal(face('.su-got-h h3'), '--su-inter 300');
  assert.equal(face('.su-grey'), '--su-inter 400');
  assert.equal(face('.su-keep'), '--su-jost 400');
  assert.match(css, /\.su-h \{ font: 300 calc\(100cqw \/ 7\.25\) \/ 0\.82 var\(--su-inter\); letter-spacing: -0\.021em;/);
  assert.match(css, /--su-inter: "Inter", Arial, sans-serif;/); assert.match(css, /--su-jost: "Jost", Arial, sans-serif;/);
  // the picture's colours
  for (const hex of ['#5A544D', '#3F3935', '#27211F', '#49443F', '#77706A', '#AFA9A5', '#AEA8A3', '#5C5650', '#A49B99']) assert.match(css, new RegExp(hex), hex);
});

test('the jars (C2): read by name with import.meta.glob, each state only with all four files, AVIF then WebP, 200w and 400w, lazy and async with explicit sizes; jar 4 two stacked layers', () => {
  const srcsMod = read('src/scripts/signup/jar-srcs.ts');
  assert.match(srcsMod, /import\.meta\.glob<string>\('\.\.\/\.\.\/assets\/signup\/jars\/\*\.\{avif,webp\}', \{ eager: true, query: '\?url', import: 'default' \}\)/);
  for (const part of ['frame', 'jar', 'states']) assert.match(srcsMod, new RegExp(`import\\.meta\\.glob<JarsManifest\\['${part}'\\]>\\('\\.\\.\\/\\.\\.\\/assets\\/signup\\/jars\\/jars\\.json', \\{ eager: true, import: '${part}' \\}\\)`), `jars.json's ${part} by its named export, so the script's chunk carries the states' tops alone`);
  assert.match(srcsMod, /return a1 && a2 && w1 && w2 \? \{ a: `\$\{a1\} 200w, \$\{a2\} 400w`, w: `\$\{w1\} 200w, \$\{w2\} 400w`/);
  assert.match(astro, /import \{ JARS, SIZES, STATE_SRCS \} from '\.\.\/\.\.\/scripts\/signup\/jar-srcs\.ts';/, 'the page lays the jars out from the same table');
  assert.match(dom, /import \{ SIZES, STATE_SRCS, STATE_TOPS, type Srcs \} from '\.\/jar-srcs\.ts';/, 'the script reads the same table, so the sixteen states\' URLs ride its chunk');
  assert.doesNotMatch(astro, /data-jars|JSON\.stringify\(STATE_SRCS\)|set:html=\{[^}]*STATE_SRCS|define:vars=\{[^}]*STATE_SRCS/, 'no table of URLs in the first view\'s markup, under any name');
  assert.match(srcsMod, /const frame = \/\* @__PURE__ \*\/ first\(frames\), box = \/\* @__PURE__ \*\/ first\(boxes\);/, 'the frame and the box are read as pure, so the script\'s chunk drops them with JARS');
  assert.match(astro, /<source type="image\/avif" srcset=\{j\.pic\.a\} sizes=\{SIZES\} \/>\s+<source type="image\/webp" srcset=\{j\.pic\.w\} sizes=\{SIZES\} \/>\s+<img src=\{j\.pic\.s\} alt="" width=\{W1\} height=\{H1\} loading="lazy" decoding="async" \/>/);
  assert.match(astro, /data-layer="cur"/); assert.match(astro, /data-layer="next" hidden/);
  assert.doesNotMatch(astro.replace(/<style is:inline set:html=\{frameCss\}><\/style>/, ''), /\sstyle=/, 'no style attribute (the CSP)');
  const files = existsSync(JARS_DIR) ? readdirSync(JARS_DIR) : [];
  for (const f of files.filter((n) => /\.(avif|webp)$/.test(n))) assert.match(f, /^jar-(0|[fyi]{1,3})-(1x|2x)\.(avif|webp)$/, `${f}: C2's name`);
});

test('the script (C3, C4, C5): the fill by clip-path, the visibility gate, the events, data-ready, the hooks behind the constant, nothing of the island\'s jar', () => {
  assert.match(dom, /nxt\.animate\(\[\{ clipPath: `inset\(\$\{span\.from\}% 0 0 0\)` \}, \{ clipPath: `inset\(\$\{span\.to\}% 0 0 0\)` \}\], \{ duration: ms, easing: 'ease-out', fill: 'forwards' \}\)/);
  assert.match(dom, /const under = cur\.animate\(\[\{ clipPath: `inset\(0 0 calc\(\$\{100 - span\.from\}% - 1px\) 0\)` \}, \{ clipPath: `inset\(0 0 calc\(\$\{100 - span\.to\}% - 1px\) 0\)` \}\], \{ duration: ms, easing: 'ease-out', fill: 'forwards' \}\);/, 'the old layer clipped to the complement on the same clock, 1 px past the edge, so no pixel composites twice and no hairline of ground shows');
  assert.match(dom, /under\.cancel\(\);\n\s+if \(end === 'cancelled'\) return;/, 'both clips gone at the reveal\'s end, on a reset too');
  assert.match(dom, /const tops = \{ states: STATE_TOPS \};/, 'the reveal reads the renders\' tops and seams as jars.json gives them');
  assert.match(dom, /reducedMQ\.matches \|\| !span \? 0 : fillMs\(id\)/, 'at once under reduced motion');
  assert.match(dom, /document\.visibilityState !== 'visible'/);
  assert.match(dom, /new CustomEvent\('skreed:signup', \{ detail: \{ id, follows: \[\.\.\.follows\] \} \}\)/);
  assert.match(dom, /new CustomEvent\('skreed:signup-filled', \{ detail: \{ state \} \}\)/);
  assert.match(dom, /root\.dataset\.ready = '1'/);
  assert.match(dom, /READY_MS = 4000/);
  assert.match(dom, /if \(import\.meta\.env\.PUBLIC_HERO_HOOKS === '1'\) \{\n\s+window\.__skreedSignupHooks = \{/);
  assert.doesNotMatch(dom, /__skreedSignup\b|data-pouring|dataset\.pouring|createDecoder|stillFiles/, 'nothing of the island\'s jar');
  // the island's word on a change (hero/loop.ts): the body under a seam's cloud with the cover, back at rest
  assert.match(dom, /window\.__skreedSignupFrame = \(f\) => \{/);
  assert.match(dom, /addEventListener\('skreed:room-state'/, 'the wrap announcement');
  assert.match(dom, /if \(window\.__skreedLogo\?\.setTone\) window\.__skreedLogo\.setTone\(on\);/, 'the logotype turns Urban Slate over the cream ground on the poster tier, through the logotype\'s own setTone');
  assert.match(dom, /setTone\(r\.top < mid && r\.bottom > mid\)/, 'while the section\'s ground is under the logotype\'s middle');
  assert.match(dom, /if \(on === \(logo\.dataset\.tone === 'light'\)\) return;/, 'the tone read from the logotype, never from a stale flag');
  assert.doesNotMatch(astro, /suLoopEnd|su-loopend|suFade|su-fade/, 'nothing follows the body and nothing loops from it (2026-11-03): no empty screen, no fade');
  assert.doesNotMatch(css, /su-loopend|su-fade/);
  assert.doesNotMatch(dom, /room_loop|suFade|IntersectionObserver\(\(es\) => \{\n\s+if \(!isPoster\(\) \|\| fading/, 'the script runs no loop from the section\'s end');
  assert.match(astro, /<div class=\{LEADS \? 'su-body' : 'su-body su-noform'\} id="suBody">/, '.su-body the one-screen block');
  assert.match(css, /\.su-body \{[^}]*min-height: 100svh;/);
});

test('(8) the lock (quiz-gate.md D9): section 5 rendered hidden and data-locked with section 4, its inline step after the markup from QUIZ_GATE.key, opened by the same unlock, and the no-JS rule', () => {
  const inline = read('src/inline/signup-gate.inline.js'), gate = read('src/scripts/quiz/gate.ts');
  assert.match(astro, /<section class="signup" id="signup" aria-label=\{C\.aria\} data-state="rest" hidden data-locked>/, 'rendered locked on every tier');
  assert.match(astro, /const gateCode = inlineScript\('signup-gate\.js', \{ KEY: QUIZ_GATE\.key \}, gate\);/, 'the step assembled from the key, no hooks part of its own');
  assert.match(astro, /<\/section>\n<script is:inline set:html=\{gateCode\}><\/script>/, 'the step right after the section');
  assert.match(inline, /if \(v === '1' \|\| o\) \{ s\.removeAttribute\('hidden'\); s\.removeAttribute\('data-locked'\); s\.setAttribute\('data-open', 'visit'\); \}/, 'opened for a visit that opened the room');
  assert.match(gate, /const s = document\.getElementById\('signup'\);\n\s*if \(s\) \{ s\.removeAttribute\('hidden'\); s\.removeAttribute\('data-locked'\); s\.dataset\.open = by; \}\n\s*flag\(\);/, 'the unlock opens section 5 with the room');
  assert.match(css, /html:not\(\.js\) \.signup\[data-locked\] \{ display: block; \}/, 'without JavaScript nothing is locked');
  assert.doesNotMatch(css, /\.signup \{[^}]*display:/, 'signup.css sets no display on .signup itself');
  assert.ok(jarById('facebook'));
});
