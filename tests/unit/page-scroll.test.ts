// The page scroll's decisions (docs/specs/section-4-flux.md 2 "The elastic glue" and "The top of the page", 5 "Glue
// spans" and "Capture, by state and position", AC3, AC4 and AC6): the glue at the three spans with innerHeight not equal
// to 100svh (the review's ping-pong case settles once or not at all), the dead band, the two-spans rule, a focused
// element kept in view, the wheel burst filter as the reference has it and the wrap it gates, the touch's first-move
// decision, the key table, the scrolling keys, the settle's curve against --ease-standard, scroll.ts driven in a fake
// window (a burst that reaches scroll 0 never wraps, one swipe is one step, a wrap's momentum steps nowhere, the seam's
// lock swallows at the top, the lock attaches the capture set out of range), and scroll.ts's independence from the
// director (the adapter is its only link).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S2T, TRACK_SVH } from '../../src/config/hero.ts';
import {
  BURST, EASE_STANDARD, GLUE, TOUCH, burstConsume, burstFeed, createBurst, cubicBezier, easeStandard, glueDecision, isScrollKey, keyDir, keyStep,
  touchDecision, wheelDecision, type Span, type WheelContext,
} from '../../src/scripts/hero/section4/scroll-math.ts';
import { SCROLL_MARK, createPageScroll } from '../../src/scripts/hero/section4/scroll.ts';

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

test('the burst filter (reference 5): silence resets; the peak grows even while swallowed; a consumed burst is swallowed while busy with no half-peak test, then under half its peak; a larger delta ends it, passes and is not fresh', () => {
  const b = createBurst();
  assert.deepEqual(burstFeed(b, -120, 1000), { fresh: true, pass: true });
  assert.deepEqual(burstFeed(b, -80, 1050), { fresh: false, pass: true });
  assert.equal(b.peak, 120);
  burstConsume(b);                                                    // a step ran
  assert.deepEqual(burstFeed(b, -59, 1100), { fresh: false, pass: false }, 'the tail under 60');
  assert.deepEqual(burstFeed(b, -200, 1120, true), { fresh: false, pass: false }, 'a harder push while busy: swallowed, no half-peak test');
  assert.deepEqual([b.peak, b.consumed], [200, true], 'and it raises the peak');
  assert.deepEqual(burstFeed(b, -99, 1140), { fresh: false, pass: false }, 'after the cooldown, under half of 200');
  assert.deepEqual(burstFeed(b, -100, 1160), { fresh: false, pass: true }, 'half the peak ends the consumed burst and passes, but is not fresh');
  assert.deepEqual([b.peak, b.consumed], [100, false]);
  assert.deepEqual(burstFeed(b, -30, 1180), { fresh: false, pass: true }, 'an unconsumed burst always passes');
  burstConsume(b);
  assert.deepEqual(burstFeed(b, 10, 1381), { fresh: true, pass: true }, '201 ms of silence: a new burst');
  assert.deepEqual([b.peak, b.consumed], [10, false]);
  assert.deepEqual(burstFeed(b, -3, 1581), { fresh: false, pass: true }, '200 ms exactly is not silence');
  assert.deepEqual(burstFeed(b, -3, 1582, true), { fresh: false, pass: true }, 'busy does not touch an unconsumed burst: the caller swallows and consumes');
});

const ctx = (over: Partial<WheelContext> = {}): WheelContext => ({ atTop: false, canWrap: true, locked: false, busy: false, edgeForward: false, edgeBack: false, ...over });

