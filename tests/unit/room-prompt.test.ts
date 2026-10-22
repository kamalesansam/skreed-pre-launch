// Section 4's prompt across a lap (docs/specs/section-4-flux.md 2 "Scene 1 and the way back", AC13; the build record's
// D2: after the way back the prompt came back as a blank ring, its [E] and text spans gone and its name "[E][E]Enter
// Skreed universeENTER SKREED UNIVERSE"). The decode (src/scripts/quiz/decode.ts) under a fake document: a hide of the
// button itself splits the button's whole text afresh and detaches the two prepared spans (the mechanism), while the
// prompt's wipe in walk.ts hides the two spans and leaves the button's markup intact, so the way back's conceal and the
// station frame's show find them, with the same name as on the first lap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

/** the least of an element the decode touches: text, children, class, attributes, style, the :scope > .sr-only query */
class El {
  tag: string; className = ''; attrs: Record<string, string> = {}; children: El[] = []; parent: El | null = null; style: Record<string, string> = {}; text = '';
  constructor(tag: string) { this.tag = tag; }
  get textContent(): string { return this.children.length ? this.children.map((c) => c.textContent).join('') : this.text; }
  set textContent(v: string) { for (const c of this.children) c.parent = null; this.children = []; this.text = v; }
  append(...els: El[]) { for (const e of els) { e.parent = this; this.children.push(e); } }
  setAttribute(k: string, v: string) { this.attrs[k] = v; }
  querySelector(sel: string): El | null { return sel === ':scope > .sr-only' ? this.children.find((c) => c.className === 'sr-only') ?? null : null; }
  /** what assistive technology reads: the sr-only copies, aria-hidden parts left out */
  get name(): string { if (this.attrs['aria-hidden'] === 'true') return ''; return this.children.length ? this.children.map((c) => (c.className === 'dc' ? '' : c.name)).join('') : this.text; }
}
const g = globalThis as unknown as Record<string, unknown>;
// a hidden document settles every decode at once (decode.ts: no frames are drawn, so the text goes straight to its end state)
g.document = { visibilityState: 'hidden', createElement: (t: string) => new El(t), addEventListener() {} };
g.requestAnimationFrame = (fn: (t: number) => void) => setTimeout(() => fn(performance.now()), 1);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
const { createDecoder } = await import('../../src/scripts/quiz/decode.ts');
type H = HTMLElement;

/** the prompt as Room.astro writes it: [E] aria-hidden, then the words */
function prompt() {
  const enter = new El('button'), keyEl = new El('span'), enterText = new El('span');
  keyEl.className = 'rm-key'; keyEl.setAttribute('aria-hidden', 'true'); keyEl.text = '[E]';
  enterText.className = 'rm-enter-text'; enterText.text = 'Enter Skreed universe';
  enter.append(keyEl, enterText);
  return { enter, keyEl, enterText };
}

test('the mechanism: a decode hide of the button itself splits its whole text afresh, garbles the name and detaches the two spans', async () => {
  const dec = createDecoder(() => false);
  const { enter, keyEl, enterText } = prompt();
  dec.prepare(keyEl as unknown as H); dec.prepare(enterText as unknown as H);
  assert.equal(enter.name, 'Enter Skreed universe', 'prepared: the name is the words');
  await dec.hide(enter as unknown as H);
  assert.equal(keyEl.parent, null); assert.equal(enterText.parent, null);
  assert.equal(enter.querySelector(':scope > .sr-only')?.textContent, '[E][E]Enter Skreed universeENTER SKREED UNIVERSE', "the build record's reading");
  assert.notEqual(enter.name, 'Enter Skreed universe');
});

test("the prompt's wipe: the two spans hide and show again, the button's markup and name intact across the lap", async () => {
  const dec = createDecoder(() => false);
  const { enter, keyEl, enterText } = prompt();
  dec.prepare(keyEl as unknown as H); dec.prepare(enterText as unknown as H);
  const first = enter.name;
  // the entry (walk.ts wipePrompt): inert, the two spans wiped, then hidden
  let hidden = false;
  await Promise.all([dec.hide(keyEl as unknown as H), dec.hide(enterText as unknown as H)]).then(() => { hidden = true; });
  assert.ok(hidden);
  assert.deepEqual(enter.children, [keyEl, enterText], 'the spans stay the button\'s children');
  assert.ok(keyEl.children.every((c) => c.className !== 'dc' || c.children.every((s) => s.style.opacity === '0')), 'the glyphs are out');
  // the way back (restorePrompt): concealed, then the station frame decodes the two in
  dec.conceal(keyEl as unknown as H); dec.conceal(enterText as unknown as H);
  await Promise.all([dec.show(keyEl as unknown as H), dec.show(enterText as unknown as H)]);
  assert.deepEqual(enter.children, [keyEl, enterText]);
  assert.equal(enter.name, first);
  assert.equal(enter.name, 'Enter Skreed universe');
  assert.equal(enterText.querySelector(':scope > .sr-only')?.textContent, 'Enter Skreed universe');
  assert.equal(keyEl.querySelector(':scope > .sr-only')?.textContent, '[E]');
  const row = enterText.children.find((c) => c.className === 'dc')!;
  assert.equal(row.children.map((s) => s.textContent).join(''), 'ENTER SKREED UNIVERSE');
  assert.ok(row.children.every((s) => s.style.opacity === ''), 'every glyph shown');
});

test('walk.ts wipes the prompt by its two spans and never hands the button itself to the decode', () => {
  const walk = read('src/scripts/room/walk.ts');
  assert.match(walk, /function wipePrompt\(to\?: HTMLElement \| null\) \{[\s\S]*?enter\.inert = true;\s*void Promise\.all\(\[dec\.hide\(keyEl\), dec\.hide\(enterText\)\]\)\.then\(\(\) => \{ if \(enter\.inert\) enter\.hidden = true; \}\);/);
  assert.match(walk, /wipePrompt\(hadFocus \? skip : null\);/, 'the entry wipes the prompt this way');
  assert.doesNotMatch(walk, /wipeControl\(enter\b|dec\.(hide|show|prepare|set|conceal)\(enter\)/, 'the button never goes through the decode');
  assert.match(walk, /function restorePrompt\(\) \{[\s\S]*?dec\.conceal\(keyEl\); dec\.conceal\(enterText\);/, 'the way back conceals the same two spans');
});
