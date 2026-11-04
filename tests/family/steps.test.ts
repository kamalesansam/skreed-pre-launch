// The case types' steps (src/scripts/family/steps.ts; docs/specs/family-page.md 26, docs/specs/scroll-steps.md 3; Sam,
// 2026-11-04): one wheel burst, one swipe or one step key rides a whole screen to the next type; gestures during a ride
// and its cooldown are swallowed; at Tough back and at Armor on the gesture is the page's; a page its own scroll carries
// into the types is held on the type it entered at; the beat nav rides; nothing on the grid tier. Driven in a fake window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASE_RESTS, caseRideMs, createCaseSteps } from '../../src/scripts/family/steps.ts';
import { CASE_HOLD_MAX_MS, CASE_HOLD_STILL_MS, CASE_STEP_COOLDOWN_MS, CASE_STEP_MAX_MS, CASE_STEP_MS } from '../../src/scripts/family/timing.ts';

const VH = 800;

function fakePage(y0: number, classes = ['m3d']) {
  const g = globalThis as unknown as Record<string, unknown>;
  const target = new EventTarget();
  const keys = ['window', 'document', 'location', 'scrollY', 'innerHeight', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'scrollTo', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const saved = keys.map((k) => [k, g[k]] as const), savedNow = performance.now;
  let clock = 0;
  const body = { tagName: 'BODY' };
  const cls = new Set(classes);
  g.window = g;
  g.document = { documentElement: { tagName: 'HTML', classList: { contains: (c: string) => cls.has(c) } }, body, activeElement: body, querySelector: () => null };
  g.location = { search: '' };
  g.scrollY = y0; g.innerHeight = VH;
  g.addEventListener = target.addEventListener.bind(target);
  g.removeEventListener = target.removeEventListener.bind(target);
  g.dispatchEvent = target.dispatchEvent.bind(target);
  const scroll = (v: number) => { g.scrollY = v; target.dispatchEvent(new Event('scroll')); };
  g.scrollTo = (opts: { top: number }) => scroll(opts.top);
  g.requestAnimationFrame = (f: () => void) => setTimeout(f, 16);
  g.cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
  performance.now = () => clock;
  const fire = <T extends object>(type: string, props: T, cancelable = true): Event & T => { const e = Object.assign(new Event(type, { cancelable }), props); target.dispatchEvent(e); return e; };
  return {
    get now() { return clock; },
    tick(ms: number) { clock += ms; },
    get y() { return g.scrollY as number; },
    cls,
    scroll,
    wheel(deltaY: number, cancelable = true): boolean {
      const e = fire('wheel', { deltaY, ctrlKey: false }, cancelable);
      if (!e.defaultPrevented) scroll(Math.max(0, (g.scrollY as number) + deltaY));
      return e.defaultPrevented;
    },
    touch(type: 'touchstart' | 'touchmove' | 'touchend', clientY: number): boolean {
      return fire(type, { touches: type === 'touchend' ? [] : [{ clientY }] }).defaultPrevented;
    },
    key(key: string, over: Record<string, unknown> = {}): boolean { return fire('keydown', { key, ...over }).defaultPrevented; },
    restore() { performance.now = savedNow; for (const [k, v] of saved) { if (v === undefined) delete g[k]; else g[k] = v; } },
  };
}
/** the ride's frames run on timers: the clock moved on, then a few frames' worth of real time */
const frames = () => new Promise((r) => setTimeout(r, 40));
const at = (i: number) => CASE_RESTS[i] * VH;

test('the rests and the ride: Tough, MagTough, Snap and Armor at screens 2 to 5; 1.4 s a screen, at most 2.8 s', () => {
  assert.deepEqual(CASE_RESTS, [2, 3, 4, 5]);
  assert.equal(CASE_STEP_MS, 1400); assert.equal(CASE_STEP_MAX_MS, 2800); assert.equal(CASE_STEP_COOLDOWN_MS, 150);
  assert.equal(caseRideMs(1), 1400); assert.equal(caseRideMs(-1), 1400); assert.equal(caseRideMs(0.3), 1400, 'a part screen rides as one');
  assert.equal(caseRideMs(2), 2800); assert.equal(caseRideMs(3), 2800);
});

test('one wheel burst is one type: the ride plays the whole screen, its tail swallowed through the ride and the cooldown; at Tough back and at Armor on are the page\'s', async () => {
  const page = fakePage(at(0));
  try {
    const s = createCaseSteps({ reduced: () => false });
    page.scroll(at(0));
    assert.equal(s.state().inRange, true);
    let prevented = 0;
    const deltas = [8, 16, 32, 60]; for (let d = 56; d >= 1; d *= 0.9) deltas.push(Math.round(d));
    for (const d of deltas) { if (page.wheel(d)) prevented++; page.tick(20); await frames(); }
    assert.equal(prevented, deltas.length, 'every event of the swipe prevented');
    page.tick(CASE_STEP_MS); await frames();
    assert.equal(page.y, at(1), 'on MagTough, one type on');
    assert.equal(page.wheel(60), true, 'the cooldown or the tail: swallowed');
    assert.equal(page.y, at(1));
    page.tick(400);
    assert.equal(page.wheel(60), true, 'a burst after silence: the next type');
    page.tick(CASE_STEP_MS + 50); await frames();
    assert.equal(page.y, at(2));
    page.tick(400);
    assert.equal(page.wheel(-60), true, 'and back');
    page.tick(CASE_STEP_MS + 50); await frames();
    assert.equal(page.y, at(1));
    page.scroll(at(0)); page.tick(1000);
    assert.equal(page.wheel(-60), false, 'at Tough a wheel back is the page\'s, up into the zoom');
    page.tick(1000); page.scroll(at(3)); page.tick(1000);
    assert.equal(page.wheel(60), false, 'at Armor a wheel on is the page\'s, on to the argument screen');
    s.dispose();
  } finally { page.restore(); }
});

test('one swipe is one type, and the keys step one type a keydown; at the edges the keys are the browser\'s', async () => {
  const page = fakePage(at(1));
  try {
    const s = createCaseSteps({ reduced: () => false });
    page.scroll(at(1)); page.tick(1000);
    page.touch('touchstart', 500);
    assert.equal(page.touch('touchmove', 495), true, 'ours from the first move');
    assert.equal(page.touch('touchmove', 480), true, 'up 20 px: one type on');
    assert.equal(page.touch('touchmove', 300), true, 'the rest of the swipe: swallowed');
    page.touch('touchend', 300);
    page.tick(CASE_STEP_MS + 50); await frames();
    assert.equal(page.y, at(2), 'on Snap');
    page.tick(400);
    assert.equal(page.key('ArrowDown'), true); page.tick(CASE_STEP_MS + 50); await frames();
    assert.equal(page.y, at(3), 'ArrowDown: on Armor');
    page.tick(400);
    assert.equal(page.key('PageDown'), false, 'PageDown at Armor: the browser\'s');
    assert.equal(page.key(' ', { shiftKey: true }), true, 'Shift+Space: back');
    assert.equal(page.key('ArrowUp'), true, 'a key during the ride: swallowed');
    page.tick(CASE_STEP_MS + 50); await frames();
    assert.equal(page.y, at(2), 'one type back, not two');
    s.dispose();
  } finally { page.restore(); }
});

test('a page its own scroll carries past Tough from the zoom is put back on Tough and held there; from the argument screen past Armor, on Armor; the beat nav rides; a jump by no input of the visitor\'s (Back to top) passes', async () => {
  const page = fakePage(1.5 * VH);
  try {
    const s = createCaseSteps({ reduced: () => false });
    page.tick(1000);
    page.wheel(200, false);                                   // the fling the browser latched: native, 1.5 to 1.75 screens
    page.wheel(400, false);                                   // past Tough to 2.25
    assert.equal(page.y, at(0), 'put back on Tough');
    assert.equal(s.state().holding, true);
    page.tick(16); page.scroll(at(0) + 120); await frames();  // the momentum runs on
    assert.equal(page.y, at(0), 'held');
    page.tick(CASE_HOLD_STILL_MS + 20); await frames();
    assert.equal(s.state().holding, false, 'still: the hold is over');
    // from the argument screen, up past Armor
    page.scroll(6 * VH); page.tick(1000);
    page.wheel(-1000, false);
    assert.equal(page.y, at(3), 'put back on Armor');
    page.tick(CASE_HOLD_STILL_MS + 20); await frames();
    // the beat nav: a ride to Tough
    page.tick(1000);
    assert.equal(s.go(0), true);
    page.tick(2800 + 50); await frames();
    assert.equal(page.y, at(0));
    // Back to top: a scroll no wheel, finger or scrolling key began crosses the types and is never held
    page.tick(1000);
    page.scroll(7 * VH); page.scroll(0);
    assert.equal(page.y, 0); assert.equal(s.state().holding, false);
    s.dispose();
  } finally { page.restore(); }
});

test('swatch grid mode: no steps, every gesture the page\'s', () => {
  const page = fakePage(2 * VH, ['grid']);
  try {
    const s = createCaseSteps({ reduced: () => false });
    page.tick(1000);
    assert.equal(s.state().inRange, false);
    assert.equal(page.wheel(60), false);
    assert.equal(page.key('ArrowDown'), false);
    assert.equal(s.go(1), false);
    s.dispose();
  } finally { page.restore(); }
});

test('under reduced motion a step is an instant cut', () => {
  const page = fakePage(2 * VH);
  try {
    const s = createCaseSteps({ reduced: () => true });
    page.scroll(at(0)); page.tick(1000);
    assert.equal(page.key('ArrowDown'), true);
    assert.equal(page.y, at(1));
    s.dispose();
  } finally { page.restore(); }
});

test('a phone\'s fling: the momentum that crosses Tough well after the finger lifted is still held there; Home and End never are', async () => {
  const page = fakePage(1.5 * VH);
  try {
    const s = createCaseSteps({ reduced: () => false });
    page.tick(1000);
    page.touch('touchstart', 600); page.touch('touchmove', 300); page.touch('touchend', 300);
    page.tick(1200);                                           // the momentum runs on after the release
    page.scroll(1.9 * VH); page.scroll(2.4 * VH);
    assert.equal(page.y, at(0), 'put back on Tough 1.2 s after the release');
    page.tick(CASE_HOLD_MAX_MS + 50); await frames();
    // End from the carousel: the browser's jump to the page's end passes the types untouched
    page.scroll(0); page.tick(5000);
    page.key('End'); page.scroll(7 * VH);
    assert.equal(page.y, 7 * VH, 'End is never held');
    s.dispose();
  } finally { page.restore(); }
});

test('the first step key after an arrival lets the hold go and steps at once', async () => {
  const page = fakePage(1.5 * VH);
  try {
    const s = createCaseSteps({ reduced: () => false });
    page.tick(1000);
    page.wheel(600, false);                                    // a latched fling past Tough
    assert.equal(s.state().holding, true);
    page.tick(50);
    assert.equal(page.key('ArrowDown'), true, 'taken');
    assert.equal(s.state().holding, false, 'the hold let go');
    assert.equal(s.state().riding, true, 'and the ride to MagTough began with the same key');
    page.tick(CASE_STEP_MS + 50); await frames();
    assert.equal(page.y, at(1));
    s.dispose();
  } finally { page.restore(); }
});

test('a page that loads in swatch grid mode and then shows 3D steps from then on', async () => {
  const page = fakePage(at(0), ['grid']);
  try {
    const s = createCaseSteps({ reduced: () => false });
    page.tick(1000);
    assert.equal(page.key('ArrowDown'), false, 'grid: the browser\'s');
    page.cls.delete('grid'); page.cls.add('m3d');            // "Show in 3D" (boot.ts, fam:want3d)
    page.scroll(at(0)); page.tick(1000);
    assert.equal(page.key('ArrowDown'), true, '3D now: a step');
    page.tick(CASE_STEP_MS + 50); await frames();
    assert.equal(page.y, at(1));
    s.dispose();
  } finally { page.restore(); }
});

test('under reduced motion the beat nav lands on the type pressed, never held back on Tough', () => {
  const page = fakePage(1.5 * VH);
  try {
    const s = createCaseSteps({ reduced: () => true });
    page.tick(1000);
    page.key(' ');                                            // the Space that pressed the nav button counts as a scrolling key
    assert.equal(s.go(2), true);
    assert.equal(page.y, at(2), 'on Snap');
    assert.equal(s.state().holding, false);
    s.dispose();
  } finally { page.restore(); }
});
