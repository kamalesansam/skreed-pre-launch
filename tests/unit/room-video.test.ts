// Section 4 part two's option C, the clips (docs/specs/section-4-world.md 2 "Option C", 3 "Option C's clips", 6 "Option
// C: the clips", AC5, E-S4-video): src/data/room-clips.json records every kling_o3_flf call inside the credit cap and at
// most two attempts a clip, and per clip the attempt it takes with the raw file's sum committed in
// assets-src/room/clips/SHA256SUMS; the encoded clips in src/assets/room/clips/ (scripts/room/encode-clips.mjs) are read
// box by box: three a class, joining the lands in the catalog's order, H.264 alone (no audio track), the moov ahead of
// the media (+faststart), 3 s at the class's size, at most 700 KB, each with AC5's check passed at its viewports.
// travel-video.ts's pure parts: the clip's file by the lands it joins, the zoom of a land at rest, the hand-over, the
// whole clip buffered, and where clips may play.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { LAND_COPY, ROOM_PRODUCTS } from '../../src/config/room.ts';
import { ENTRY } from '../../src/scripts/hero/section4/world.ts';
import { VIDEO, clipName, clipUrl, clipsAllowed, handOverAlpha, restZoom, wholeBuffered } from '../../src/scripts/hero/section4/travel-video.ts';
import CLIPS from '../../src/data/room-clips.json' with { type: 'json' };

type Attempt = { clip: string; attempt: number; job: string; credits: number; aspect: string; raw: string; sha256: string; prompt: string };
type Flash = { viewport: number[]; regionTurns: number; redTurns: number; verdict: string };
type Clip = { file: string; from: string; to: string; class: 'portrait' | 'wide'; pick: { attempt: number; job: string; raw: string }; encoded: { bytes: number; sha256: string; size: number[] }; flash: Flash[]; approval: string };
const DOC = CLIPS as unknown as { cap: number; credits: number; model: string; params: { duration: number; mode: string; sound: string; multi_shots: boolean }; attempts: Attempt[]; clips: Clip[] };
const DIR = new URL('../../src/assets/room/clips/', import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith('.mp4')).sort();
const sums = new Map(readFileSync(new URL('../../assets-src/room/clips/SHA256SUMS', import.meta.url), 'utf8').trim().split('\n').map((l) => { const [h, f] = l.split(/\s+/); return [f, h] as const; }));

// ---- the MP4's boxes, as far as the tests read them
interface Box { type: string; start: number; end: number; body: number }
function boxes(b: Buffer, start = 0, end = b.length): Box[] {
  const out: Box[] = [];
  for (let at = start; at + 8 <= end;) {
    let size = b.readUInt32BE(at), body = at + 8;
    const type = b.toString('latin1', at + 4, at + 8);
    if (size === 1) { size = Number(b.readBigUInt64BE(at + 8)); body = at + 16; } else if (size === 0) size = end - at;
    out.push({ type, start: at, end: at + size, body }); at += size;
  }
  return out;
}
const child = (b: Buffer, box: Box, type: string, skip = 0) => boxes(b, box.body + skip, box.end).find((x) => x.type === type);
function readMp4(b: Buffer) {
  const top = boxes(b), moov = top.find((x) => x.type === 'moov')!;
  const mvhd = child(b, moov, 'mvhd')!, v1 = b[mvhd.body] === 1;
  const scale = b.readUInt32BE(mvhd.body + (v1 ? 20 : 12)), duration = v1 ? Number(b.readBigUInt64BE(mvhd.body + 24)) : b.readUInt32BE(mvhd.body + 16);
  const tracks = boxes(b, moov.body, moov.end).filter((x) => x.type === 'trak').map((trak) => {
    const mdia = child(b, trak, 'mdia')!, hdlr = child(b, mdia, 'hdlr')!, handler = b.toString('latin1', hdlr.body + 8, hdlr.body + 12);
    const stsd = child(b, child(b, child(b, mdia, 'minf')!, 'stbl')!, 'stsd')!, entry = boxes(b, stsd.body + 8, stsd.end)[0];
    return { handler, codec: entry.type, width: b.readUInt16BE(entry.body + 24), height: b.readUInt16BE(entry.body + 26) };
  });
  return { order: top.map((x) => x.type), seconds: duration / scale, tracks };
}

