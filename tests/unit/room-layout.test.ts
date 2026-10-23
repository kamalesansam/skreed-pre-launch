// Section 4's cached layout (docs/specs/section-4.md 5 "the cached layout"; the build record's D1: at 390 x 844 the
// director chunk arrives during the intro, when the hero's track stands collapsed and #room's top reads 1,577 px in
// place of 15,361, and nothing re-read it). layout.ts under node with fake observers: a reading taken under html.intro
// is replaced when html's class changes, when the document's size changes, and by get() on its own once the intro has
// ended; the director and the stills script drive off it (the hooks report it, render-stills.mjs waits for it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { watchLayout, type Layout } from '../../src/scripts/hero/section4/layout.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

/** a fake observer: the callback kept, fired by the test */
class Fake {
  static made: Fake[] = [];
  observed: unknown[] = [];
  cb: () => void;
  constructor(cb: () => void) { this.cb = cb; Fake.made.push(this); }
  observe(el: unknown) { this.observed.push(el); }
  disconnect() { this.observed = []; }
}
/** the page as the director sees it: html's classes, the section's rect by layout (the intro's and the real one) */
function page() {
  const classes = new Set(['js', 'hero3d', 'intro']);
  const html = { classList: { contains: (c: string) => classes.has(c) } };
  // the intro's layout (the hero's track at 100svh) puts the section at 1,577 px; the real one at 15,361 (the build record's numbers at 390 x 844)
  const rect = () => (classes.has('intro') ? { top: 1577, height: 13335 } : { top: 15361, height: 13335 });
  return { classes, html, rect };
}

test('a reading taken under html.intro is replaced when the intro class goes (the MutationObserver on html\'s class)', () => {
  Fake.made = [];
  const p = page(), seen: Layout[] = [];
  const section = { id: 'room' }, quiz = { id: 'find' }, doc = { id: 'html' };
  const lay = watchLayout({ html: p.html, read: () => p.rect(), watch: [section, quiz, null, doc] as unknown as Element[], onMeasure: (l) => seen.push(l), mutation: Fake as never, resize: Fake as never, listen: () => () => {} });
  const [mo, ro] = Fake.made;
  assert.deepEqual(mo.observed, [p.html], 'html is watched for its class');
  assert.deepEqual(ro.observed, [section, quiz, doc], 'the section, the quiz and the document are watched for their size; nulls skipped');
  assert.equal(lay.layout, null, 'nothing read before the first frame');
  // the first frame under the intro: the provisional reading
  const first = lay.get();
  assert.deepEqual(first, { top: 1577, height: 13335, intro: true });
  assert.deepEqual(lay.get(), first, 'held while the intro is on');
  // the intro ends: html loses the class, the observer fires, the reading is replaced
  p.classes.delete('intro');
  mo.cb();
  assert.deepEqual(lay.layout, { top: 15361, height: 13335, intro: false });
  assert.deepEqual(seen.map((l) => l.top), [1577, 15361]);
  lay.dispose();
  assert.deepEqual(mo.observed, [], 'disconnected');
});

test('a reading under html.intro is replaced by get() on its own once the intro has ended, even before any observer fires', () => {
  Fake.made = [];
  const p = page();
  const lay = watchLayout({ html: p.html, read: () => p.rect(), watch: [], mutation: null, resize: null, listen: () => () => {} });
  assert.deepEqual(lay.get(), { top: 1577, height: 13335, intro: true });
  p.classes.delete('intro');
  assert.deepEqual(lay.get(), { top: 15361, height: 13335, intro: false }, 'the frame after the intro reads again');
  assert.deepEqual(lay.get(), { top: 15361, height: 13335, intro: false }, 'and then holds');
});

test('the document growing (the ResizeObserver on documentElement) and a resize re-read the layout; a disposed watch stops', () => {
  Fake.made = [];
  const p = page();
  let onResize: (() => void) | null = null, off = 0;
  const lay = watchLayout({ html: p.html, read: () => p.rect(), watch: [{ id: 'html' } as unknown as Element], mutation: Fake as never, resize: Fake as never, listen: (fn) => { onResize = fn; return () => { off++; }; } });
  const ro = Fake.made[1];
  assert.deepEqual(lay.measure(), { top: 1577, height: 13335, intro: true });
  p.classes.delete('intro');
  ro.cb();
  assert.equal(lay.layout?.top, 15361, 'the document\'s size change re-read it');
  p.classes.add('intro'); onResize!();
  assert.deepEqual(lay.layout, { top: 1577, height: 13335, intro: true }, 'a resize reads whatever the layout is now');
  lay.dispose();
  p.classes.delete('intro');
  assert.equal(lay.measure()?.top, 1577, 'disposed: no reading changes');
  assert.equal(off, 1, 'the resize listener removed');
});

test('a section that is not there: no reading, and nothing throws; the height is at least 1', () => {
  const p = page();
  const none = watchLayout({ html: p.html, read: () => null, watch: [], mutation: null, resize: null, listen: () => () => {} });
  assert.equal(none.get(), null);
  const flat = watchLayout({ html: p.html, read: () => ({ top: 10, height: 0 }), watch: [], mutation: null, resize: null, listen: () => () => {} });
  assert.equal(flat.get()?.height, 1);
});

test('the director drives off layout.ts and reports the reading to the hooks; the stills script waits for a reading taken after the intro', () => {
  const director = read('src/scripts/hero/section4/director.ts');
  assert.match(director, /import \{ watchLayout \} from '\.\/layout\.ts';/);
  assert.match(director, /watch: \[root, document\.getElementById\('find'\), H\]/, 'the section, the quiz and the document are watched');
  assert.match(director, /onMeasure: \(l\) => \{ top = l\.top; height = l\.height; measured = true; o\.onLayout\?\.\(\); \}/, 'every reading reaches the wiring');
  assert.doesNotMatch(director, /new ResizeObserver|addEventListener\('resize', measure\)/, 'no cache of its own');
  assert.match(director, /layout: lay\.layout \? \{ \.\.\.lay\.layout \} : null/, 'the hooks report the reading');
  assert.match(read('src/scripts/hero/hero.ts'), /onLayout: \(\) => pageScroll\?\.notify\(\)/, 'the page scroll re-evaluates its capture set on every reading');
  const stills = read('scripts/room/render-stills.mjs');
  assert.match(stills, /channel: 'chrome'/, 'the installed Chrome first (it decodes H.264)');
  assert.match(stills, /layout && !s\.layout\.intro/, 'the first snap waits for a reading taken after the intro');
});
