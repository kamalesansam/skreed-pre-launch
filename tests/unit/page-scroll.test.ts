// The page scroll's decisions (docs/specs/section-4-flux.md 2 "The elastic glue" and "The top of the page", 5 "Glue
// spans", AC3, AC4 and AC6): the glue at the three spans with innerHeight not equal to 100svh (the review's ping-pong
// case settles once or not at all), the dead band, the two-spans rule, a focused element kept in view, the wheel burst
// filter and the wrap it gates, the touch's first-move decision, the key table, the scrolling keys, the settle's curve
// against --ease-standard, and scroll.ts's independence from the director (the adapter is its only link).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S2T, TRACK_SVH } from '../../src/config/hero.ts';
import {
  BURST, EASE_STANDARD, GLUE, TOUCH, burstConsume, burstFeed, createBurst, cubicBezier, easeStandard, glueDecision, isScrollKey, keyDir, keyStep,
  touchDecision, wheelDecision, type Span, type WheelContext,
} from '../../src/scripts/hero/scroll-math.ts';

const root = new URL('../../', import.meta.url);

/** the three spans as the wiring builds them: the first wipe and the quiz seam in innerHeight, the quiz's top and the room in the probe's 100svh */
const threeSpans = (ih: number, svh: number, quizH = svh): Span[] => {
  const quizTop = (TRACK_SVH / 100) * svh, roomTop = quizTop + quizH;
  return [{ start: S2T.PULL * ih, end: S2T.W1END * ih }, { start: S2T.W2 * ih, end: quizTop }, { start: roomTop - svh, end: roomTop + svh }];
};

test('the numbers: 2 px dead band, 150 ms still, 300 ms input, 500 ms settle, the burst at 200 ms and half the peak, 12 px step, 16 px wrap', () => {
  assert.deepEqual(GLUE, { dead: 2, stillMs: 150, inputMs: 300, settleMs: 500 });
  assert.deepEqual(BURST, { silenceMs: 200, keep: 0.5 });
  assert.deepEqual(TOUCH, { stepPx: 12, wrapPx: 16 });
  assert.deepEqual(threeSpans(745, 844).map((s) => [s.start, s.end]), [[3725, 4470], [11324, 14516.8], [14516.8, 16204.8]]);
});

test('the glue at the three spans with innerHeight 745 and svh 844: every settle lands on an end, by the midpoint, and is itself at rest', () => {
  for (const [ih, svh, quizH] of [[745, 844, 844], [745, 844, 1132], [745, 664, 664], [844, 745, 745], [844, 844, 969]] as const) {
    const spans = threeSpans(ih, svh, quizH);
    let settles = 0;
    for (let y = 0; y <= spans[2].end + 2000; y += 0.5) {
      const t = glueDecision(y, spans, ih, svh);
      if (t === null) continue;
      settles++;
      const s = spans.find((x) => y > x.start && y < x.end);
      assert.ok(s && (s.start === t || s.end === t), `${ih}/${svh}/${quizH} at ${y}: ${t} is an end of the span it is inside`);
      assert.equal(t, y <= (s.start + s.end) / 2 ? s.start : s.end, `${ih}/${svh}/${quizH} at ${y}: the midpoint decides`);
      assert.equal(glueDecision(t, spans, ih, svh), null, `${ih}/${svh}/${quizH} at ${y}: the target ${t} settles again (ping-pong)`);
    }
    // an inverted quiz seam (innerHeight over 100svh by more than 17.2 / 15.2: W2 x 844 is past 17.2 x 745) settles nowhere; the two others still do
    assert.ok(settles > 0);
    assert.equal(spans[1].start > spans[1].end, ih / svh > TRACK_SVH / 100 / S2T.W2, `${ih}/${svh}: the quiz seam's shape`);
    if (spans[1].start > spans[1].end) {
      const rest = [spans[0], spans[2]];
      for (let y = spans[1].end - 10; y <= spans[1].start + 10; y += 0.5) assert.equal(glueDecision(y, spans, ih, svh), glueDecision(y, rest, ih, svh), `${ih}/${svh} at ${y}: the inverted seam adds nothing`);
    }
  }
});

