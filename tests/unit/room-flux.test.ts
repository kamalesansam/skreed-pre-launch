// Section 4 part three's ten loops and twenty stills as shipped (docs/specs/section-4-flux.md 3 "The backgrounds" and
// "Provenance", AC2, AC15 "the ten loops by hash, frames and tags"). src/data/room-flux.json is the record; this test
// holds the files in src/assets/room/flux/ to it byte for byte (sha256 and size for the loops, size for the stills),
// each master's and clean still's sum to assets-src/room/flux/SHA256SUMS (the raw files are gitignored, their sums are
// committed), the record's own numbers to the spec (120 frames at 24 fps, 5.0 s, 1328 x 692 and 720 x 1280, H.264
// High, bt709 with the sRGB transfer, no audio, every file under its line), the scene ids and order to ROOM_SCENES, the
// posters' sizes to SCENE_SIZE, and, where ffprobe is on the PATH, the encoded files themselves to the same numbers
// (skipped with a message otherwise, never failed). scripts/hero/budget.mjs names this test for what it leaves to it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { ROOM_SCENES, SCENE_COUNT, SCENE_SIZE, type SceneClass } from '../../src/config/room.ts';

interface Still { file: string; bytes: number; line: number; width: number; height: number }
interface Loop {
  id: string; order: number; class: SceneClass;
  source: { sums: string; sha256: string; bytes: number; width: number; height: number; frames: number; still: { sha256: string; bytes: number } };
  encoded: { file: string; bytes: number; sha256: string; width: number; height: number; frames: number; fps: number; duration: number };
  check: { boxes: string[]; profile: string; pix_fmt: string; tags: string };
  posters: { avif: Still; webp: Still };
  approval: { date: string; words: string };
}
interface Doc {
  cap: number;
  encode: { codec: string; profile: string; frames: number; fps: number; duration: number; vui: string; audio: string; faststart: boolean; size: Record<SceneClass, [number, number]> };
  posters: { size: Record<SceneClass, [number, number]>; lines: Record<SceneClass, { avif: number; webp: number }> };
  loops: Loop[];
}

const root = new URL('../../', import.meta.url);
const at = (p: string) => new URL(p, root);
const DOC = JSON.parse(readFileSync(at('src/data/room-flux.json'), 'utf8')) as Doc;
const DIR = 'src/assets/room/flux/';
const CLASSES: readonly SceneClass[] = ['wide', 'portrait'];
const KB = 1024;
const sha256 = (p: URL) => createHash('sha256').update(readFileSync(p)).digest('hex');

test('the record: ten loops, one per scene and class in the order of ROOM_SCENES, each with the numbers the spec gives and the approval words', () => {
  assert.equal(SCENE_COUNT, 5);
  assert.equal(DOC.loops.length, 2 * SCENE_COUNT, 'ten loops');
  assert.deepEqual(DOC.encode.size, { wide: [1328, 692], portrait: [720, 1280] });
  assert.deepEqual(DOC.posters.size, { wide: [SCENE_SIZE.wide.width, SCENE_SIZE.wide.height], portrait: [SCENE_SIZE.portrait.width, SCENE_SIZE.portrait.height] });
  assert.deepEqual([DOC.encode.codec, DOC.encode.profile, DOC.encode.frames, DOC.encode.fps, DOC.encode.duration, DOC.encode.audio, DOC.encode.faststart], ['libx264', 'high', 120, 24, 5, 'none', true]);
  assert.match(DOC.encode.vui, /colorprim=bt709:transfer=iec61966-2-1:colormatrix=bt709/);
  assert.equal(DOC.cap, 1200 * KB, 'each loop under 1,200 KB (spec 6)');
  const seen = new Set<string>();
  for (const l of DOC.loops) {
    const key = `${l.id}-${l.class}`;
    assert.ok(!seen.has(key), `${key} once`); seen.add(key);
    const s = ROOM_SCENES.find((x) => x.id === l.id);
    assert.ok(s, `${l.id} is a scene`);
    assert.equal(l.order, s.order, `${key}: the scene's order`);
    assert.ok(CLASSES.includes(l.class), `${key}: a class`);
    assert.equal(l.encoded.file, `${key}.mp4`, `${key}: the file is named by id and class`);
    assert.deepEqual([l.encoded.width, l.encoded.height], DOC.encode.size[l.class], `${key}: the loop's pixels`);
    assert.deepEqual([l.encoded.frames, l.encoded.fps, l.encoded.duration], [120, 24, 5], `${key}: 120 frames at 24 fps, 5.0 s`);
    assert.ok(l.encoded.bytes <= DOC.cap, `${key}: ${l.encoded.bytes} B under the line`);
    assert.match(l.encoded.sha256, /^[0-9a-f]{64}$/);
    assert.equal(l.check.profile, 'High', `${key}: H.264 High`);
    assert.equal(l.check.pix_fmt, 'yuv420p');
    assert.equal(l.check.tags, 'bt709 iec61966-2-1 bt709 tv', `${key}: bt709 with the sRGB transfer, tv range`);
    assert.equal(l.check.boxes[0], 'ftyp'); assert.ok(l.check.boxes.indexOf('moov') < l.check.boxes.indexOf('mdat'), `${key}: faststart (moov before mdat)`);
    for (const fmt of ['avif', 'webp'] as const) {
      const p = l.posters[fmt];
      assert.equal(p.file, `${key}.${fmt}`, `${key}: the ${fmt} still is named by id and class`);
      assert.deepEqual([p.width, p.height], DOC.posters.size[l.class], `${key}: the ${fmt} still's pixels`);
      assert.equal(p.line, DOC.posters.lines[l.class][fmt]);
      assert.ok(p.bytes <= p.line, `${key}: the ${fmt} still ${p.bytes} B under its line ${p.line}`);
    }
    assert.equal(l.approval.words, 'All ten backgrounds are approved.', `${key}: Sam's words`);
    assert.match(l.approval.date, /^2026-10-2\d$/);
  }
  for (const s of ROOM_SCENES) for (const c of CLASSES) assert.ok(seen.has(`${s.id}-${c}`), `${s.id}-${c} is recorded`);
  // the lines of spec 6 for the stills, in bytes
  assert.deepEqual(DOC.posters.lines, { wide: { avif: 110 * KB, webp: 176 * KB }, portrait: { avif: 80 * KB, webp: 128 * KB } });
});

