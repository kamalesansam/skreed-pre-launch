// Section 2 to the family pages (docs/specs/family-page.md 2.2; acceptance 2, links part): the gem to family mapping
// under every block colour order, the click rule, the return path and the poster-path swatch rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROCK_LINKS, linkForShade, installRockNav, TAP_SLOP_PX } from '../../src/scripts/family/rock-links.ts';
import { REGION, BLOCK_ORDER } from '../../src/config/shades.gen.ts';

// spec 2.2, the table for today's default "cool" order: block, holds, opens
const COOL: [number, string, string][] = [
  [0, 'Mango', '/shades/blushing-corals/?shade=148'], [1, 'Silver', '/shades/stormy-greys/?shade=173'],
  [2, 'Snow', '/shades/frosty-whites/?shade=007'], [3, 'Sky', '/shades/blissful-blues/?shade=032'],
  [4, 'Cinnamon', '/shades/earthy-browns/?shade=127'], [5, 'Amethyst', '/shades/vivid-violets/?shade=079'],
  [6, 'Sunbeam', '/shades/mellow-yellows/?shade=097'], [7, 'Rouge', '/shades/playful-pinks/?shade=062'],
  [8, 'Lawn', '/shades/go-green/?shade=204'], [9, 'Crimson', '/shades/roaring-reds/?shade=223'],
];
// the prototype's other orders (prototypes/hero-v9/template.html BLOCK_ORDERS)
const ORDERS: Record<string, string[]> = {
  warm: ['Sky', 'Cinnamon', 'Snow', 'Mango', 'Silver', 'Crimson', 'Lawn', 'Rouge', 'Sunbeam', 'Amethyst'],
  wheel: ['Mango', 'Sky', 'Cinnamon', 'Snow', 'Crimson', 'Silver', 'Rouge', 'Lawn', 'Amethyst', 'Sunbeam'],
  original: ['Amethyst', 'Lawn', 'Rouge', 'Silver', 'Sunbeam', 'Crimson', 'Cinnamon', 'Snow', 'Mango', 'Sky'],
};

test('ten links in catalog order with the accessible names of 2.2', () => {
  assert.deepEqual(ROCK_LINKS.map((l) => l.slug), ['frosty-whites', 'blissful-blues', 'playful-pinks', 'vivid-violets', 'mellow-yellows', 'earthy-browns', 'blushing-corals', 'stormy-greys', 'go-green', 'roaring-reds']);
  ROCK_LINKS.forEach((l, i) => assert.equal(l.shade, REGION[i].name));
});

test('the default cool order opens the families of the 2.2 table, derived from the shade index', () => {
  for (const [block, holds, href] of COOL) {
    const shadeIndex = BLOCK_ORDER[block];
    assert.equal(REGION[shadeIndex].name, holds, `block ${block}`);
    assert.equal(linkForShade(shadeIndex).href, href, `block ${block}`);
  }
});

test('any other block colour order still links each gem to the family of the shade it shows', () => {
  for (const [name, order] of Object.entries(ORDERS)) {
    order.forEach((shadeName, block) => {
      const shadeIndex = REGION.findIndex((r) => r.name === shadeName);
      const l = linkForShade(shadeIndex);
      assert.equal(l.shade, shadeName, `${name} block ${block}`);
      assert.ok(REGION[shadeIndex].id.startsWith(l.slug), `${name} block ${block}`);
    });
  }
  assert.throws(() => linkForShade(10), RangeError);
});

test('the poster-path swatch rules follow family-keys.json', () => {
  const css = readFileSync(new URL('../../src/styles/family-links.css', import.meta.url), 'utf8');
  for (const r of REGION) {
    const slug = r.id.replace(/-\d\d$/, '');
    assert.ok(css.includes(`.fl a[data-family="${slug}"] .fl-sw { background: var(--shade-${r.id}); }`), slug);
  }
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|box-shadow|gradient|visibility:\s*hidden/);
});

// --- the click rule, with a fake canvas and stub browser globals ---
type Fake = { clientX: number; clientY: number; target?: unknown; button?: number; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; defaultPrevented?: boolean };
function harness(pickResult: number | null) {
  const calls: { assign?: string; replaceState?: string; events: unknown[] } = { events: [] };
  const g = globalThis as Record<string, unknown>;
  g.history = { state: null, replaceState: (_s: unknown, _t: string, u: string) => { calls.replaceState = u; } };
  g.location = { assign: (u: string) => { calls.assign = u; }, hash: '' };
  g.dispatchEvent = (e: CustomEvent) => { calls.events.push(e.detail); return true; };
  g.requestAnimationFrame = (f: () => void) => { f(); return 1; };
  g.cancelAnimationFrame = () => {};
  const canvas = new EventTarget() as unknown as HTMLElement;
  const fire = (type: string, e: Fake) => {
    const ev = new Event(type);
    for (const [k, v] of Object.entries({ button: 0, ...e })) Object.defineProperty(ev, k, { value: v });
    canvas.dispatchEvent(ev);
  };
  const off = installRockNav({ canvas, pick: () => pickResult });
  return { calls, fire, canvas, off };
}

test('a tap that moved 10 px or less on a gem navigates, with the return path set first', () => {
  const h = harness(3);
  h.fire('pointerdown', { clientX: 100, clientY: 100 });
  h.fire('click', { clientX: 100 + TAP_SLOP_PX * 0.6, clientY: 100 + TAP_SLOP_PX * 0.6 });
  assert.equal(h.calls.replaceState, '#families');
  assert.equal(h.calls.assign, '/shades/vivid-violets/?shade=079');
  assert.deepEqual(h.calls.events[0], { event: 'family_open', props: { family: 'vivid-violets', from: 'rock' } });
  h.off();
});

test('a drag, a click off the canvas, a modified click or a miss never navigates', () => {
  const drag = harness(3);
  drag.fire('pointerdown', { clientX: 100, clientY: 100 });
  drag.fire('click', { clientX: 112, clientY: 100 });
  assert.equal(drag.calls.assign, undefined, 'moved 12 px');
  drag.off();
  const label = harness(3);
  label.fire('pointerdown', { clientX: 100, clientY: 100 });
  label.fire('click', { clientX: 100, clientY: 100, target: {} });
  assert.equal(label.calls.assign, undefined, 'a DOM control over the canvas');
  label.off();
  const meta = harness(3);
  meta.fire('pointerdown', { clientX: 1, clientY: 1 });
  meta.fire('click', { clientX: 1, clientY: 1, metaKey: true });
  assert.equal(meta.calls.assign, undefined, 'cmd-click keeps the browser behaviour');
  meta.off();
  const miss = harness(null);
  miss.fire('pointerdown', { clientX: 1, clientY: 1 });
  miss.fire('click', { clientX: 1, clientY: 1 });
  assert.equal(miss.calls.assign, undefined, 'no gem under the pointer');
  miss.off();
});