test('the review\'s ping-pong case: the quiz top and section 4\'s top both inside a 745 px viewport settle once, and the touching spans never trade', () => {
  const ih = 745, svh = 664, spans = threeSpans(ih, svh);   // the quiz is one 100svh screen, shorter than the viewport
  const quizTop = spans[1].end;
  assert.equal(spans[2].start, quizTop, 'the quiz seam ends where section 4\'s seam starts');
  const t = glueDecision(quizTop - 20, spans, ih, svh);
  assert.equal(t, quizTop, 'the upper half of the quiz seam settles to the quiz top');
  assert.equal(glueDecision(quizTop, spans, ih, svh), null, 'and the quiz top is at rest');
  assert.equal(glueDecision(quizTop + 1, spans, ih, svh), null);
  assert.equal(glueDecision(quizTop + 3, spans, ih, svh), quizTop, 'just inside section 4\'s seam: back to its start');
  assert.equal(glueDecision(quizTop + svh + 1, spans, ih, svh), quizTop + 2 * svh, 'past its middle: the hall fully in');
});

test('the dead band: within 2 px of either end nothing settles; the midpoint picks the start on a tie', () => {
  const spans: Span[] = [{ start: 1000, end: 1400 }];
  for (const y of [998, 1000, 1001, 1002, 1398, 1399, 1400, 1402]) assert.equal(glueDecision(y, spans, 800, 800), null, `${y}`);
  assert.equal(glueDecision(1002.5, spans, 800, 800), 1000);
  assert.equal(glueDecision(1003, spans, 800, 800), 1000);
  assert.equal(glueDecision(1200, spans, 800, 800), 1000, 'the midpoint: the start');
  assert.equal(glueDecision(1200.5, spans, 800, 800), 1400);
  assert.equal(glueDecision(1397.5, spans, 800, 800), 1400);
  assert.equal(glueDecision(1397, spans, 800, 800), 1400);
  assert.equal(glueDecision(1100, spans, 800, 800, { dead: 150 }), null, 'a wider dead band');
  assert.equal(glueDecision(1100, [{ start: 1000, end: 1004 }], 800, 800), null, 'a span no longer than its dead bands has no seam');
  assert.equal(glueDecision(1100, [], 800, 800), null);
  assert.equal(glueDecision(NaN, spans, 800, 800), null);
});

test('two spans in view settle none, and a target that is not a rest settles not at all', () => {
  const overlap: Span[] = [{ start: 100, end: 500 }, { start: 300, end: 700 }];
  assert.equal(glueDecision(400, overlap, 800, 800), null, 'inside both: none');
  assert.equal(glueDecision(200, overlap, 800, 800), 100, 'inside the first alone');
  assert.equal(glueDecision(600, overlap, 800, 800), 700, 'inside the second alone');
  const nested: Span[] = [{ start: 100, end: 500 }, { start: 450, end: 900 }];
  assert.equal(glueDecision(350, nested, 800, 800), null, 'the first\'s end lies inside the second: a settle there would settle again');
  assert.equal(glueDecision(200, nested, 800, 800), 100);
  assert.equal(glueDecision(800, nested, 800, 800), 900);
  assert.equal(glueDecision(460, nested, 800, 800), null, 'inside both');
});

test('a focused element stays in the smaller viewport: a settle that would take it out is refused', () => {
  const spans: Span[] = [{ start: 1000, end: 2000 }];
  const keep = { top: 1300, bottom: 1340 };
  assert.equal(glueDecision(1200, spans, 745, 844, { keep }), 1000, 'fully in view before and after');
  assert.equal(glueDecision(1700, spans, 745, 844, { keep: { top: 1750, bottom: 1790 } }), null, 'in view now, out after the settle to 2000');
  assert.equal(glueDecision(1700, spans, 745, 844, { keep: { top: 2100, bottom: 2140 } }), 2000, 'in view now and after');
  assert.equal(glueDecision(1700, spans, 745, 844, { keep: { top: 3100, bottom: 3140 } }), 2000, 'out of view now: no constraint');
  assert.equal(glueDecision(1700, spans, 745, 844, { keep: { top: 1300, bottom: 1340 } }), 2000, 'above the viewport now: no constraint either');
  assert.equal(glueDecision(1200, spans, 745, 844, { keep: { top: 1900, bottom: 1960 } }), null, 'partly in view at the viewport\'s foot (745), out after');
  assert.equal(glueDecision(1200, spans, 844, 745, { keep: { top: 1900, bottom: 1960 } }), null, 'the smaller unit is the sure viewport whichever it is');
  assert.equal(glueDecision(1200, spans, 745, 844, { keep: null }), 1000);
});