test('the wheel at scroll 0: only a burst that begins there after silence, moving up, wraps; the lock swallows before canWrap; a burst under way, a harder push in it, a downward burst and the intro do not wrap', () => {
  const b = createBurst();
  assert.deepEqual(wheelDecision(b, -40, 0, ctx({ atTop: true, canWrap: false })), { kind: 'page' }, 'the intro: its own lock');
  assert.deepEqual(wheelDecision(b, -40, 300, ctx({ atTop: true, canWrap: false, locked: true })), { kind: 'swallow' }, 'a seam running at the top: the lock before canWrap');
  assert.ok(b.consumed, 'and the burst is consumed');
  assert.deepEqual(wheelDecision(b, 40, 320, ctx({ atTop: true, canWrap: false, locked: true })), { kind: 'swallow' }, 'either way');
  assert.deepEqual(wheelDecision(b, -40, 600, ctx({ atTop: true, locked: true })), { kind: 'swallow' }, 'the 400 ms after a seam');
  assert.deepEqual(wheelDecision(b, -40, 650, ctx({ atTop: true })), { kind: 'page' }, 'the lock lifted: the burst under way does not wrap');
  assert.deepEqual(wheelDecision(b, -80, 700, ctx({ atTop: true })), { kind: 'page' }, 'nor a harder push in it');
  assert.deepEqual(wheelDecision(b, 40, 950, ctx({ atTop: true })), { kind: 'page' }, 'down from the top after silence: the page');
  assert.deepEqual(wheelDecision(b, -40, 1000, ctx({ atTop: true })), { kind: 'page' }, 'up, but the burst began with the tick before');
  assert.deepEqual(wheelDecision(b, -40, 1250, ctx({ atTop: true })), { kind: 'wrap' }, 'a burst beginning at the top after 200 ms of silence');
  burstConsume(b);
  assert.deepEqual(wheelDecision(b, -15, 1300, ctx({ atTop: true, locked: true })), { kind: 'swallow' }, 'its tail under the wrap\'s lock');
  assert.deepEqual(wheelDecision(b, -15, 1450, ctx({ atTop: true })), { kind: 'page' }, 'and the page\'s after it');
  assert.deepEqual(wheelDecision(b, -15, 1700, ctx({ atTop: true, ctrl: true })), { kind: 'page' }, 'Ctrl+wheel is never captured');
  assert.equal(b.last, 1450, 'and never feeds the burst');
  // the exit seam's jump lands the page at 0 under the lock with a burst under way: swallowed through the lock, the page's after, a wrap only after silence
  const c = createBurst();
  assert.deepEqual(wheelDecision(c, 60, 0, ctx()), { kind: 'step', dir: 1 });
  burstConsume(c);
  for (let t = 40; t < 400; t += 40) assert.deepEqual(wheelDecision(c, -20, t, ctx({ atTop: true, locked: true })), { kind: 'swallow' }, `${t}`);
  assert.deepEqual(wheelDecision(c, -20, 400, ctx({ atTop: true })), { kind: 'page' });
  assert.deepEqual(wheelDecision(c, -20, 440, ctx({ atTop: true })), { kind: 'page' });
  assert.deepEqual(wheelDecision(c, -20, 700, ctx({ atTop: true })), { kind: 'wrap' });
});

