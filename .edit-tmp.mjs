import fs from 'node:fs';
const f = 'tests/unit/scroll-cue.test.ts';
let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, b); };
rep(`import { cueWordsOn, REST_EPS, type CueWordsIn } from '../../src/scripts/hero/scroll/cue-words.ts';`,
`import { cueWordsOn, REST_EPS, type CueWordsIn } from '../../src/scripts/hero/scroll/cue-words.ts';
import { landClear } from '../../src/scripts/family/cue.ts';
import { solve } from '../../src/scripts/family/three/pose.ts';`);
rep(`y: screens * VH, vh: VH, restMs: CUE.stillMs, tp: Math.min(1, Math.max(0, screens - S2T.PULL)), s2ready: true, quizBelow: () => true, ...o,`,
`y: screens * VH, vh: VH, restMs: CUE.stillMs, tp: Math.min(1, Math.max(0, screens - S2T.PULL)), s2ready: true, cueOff: screens * VH > CUE.top,
  quizBelow: () => true, pageBelow: () => true, ...o,`);
rep(`  assert.equal(cueWordsOn(at(1, { vh: 0 })), false);
});`,
`  assert.equal(cueWordsOn(at(1, { vh: 0 })), false);
});

test('the top: the chevrons speak there, unless they stay hidden at rest with the page going on below', () => {
  assert.equal(cueWordsOn(at(0, { cueOff: false })), false, 'chevrons shown: the words follow them by CSS');
  assert.equal(cueWordsOn(at(0, { cueOff: true })), true, 'chevrons stuck off after a jump the followers reach late');
  assert.equal(cueWordsOn(at(0, { cueOff: true, restMs: CUE.stillMs - 1 })), false, 'not before the rest');
  assert.equal(cueWordsOn(at(0, { cueOff: true, pageBelow: () => false })), false, 'the loader and the intro lock the page: nothing below');
  assert.equal(cueWordsOn(at(8 / VH, { cueOff: true })), true, 'at 8 px still the top');
  let reads = 0;
  cueWordsOn(at(0, { cueOff: false, pageBelow: () => { reads++; return true; } }));
  cueWordsOn(at(0, { cueOff: true, restMs: 0, pageBelow: () => { reads++; return true; } }));
  cueWordsOn(at(3, { pageBelow: () => { reads++; return true; } }));
  assert.equal(reads, 0, 'the document is measured only at the top, at rest, with the chevrons off');
});`);
rep(`  assert.match(base, /left:calc\(50% \+ 8\.75px \+ var\(--s2\)\)/, 'from 1100 px right of the 17.5 px column');
  assert.match(css, /@media \(max-width:1100px\)\{\.cuetext\{left:auto;right:calc\(50% \+ 8\.75px \+ var\(--s2\)\)\}\}/, 'below it, left of the column');`,
`  assert.match(base, /left:calc\(50% \+ 8\.75px \+ var\(--s2\)\)/, 'above 1100 px right of the 17.5 px column');
  assert.match(css, /@media \(max-width:1100px\)\{\.cuetext\{left:auto;right:calc\(50% \+ 8\.75px \+ var\(--s2\)\)\}\}/, 'up to it, left of the column');
  assert.match(css, /\n\.scrollcue\.is-off~\.cuetext\[data-at="pin"\]\{left:auto;right:calc\(var\(--inset\) \+ env\(safe-area-inset-right,0px\)\)\}/, 'in the pin above 1100 px: the right inset');
  assert.match(css, /@media \(max-width:1100px\)\{\.scrollcue\.is-off~\.cuetext\[data-at="pin"\]\{right:auto;left:calc\(var\(--inset\) \+ env\(safe-area-inset-left,0px\)\)\}\}/, 'in the pin up to 1100 px: the left inset');
  assert.doesNotMatch(css, /\.intro\.po~\.cuetext/, 'no forced show over the loader\'s poster state: the words follow is-off there');`);
rep(`  assert.match(show, /html\.m3d\.hud-off\[data-still\]:not\(\.arg-on\) \.cuetext\.is-story$/);`,
`  assert.match(show, /html\.m3d:not\(\.loading\)\.hud-off\[data-still\]:not\(\.arg-on\) \.cuetext\.is-story$/);
  assert.match(css, /\nhtml\.cue-tight \.cuetext\.is-land \{ display: none; \}/, 'hidden where it would meet the front case');`);
s += `
test('the family first screen\'s line clears the front case or stands down (cue.ts over pose.ts solve, the page\'s own fit)', () => {
  const [mw, mh, md] = (JSON.parse(read('src/data/case-model.json')) as { sizeMm: [number, number, number] }).sizeMm;
  const dims = { w: +(mw / mh).toFixed(4), d: +(md / mh).toFixed(4) };   // FamilyPage.astro's
  const clears = (w: number, h: number, sab = 0) => landClear(solve(w, h, 'phone', dims).caseBottom, h, 204 + sab);
  for (const [w, h] of [[390, 844], [430, 932], [360, 780], [412, 915], [375, 667], [390, 664]] as const) assert.equal(clears(w, h), true, \`\${w} x \${h}\`);
  for (const [w, h, sab] of [[375, 553, 0], [360, 584, 0], [390, 600, 0], [390, 750, 34]] as const) assert.equal(clears(w, h, sab), false, \`\${w} x \${h}, inset \${sab}\`);
  assert.equal(landClear(500, 844, 204), true);
  assert.equal(landClear(623, 844, 204), false, 'the gap is 4 px: 3 px short');
  assert.equal(landClear(622, 844, 204), true);
  const page = read('src/scripts/family/page.ts');
  assert.match(page, /H\.classList\.toggle\('cue-tight', cls === 'phone' && !landClear\(fit\.caseBottom, Hh, parseFloat\(getComputedStyle\(landLine\)\.bottom\) \|\| 0\)\);/);
});
`;
fs.writeFileSync(f, s);
console.log('ok');
