// The exit seam's guard (docs/specs/section-5.md 2 "The exit seam"; Sam's one-screen brief of 2026-11-02;
// src/scripts/hero/section4/exit-guard.ts), driven a frame at a time as director.ts drives it: a fling from section 4
// held at section 5's rest with no exit; the rest of 300 ms with no input and no movement arming it, and the next
// notch down running the exit; input, movement, a finger down or a page short of the rest keeping it unarmed; leaving
// upward by more than half a screen disarming it; the wrap's landing armed by the same rest once its lock has ended;
// PageDown twice from the wipe held, a third after a rest exiting; the seams' refusals (a text field, the on-screen
// keyboard, a zoomed page) neither holding nor exiting and disarming; a landscape phone's rest at its body's end and a
// body shorter than the screen at its top; the refusal's reading of the focus and the visual viewport; the director's
// wiring; section 5's layout read afresh after a resize (stage/resize.ts, run on a fake context); and the trigger, the
// rest and the readiness handed to the director from the DOM alone (hero.ts, section5/ground.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EXIT_GUARD, createExitGuard, exitGuard, refuses, type ExitAct } from '../../src/scripts/hero/section4/exit-guard.ts';
import { createResize } from '../../src/scripts/hero/stage/resize.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const FRAME = 1000 / 60;

interface PageOpts { exitY?: number; vh?: number; touching?: boolean; refuse?: boolean; live?: boolean }
/**
 * A page at 60 frames a second under the guard, acting on its verdicts as director.ts does: the hold snaps the page to
 * the rest (rounded) and leaves prevY there; the exit starts a seam, so the frames after it are not live. moves() is
 * the page's own scroll between frames (a wheel, a key's smooth scroll, a finger); input marks a wheel, touch or key
 * event in that frame.
 */
class Page {
  readonly g = createExitGuard();
  prevY = NaN; t = 0; inputAt = -Infinity; exits = 0; holds = 0;
  readonly acts: ExitAct[] = [];
  rest: number; y: number; o: PageOpts;
  constructor(rest: number, y: number, o: PageOpts = {}) { this.rest = rest; this.y = y; this.o = o; }
  frame(dy = 0, input = false): ExitAct {
    this.t += FRAME;
    if (input) this.inputAt = this.t;
    this.y += dy;
    const act = exitGuard(this.g, { y: this.y, prevY: this.prevY, exitY: this.o.exitY ?? this.rest, restY: this.rest, vh: this.o.vh ?? 844, now: this.t, inputAt: this.inputAt, touching: !!this.o.touching, refuse: !!this.o.refuse, live: this.o.live ?? true });
    this.prevY = this.y;
    if (act === 'hold') { this.holds++; this.y = this.prevY = Math.round(this.rest); }
    if (act === 'exit') { this.exits++; this.o.live = false; }
    this.acts.push(act);
    return act;
  }
  /** frames with no input and no movement for about ms */
  idle(ms: number): void { for (let k = 0; k < Math.round(ms / FRAME); k++) this.frame(); }
  /** a wheel burst: n events, one a frame, each moving the page dy (the momentum as more events) */
  burst(n: number, dy: number): void { for (let k = 0; k < n; k++) this.frame(dy, true); }
}
/** section 5's rest at 390 x 844: the room's top plus its 14.8 screens, as the fourth wipe's span sits under it */
const REST = 30_000, VH = 844;
/** a page that has come to rest at section 5's rest and been armed there */
const armedAt = (rest = REST, o: PageOpts = {}): Page => { const p = new Page(rest, rest, o); p.idle(400); assert.equal(p.g.armed, true, 'armed by the rest'); return p; };

test('the numbers: a rest of 300 ms, 1 px for near and for a move, half a screen to leave', () => {
  assert.deepEqual(EXIT_GUARD, { restMs: 300, near: 1, leave: 0.5 });
});

test('a wheel burst from the fourth wipe through section 5\'s top comes to rest there with no exit; the rest arms it; one notch down then runs the exit', () => {
  // from the room's q 13.3 (the cut's half), 1.5 screens above the rest, a burst of 24 events of 90 px: 2160 px, 894 past the rest
  const p = new Page(REST, REST - 1.5 * VH);
  p.burst(24, 90);
  assert.equal(p.exits, 0, 'no exit during the burst');
  assert.ok(p.holds > 0, 'held at the rest');
  assert.equal(p.y, REST, 'the page at the rest');
  assert.equal(p.g.armed, false, 'not armed while the input runs');
  p.idle(270);
  assert.equal(p.g.armed, false, 'not armed before 300 ms');
  p.idle(60);
  assert.equal(p.g.armed, true, 'armed by 300 ms of rest');
  p.idle(400);
  assert.equal(p.exits, 0, 'nothing at rest');
  assert.equal(p.frame(100, true), 'exit', 'one notch down');
  assert.equal(p.g.armed, false, 'the exit takes the arming with it');
  assert.equal(p.frame(40, true), null, 'the seam: nothing more');
});