test('the wheel in range: one tick one step; a consumed burst is swallowed while busy with no half-peak test, then its tail under half the peak; a larger delta after the cooldown steps once more; the lock and busy before the edges; a horizontal wheel', () => {
  const b = createBurst();
  assert.deepEqual(wheelDecision(b, 10, 0, ctx()), { kind: 'step', dir: 1 });
  burstConsume(b);                                                                     // the adapter accepted the step
  assert.deepEqual(wheelDecision(b, 40, 30, ctx({ busy: true })), { kind: 'swallow' }, 'the swipe ramps during the step: swallowed with no half-peak test');
  assert.deepEqual(wheelDecision(b, 60, 60, ctx({ busy: true })), { kind: 'swallow' });
  assert.equal(b.peak, 60, 'the peak is the burst\'s largest delta, swallowed ticks included');
  for (let t = 90; t < 920; t += 30) assert.deepEqual(wheelDecision(b, 20, t, ctx({ busy: true })), { kind: 'swallow' }, `the tail at ${t}, during the step and its cooldown`);
  assert.deepEqual(wheelDecision(b, 29, 930, ctx()), { kind: 'swallow' }, 'after the cooldown, the tail under half the peak');
  assert.ok(b.consumed);
  assert.deepEqual(wheelDecision(b, 30, 960, ctx()), { kind: 'step', dir: 1 }, 'half the peak or more after the cooldown: one more step');
  assert.deepEqual([b.peak, b.consumed], [30, false]);
  burstConsume(b);
  assert.deepEqual(wheelDecision(b, -100, 1400, ctx()), { kind: 'step', dir: -1 }, 'a new burst after silence');
  assert.deepEqual(wheelDecision(b, 100, 1700, ctx({ edgeForward: true })), { kind: 'page' }, 'scene 5 forward: the page scrolls into the hold');
  assert.deepEqual(wheelDecision(b, -100, 2000, ctx({ edgeForward: true })), { kind: 'step', dir: -1 });
  assert.deepEqual(wheelDecision(b, -100, 2300, ctx({ edgeBack: true })), { kind: 'back' }, 'scene 1 back: the way back');
  assert.deepEqual(wheelDecision(b, 100, 2600, ctx({ edgeBack: true })), { kind: 'step', dir: 1 });
  assert.deepEqual(wheelDecision(b, 100, 2900, ctx({ locked: true })), { kind: 'swallow' }, 'a seam, the way back or the entry');
  assert.ok(b.consumed, 'which consumes the burst');
  assert.deepEqual(wheelDecision(b, 100, 3200, ctx({ busy: true, edgeForward: true })), { kind: 'swallow' }, 'busy before the edges: a step running at scene 5 swallows a forward tick');
  assert.deepEqual(wheelDecision(b, 0, 3500, ctx()), { kind: 'page' }, 'no vertical delta');
  assert.equal(b.last, 3200, 'a horizontal wheel is no part of a burst');
  assert.deepEqual(wheelDecision(b, 100, 3800, ctx()), { kind: 'step', dir: 1 }, 'the step that arrives at scene 5');
  burstConsume(b);
  for (let t = 3830; t <= 4740; t += 30) assert.deepEqual(wheelDecision(b, 40, t, ctx({ busy: t < 4720, edgeForward: true })), { kind: 'swallow' }, `the tail of the gesture that arrived at scene 5 at ${t}`);
  assert.deepEqual(wheelDecision(b, 40, 4760, ctx({ edgeForward: true })), { kind: 'swallow' }, 'after its cooldown, under half the peak: still not the page\'s');
  assert.deepEqual(wheelDecision(b, 60, 4790, ctx({ edgeForward: true })), { kind: 'page' }, 'a push of half the peak or more at scene 5 is the page\'s');
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

// ---- scroll.ts in a fake window

/**
 * The window scroll.ts needs, faked: one EventTarget stands in for the page, performance.now is a manual clock, and the
 * page's scroll moves by a wheel's deltaY (never above 0) unless the event was prevented, a scroll event following, as
 * a browser does. restore() puts the globals back.
 */
function fakePage(y0: number) {
  const g = globalThis as unknown as Record<string, unknown>;
  const target = new EventTarget();
  const keys = ['window', 'document', 'location', 'scrollY', 'innerHeight', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'scrollTo', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const saved = keys.map((k) => [k, g[k]] as const), savedNow = performance.now;
  let clock = 0;
  const body = { tagName: 'BODY' };
  g.window = g;
  g.document = { documentElement: { tagName: 'HTML', style: { setProperty() {}, removeProperty() {} } }, body, activeElement: body };
  g.location = { search: '' };
  g.scrollY = y0; g.innerHeight = 844;
  g.addEventListener = target.addEventListener.bind(target);
  g.removeEventListener = target.removeEventListener.bind(target);
  g.dispatchEvent = target.dispatchEvent.bind(target);
  g.scrollTo = (opts: { top: number }) => { g.scrollY = opts.top; };
  g.requestAnimationFrame = (f: () => void) => setTimeout(f, 16);
  g.cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
  performance.now = () => clock;
  const fire = <T extends object>(type: string, props: T): Event & T => { const e = Object.assign(new Event(type, { cancelable: true }), props); target.dispatchEvent(e); return e; };
  const scroll = (v: number) => { g.scrollY = v; target.dispatchEvent(new Event('scroll')); };
  return {
    get now() { return clock; },
    tick(ms: number) { clock += ms; },
    get y() { return g.scrollY as number; },
    set y(v: number) { g.scrollY = v; },
    scroll,
    /** one wheel event; true when it was prevented, else the page has moved */
    wheel(deltaY: number, ctrlKey = false): boolean {
      const e = fire('wheel', { deltaY, ctrlKey });
      if (!e.defaultPrevented) { const v = Math.max(0, (g.scrollY as number) + deltaY); if (v !== g.scrollY) scroll(v); }
      return e.defaultPrevented;
    },
    /** one touch event with this many fingers at clientY; true when it was prevented */
    touch(type: 'touchstart' | 'touchmove' | 'touchend', clientY: number, fingers = 1): boolean {
      return fire(type, { touches: type === 'touchend' ? [] : Array.from({ length: fingers }, () => ({ clientY })) }).defaultPrevented;
    },
    /** one keydown; true when it was prevented */
    key(key: string, over: Record<string, unknown> = {}): boolean { return fire('keydown', { key, ...over }).defaultPrevented; },
    restore() { performance.now = savedNow; for (const [k, v] of saved) { if (v === undefined) delete g[k]; else g[k] = v; } },
  };
}

/** a director stand-in: the scenes' slots at roomTop plus (10 + 0.5 i) screens, a step busy for 770 + 150 ms, the way back and the wrap under their locks */
function fakeRoom(page: ReturnType<typeof fakePage>, roomTop = 20000, screen = 844) {
  const r = {
    state: 'hall' as 'hall' | 'entering' | 'world' | 'back' | 'seam', scene: 0, intro: false, busyUntil: -Infinity, lockUntil: -Infinity, calls: [] as string[],
    q: (i: number): number => roomTop + (10 + 0.5 * i) * screen,
    inRange: (): boolean => r.state === 'world' && page.y >= roomTop + 10 * screen - 2 && page.y <= roomTop + 12 * screen + 2,
    edge: (dir: 1 | -1): 'forward' | 'back' | null => (dir === 1 && r.scene === 4 ? 'forward' : dir === -1 && r.scene === 0 ? 'back' : null),
    step: (dir: 1 | -1): boolean => { if (r.busy()) return false; r.scene += dir; r.busyUntil = page.now + 770 + 150; r.calls.push(`step ${dir}`); page.y = r.q(r.scene); return true; },
    back: (): void => { r.calls.push('back'); r.state = 'back'; r.lockUntil = page.now + 1000; },
    wrap: (): void => { r.calls.push('wrap'); r.state = 'world'; r.scene = 4; r.lockUntil = page.now + 280 + 360 + 400; page.y = r.q(4); },
    canWrap: (): boolean => !r.intro && !r.lock(),
    lock: (): boolean => page.now < r.lockUntil,
    busy: (): boolean => page.now < r.busyUntil,
  };
  return r;
}

const options = (room: ReturnType<typeof fakeRoom>) => ({ room, spans: () => [], svh: () => 844, reduced: false, hooks: false });

test('scroll.ts: a wheel burst that carries the page up to scroll 0 never wraps; a burst beginning at 0 after 200 ms of silence does (AC6)', () => {
  const page = fakePage(500);
  try {
    const room = fakeRoom(page);
    const ps = createPageScroll(options(room));
    assert.equal(ps.mark, SCROLL_MARK);
    assert.equal(ps.state().capturing, false, 'in the hero, nothing is captured');
    let prevented = 0;
    for (let i = 0; i < 30; i++) { if (page.wheel(-100)) prevented++; page.tick(40); }   // 30 ticks over 1.2 s; the page is at 0 from the fifth
    assert.equal(page.y, 0);
    assert.equal(ps.state().capturing, true, 'at 0 the capture set is on');
    assert.deepEqual(room.calls, [], 'no wrap: the burst began at 500');
    assert.equal(prevented, 0, 'and nothing was prevented');
    page.tick(161);                                                                        // 201 ms since the last tick
    assert.equal(page.wheel(-100), true, 'a burst beginning at 0 after silence is prevented');
    assert.deepEqual(room.calls, ['wrap']);
    ps.dispose();
  } finally { page.restore(); }
});

test('scroll.ts: one trackpad swipe in range is exactly one step; its tail is swallowed through the step, the cooldown and after (AC3)', () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    room.state = 'world'; room.scene = 1; page.scroll(room.q(1));
    const ps = createPageScroll(options(room));
    assert.equal(ps.state().capturing, true);
    const deltas = [8, 16, 32, 60];
    for (let d = 60 * 0.94; d >= 1; d *= 0.94) deltas.push(Math.round(d * 10) / 10);    // the momentum tail, 20 ms apart, about 1.3 s
    let prevented = 0;
    for (const d of deltas) { if (page.wheel(d)) prevented++; page.tick(20); }
    assert.equal(prevented, deltas.length, 'every event of the swipe is prevented');
    assert.deepEqual(room.calls, ['step 1'], 'one step');
    assert.equal(page.y, room.q(2));
    page.tick(181);
    assert.equal(page.wheel(60), true);
    assert.deepEqual(room.calls, ['step 1', 'step 1'], 'the next burst after silence steps again');
    ps.dispose();
  } finally { page.restore(); }
});

test('scroll.ts: a wrap followed by its momentum gives no step and no way back; a burst after silence steps back (AC6, AC3)', () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    const ps = createPageScroll(options(room));
    page.tick(1000);
    assert.equal(page.wheel(-100), true);
    assert.deepEqual(room.calls, ['wrap']);
    ps.notify();                                                                           // the wiring's notify on the state change: world at scene 5, in range, under the lock
    assert.equal(ps.state().capturing, true);
    let prevented = 0, n = 0;
    for (let d = -100 * 0.94; d <= -1; d *= 0.94) { page.tick(20); n++; if (page.wheel(Math.round(d * 10) / 10)) prevented++; }   // about 1.5 s of tail
    assert.equal(prevented, n, 'the tail is swallowed through the seam, its lock and after');
    assert.deepEqual(room.calls, ['wrap'], 'no step, no way back');
    assert.equal(page.y, room.q(4));
    page.tick(201);
    assert.equal(page.wheel(-100), true);
    assert.deepEqual(room.calls, ['wrap', 'step -1'], 'a burst after silence steps back from dawn');
    ps.dispose();
  } finally { page.restore(); }
});