test('the record: inside the cap, at most two attempts a clip, kling_o3_flf 3 s std with no sound and one shot, every raw file summed', () => {
  assert.equal(DOC.model, 'kling_o3_flf');
  assert.deepEqual(DOC.params, { duration: 3, mode: 'std', sound: 'off', multi_shots: false });
  const total = DOC.attempts.reduce((s, a) => s + a.credits, 0);
  assert.equal(total, DOC.credits);
  assert.ok(DOC.credits <= DOC.cap && DOC.cap <= 45, `${DOC.credits} credits against a cap of ${DOC.cap}`);
  const per = new Map<string, number>();
  for (const a of DOC.attempts) {
    per.set(a.clip, (per.get(a.clip) ?? 0) + 1);
    assert.equal(a.credits, 3, `${a.clip} attempt ${a.attempt}: 3 credits (higgsfield generate cost)`);
    assert.equal(a.aspect, a.clip.endsWith('portrait') ? '9:16' : '16:9');
    assert.match(a.job, /^[0-9a-f-]{36}$/);
    assert.equal(sums.get(a.raw), a.sha256, `${a.raw}: its sum is committed`);
    assert.doesNotMatch(a.prompt, /—/, 'no em dash');
    assert.match(a.prompt, /No other people, no text/);
  }
  for (const [k, n] of per) assert.ok(n <= 2, `${k}: ${n} attempts`);
});

test('the clips: three a class, joining the lands in catalog order, each the attempt the record picks', () => {
  const ids = ROOM_PRODUCTS.map((p) => p.id);
  const want = ids.slice(0, -1).flatMap((id, i) => (['portrait', 'wide'] as const).map((c) => clipName(id, ids[i + 1], c))).sort();
  assert.deepEqual(files, want);
  assert.deepEqual(DOC.clips.map((c) => c.file).sort(), want);
  for (const c of DOC.clips) {
    assert.equal(c.file, clipName(c.from, c.to, c.class));
    const a = DOC.attempts.find((x) => x.clip === `${c.from}-${c.to}-${c.class}` && x.attempt === c.pick.attempt);
    assert.ok(a && a.job === c.pick.job && a.raw === c.pick.raw, `${c.file}: its pick is an attempt in the ledger`);
    assert.ok(['pending', 'approved'].includes(c.approval.split(' ')[0]), `${c.file}: ${c.approval}`);
  }
});

test('each clip: H.264 alone (no audio), +faststart, 3 s at its class size, 700 KB or less, the bytes the record names', () => {
  for (const c of DOC.clips) {
    const b = readFileSync(new URL(c.file, DIR)), m = readMp4(b);
    assert.ok(b.length <= 700 * 1024 && b.length === statSync(new URL(c.file, DIR)).size, `${c.file}: ${b.length} B`);
    assert.equal(b.length, c.encoded.bytes);
    assert.equal(createHash('sha256').update(b).digest('hex'), c.encoded.sha256);
    assert.equal(m.order[0], 'ftyp');
    assert.ok(m.order.indexOf('moov') < m.order.indexOf('mdat'), `${c.file}: the moov ahead of the media (${m.order.join(' ')})`);
    assert.equal(m.tracks.length, 1, `${c.file}: one track`);
    assert.deepEqual(m.tracks.map((t) => [t.handler, t.codec]), [['vide', 'avc1']]);
    assert.deepEqual([m.tracks[0].width, m.tracks[0].height], c.class === 'portrait' ? [720, 1280] : [1280, 800]);
    assert.deepEqual(c.encoded.size, [m.tracks[0].width, m.tracks[0].height]);
    assert.ok(Math.abs(m.seconds - 3) < 0.05, `${c.file}: ${m.seconds} s`);
  }
});

test("AC5: each clip's flash check passed at the viewports its class plays at (no region turning more than six times in a second)", () => {
  for (const c of DOC.clips) {
    const views = c.flash.map((f) => f.viewport.join('x'));
    assert.ok(views.includes(c.class === 'portrait' ? '390x844' : '1280x800'), `${c.file}: ${views.join(', ')}`);
    for (const f of c.flash) {
      assert.equal(f.verdict, 'pass', `${c.file} at ${f.viewport.join(' x ')}`);
      assert.ok(f.regionTurns <= 6 && f.redTurns <= 6);
    }
  }
});