test('a fling\'s momentum after its input ends is held until the page stops; the rest counts from the last movement', () => {
  const p = new Page(REST, REST - 600);
  p.burst(3, 150);   // the input: 450 px
  for (let k = 0; k < 40; k++) p.frame(60);   // the momentum, no events: 2400 px more, every frame past the rest held
  assert.equal(p.exits, 0);
  assert.equal(p.y, REST);
  const quiet = p.t;
  p.idle(250);
  assert.equal(p.g.armed, false, 'the input ended long ago, but the page moved until 250 ms ago');
  p.idle(80);
  assert.equal(p.g.armed, true, `armed 300 ms after the last movement (${(p.t - quiet).toFixed(0)} ms)`);
});

test('the rest arms only within 1 px of the rest, with no input and no finger down', () => {
  const short = new Page(REST, REST - 2);
  short.idle(1000);
  assert.equal(short.g.armed, false, '2 px short of the rest');
  assert.equal(short.frame(100, true), 'hold', 'so a notch from there is held, not run');
  const near = new Page(REST, REST - 0.8);
  near.idle(400);
  assert.equal(near.g.armed, true, 'within 1 px (a device pixel short)');
  const typing = new Page(REST, REST);
  for (let k = 0; k < 10; k++) { typing.idle(200); typing.frame(0, true); }   // a key every 200 ms, no movement
  assert.equal(typing.g.armed, false, 'input every 200 ms');
  const finger = new Page(REST, REST, { touching: true });
  finger.idle(1000);
  assert.equal(finger.g.armed, false, 'a finger resting on the glass');
  finger.o.touching = false;
  finger.frame(0, true);   // the touchend
  finger.idle(330);
  assert.equal(finger.g.armed, true, 'armed 300 ms after the finger lifts');
});

test('input does not disarm: a key or a tap at the armed rest leaves the next notch to run the exit', () => {
  const p = armedAt();
  p.frame(0, true); p.frame(0, true);
  assert.equal(p.g.armed, true);
  assert.equal(p.frame(120, true), 'exit');
});

test('leaving upward by more than half a screen disarms; less keeps it armed', () => {
  const near = armedAt();
  near.frame(-0.4 * VH, true); near.idle(100);
  assert.equal(near.g.armed, true, '0.4 of a screen up');
  assert.equal(near.frame(0.4 * VH + 50, true), 'exit', 'back down past the rest: the exit');
  const far = armedAt();
  far.frame(-0.6 * VH, true);
  assert.equal(far.g.armed, false, '0.6 of a screen up');
  assert.equal(far.frame(0.6 * VH + 50, true), 'hold', 'back down past the rest: held, not run');
  far.idle(330);
  assert.equal(far.g.armed, true, 'and armed again by the rest');
});

test('a crossing, never an arrival: a frame that ends exactly at the rest does nothing; a page past the rest with no last frame is held, never run', () => {
  const p = new Page(REST, REST - 300);
  p.frame();
  assert.equal(p.frame(300), null, 'arriving on the rest');
  assert.equal(p.y, REST);
  const fresh = armedAt();
  fresh.prevY = NaN;   // the director's first frame
  fresh.y = REST + 200;
  assert.equal(fresh.frame(), 'hold');
  assert.equal(fresh.exits, 0);
});

test('PageDown twice quickly from the wipe holds at section 5; a third after a rest runs the exit', () => {
  // a page step at 844 is 0.875 of it (738.5 px), each a smooth scroll of nine frames; the second pressed 100 ms after the first
  const step = 0.875 * VH, frames = 9, per = step / frames;
  const p = new Page(REST, REST - 1.5 * VH);
  const queue: number[] = [];
  const press = () => { for (let k = 0; k < frames; k++) queue[k] = (queue[k] ?? 0) + per; };
  press(); p.frame(queue.shift() ?? 0, true);
  for (let k = 0; k < 5; k++) p.frame(queue.shift() ?? 0);
  press(); p.frame(queue.shift() ?? 0, true);
  while (queue.length) p.frame(queue.shift() ?? 0);
  assert.equal(p.exits, 0, 'two pages from the wipe: held');
  assert.ok(p.holds > 0);
  assert.equal(p.y, REST);
  p.idle(400);
  assert.equal(p.g.armed, true);
  press();
  assert.equal(p.frame(queue.shift() ?? 0, true), 'exit', 'the third, after a rest');
});

