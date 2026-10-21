// Section 4 part two's lands (docs/specs/section-4-world.md 3, "How each master is made" and "Provenance"; 6, the credit
// plan and the land lines): src/data/room-lands.json, written by scripts/room/lands.py record, names the four lands in the
// catalog's order with Sam's three reviews (the first sheet reviewed with fixes asked, sheet-v2 approved with the seams to
// be blended and the Lenskin in option 3, sheet-final, the encoded files, approved: "this works, build it"), each
// accessory in ROOM_PRODUCTS' shade and finish by id ("The shade rendered is the shade named"; the Lenskin's Sam's pick),
// every master with the sum committed in assets-src/room/lands/SHA256SUMS, every depth call on VDA-Small at one frame and
// each wide's map made from its final crop, and a ledger whose credits add up and stay inside the plan. The pictures stay
// out of git, so only their records are tested; the encoded files in src/assets/room/lands/ (scripts/room/encode-lands.mjs)
// are tested for their sizes, lines, quality floors, Sam's acceptances and the masters they came from.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ROOM_PRODUCTS } from '../../src/config/room.ts';
import { SHADES } from '../../src/config/shades.gen.ts';
import LANDS from '../../src/data/room-lands.json' with { type: 'json' };
import LEDGER from '../../src/data/room-lands.ledger.json' with { type: 'json' };

type Review = { round: number; date: string; by: string; sheet: string; verdict: string; fixes?: string[]; lenskin?: string; words?: string };
type Step = { stage: string; model?: string; job?: string; credits?: number; variant?: string; max_frames?: number; prompt?: string; round?: number; local?: boolean };
type Land = {
  id: string; n: number; approval: string; reviews: Review[];
  accessory: null | { shade: string; hex: string; finish: string; options?: { option: number; shade: string; hex: string }[]; pick?: { option: number; shade: string } };
  classes: Record<string, { file: string; sha256: string | null; steps: Step[]; made_from?: string }>;
};
type Accepted = { file: string; quality: number; master: string; master_sha256: string; by: string; date: string; sheet: string; words: string };
const DOC = LANDS as unknown as { credits: number; encoding: { accepted: Accepted[] }; lands: Land[] };
const byId = new Map(SHADES.map((s) => [s.id, s]));
const readSums = (rel: string) => new Map(readFileSync(new URL(rel, import.meta.url), 'utf8').trim().split('\n')
  .map((l) => { const [h, f] = l.split(/\s+/); return [f, h] as const; }));
const sums = readSums('../../assets-src/room/lands/SHA256SUMS');
const lenskin = DOC.lands.find((l) => l.id === 'lenskin')!;
const pick = lenskin.accessory!.pick!;

test('the four lands in the catalog order, by ROOM_PRODUCTS ids, with the reviews Sam gave', () => {
  assert.deepEqual(DOC.lands.map((l) => l.id), ROOM_PRODUCTS.map((p) => p.id));
  assert.deepEqual(DOC.lands.map((l) => l.n), [1, 2, 3, 4]);
  const approval = Object.fromEntries(DOC.lands.map((l) => [l.id, l.approval]));
  const final = 'Sam 2026-10-21 (sheet-final.jpg, the encoded files): "this works, build it"';
  assert.deepEqual(approval, { case: final, wallet: final, lenskin: `${final}, Lenskin option 3 (Sage)`, airpods: final });
  for (const l of DOC.lands) {
    assert.deepEqual(l.reviews.map((r) => [r.round, r.date, r.by, r.sheet, r.verdict]), [
      [1, '2026-10-20', 'Sam', 'sheet.jpg', 'reviewed, fixes asked'],
      [2, '2026-10-20', 'Sam', 'sheet-v2.jpg', 'approved, with the seams to be blended'],
      [3, '2026-10-21', 'Sam', 'sheet-final.jpg', 'approved'],
    ], l.id);
    assert.ok(l.reviews[0].fixes && l.reviews[0].fixes.length > 0, `${l.id}: the fixes asked`);
    assert.equal(l.reviews[2].words, 'this works, build it', l.id);
  }
  assert.equal(lenskin.reviews[1].lenskin, 'option 3, go-green-09 (Sage)');
});