test('the files: every loop in src/assets/room/flux is the record\'s byte for byte (sha256 and size), every still its size, and the folder holds the ten loops, the twenty stills and products.bin alone', () => {
  const names = readdirSync(at(DIR)).filter((n) => !n.startsWith('.')).sort();
  const expected = [...DOC.loops.flatMap((l) => [l.encoded.file, l.posters.avif.file, l.posters.webp.file]), 'products.bin'].sort();
  assert.deepEqual(names, expected, 'nothing else of the scenes ships from the folder');
  for (const l of DOC.loops) {
    const key = `${l.id}-${l.class}`, loop = at(DIR + l.encoded.file);
    assert.equal(readFileSync(loop).length, l.encoded.bytes, `${key}: the loop's size`);
    assert.equal(sha256(loop), l.encoded.sha256, `${key}: the loop's sha256 (AC2: the approved loop by hash)`);
    for (const fmt of ['avif', 'webp'] as const) assert.equal(readFileSync(at(DIR + l.posters[fmt].file)).length, l.posters[fmt].bytes, `${key}: the ${fmt} still's size`);
  }
});

test('the masters: each loop\'s raw master and clean still are in assets-src/room/flux/SHA256SUMS by sum (the files themselves are gitignored)', () => {
  const sums = readFileSync(at('assets-src/room/flux/SHA256SUMS'), 'utf8');
  const known = new Set([...sums.matchAll(/^([0-9a-f]{64})\s+\S+$/gm)].map((m) => m[1]));
  assert.ok(known.size >= 2 * DOC.loops.length, `${known.size} sums committed`);
  for (const l of DOC.loops) {
    const key = `${l.id}-${l.class}`;
    assert.equal(l.source.sums, 'assets-src/room/flux/SHA256SUMS');
    assert.ok(known.has(l.source.sha256), `${key}: the master's sum is committed`);
    assert.ok(known.has(l.source.still.sha256), `${key}: the clean still's sum is committed`);
    assert.deepEqual([l.source.width, l.source.height], DOC.encode.size[l.class], `${key}: the master's pixels`);
    assert.equal(l.source.frames, 121, `${key}: the master's 121 frames (the last returns to the first; the encode keeps 120)`);
  }
  const gitignore = readFileSync(at('assets-src/room/flux/.gitignore'), 'utf8');
  assert.match(gitignore, /^\*\s*$/m, 'everything in the folder is gitignored (the raw masters, stills, job records and scripts)');
  assert.match(gitignore, /^!SHA256SUMS\s*$/m, 'but the sums are committed');
});

test('ffprobe where available: each loop decodes as one H.264 High video stream of its class, 120 frames at 24/1 over 5.0 s, bt709 with the iec61966-2-1 transfer, and no audio stream', (t) => {
  const probe = spawnSync('ffprobe', ['-version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) { t.skip('ffprobe is not on the PATH here; the loops\' streams were not probed (the record\'s numbers and hashes were)'); return; }
  for (const l of DOC.loops) {
    const key = `${l.id}-${l.class}`;
    const r = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', at(DIR + l.encoded.file).pathname], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${key}: ffprobe ran (${r.stderr})`);
    const out = JSON.parse(r.stdout) as { streams: Record<string, string | number>[]; format: Record<string, string | number> };
    assert.equal(out.streams.length, 1, `${key}: one stream, so no audio track`);
    const v = out.streams[0];
    assert.equal(v.codec_type, 'video');
    assert.equal(v.codec_name, 'h264', `${key}: H.264`);
    assert.equal(v.profile, 'High', `${key}: the High profile`);
    assert.deepEqual([Number(v.width), Number(v.height)], DOC.encode.size[l.class], `${key}: the class's pixels`);
    assert.equal(Number(v.nb_frames), 120, `${key}: 120 frames`);
    assert.equal(v.r_frame_rate, '24/1', `${key}: 24 fps`);
    assert.equal(v.pix_fmt, 'yuv420p');
    assert.deepEqual([v.color_primaries, v.color_transfer, v.color_space, v.color_range], ['bt709', 'iec61966-2-1', 'bt709', 'tv'], `${key}: the colour tags`);
    assert.ok(Math.abs(Number(out.format.duration) - 5) < 0.05, `${key}: 5.0 s (${out.format.duration})`);
    assert.equal(Number(out.format.size), l.encoded.bytes, `${key}: the size ffprobe reads`);
  }
});

test('scripts/hero/budget.mjs names this test for the frames, length, codec and audio track it does not measure', () => {
  const budget = readFileSync(at('scripts/hero/budget.mjs'), 'utf8');
  assert.match(budget, /tests\/unit\/room-flux\.test\.ts/, 'the budget points here');
});