test('scroll.ts: at scroll 0 while a seam runs (canWrap false, lock true) the wheel, the touch and the keys are swallowed; the intro alone leaves them to the page', () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    room.state = 'seam'; room.lockUntil = 760;                                            // cover-out 360 ms over the hero, then the 400 ms
    const ps = createPageScroll(options(room));
    assert.equal(room.canWrap(), false); assert.equal(room.lock(), true);
    assert.equal(page.wheel(-100), true, 'the wheel');
    assert.equal(page.wheel(100), true, 'either way');
    assert.equal(page.y, 0);
    page.touch('touchstart', 400);
    assert.equal(page.touch('touchmove', 430), true, 'the touch, on its first move');
    assert.equal(page.touch('touchmove', 380), true, 'and every move of it');
    page.touch('touchend', 380);
    assert.equal(page.key('ArrowDown'), true, 'a key');
    assert.equal(page.key('Escape'), false, 'not the keys walk.ts maps to Skip');
    assert.deepEqual(room.calls, []);
    page.tick(761); room.state = 'hall'; ps.notify();
    page.touch('touchstart', 400);
    assert.equal(page.touch('touchmove', 416), true);
    assert.deepEqual(room.calls, ['wrap'], 'after the lock, a touch from 0 moving 16 px down wraps');
    page.touch('touchend', 416);
    ps.dispose();
    const intro = fakeRoom(page); intro.intro = true; page.y = 0; page.tick(1000);
    const ps2 = createPageScroll(options(intro));
    assert.equal(page.wheel(-100), false, 'the intro: its own lock, the page\'s');
    page.touch('touchstart', 400); assert.equal(page.touch('touchmove', 430), false); page.touch('touchend', 430);
    assert.equal(page.key('ArrowDown'), false);
    assert.deepEqual(intro.calls, []);
    ps2.dispose();
  } finally { page.restore(); }
});