test('each accessory is ROOM_PRODUCTS\' shade, hex and finish by id, the Lenskin\'s Sam\'s pick among its candidates, each hex the catalog\'s', () => {
  assert.deepEqual(DOC.lands.filter((l) => l.accessory).map((l) => l.id), ['wallet', 'lenskin', 'airpods']);
  for (const l of DOC.lands) {
    const p = ROOM_PRODUCTS.find((r) => r.id === l.id)!;
    if (l.id === 'case') { assert.equal(l.accessory, null); continue; }
    assert.ok(l.accessory, l.id);
    assert.equal(l.accessory.shade, p.shade, `${l.id}: the shade rendered is the shade ROOM_PRODUCTS names`);
    assert.equal(l.accessory.hex.toLowerCase(), p.hex.toLowerCase(), l.id);
    assert.equal(l.accessory.finish, p.finish, l.id);
    assert.equal(l.accessory.hex.toLowerCase(), byId.get(l.accessory.shade)!.hex.toLowerCase(), l.id);
  }
  assert.deepEqual([lenskin.accessory!.shade, lenskin.accessory!.hex.toLowerCase()], ['go-green-09', '#96a880'], 'the Lenskin in Sage');
  assert.equal(lenskin.accessory!.shade, pick.shade, 'the Lenskin is Sam\'s pick');
  const opts = lenskin.accessory!.options!;
  assert.equal(opts.length, 5);
  assert.equal(opts[0].shade, 'roaring-red-07', 'option 0 is the first candidate, Crimson');
  for (const o of opts) assert.equal(o.hex.toLowerCase(), byId.get(o.shade)?.hex.toLowerCase(), `option ${o.option}`);
  assert.equal(new Set(opts.map((o) => o.shade)).size, 5);
  assert.deepEqual([pick.option, pick.shade, opts[pick.option].shade], [3, 'go-green-09', 'go-green-09']);
});

test('every master is listed with the sum committed beside the gitignored pictures, and work/ has its own sums, pinned', () => {
  for (const l of DOC.lands) {
    assert.deepEqual(Object.keys(l.classes).sort(), ['portrait', 'portrait-depth', 'square', 'wide', 'wide-depth'], l.id);
    for (const [c, v] of Object.entries(l.classes)) {
      assert.equal(v.file, `land-${l.id}-${c}.png`);
      assert.ok(v.sha256 && /^[0-9a-f]{64}$/.test(v.sha256), `${v.file}: a sum`);
      assert.equal(sums.get(v.file), v.sha256, `${v.file}: the sum in SHA256SUMS`);
    }
  }
  assert.ok(/^[0-9a-f]{64}$/.test(sums.get('work/SHA256SUMS') ?? ''), 'SHA256SUMS pins work/SHA256SUMS');
  const work = readSums('../../assets-src/room/lands/work/SHA256SUMS');
  for (const l of DOC.lands) for (const v of Object.values(l.classes)) for (const s of v.steps as (Step & { output?: string; mask?: string })[]) {
    for (const f of [s.output, s.mask]) if (f && f.startsWith('work/')) assert.ok(work.has(f.slice(5)), `${l.id} ${s.stage}: ${f} in work/SHA256SUMS`);
  }
});

test('the generator steps: depth on VDA-Small at one frame (Apache-2.0; 21.45 credits without the cap), prompts on the inpaints', () => {
  for (const l of DOC.lands) for (const [c, v] of Object.entries(l.classes)) for (const s of v.steps) {
    if (s.stage === 'depth') { assert.equal(s.variant, 'VDA-Small', `${l.id} ${c}`); assert.equal(s.max_frames, 1, `${l.id} ${c}`); }
    if (s.model === 'nano_banana_2_1') assert.ok(s.prompt && s.prompt.length > 40, `${l.id} ${c} ${s.stage}: its prompt`);
    if (s.model) assert.ok(s.job && /^[0-9a-f-]{36}$/.test(s.job), `${l.id} ${c} ${s.stage}: its job id`);
  }
  for (const l of DOC.lands) assert.ok(l.classes['portrait-depth'].steps.filter((s) => s.stage === 'depth').length === 1 && l.classes['wide-depth'].steps.filter((s) => s.stage === 'depth').length === 1, `${l.id}: one depth call per crop`);
  for (const l of DOC.lands) assert.ok(l.classes.wide.steps.some((s) => s.stage === 'seams'), `${l.id}: the wide's seams blended`);
  // each wide's map is the depth model's output on the crop Sam approved (spec 3, "Option A's depth maps"): made after
  // the seams, by the fourth round's call, and nothing local laid over it
  for (const l of DOC.lands) {
    const d = l.classes['wide-depth'];
    assert.deepEqual(d.steps.map((s) => [s.stage, s.round]), [['depth', 4]], `${l.id}: the wide's map is the fourth round's call alone`);
    assert.match(d.made_from ?? '', new RegExp(`^the final crop \\(land-${l.id}-wide\\.png\\)`), l.id);
  }
});

