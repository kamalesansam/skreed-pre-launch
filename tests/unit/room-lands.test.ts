// Section 4 part two's lands (docs/specs/section-4-world.md 3, "How each master is made" and "Provenance"; 6, the credit
// plan): src/data/room-lands.json, written by scripts/room/lands.py record, names the four lands in the catalog's order,
// each accessory in ROOM_PRODUCTS' shade and finish by id ("The shade rendered is the shade named"), every master with
// the sum committed in assets-src/room/lands/SHA256SUMS, every depth call on VDA-Small at one frame, and a ledger whose
// credits add up and stay inside the plan. The pictures themselves stay out of git, so only their records are tested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROOM_PRODUCTS } from '../../src/config/room.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import LANDS from '../../src/data/room-lands.json' with { type: 'json' };
import LEDGER from '../../src/data/room-lands.ledger.json' with { type: 'json' };

type Step = { stage: string; model?: string; job?: string; credits?: number; variant?: string; max_frames?: number; prompt?: string };
type Land = {
  id: string; n: number; approval: string;
  accessory: null | { shade: string; hex: string; finish: string; options?: { option: number; shade: string; hex: string }[] };
  classes: Record<string, { file: string; sha256: string | null; steps: Step[] }>;
};
const DOC = LANDS as unknown as { credits: number; lands: Land[] };
const byId = new Map(SHADES.map((s) => [s.id, s]));
const sums = new Map(readFileSync(new URL('../../assets-src/room/lands/SHA256SUMS', import.meta.url), 'utf8').trim().split('\n')
  .map((l) => { const [h, f] = l.split(/\s+/); return [f, h] as const; }));

test('the four lands in the catalog order, by ROOM_PRODUCTS ids, with the approvals Sam gave', () => {
  assert.deepEqual(DOC.lands.map((l) => l.id), ROOM_PRODUCTS.map((p) => p.id));
  assert.deepEqual(DOC.lands.map((l) => l.n), [1, 2, 3, 4]);
  const approval = Object.fromEntries(DOC.lands.map((l) => [l.id, l.approval]));
  assert.deepEqual(approval, { case: 'Sam 2026-10-20, with fixes', wallet: 'Sam 2026-10-20, with fixes', lenskin: 'pending the redo', airpods: 'Sam 2026-10-20, with fixes' });
});

test('each accessory is ROOM_PRODUCTS\' shade and finish by id, its hex the catalog\'s; the Lenskin\'s candidates are shades by id', () => {
  for (const l of DOC.lands) {
    const p = ROOM_PRODUCTS.find((r) => r.id === l.id)!;
    if (l.id === 'case') { assert.equal(l.accessory, null); continue; }
    assert.ok(l.accessory, l.id);
    assert.equal(l.accessory.shade, p.shade, l.id); assert.equal(l.accessory.finish, p.finish, l.id);
    assert.equal(l.accessory.hex.toLowerCase(), byId.get(p.shade)!.hex.toLowerCase(), l.id);
  }
  const opts = DOC.lands.find((l) => l.id === 'lenskin')!.accessory!.options!;
  assert.equal(opts.length, 5);
  assert.equal(opts[0].shade, ROOM_PRODUCTS.find((r) => r.id === 'lenskin')!.shade, 'option 0 is the first candidate');
  for (const o of opts) assert.equal(o.hex.toLowerCase(), byId.get(o.shade)?.hex.toLowerCase(), `option ${o.option}`);
  assert.equal(new Set(opts.map((o) => o.shade)).size, 5);
});

test('every master is listed with the sum committed beside the gitignored pictures', () => {
  for (const l of DOC.lands) {
    assert.deepEqual(Object.keys(l.classes).sort(), ['portrait', 'portrait-depth', 'square', 'wide', 'wide-depth'], l.id);
    for (const [c, v] of Object.entries(l.classes)) {
      assert.equal(v.file, `land-${l.id}-${c}.png`);
      assert.ok(v.sha256 && /^[0-9a-f]{64}$/.test(v.sha256), `${v.file}: a sum`);
      assert.equal(sums.get(v.file), v.sha256, `${v.file}: the sum in SHA256SUMS`);
    }
  }
});

test('the generator steps: depth on VDA-Small at one frame (Apache-2.0; 21.45 credits without the cap), prompts on the inpaints', () => {
  for (const l of DOC.lands) for (const [c, v] of Object.entries(l.classes)) for (const s of v.steps) {
    if (s.stage === 'depth') { assert.equal(s.variant, 'VDA-Small', `${l.id} ${c}`); assert.equal(s.max_frames, 1, `${l.id} ${c}`); }
    if (s.model === 'nano_banana_2_1') assert.ok(s.prompt && s.prompt.length > 40, `${l.id} ${c} ${s.stage}: its prompt`);
    if (s.model) assert.ok(s.job && /^[0-9a-f-]{36}$/.test(s.job), `${l.id} ${c} ${s.stage}: its job id`);
  }
  for (const l of DOC.lands) assert.ok(l.classes['portrait-depth'].steps.length === 1 && l.classes['wide-depth'].steps.length === 1, `${l.id}: one depth call per crop`);
});

test('the ledger adds up to the document\'s credits and stays inside the plan\'s 300', () => {
  const rows = LEDGER as { credits: number; status?: string | null; job: string | null }[];
  const total = Math.round(rows.reduce((a, r) => a + r.credits, 0) * 1000) / 1000;
  assert.equal(total, DOC.credits);
  assert.ok(total <= 300, `${total} credits`);
  for (const r of rows) if (r.status === 'failed') assert.equal(r.credits, 0);
});