test('scroll.ts: the capture set follows the lock out of range: the entry at q 9.5 and the way back swallow the wheel, the touch and the keys; the hall captures nothing', () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    page.scroll(room.q(-1));                                                               // q 9.5, the station
    const ps = createPageScroll(options(room));
    assert.equal(ps.state().capturing, false, 'the hall captures nothing');
    assert.equal(page.wheel(100), false);
    page.scroll(room.q(-1));
    room.state = 'entering'; room.lockUntil = page.now + 2350; ps.notify();
    assert.equal(ps.state().capturing, true, 'entering: attached by the lock');
    assert.equal(page.wheel(100), true); assert.equal(page.wheel(-100), true);
    page.touch('touchstart', 400); assert.equal(page.touch('touchmove', 300), true); page.touch('touchend', 300);
    assert.equal(page.key('PageDown'), true);
    assert.deepEqual(room.calls, []);
    page.tick(2350); room.state = 'world'; room.scene = 0; page.scroll(room.q(0)); ps.notify();
    assert.equal(ps.state().capturing, true, 'then world in range');
    assert.equal(page.wheel(-100), true);
    assert.deepEqual(room.calls, ['back'], 'a backward tick at scene 1 is the way back');
    ps.notify();
    assert.equal(ps.state().capturing, true, 'the way back: attached by the lock though out of range');
    page.tick(500);
    assert.equal(page.wheel(-100), true); assert.equal(page.key('ArrowUp'), true);
    assert.deepEqual(room.calls, ['back']);
    page.tick(501); room.state = 'hall'; page.scroll(room.q(-1)); ps.notify();
    assert.equal(ps.state().capturing, false, 'the hall again');
    ps.dispose();
  } finally { page.restore(); }
});