test('the burst filter: silence resets, the peak grows, a consumed burst swallows under half its peak, a larger delta begins a new burst', () => {
  const b = createBurst();
  assert.deepEqual(burstFeed(b, -120, 1000), { fresh: true, pass: true });
  assert.deepEqual(burstFeed(b, -80, 1050), { fresh: false, pass: true });
  assert.equal(b.peak, 120);
  burstConsume(b);                                                    // a step ran
  assert.deepEqual(burstFeed(b, -59, 1100), { fresh: false, pass: false }, 'the tail under 60');
  assert.deepEqual(burstFeed(b, -30, 1200), { fresh: false, pass: false });
  assert.ok(b.consumed);
  assert.deepEqual(burstFeed(b, -60, 1250), { fresh: true, pass: true }, 'half the peak passes and begins a new burst');
  assert.deepEqual([b.peak, b.consumed], [60, false]);
  burstConsume(b);
  assert.deepEqual(burstFeed(b, 10, 1451), { fresh: true, pass: true }, '201 ms of silence: a new burst');
  assert.deepEqual([b.peak, b.consumed], [10, false]);
  assert.deepEqual(burstFeed(b, -3, 1651), { fresh: false, pass: true }, '200 ms exactly is not silence');
});

const ctx = (over: Partial<WheelContext> = {}): WheelContext => ({ atTop: false, canWrap: true, locked: false, edgeForward: false, edgeBack: false, ...over });

test('the wheel at scroll 0: only a new burst moving up wraps; a burst under way, a downward burst, the intro and the lock do not', () => {
  const b = createBurst();
  assert.deepEqual(wheelDecision(b, -40, 0, ctx({ atTop: true, canWrap: false })), { kind: 'page' }, 'the intro: its own lock');
  assert.deepEqual(wheelDecision(b, -40, 300, ctx({ atTop: true, locked: true })), { kind: 'swallow' }, 'the 400 ms after a seam');
  assert.deepEqual(wheelDecision(b, 40, 600, ctx({ atTop: true })), { kind: 'page' }, 'down from the top: the page');
  assert.deepEqual(wheelDecision(b, -40, 650, ctx({ atTop: true })), { kind: 'page' }, 'up, but the burst began with the tick before');
  assert.deepEqual(wheelDecision(b, -40, 900, ctx({ atTop: true })), { kind: 'wrap' }, 'a burst beginning at the top after 200 ms of silence');
  burstConsume(b);
  assert.deepEqual(wheelDecision(b, -15, 950, ctx({ atTop: true })), { kind: 'page' }, 'its tail');
  assert.deepEqual(wheelDecision(b, -15, 1200, ctx({ atTop: true, ctrl: true })), { kind: 'page' }, 'Ctrl+wheel is never captured');
  assert.equal(b.last, 950, 'and never feeds the burst');
  // a burst under way when the page lands at 0 (the exit seam's jump under its lock, then the lock lifting) never wraps
  const c = createBurst();
  wheelDecision(c, 60, 0, ctx());
  for (let t = 40; t < 400; t += 40) assert.deepEqual(wheelDecision(c, -30, t, ctx({ atTop: true, locked: t < 400 })), { kind: t < 400 ? 'swallow' : 'page' });
  assert.deepEqual(wheelDecision(c, -30, 440, ctx({ atTop: true })), { kind: 'page' });
  assert.deepEqual(wheelDecision(c, -30, 700, ctx({ atTop: true })), { kind: 'wrap' });
});

test('the wheel in range: one tick one step, the consumed burst\'s tail swallowed, the edges, the lock, a horizontal wheel', () => {
  const b = createBurst();
  assert.deepEqual(wheelDecision(b, 100, 0, ctx()), { kind: 'step', dir: 1 });
  burstConsume(b);
  assert.deepEqual(wheelDecision(b, 40, 30, ctx()), { kind: 'swallow' }, 'a trackpad tail does not step twice');
  assert.deepEqual(wheelDecision(b, 70, 60, ctx()), { kind: 'step', dir: 1 }, 'a delta of half the peak or more is a new burst');
  assert.deepEqual(wheelDecision(b, -100, 400, ctx()), { kind: 'step', dir: -1 });
  assert.deepEqual(wheelDecision(b, 100, 700, ctx({ edgeForward: true })), { kind: 'page' }, 'scene 5 forward: the page scrolls into the hold');
  assert.deepEqual(wheelDecision(b, -100, 1000, ctx({ edgeForward: true })), { kind: 'step', dir: -1 });
  assert.deepEqual(wheelDecision(b, -100, 1300, ctx({ edgeBack: true })), { kind: 'back' }, 'scene 1 back: the way back');
  assert.deepEqual(wheelDecision(b, 100, 1600, ctx({ edgeBack: true })), { kind: 'step', dir: 1 });
  assert.deepEqual(wheelDecision(b, 100, 1900, ctx({ locked: true })), { kind: 'swallow' }, 'a seam or the way back running');
  assert.deepEqual(wheelDecision(b, 0, 2200, ctx()), { kind: 'page' }, 'no vertical delta');
  assert.equal(b.last, 1900, 'a horizontal wheel is no part of a burst');
  assert.deepEqual(wheelDecision(b, 100, 2500, ctx()), { kind: 'step', dir: 1 }, 'the step that arrives at scene 5');
  burstConsume(b);
  assert.deepEqual(wheelDecision(b, 40, 2530, ctx({ edgeForward: true })), { kind: 'swallow' }, 'the tail of the gesture that arrived at scene 5 does not push the page on');
  assert.deepEqual(wheelDecision(b, 60, 2560, ctx({ edgeForward: true })), { kind: 'page' }, 'a new burst there is the page\'s');
});