test('the ledger adds up to the document\'s credits and stays inside the plan\'s 300', () => {
  const rows = LEDGER as { credits: number; status?: string | null; job: string | null }[];
  const total = Math.round(rows.reduce((a, r) => a + r.credits, 0) * 1000) / 1000;
  assert.equal(total, DOC.credits);
  assert.ok(total <= 300, `${total} credits`);
  for (const r of rows) if (r.status === 'failed') assert.equal(r.credits, 0);
});

// the encoded lands: section-4-world.md 6's lines (KB of 1024 B, as stored), the sizes of 3, each from its master, and
// each at or over its format's floor (encode-lands.mjs: AVIF q45, WebP q60) unless Sam accepted it at the quality written
const ENC = JSON.parse(readFileSync(new URL('../../src/assets/room/lands/encoded.json', import.meta.url), 'utf8')) as { files: Record<string, { bytes: number; line: number; quality: number; floor: number; accepted?: string; width: number; height: number; from: string; from_sha256: string }> };
const FLOOR = { avif: 45, webp: 60 } as const;
const LINE = { portrait: { avif: 80, webp: 128 }, wide: { avif: 110, webp: 176 }, depth: { avif: 12, webp: 20 } } as const;
const DIMS = { portrait: [720, 1280], wide: [1920, 1200], 'portrait-depth': [180, 320], 'wide-depth': [480, 300] } as const;

test('every land is encoded in AVIF and WebP at its size, inside its line, from the master on record', () => {
  const names: string[] = [];
  for (const l of DOC.lands) for (const key of ['portrait', 'wide', 'portrait-depth', 'wide-depth'] as const) for (const fmt of ['avif', 'webp'] as const) {
    const name = `land-${l.id}-${key}.${fmt}`; names.push(name);
    const e = ENC.files[name]; assert.ok(e, `${name} in encoded.json`);
    const bytes = statSync(new URL(`../../src/assets/room/lands/${name}`, import.meta.url)).size;
    assert.equal(bytes, e.bytes, `${name}: the file is the one recorded`);
    const line = (key.endsWith('depth') ? LINE.depth : LINE[key as 'portrait' | 'wide'])[fmt] * 1024;
    assert.ok(bytes <= line, `${name}: ${bytes} B over ${line}`);
    assert.deepEqual([e.width, e.height], DIMS[key], name);
    assert.equal(e.from, l.classes[key].file, name); assert.equal(e.from_sha256, l.classes[key].sha256, `${name}: from the master on record`);
    assert.equal(e.floor, FLOOR[fmt], `${name}: its format's floor`);
    const ok = DOC.encoding.accepted.find((a) => a.file === name);
    if (ok) assert.deepEqual([e.quality, e.from, e.from_sha256, e.accepted], [ok.quality, ok.master, ok.master_sha256, `${ok.by} ${ok.date} (${ok.sheet})`], `${name}: written as Sam accepted it`);
    else assert.ok(e.quality >= FLOOR[fmt] && e.accepted === undefined, `${name}: q${e.quality}, under the floor with no acceptance`);
  }
  assert.deepEqual(Object.keys(ENC.files).sort(), names.sort(), 'nothing else encoded');
});

test('land 1\'s wide is accepted at AVIF q48 and WebP q64, under Sam\'s approval of sheet-final, and nothing else is', () => {
  const sam = { by: 'Sam', date: '2026-10-21', sheet: 'sheet-final.jpg', words: 'this works, build it' };
  const wide = DOC.lands.find((l) => l.id === 'case')!.classes.wide;
  assert.deepEqual(DOC.encoding.accepted, [
    { file: 'land-case-wide.avif', quality: 48, master: 'land-case-wide.png', master_sha256: wide.sha256, ...sam },
    { file: 'land-case-wide.webp', quality: 64, master: 'land-case-wide.png', master_sha256: wide.sha256, ...sam },
  ]);
});
