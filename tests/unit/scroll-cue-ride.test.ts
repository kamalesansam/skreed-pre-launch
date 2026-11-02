// The ride's wiring of the words' rule (src/scripts/hero/scroll/ride.ts; docs/specs/scroll-cue.md 4, D10, D11): the page
// lock read from the root's classes (loading, intro, poster) with the rest clock running from its end, the reads kept once
// per rest, and the pin place set with the class and held through the fade out after a jump to the top. Over a stub
// document and clock, so the island's frame loop is not needed; the rule itself is scroll-cue.test.ts's.
//   node --test tests/unit/scroll-cue-ride.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CUE } from '../../src/config/cue.ts';
import { S2T } from '../../src/config/hero.ts';

const VH = 844;
const g = globalThis as unknown as Record<string, unknown>;
let now = 0, reads = { doc: 0, quiz: 0 };
const rootClasses = new Set<string>();
const mkEl = () => {
  const classes = new Set<string>();
  return {
    classes, dataset: {} as Record<string, string>,
    classList: { contains: (c: string) => classes.has(c), add: (c: string) => { classes.add(c); }, remove: (c: string) => { classes.delete(c); }, toggle: (c: string, on?: boolean) => { const want = on ?? !classes.has(c); if (want) classes.add(c); else classes.delete(c); return want; } },
  };
};
g.window = g;
g.document = {
  documentElement: { classList: { contains: (c: string) => rootClasses.has(c) }, get scrollHeight() { reads.doc++; return 20 * VH; } },
  getElementById: (id: string) => (id === 'find' ? { getBoundingClientRect: () => { reads.quiz++; return { top: 16.2 * VH }; } } : null),
};
g.innerHeight = VH;
g.scrollY = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true, writable: true });
const { rideCopy } = await import('../../src/scripts/hero/scroll/ride.ts');

const more = mkEl(), cue = mkEl();
const els = { heroCopy: null, cue: cue as unknown as HTMLElement, labels: null, siteLogo: null, more: more as unknown as HTMLElement };
/** one island frame at `screens`, section 2 built, the first wipe at rest */
const frame = (screens: number, dt = 100) => { now += dt; g.scrollY = screens * VH; const tp = Math.min(1, Math.max(0, (screens - S2T.PULL) / S2T.WIPE)); rideCopy(els, tp, 0.46, true); };
/** two pin places by the scroll map (halved on 2026-11-02): mid pull-back, and the cascade's middle past the first wipe */
const PIN_A = S2T.PULL / 2, PIN_B = (S2T.W1END + S2T.LAND) / 2;
const on = () => more.classes.has('is-on');

test('under the lock (loading, intro, poster) at the top with the chevrons off: never on, nothing measured, and the rest counts from the lock\'s end', () => {
  for (const lock of ['loading', 'intro', 'poster']) {
    rootClasses.clear(); rootClasses.add(lock); cue.classes.add('is-off'); reads = { doc: 0, quiz: 0 };
    for (let i = 0; i < 30; i++) frame(0);   // 3 s under the lock
    assert.equal(on(), false, `${lock}: off`);
    assert.equal(reads.doc + reads.quiz, 0, `${lock}: no layout read under the lock`);
    rootClasses.delete(lock);
    frame(0); assert.equal(on(), false, `${lock}: not at the lift`);   // the rest counts from the last locked frame
    for (let i = 0; i < 13; i++) frame(0);   // 1.4 s after it
    assert.equal(on(), false, `${lock}: not yet rested since the lift`);
    frame(0);
    assert.equal(on(), true, `${lock}: back alone once the page has rested since the lift, the chevrons still off`);
    assert.equal(more.dataset.at, undefined, `${lock}: at the top place`);
    assert.equal(reads.doc, 1, `${lock}: the document measured once`);
    cue.classes.delete('is-off'); frame(0);
    assert.equal(on(), false, `${lock}: the chevrons back: the words follow them by CSS`);
  }
});

test('the pin: the place is set in the frame the words come on, the reads are kept per rest, and the tone follows the wipe', () => {
  rootClasses.clear(); reads = { doc: 0, quiz: 0 };
  frame(PIN_A); cue.classes.add('is-off');   // the plain script hides the chevrons past 8 px
  for (let i = 0; i < 14; i++) frame(PIN_A);
  assert.equal(on(), false, 'not before the rest'); assert.equal(more.dataset.at, undefined, 'no place before the words come on');
  frame(PIN_A);
  assert.equal(on(), true); assert.equal(more.dataset.at, 'pin', 'placed in the same frame'); assert.equal(more.dataset.tone, undefined, 'Pearl Whisper before the wipe');
  for (let i = 0; i < 20; i++) frame(PIN_A);
  assert.equal(reads.quiz, 1, 'the quiz read once per rest, never per frame'); assert.equal(reads.doc, 0, 'the document only at the top');
  frame(PIN_B); assert.equal(on(), false, 'moving: off at once'); assert.equal(more.dataset.at, 'pin', 'the place kept between two pin places');
  for (let i = 0; i < 16; i++) frame(PIN_B);
  assert.equal(on(), true); assert.equal(more.dataset.tone, 'light', 'Urban Slate over the fog'); assert.equal(reads.quiz, 2, 'read again after the move');
});

test('a jump to the top from the pin: off at once, the pin place held through the fade out, then dropped, and back over the column after the rest (D10)', () => {
  rootClasses.clear(); cue.classes.add('is-off');
  frame(PIN_B); for (let i = 0; i < 16; i++) frame(PIN_B);
  assert.equal(on(), true); assert.equal(more.dataset.at, 'pin');
  frame(0);   // the Home key, a scrollbar drag, a status-bar tap: the chevrons stay off while the camera's followers lag
  assert.equal(on(), false, 'off in the frame the scroll changed'); assert.equal(more.dataset.at, 'pin', 'still in the corner while it fades');
  frame(0, CUE.fadeMs - 1);
  assert.equal(more.dataset.at, 'pin', 'held to the end of the fade');
  frame(0, 1);
  assert.equal(more.dataset.at, undefined, 'dropped once the fade has ended: the move happens hidden');
  assert.equal(on(), false, 'not yet rested');
  let n = 0; while (!on() && n++ < 30) frame(0);
  assert.equal(on(), true, 'back alone at the top after the rest, the chevrons still off');
  assert.ok(now >= 0, 'the clock ran');
  assert.equal(more.dataset.at, undefined, 'over the column');
  cue.classes.delete('is-off'); frame(0);
  assert.equal(on(), false, 'the chevrons back (the followers arrived): the words follow them by CSS');
});
