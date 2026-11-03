// The page scroll's decisions (docs/specs/section-4-flux.md 2 "The elastic glue" and "The top of the page", 5 "Glue
// spans" and "Capture, by state and position", AC3, AC4 and AC6): the glue at the three spans with innerHeight not equal
// to 100svh (the review's ping-pong case settles once or not at all), the dead band, the two-spans rule, a focused
// element kept in view, the wheel burst filter as the reference has it and the wrap it gates, the touch's first-move
// decision, the key table, the scrolling keys, the settle's curve against --ease-standard, scroll.ts driven in a fake
// window (a burst that reaches scroll 0 never wraps, one swipe is one step, a wrap's momentum steps nowhere, the seam's
// lock swallows at the top, the lock attaches the capture set out of range, both edges are the page's since the hall
// left, docs/specs/section-4-no-hall.md 2), and scroll.ts's independence from the director (the adapter is its only link).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S2T, TRACK_SVH } from '../../src/config/hero.ts';
import { ROOM_HEIGHT, SCENES_END, WIPE4_START } from '../../src/config/room-map.ts';
import {
  BURST, EASE_STANDARD, GLUE, TOUCH, burstConsume, burstReset, burstFeed, createBurst, cubicBezier, easeStandard, glueDecision, isScrollKey, keyDir, keyStep,
  touchDecision, wheelDecision, type Span, type WheelContext,
} from '../../src/scripts/hero/section4/scroll-math.ts';
import { SCROLL_MARK, createPageScroll } from '../../src/scripts/hero/section4/scroll.ts';

const root = new URL('../../', import.meta.url);

/**
 * the four spans as the wiring builds them (hero.ts; section-4-flux.md 5 "Glue spans", section-5.md 2 "The elastic
 * glue"): the first wipe and the quiz seam in innerHeight, the quiz's top, the room and scene 5 to section 5 (the hold and the fourth wipe) in the probe's 100svh
 */
const threeSpans = (ih: number, svh: number, quizH = svh): Span[] => {
  const quizTop = (TRACK_SVH / 100) * svh, roomTop = quizTop + quizH;
  return [{ start: S2T.PULL * ih, end: S2T.W1END * ih }, { start: S2T.W2 * ih, end: quizTop }, { start: roomTop - svh, end: roomTop + svh }, { start: roomTop + SCENES_END * svh, end: roomTop + ROOM_HEIGHT * svh }];
};

test('the numbers: 2 px dead band, 150 ms still, 300 ms input, 500 ms settle, the burst at 200 ms and half the peak, 12 px step, 16 px wrap', () => {
  assert.deepEqual(GLUE, { dead: 2, stillMs: 150, inputMs: 300, settleMs: 500 });
  assert.deepEqual(BURST, { silenceMs: 200, keep: 0.5, carriedMs: 700 });
  assert.deepEqual(TOUCH, { stepPx: 12, wrapPx: 16 });
  assert.deepEqual(threeSpans(745, 844).map((s) => [+s.start.toFixed(2), +s.end.toFixed(2)]), [[1862.5, 2607.5], [4097.5, 6330], [6330, 8018], [9706, 11225.2]]);   // the map of 2026-11-03 (section-2.md 14, the 750svh track), the fourth from the room's top (7174) and its screens 3 to 4.8 (scene 5 to section 5)
  // hero.ts builds the fourth from the room's top and its screens (the probe's 100svh)
  assert.match(readFileSync(new URL('src/scripts/hero/hero.ts', root), 'utf8'), /\{ start: top \+ SCENES_END \* one, end: Math\.min\(top \+ ROOM_HEIGHT \* one, last\) \}/);
});

test('the fourth span (section-5.md AC7): a run that stops in the hold or inside the cut settles to the nearer end; nothing settles at section 5\'s top or inside its body', () => {
  const ih = 745, svh = 844, spans = threeSpans(ih, svh), cut = spans[3], roomTop = cut.start - SCENES_END * svh;
  assert.equal(glueDecision(cut.start + 100, spans, ih, svh), cut.start, 'the hold: back to scene 5');
  assert.equal(glueDecision(roomTop + WIPE4_START * svh - 10, spans, ih, svh), cut.start, 'the hold\'s end: back to scene 5');
  assert.equal(glueDecision(cut.start, spans, ih, svh), null, 'scene 5 is at rest');
  assert.equal(glueDecision(cut.end - 100, spans, ih, svh), cut.end, 'the upper half: the cut done');
  assert.equal(glueDecision(cut.end, spans, ih, svh), null, 'the end is at rest');
  for (const y of [cut.end + 10, cut.end + svh, cut.end + 3 * svh]) assert.equal(glueDecision(y, spans, ih, svh), null, `${y}: section 5 rises as flow content, no seam to settle`);
  assert.ok(cut.start >= spans[2].end + 2 * svh - 1e-6, 'apart from section 4\'s seam by the scenes (scene 1 to scene 5)');
});