test('the wrap from the top: nothing while its seam runs; the rest arms it once the lock has ended, and the next notch runs the exit', () => {
  const p = new Page(REST, 0, { live: false });
  p.idle(300);   // the cover-in over the hero
  p.y = REST; p.prevY = REST;   // landWrap: the page set to the rest, prevY with it
  p.idle(1100);   // the hold, the cover-out and the lock
  assert.equal(p.g.armed, false, 'never armed during the seam');
  p.o.live = true;
  p.frame();
  assert.equal(p.g.armed, true, 'the rest has held since the landing: armed as the lock ends');
  assert.equal(p.frame(100, true), 'exit');
  // a wheel's momentum swallowed during the lock (input with no movement) keeps it unarmed until 300 ms after the tail
  const q = new Page(REST, REST, { live: false });
  q.prevY = REST;
  q.idle(800); q.burst(10, 0);
  q.o.live = true;
  q.frame();
  assert.equal(q.g.armed, false, 'the tail ended a frame ago');
  q.idle(320);
  assert.equal(q.g.armed, true);
});

test('the seams\' refusals (a text field focused, the keyboard up, a zoomed page): no hold and no exit, disarmed; after them the page past the rest is held, the rest arms it again and the next gesture runs the exit', () => {
  const p = armedAt();
  p.o.refuse = true;
  assert.equal(p.frame(0, true), null);
  assert.equal(p.g.armed, false, 'disarmed by the refusal');
  for (let k = 0; k < 8; k++) assert.equal(p.frame(15), null, 'the browser lifting the field above the keyboard is never fought');
  assert.equal(p.y, REST + 120, 'the page left where the browser put it');
  assert.equal(p.frame(200, true), null, 'and a wheel past the rest while typing runs nothing');
  p.o.refuse = false;
  assert.equal(p.frame(), 'hold', 'the refusal over: the page back at the rest');
  assert.equal(p.y, REST);
  p.idle(330);
  assert.equal(p.g.armed, true, 'armed by the rest');
  assert.equal(p.frame(90, true), 'exit', 'the next gesture runs the exit');
});

test('not live (a seam, the entry, the way back) and no reading: nothing, and disarmed', () => {
  const p = armedAt();
  p.o.live = false;
  assert.equal(p.frame(200, true), null);
  assert.equal(p.g.armed, false);
  const blind = new Page(NaN, REST + 500);
  blind.idle(500);
  assert.deepEqual([...new Set(blind.acts)], [null], 'no hold and no exit before section 5 has a reading');
  const half = new Page(REST, REST + 500, { exitY: NaN });
  half.idle(100);
  assert.deepEqual([...new Set(half.acts)], [null]);
});

test('a landscape phone: the body runs past the screen, exitY and the rest at its end; the body read through without a hold, a fling past its end held, the rest there arms it', () => {
  // 844 x 390: the section's top at T, the body 890 px tall, so its end meets the viewport's bottom at T + 500
  const T = 20_000, rest = T + 500, vh = 390;
  const p = new Page(rest, T, { vh });
  for (let k = 0; k < 9; k++) p.frame(50, true);   // reading down the body to T + 450
  assert.deepEqual([...new Set(p.acts)], [null], 'no hold inside the body');
  p.burst(6, 80);
  assert.equal(p.exits, 0);
  assert.equal(p.y, rest, 'held at the body\'s end');
  p.idle(330);
  assert.equal(p.g.armed, true);
  p.frame(-0.5 * vh - 10, true);
  assert.equal(p.g.armed, false, 'up to the top of a body more than half a screen above its end: disarmed');
});