test('scroll.ts imports nothing else from section4 or config/room: the adapter is the only link; it carries the marker skreed:scroll live; it writes no DOM state or event', () => {
  const src = readFileSync(new URL('src/scripts/hero/section4/scroll.ts', root), 'utf8');
  const math = readFileSync(new URL('src/scripts/hero/section4/scroll-math.ts', root), 'utf8');
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
  assert.match(src, /mark: SCROLL_MARK,/, 'the marker rides the returned object, so the bundler keeps it in the chunk');
  assert.doesNotMatch(code(src), /dispatchEvent|CustomEvent|\.style\b|setProperty|setAttribute|dataset|classList/, 'no DOM state or event the spec does not give');
  assert.match(src, /\['scroll', onScroll, \{ passive: true \}\]/, 'a passive scroll listener always');
  assert.match(src, /\['wheel', onWheel as EventListener, \{ passive: false \}\]/, 'the capturing wheel listener is non-passive');
  assert.match(src, /\['touchmove', onTouchMove as EventListener, \{ passive: false \}\]/, 'and so is touchmove, for the first move');
  assert.match(src, /room\.inRange\(\) \|\| scrollY <= 0 \|\| room\.lock\(\)/, 'the capture set follows the range, the top and the lock');
  assert.match(src, /get\('glue'\) === '0'/, 'the ?glue=0 switch');
  assert.match(src, /\.scale \?\? 1\) > 1\.01/, 'nothing is captured while zoomed');
  assert.match(src, /e\.touches\.length (?:===|!==) 1/, 'one finger only');
});