test('the touch: decided on the first move, one step at 12 px, the page\'s when forward at scene 5, the wrap at 16 px down from scroll 0', () => {
  assert.deepEqual(touchDecision(400, 5000, 400, false), { kind: 'none' });
  assert.deepEqual(touchDecision(400, 5000, 395, false), { kind: 'hold' }, 'up 5 px: ours, not yet a step');
  assert.deepEqual(touchDecision(400, 5000, 388.5, false), { kind: 'hold' });
  assert.deepEqual(touchDecision(400, 5000, 388, false), { kind: 'step', dir: 1 }, 'up 12 px: one step forward');
  assert.deepEqual(touchDecision(400, 5000, 300, false), { kind: 'step', dir: 1 });
  assert.deepEqual(touchDecision(400, 5000, 412, false), { kind: 'step', dir: -1 }, 'down 12 px: one step back');
  assert.deepEqual(touchDecision(400, 5000, 405, false), { kind: 'hold' });
  assert.deepEqual(touchDecision(400, 5000, 399, true), { kind: 'page' }, 'forward at scene 5: the page\'s from the first move');
  assert.deepEqual(touchDecision(400, 5000, 300, true), { kind: 'page' });
  assert.deepEqual(touchDecision(400, 5000, 412, true), { kind: 'step', dir: -1 }, 'back from scene 5 is ours');
  assert.deepEqual(touchDecision(400, 0, 399, false), { kind: 'page' }, 'up from the top: the page scrolls');
  assert.deepEqual(touchDecision(400, 0, 401, false), { kind: 'hold' }, 'down from the top: ours from the first move (prevented)');
  assert.deepEqual(touchDecision(400, 0, 415.9, false), { kind: 'hold' });
  assert.deepEqual(touchDecision(400, 0, 416, false), { kind: 'wrap' }, '16 px: the wrap');
  assert.deepEqual(touchDecision(400, -8, 416, true), { kind: 'wrap' }, 'a rubber-banded start is still the top');
  assert.deepEqual(touchDecision(400, 0, 412, true), { kind: 'hold' }, '12 px is a step in range, not the wrap');
});

test('keyStep: Down, PageDown and Space step forward, Up, PageUp and Shift+Space back, null for the browser\'s cases', () => {
  for (const key of ['ArrowDown', 'PageDown', ' ', 'Spacebar']) assert.equal(keyStep({ key }), 1, key);
  for (const key of ['ArrowUp', 'PageUp']) assert.equal(keyStep({ key }), -1, key);
  assert.equal(keyStep({ key: ' ', shiftKey: true }), -1);
  assert.equal(keyStep({ key: 'Spacebar', shiftKey: true }), -1);
  for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Tab', 'Home']) assert.equal(keyStep({ key, shiftKey: true }), null, `shifted ${key}`);
  for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Enter', 'Escape', 'j', 'w', 's']) assert.equal(keyStep({ key }), null, key);
  for (const mod of ['ctrlKey', 'metaKey', 'altKey'] as const) assert.equal(keyStep({ key: 'ArrowDown', [mod]: true }), null, mod);
  assert.equal(keyStep({ key: 'ArrowDown', defaultPrevented: true }), null, 'already handled');
  assert.equal(keyStep({ key: 'ArrowDown', repeat: true }), null, 'a held key does not repeat');
  assert.equal(keyDir({ key: 'ArrowDown', repeat: true }), 1, 'but the table still names it, so the repeat can be swallowed');
  for (const tagName of ['INPUT', 'input', 'TEXTAREA', 'SELECT', 'BUTTON']) assert.equal(keyStep({ key: ' ', target: { tagName } }), null, tagName);
  assert.equal(keyStep({ key: 'ArrowDown', target: { tagName: 'DIV', isContentEditable: true } }), null, 'contentEditable');
  assert.equal(keyStep({ key: 'ArrowDown', target: { tagName: 'DIV', isContentEditable: false } }), 1);
  assert.equal(keyStep({ key: 'ArrowDown', target: { tagName: 'A' } }), 1, 'a link is not a typing control');
  assert.equal(keyStep({ key: 'ArrowDown', target: null }), 1);
});