test('the glue at the three spans with innerHeight 745 and svh 844: every settle lands on an end, by the midpoint, and is itself at rest', () => {
  for (const [ih, svh, quizH] of [[745, 844, 844], [745, 844, 1132], [745, 664, 664], [844, 745, 745], [844, 844, 969], [844, 600, 600]] as const) {
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
    // an inverted quiz seam (innerHeight over 100svh by more than TRACK_SVH / 100 / W2, 6.75 / 5.25 since 2026-11-02: W2 x 844 is past 6.75 x 600) settles nowhere; the two others still do
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
  assert.equal(glueDecision(quizTop + svh + 1, spans, ih, svh), quizTop + 2 * svh, 'past its middle: scene 1 fully in');
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

test("burstReset: the peak and the consumed flag go and the clock stays, so the next event is judged on its own (the visitor's gesture against the carried input's direction, scroll.ts)", () => {
  const b = createBurst();
  burstFeed(b, 120, 1000); burstConsume(b);
  for (const d of [50, 40, 30]) assert.equal(burstFeed(b, d, 1016).pass, false, `${d} is the consumed burst's tail`);
  assert.equal(b.peak, 120); assert.equal(b.consumed, true);
  burstReset(b);
  assert.deepEqual(b, { last: 1016, peak: 0, consumed: false });
  assert.deepEqual(burstFeed(b, -30, 1060), { fresh: false, pass: true }, "a gentle event the other way passes at once, inside the old burst's 200 ms, and is not fresh");
  assert.equal(b.peak, 30);
});

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
  assert.deepEqual(wheelDecision(b, -100, 2300, ctx({ edgeBack: true })), { kind: 'page' }, 'scene 1 back: the page scrolls up into the wipe (no way back since the hall left)');
  assert.deepEqual(wheelDecision(b, 100, 2600, ctx({ edgeBack: true })), { kind: 'step', dir: 1 });
  assert.deepEqual(wheelDecision(b, 100, 2900, ctx({ locked: true })), { kind: 'swallow' }, 'a seam');
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
  assert.deepEqual(touchDecision(400, 5000, 401, false, true), { kind: 'page' }, "back at scene 1: the page's from the first move");
  assert.deepEqual(touchDecision(400, 5000, 500, false, true), { kind: 'page' });
  assert.deepEqual(touchDecision(400, 5000, 388, false, true), { kind: 'step', dir: 1 }, 'forward from scene 1 is ours');
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
  const fire = <T extends object>(type: string, props: T, cancelable = true): Event & T => { const e = Object.assign(new Event(type, { cancelable }), props); target.dispatchEvent(e); return e; };
  const scroll = (v: number) => { g.scrollY = v; target.dispatchEvent(new Event('scroll')); };
  return {
    get now() { return clock; },
    tick(ms: number) { clock += ms; },
    get y() { return g.scrollY as number; },
    set y(v: number) { g.scrollY = v; },
    scroll,
    /** one wheel event; true when it was prevented, else the page has moved (always, for one the page cannot cancel) */
    wheel(deltaY: number, ctrlKey = false, cancelable = true): boolean {
      const e = fire('wheel', { deltaY, ctrlKey }, cancelable);
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

/** a director stand-in: the scenes' slots at roomTop plus (1 + 0.5 i) screens (section-4-no-hall.md 5), a step busy for 770 + 150 ms, the wrap under its lock */
function fakeRoom(page: ReturnType<typeof fakePage>, roomTop = 20000, screen = 844) {
  const r = {
    state: 'approach' as 'approach' | 'world' | 'seam', scene: 0, intro: false, busyUntil: -Infinity, lockUntil: -Infinity, calls: [] as string[], carriedN: 0,
    q: (i: number): number => roomTop + (1 + 0.5 * i) * screen,
    inRange: (): boolean => r.state === 'world' && page.y >= roomTop + 1 * screen - 2 && page.y <= roomTop + 3 * screen + 2,
    edge: (dir: 1 | -1): boolean => (dir === 1 ? r.scene === 4 : r.scene === 0),
    step: (dir: 1 | -1): boolean => { if (r.busy()) return false; r.scene += dir; r.busyUntil = page.now + 770 + 150; r.calls.push(`step ${dir}`); page.y = r.q(r.scene); return true; },
    wrap: (): void => { r.calls.push('wrap'); r.state = 'world'; r.scene = 4; r.lockUntil = page.now + 280 + 360 + 400; page.y = r.q(4); },
    canWrap: (): boolean => !r.intro && !r.lock(),
    lock: (): boolean => page.now < r.lockUntil,
    busy: (): boolean => page.now < r.busyUntil,
    carried: (): void => { r.carriedN++; },
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

test('scroll.ts: a trackpad fling from the quiz that carries the page onto scene 1 never steps with its tail, however sparse (the burst is consumed as the capture attaches, section-4-no-hall.md AC3); a new push after 0.7 s of silence steps', () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    page.scroll(room.q(-0.8));                                                             // q 0.6, the third wipe, the approach
    const ps = createPageScroll(options(room));
    assert.equal(ps.state().capturing, false);
    // the fling: native while the section approaches; the director makes it world once the page reaches scene 1 and the wiring notifies
    const deltas = [40, 120, 200, 260];
    for (let d = 260 * 0.92; d >= 2; d *= 0.92) deltas.push(Math.round(d));
    let steps = 0, swallowed = 0;
    for (const d of deltas) {
      const prevented = page.wheel(d);
      if (room.state === 'approach' && page.y >= room.q(0) - 2) { room.state = 'world'; page.y = room.q(0); ps.notify(); }   // the arrival, held on scene 1
      else if (prevented) swallowed++;
      page.tick(16);
    }
    steps = room.calls.filter((c) => c.startsWith('step')).length;
    assert.equal(room.state, 'world');
    assert.equal(steps, 0, "the fling's own tail never steps, its later and larger pushes included");
    assert.ok(swallowed > 10, `the tail is swallowed in range (${swallowed})`);
    assert.equal(page.y, room.q(0), 'the page stays on scene 1');
    // the same input coming in sparsely (a slow machine coalescing it, a wheel spinning down): still the page's
    for (const gap of [280, 420, 650, 300]) { page.tick(gap); assert.equal(page.wheel(8), true, `swallowed after ${gap} ms`); }
    assert.equal(room.calls.filter((c) => c.startsWith('step')).length, 0, 'a sparse tail never steps');
    page.tick(701);
    assert.equal(page.wheel(60), true);
    assert.deepEqual(room.calls, ['step 1'], 'a new push after 0.7 s of silence is one step');
    ps.dispose();
  } finally { page.restore(); }
});

test('scroll.ts: a forward wheel the page cannot cancel (a trackpad gesture latched before the capture attached) never steps in the scenes and asks the director to hold, however late it comes; at scene 5 it is the page\'s (section-4-no-hall.md AC3)', () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    room.state = 'world'; page.y = room.q(0);
    const ps = createPageScroll(options(room));
    assert.equal(ps.state().capturing, true);
    page.tick(1000);
    for (const gap of [16, 16, 900, 16, 2000]) { page.tick(gap); page.wheel(40, false, false); }
    assert.deepEqual(room.calls, [], 'never a step, after a long pause too');
    assert.equal(room.carriedN, 5, 'every one asks for the hold');
    page.y = room.q(0); page.tick(1000);
    assert.equal(page.wheel(60), true, 'a cancelable push after silence is the visitor\'s own');
    assert.deepEqual(room.calls, ['step 1']);
    room.scene = 4; page.y = room.q(4); room.busyUntil = -Infinity; page.tick(1000);
    page.wheel(40, false, false);
    assert.equal(room.carriedN, 5, "at scene 5 forward is the page's: no hold");
    ps.dispose();
  } finally { page.restore(); }
});

test("scroll.ts: a backward wheel at scene 1 right after the fling that carried the page in is the page's, never the fling's tail: it begins a burst of its own and scrolls up into the wipe (section-4-no-hall.md AC4)", () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    page.scroll(room.q(-0.8));                                                             // q 0.6, the approach
    const ps = createPageScroll(options(room));
    // the fling, 120 px decaying to 2 px every 16 ms, carries the page in; the director makes it world at scene 1
    for (let d = 120; d >= 2; d *= 0.94) {
      page.wheel(Math.round(d));
      if (room.state === 'approach' && page.y >= room.q(0) - 2) { room.state = 'world'; page.y = room.q(0); ps.notify(); }
      page.tick(16);
    }
    assert.equal(room.state, 'world');
    assert.equal(ps.state().capturing, true);
    // 60 ms after the fling's last event, -30 px (a quarter of its peak, under the half the tail rule swallows): the page's
    // at once, up into the wipe, and nothing stepped
    page.tick(44);
    const y0 = page.y;
    assert.equal(page.wheel(-30), false, "the first backward event is the page's");
    assert.ok(page.y < y0, 'the page scrolled up');
    for (let i = 0; i < 5; i++) { page.tick(16); assert.equal(page.wheel(-30), false, `backward event ${i + 2} too`); }
    assert.deepEqual(room.calls, [], 'nothing stepped');
    ps.dispose();
  } finally { page.restore(); }
});

test('scroll.ts: a wrap followed by its momentum gives no step; a burst after silence steps back (AC6, AC3)', () => {
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
    assert.deepEqual(room.calls, ['wrap'], 'no step');
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
    assert.equal(page.key('Escape'), false, 'Escape is no key of a step');
    assert.deepEqual(room.calls, []);
    page.tick(761); room.state = 'approach'; ps.notify();
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

test("scroll.ts: the approach captures nothing; in range the scenes step, and at scene 1 a backward wheel, swipe or key is the page's (section-4-no-hall.md 2); a seam's lock captures out of range", () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    page.scroll(room.q(-1));                                                               // q 0.5, the third wipe
    const ps = createPageScroll(options(room));
    assert.equal(ps.state().capturing, false, 'the approach captures nothing');
    assert.equal(page.wheel(100), false);
    room.state = 'world'; room.scene = 0; page.scroll(room.q(0)); ps.notify();
    assert.equal(ps.state().capturing, true, 'world in range');
    page.tick(1000);
    assert.equal(page.wheel(-100), false, "a backward tick at scene 1 is the page's: it scrolls up into the wipe");
    assert.deepEqual(room.calls, [], 'nothing stepped');
    page.scroll(room.q(0));
    page.touch('touchstart', 400); assert.equal(page.touch('touchmove', 420), false, "a swipe down the glass at scene 1 is the page's"); page.touch('touchend', 420);
    assert.equal(page.key('ArrowUp'), false, 'and ArrowUp');
    assert.equal(page.key('PageUp'), false, 'and PageUp');
    assert.deepEqual(room.calls, []);
    page.tick(1000);
    assert.equal(page.wheel(100), true, 'a forward tick at scene 1 is one step');
    assert.deepEqual(room.calls, ['step 1']);
    // a seam's lock out of range (the exit seam's cover-in holds the page at q 3.8): attached by the lock, everything swallowed
    page.tick(1000); room.state = 'seam'; room.lockUntil = page.now + 1040; page.scroll(room.q(5.6)); ps.notify();
    assert.equal(ps.state().capturing, true, 'a seam: attached by the lock though out of range');
    assert.equal(page.wheel(100), true); assert.equal(page.wheel(-100), true); assert.equal(page.key('ArrowDown'), true);
    page.touch('touchstart', 400); assert.equal(page.touch('touchmove', 300), true); page.touch('touchend', 300);
    assert.deepEqual(room.calls, ['step 1'], 'nothing stepped under the seam');
    page.tick(1041); room.state = 'approach'; page.scroll(room.q(-1)); ps.notify();
    assert.equal(ps.state().capturing, false, 'the approach again');
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

test("scroll.ts: the arrival with no scroll event (the quiz's ride lands on scene 1, and the director makes it world on its next frame): nothing attaches by itself and the first tick leaks; with notify(), which the director's every state change calls through the wiring, it is one step", () => {
  const page = fakePage(0);
  try {
    const room = fakeRoom(page);
    page.scroll(room.q(0));                                                    // the ride's last frame: the page on scene 1, still the approach
    const leak = createPageScroll(options(room));
    assert.equal(leak.state().capturing, false, 'the approach captures nothing');
    room.state = 'world';                                                     // the arrival: the page is there already, so no scroll event follows
    assert.equal(leak.state().capturing, false, 'nothing re-evaluates by itself');
    page.tick(1000);
    assert.equal(page.wheel(100), false, 'without notify the first tick leaks to the page');
    assert.equal(page.y, room.q(0) + 100, 'and the page moved past scene 1');
    leak.dispose();
    // as wired (hero.ts passes onState, the director calls it from setState): the state change calls notify()
    room.state = 'approach'; page.scroll(room.q(0)); page.tick(1000);
    const ps = createPageScroll(options(room));
    assert.equal(ps.state().capturing, false);
    room.state = 'world'; ps.notify();
    assert.equal(ps.state().capturing, true, 'attached at the arrival, with no scroll event');
    assert.equal(page.wheel(100), true);
    assert.deepEqual(room.calls, ['step 1'], 'a tick in range is one step');
    ps.dispose();
  } finally { page.restore(); }
});