test('a body shorter than the screen: exitY above the section\'s top, the rest at the top and the trigger with it; the exit is held at the rest', () => {
  const T = 20_000, p = new Page(T, T - 300, { exitY: T - 80 });
  for (let k = 0; k < 5; k++) p.frame(52, true);   // through exitY to T - 40
  assert.deepEqual([...new Set(p.acts)], [null], 'past exitY but short of the top: no hold, no exit, the page goes on');
  p.frame(40, true); p.idle(330);
  assert.equal(p.g.armed, true, 'armed at the top');
  assert.equal(p.frame(60, true), 'exit', 'the crossing of the top');
  assert.doesNotMatch(read('src/scripts/hero/section4/director.ts'), /startExit\(/, 'the exit seam no longer runs: the page ends at section 5 (2026-11-03)');
});

test('refuses: a text field of any type, a textarea, a select or contentEditable; never a checkbox, a radio, a button, a link or the body; the keyboard by the visual viewport against clientHeight; the zoom', () => {
  const el = (tagName: string, type?: string, isContentEditable = false) => ({ tagName, type, isContentEditable });
  for (const [e, want] of [
    [el('INPUT', 'email'), true], [el('INPUT', 'text'), true], [el('INPUT', 'search'), true], [el('INPUT', 'tel'), true], [el('INPUT', 'password'), true], [el('INPUT'), true], [el('input', 'EMAIL'), true],
    [el('TEXTAREA'), true], [el('SELECT', 'select-one'), true], [el('DIV', undefined, true), true],
    [el('INPUT', 'checkbox'), false], [el('INPUT', 'radio'), false], [el('INPUT', 'submit'), false], [el('INPUT', 'button'), false], [el('BUTTON', 'submit'), false], [el('A'), false], [el('BODY'), false],
  ] as const) assert.equal(refuses(e, { height: 844, scale: 1 }, 844), want, `${e.tagName} ${e.type ?? ''} ${e.isContentEditable ? 'contentEditable' : ''}`);
  assert.equal(refuses(null, null, 844), false, 'nothing focused, no visual viewport');
  assert.equal(refuses(undefined, { height: 844, scale: 1 }, 844), false);
  assert.equal(refuses(null, { height: 512, scale: 1 }, 844), true, 'the keyboard up: the visual viewport 332 px short');
  assert.equal(refuses(null, { height: 843.4, scale: 1 }, 844), false, 'a fraction short (an odd zoom level): no keyboard');
  assert.equal(refuses(null, { height: 745, scale: 1 }, 664), false, 'Safari\'s bars collapsed: the visual viewport taller than the small viewport');
  assert.equal(refuses(null, { height: 422, scale: 2 }, 844), true, 'pinch-zoomed');
});

test('a rest is seen whole: the director\'s first frame and a hold\'s own snap count as movement', () => {
  const first = new Page(REST, REST);
  first.frame();
  assert.equal(first.g.armed, false, 'at the rest on the first frame, with no history: not armed yet');
  first.idle(330);
  assert.equal(first.g.armed, true);
  // a page left past the rest by a refusal, long after its last input: held back, then armed only 300 ms after the snap
  const left = new Page(REST, REST + 150, { refuse: true });
  left.idle(1000);
  left.o.refuse = false;
  assert.equal(left.frame(), 'hold');
  left.frame();
  assert.equal(left.g.armed, false, 'a frame after the snap');
  left.idle(330);
  assert.equal(left.g.armed, true);
});

test('director.ts: the guard heard on passive inputs, run each frame in world or hall before the seam, the hold as the exit\'s cover-in holds, the hooks\' armed flag; exit-guard.ts imports nothing and the director nothing of the glue\'s', () => {
  const director = read('src/scripts/hero/section4/director.ts'), guard = read('src/scripts/hero/section4/exit-guard.ts');
  assert.equal([...guard.matchAll(/^import\b/gm)].length, 0, 'exit-guard.ts imports nothing');
  assert.match(director, /import \{ createExitGuard, exitGuard, refuses \} from '\.\/exit-guard\.ts';/);
  assert.doesNotMatch(director, /scroll-math/, 'no chunk shared with scroll.ts');
  assert.match(director, /const GUARD_INPUTS = \['wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'keydown'\] as const;/);
  assert.match(director, /for \(const n of GUARD_INPUTS\) addEventListener\(n, onInput, \{ passive: true \}\);/, 'heard passively, never prevented');
  assert.match(director, /for \(const n of GUARD_INPUTS\) removeEventListener\(n, onInput\); removeEventListener\('blur', onLeave\);/, 'and let go on dispose');
  assert.match(director, /const onInput = \(e: Event\) => \{ inputAt = performance\.now\(\); if \('touches' in e\) fingers = \(e as TouchEvent\)\.touches\.length; \};/);
  assert.match(director, /const act = exitGuard\(guard, \{ y, prevY, exitY: o\.exitY\(\), restY, vh: innerHeight, now: performance\.now\(\), inputAt, touching: fingers > 0, refuse: refuses\(document\.activeElement, window\.visualViewport, H\.clientHeight\), live: state === 'hall' \|\| state === 'world' \}\);/);
  assert.match(director, /prevRaw = qRaw; prevY = y;\n\s*\/\/[^\n]*\n\s*if \(act === 'hold'\) holdAt\(Math\.round\(restY\)\);\n\s*\/\/ a seam first/, 'before the seam\'s frame, the hold at the rounded rest');
  assert.match(director, /function holdAt\(y: number\) \{\n\s*if \(Math\.abs\(scrollY - y\) > 0\.5\) scrollTo\(\{ top: y, behavior: 'instant' \}\);\n\s*const qq = \(y - top\) \/ screenPx\(\); follow\.snap\(qq\); q = qAll = qRaw = prevRaw = qq; prevY = y;\n\s*\}/, 'one hold for both');
  assert.match(director, /if \(s\.kind === 'exit'\) holdAt\(s\.holdY\);/, 'the exit\'s cover-in holds through it');
  assert.doesNotMatch(director, /const crossed = /, 'the bare crossing is gone');
  assert.match(director, /exitArmed: guard\.armed/, 'the hooks report the arming');
});

test('stage/resize.ts has section 5\'s layout read afresh after a resize, after section 4 (its ground is one texel, with nothing to resize)', () => {
  // the window resized from 1280 x 800 to 1536 x 730 at a pixel ratio of 1.5, on a fake context
  const calls: string[] = [];
  const g = globalThis as unknown as Record<string, unknown>;
  const saved = { document: g.document, innerWidth: g.innerWidth, innerHeight: g.innerHeight };
  try {
    g.document = { documentElement: { clientWidth: 1536 } }; g.innerWidth = 1536; g.innerHeight = 730;
    const canvas = { width: 1920, height: 1200 };
    const ctx = {
      dpr: 1.5, touch: false,
      intro: { resize: () => false },
      renderer: { domElement: canvas, setSize: (w: number, h: number) => { canvas.width = Math.floor(w * 1.5); canvas.height = Math.floor(h * 1.5); calls.push(`renderer ${w}x${h}`); } },
      composerA: { c: { setSize: () => {} } },
      camA: { aspect: 1, zoom: 1, updateProjectionMatrix: () => {} },
      composite: { C: { uAspect: { value: 1 } } },
      fogGround: { resize: (w: number, h: number) => calls.push(`fog ${w}x${h}`) },
      room: { resize: (w: number, h: number) => calls.push(`room ${w}x${h}`) },
      signup: { invalidate: () => calls.push('signup layout') },
      mask: { resize: () => {} },
      section2: { resize: () => {} },
      sky: { onAspect: () => {} },
    };
    createResize(ctx as unknown as Parameters<typeof createResize>[0])();
    assert.deepEqual(calls, ['renderer 1536x730', 'fog 2304x1095', 'room 2304x1095', 'signup layout']);
    calls.length = 0;
    (ctx as { signup: unknown }).signup = null;
    createResize(ctx as unknown as Parameters<typeof createResize>[0])();
    assert.deepEqual(calls, ['renderer 1536x730', 'fog 2304x1095', 'room 2304x1095'], 'a page with no section#signup: nothing for section 5');
  } finally { Object.assign(g, saved); }
});

test('hero.ts hands the director section 5\'s trigger and rest from the DOM alone (section5/ground.ts, C6) and its readiness from data-ready (C3); no jar chunk, no section 5 hooks of the jar', () => {
  const hero = read('src/scripts/hero/hero.ts');
  assert.match(hero, /exitY: \(\) => signup \? signup\.exitY\(\) : NaN,\n\s*restY: \(\) => signup \? signup\.restY\(\) : NaN,\n\s*signupReady: \(\) => !signup \|\| signup\.ready\(\),/);
  assert.match(hero, /const signup = signupEl \? createSignupGround\(signupEl\) : null;/);
  assert.doesNotMatch(hero, /section5\/jars|loadSignup|__s5\b|signupDom/, 'the jar chunk, its loader, its hooks and the old fallback reading are gone');
  assert.match(hero, /const onUnlock = \(\) => \{ signup\?\.invalidate\(\);/, 'the unlock has the section read afresh');
  const ground = read('src/scripts/hero/section5/ground.ts');
  assert.match(ground, /const s = root\.getBoundingClientRect\(\), b = \(body && body\.getClientRects\(\)\.length \? body : root\)\.getBoundingClientRect\(\), y = scrollY;/, 'the section\'s rect and .su-body\'s, read together');
  assert.match(ground, /const body = root\.querySelector<HTMLElement>\('\.su-body'\);/);
});