test('isScrollKey: Space, PageUp, PageDown, the arrows, Home and End arm the glue; Tab, Enter and letters do not', () => {
  for (const key of [' ', 'Spacebar', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) assert.ok(isScrollKey(key), key);
  for (const key of ['Tab', 'Enter', 'Escape', 'Shift', 'a', 'w', 's', 'e', 'E']) assert.ok(!isScrollKey(key), key);
});

test('the settle\'s curve is --ease-standard from tokens.css, monotone from 0 to 1, and a true cubic-bezier', () => {
  const css = readFileSync(new URL('src/styles/tokens.css', root), 'utf8');
  const m = /--ease-standard:\s*cubic-bezier\(([^)]+)\)/.exec(css);
  assert.ok(m);
  assert.deepEqual(m[1].split(',').map(Number), [...EASE_STANDARD]);
  assert.equal(easeStandard(0), 0);
  assert.equal(easeStandard(1), 1);
  assert.equal(easeStandard(-1), 0);
  assert.equal(easeStandard(2), 1);
  // against the parametric form sampled finely: for each x find the t whose x(t) matches, compare y(t)
  const [x1, y1, x2, y2] = EASE_STANDARD;
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let prev = 0;
  for (let i = 1; i <= 500; i++) {
    const x = i / 500, y = easeStandard(x);
    assert.ok(y >= prev - 1e-9 && y <= 1 + 1e-9, `monotone at ${x}`);
    let lo = 0, hi = 1; for (let k = 0; k < 60; k++) { const t = (lo + hi) / 2; if (bx(t) < x) lo = t; else hi = t; }
    assert.ok(Math.abs(y - by((lo + hi) / 2)) < 1e-5, `at ${x}: ${y} against ${by((lo + hi) / 2)}`);
    prev = y;
  }
  assert.ok(easeStandard(0.5) > 0.85, `fast out, slow in: ${easeStandard(0.5)} at the half`);
  const lin = cubicBezier(0, 0, 1, 1);
  for (const x of [0.1, 0.33, 0.5, 0.9]) assert.ok(Math.abs(lin(x) - x) < 1e-6);
});

test('scroll.ts imports nothing from section4 or config/room: the adapter is the only link, and it carries the marker skreed:scroll', () => {
  const src = readFileSync(new URL('src/scripts/hero/scroll.ts', root), 'utf8');
  const math = readFileSync(new URL('src/scripts/hero/scroll-math.ts', root), 'utf8');
  const froms = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(froms)], ['./scroll-math.ts'], `scroll.ts imports: ${froms.join(', ')}`);
  assert.equal([...math.matchAll(/^import\b/gm)].length, 0, 'scroll-math.ts imports nothing');
  const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  const dashes = new RegExp(`[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]`);
  for (const text of [src, math]) {
    assert.doesNotMatch(code(text), /section4|config\/room|director|__skreedRoom|import\(/, 'no path to the director');
    assert.doesNotMatch(text, dashes, 'no em or en dashes');
  }
  assert.match(src, /'skreed:scroll'/);
  assert.match(src, /\['scroll', onScroll, \{ passive: true \}\]/, 'a passive scroll listener always');
  assert.match(src, /\['wheel', onWheel as EventListener, \{ passive: false \}\]/, 'the capturing wheel listener is non-passive');
  assert.match(src, /\['touchmove', onTouchMove as EventListener, \{ passive: false \}\]/, 'and so is touchmove, for the first move');
  assert.match(src, /get\('glue'\) === '0'/, 'the ?glue=0 switch');
  assert.match(src, /setProperty\('overscroll-behavior-y', 'none'\)/, 'the rubber band and pull-to-refresh are off once the intro is over');
  assert.match(src, /\.scale \?\? 1\) > 1\.01/, 'nothing is captured while zoomed');
  assert.match(src, /e\.touches\.length (?:===|!==) 1/, 'one finger only');
});