test("clipUrl finds a clip by the lands it joins and the class, among the build's hashed names", () => {
  const glob = { '../../../assets/room/clips/clip-case-wallet-portrait.mp4': '/_astro/clip-case-wallet-portrait.Ab3_x9Zq.mp4', '../../../assets/room/clips/clip-case-wallet-wide.mp4': '/_astro/w.mp4' };
  assert.equal(clipUrl(glob, 'case', 'wallet', 'portrait'), '/_astro/clip-case-wallet-portrait.Ab3_x9Zq.mp4');
  assert.equal(clipUrl(glob, 'case', 'wallet', 'wide'), '/_astro/w.mp4');
  assert.equal(clipUrl(glob, 'wallet', 'case', 'wide'), null);
  assert.equal(clipUrl({}, 'case', 'wallet', 'wide'), null);
});

test('restZoom: the rest push magnifies the subject; 1 without a push; more near, less far', () => {
  for (const [id, c] of Object.entries(LAND_COPY)) {
    const push = ENTRY.pushRest * c.near, k = restZoom(c, push);
    assert.ok(k > 1.1 && k < 1 / (1 - ENTRY.pushRest), `${id}: ${k}`);
    assert.ok(restZoom(c, push, 1) > k && restZoom(c, push, 0.5) < k);
    assert.ok(Math.abs(restZoom(c, push, 1) - 1 / (1 - ENTRY.pushRest)) < 1e-9, 'at the near distance, near / (near - push)');
    assert.equal(restZoom(c, 0), 1);
  }
});

test('handOverAlpha: 0 until the last 0.2 s, 1 at the end, by the clip or the travel, whichever is further on', () => {
  assert.equal(handOverAlpha(0, 3, 0), 0);
  assert.equal(handOverAlpha(2.79, 3, 0.5), 0);
  assert.ok(Math.abs(handOverAlpha(2.9, 3, 0) - 0.5) < 1e-9);
  assert.equal(handOverAlpha(3, 3, 0), 1);
  assert.equal(handOverAlpha(1, 3, 1), 1, 'a late clip still hands over by the travel\'s end');
  assert.ok(Math.abs(handOverAlpha(0, 3, 2.9 / 3) - 0.5) < 1e-9);
  assert.equal(VIDEO.handOver, 0.2);
  assert.equal(VIDEO.backMs, 400);
  assert.equal(VIDEO.refuseMs, 1500);
});

test('wholeBuffered: in only when the ranges cover the whole clip, in any order, within half a frame', () => {
  const r = (...s: [number, number][]) => ({ length: s.length, start: (i: number) => s[i][0], end: (i: number) => s[i][1] });
  assert.equal(wholeBuffered(r([0, 3]), 3), true);
  assert.equal(wholeBuffered(r([0, 2.99]), 3), true);
  assert.equal(wholeBuffered(r([0, 2.9]), 3), false);
  assert.equal(wholeBuffered(r([1.5, 3], [0, 1.5]), 3), true);
  assert.equal(wholeBuffered(r([0, 1], [1.5, 3]), 3), false);
  assert.equal(wholeBuffered(r(), 3), false);
  assert.equal(wholeBuffered(r([0, 3]), NaN), false);
});

test('clipsAllowed: never under Save-Data, on 2g, at deviceMemory 2 or less, or under reduced motion (E-S4-video)', () => {
  assert.equal(clipsAllowed({}), true);
  assert.equal(clipsAllowed({ effectiveType: '4g', deviceMemory: 4 }), true);
  assert.equal(clipsAllowed({ effectiveType: '3g' }), true);
  assert.equal(clipsAllowed({ saveData: true }), false);
  assert.equal(clipsAllowed({ effectiveType: '2g' }), false);
  assert.equal(clipsAllowed({ effectiveType: 'slow-2g' }), false);
  assert.equal(clipsAllowed({ deviceMemory: 2 }), false);
  assert.equal(clipsAllowed({ deviceMemory: 0.5 }), false);
  assert.equal(clipsAllowed({ reduced: true }), false);
});

test('only travel-video.ts names the clips (travel-stub.ts second rule); part three\'s video.ts may name .mp4 too (section-4-flux.md 5, "The island modules")', () => {
  const walk = (d: URL): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(new URL(`${e.name}/`, d)) : [new URL(e.name, d).pathname]));
  const hits = walk(new URL('../../src/', import.meta.url)).filter((p) => /\.(ts|astro|mjs|js)$/.test(p) && /clips\/clip-|\.mp4/.test(readFileSync(p, 'utf8')));
  assert.deepEqual(hits.map((p) => p.split('/src/')[1]).sort(), ['scripts/hero/section4/travel-video.ts', 'scripts/hero/section4/video.ts']);
});
