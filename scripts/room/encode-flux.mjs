// Section 4's five scene loops (docs/specs/section-4-flux.md; the evidence in docs/specs/evidence/section-4-flux-loops.md):
// each approved kling_o3_flf loop encoded for the site, after encode-clips.mjs. H.264 at the raw file's own size (the wide
// 1328 x 692, the portrait 720 x 1280: no rescale), its first 120 frames (5.000 s at 24 fps; the raw file's frame 120
// duplicates frame 0, so the cut makes the loop seamless), no audio track, -movflags +faststart, at most 1,200 KB each:
// the lowest CRF that fits, from 18 up. Nine of the ten raw files carry no colour tags, so each file's matrix is decided
// by its own first frame: decoded once as BT.601 and once as BT.709 and compared with the clean still the loop was
// animated from (resized to the frame), the closer wins; a BT.601 file has its matrix converted to BT.709 (the colorspace
// filter, the transfer and primaries left as they are) and every output is tagged BT.709 with the sRGB transfer, as the
// clips are, so a browser decodes the same display values as the pictures. The first frame also becomes each loop's
// poster still, AVIF and WebP, with encode-lands.mjs's sharp settings inside the land picture lines. The raw files stay in
// assets-src/room/flux/raw (gitignored; SHA256SUMS committed) and are read only after their sums match. The reference
// site's file names live here and in the evidence only: nothing under src/ or public/ carries them.
//   node scripts/room/encode-flux.mjs [--raw assets-src/room/flux/raw] [--sums assets-src/room/flux/SHA256SUMS]
//                                     [--out src/assets/room/flux] [--data src/data/room-flux.json]
//                                     [--work scripts/room/out/flux] [--only cove,grove]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/** the scenes, in page order: our ids, and the generator's file names in raw/ (the reference site's names) */
export const SCENES = Object.freeze([
  { id: 'cove', order: 1, source: 'bathroom-1-c', about: 'the pink rock cove with water' },
  { id: 'grove', order: 2, source: 'bathroom-2', about: 'the green forest' },
  { id: 'ember', order: 3, source: 'bathroom-5', about: 'the red sunset' },
  { id: 'palace', order: 4, source: 'lover', about: 'the pink marble palace' },
  { id: 'dawn', order: 5, source: 'dreamer', about: 'the lilac curtains' },
]);
export const CLASSES = ['wide', 'portrait'];
export const CAP = 1200 * 1024;
export const FRAMES = 120;
export const FPS = 24;
export const CRF_FROM = 18;
export const CRF_TO = 40;
export const SIZE = { wide: [1328, 692], portrait: [720, 1280] };
export const POSTER = { wide: [1280, 666], portrait: [720, 1280] };
const KB = 1024;
/** the land picture lines (scripts/hero/budget.mjs PIC), stored bytes */
export const LINES = { wide: { avif: 110 * KB, webp: 176 * KB }, portrait: { avif: 80 * KB, webp: 128 * KB } };
const START = { avif: 60, webp: 80 };
const FLOOR = { avif: 45, webp: 60 };
/** credits per call as the account's history showed them (the job records carry no price field) */
export const CREDITS = { kling_o3_flf: 6.25, nano_banana_2_1: 2 };
export const APPROVAL = Object.freeze({ date: '2026-10-22', words: 'All ten backgrounds are approved.' });
/** a call whose record is lost: the grove still took a second inpaint after the one on record */
const LOST = { grove: { wide: { job_type: 'nano_banana_2_1', credits: CREDITS.nano_banana_2_1, note: 'a second masked inpaint on the grove still after the one on record; its record was not kept, so its id is unknown' } } };

/** the raw files of one scene and class */
export function rawFiles(source, cls) {
  const p = cls === 'portrait' ? 'p-' : '';
  return { loop: `${p}${source}-r2.mp4`, still: cls === 'portrait' ? `p-${source}-clean.png` : `${source}-clean2.png`, loopJob: `${p}${source}-r2-job.json`, inpaintJob: `${p}${source}-job.json` };
}

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });

/** SHA256SUMS as a map of path (relative to the sums file's folder) to sum */
function readSums(file) {
  const m = new Map();
  for (const line of readFileSync(file, 'utf8').split('\n')) { const t = line.match(/^([0-9a-f]{64})\s+\*?(.+)$/); if (t) m.set(t[2], t[1]); }
  return m;
}

/** frame n of a video decoded to an RGB PNG with the matrix given (the scale filter's own conversion, limited range in) */
function decodeFrame(src, n, matrix, dst) {
  ff(['-i', src, '-vf', `select=eq(n\\,${n}),scale=in_color_matrix=${matrix}:in_range=tv,format=rgb24`, '-fps_mode', 'passthrough', '-frames:v', '1', dst]);
  return dst;
}

/** an RGB PNG (or a still resized to w x h) as raw bytes */
async function rgb(p, w, h) {
  const img = w ? sharp(p).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }) : sharp(p);
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 3) throw new Error(`${p}: ${info.channels} channels, want 3`);
  if (w && (info.width !== w || info.height !== h)) throw new Error(`${p}: ${info.width} x ${info.height}, want ${w} x ${h}`);
  return { data, width: info.width, height: info.height };
}

/** mean absolute difference, overall and per channel, of two RGB buffers of one size */
function mad(a, b) {
  if (a.data.length !== b.data.length) throw new Error(`sizes differ: ${a.width} x ${a.height} and ${b.width} x ${b.height}`);
  const sum = [0, 0, 0];
  for (let i = 0; i < a.data.length; i += 3) for (let c = 0; c < 3; c++) sum[c] += Math.abs(a.data[i + c] - b.data[i + c]);
  const n = a.data.length / 3;
  const channel = sum.map((s) => +(s / n).toFixed(3));
  return { mean: +((sum[0] + sum[1] + sum[2]) / (3 * n)).toFixed(3), channel };
}

/** the file's top-level MP4 box types in order */
function boxes(p) {
  const size = statSync(p).size, fd = openSync(p, 'r'), head = Buffer.alloc(16), out = [];
  try {
    for (let at = 0; at < size;) {
      readSync(fd, head, 0, 16, at);
      let len = head.readUInt32BE(0); const type = head.toString('latin1', 4, 8);
      if (len === 1) len = Number(head.readBigUInt64BE(8)); else if (len === 0) len = size - at;
      if (len < 8) throw new Error(`${p}: a box of ${len} B at ${at}`);
      out.push(type); at += len;
    }
  } finally { closeSync(fd); }
  return out;
}

function probe(p) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', p], { encoding: 'utf8' }));
  const s = j.streams, v = s[0];
  // ffprobe's JSON leaves an unknown colour field out; 'unknown' here, so an untagged file reads as such
  const tag = (x) => x ?? 'unknown';
  const tags = [v.color_primaries, v.color_transfer, v.color_space, v.color_range].map(tag);
  return { streams: s.length, codec: v.codec_name, profile: v.profile, width: v.width, height: v.height, pix_fmt: v.pix_fmt, frames: Number(v.nb_frames), fps: v.r_frame_rate, duration: Number(v.duration), primaries: tags[0], transfer: tags[1], matrix: tags[2], range: tags[3], tags: tags.every((t) => t === 'unknown') ? 'none' : tags.join(' '), boxes: boxes(p) };
}

function encode(src, dst, matrix, crf) {
  // a BT.601 source has its matrix alone converted (the colorspace filter, as encode-clips.mjs: swscale's own yuv to yuv
  // matrices shifted the reds); a BT.709 source passes through, its samples re-encoded as they are
  const vf = matrix === 'bt601'
    ? 'colorspace=ispace=bt470bg:space=bt709:iprimaries=bt709:primaries=bt709:itrc=srgb:trc=srgb:irange=tv:range=tv:format=yuv420p'
    : 'format=yuv420p';
  ff(['-i', src, '-an', '-frames:v', String(FRAMES), '-vf', vf,
    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(crf), '-profile:v', 'high', '-level', '4.0', '-g', '24', '-keyint_min', '24',
    // the VUI through x264 itself: ffmpeg's -color_trc and -color_primaries do not always reach it
    '-x264-params', 'colorprim=bt709:transfer=iec61966-2-1:colormatrix=bt709:range=tv',
    '-movflags', '+faststart', '-map_metadata', '-1', dst]);
  return statSync(dst).size;
}

/** the poster: the highest quality from START down to FLOOR whose file is inside the line (encode-lands.mjs's fit) */
async function poster(png, w, h, fmt, line) {
  for (let q = START[fmt]; q >= FLOOR[fmt]; q--) {
    const img = sharp(png).resize(w, h, { fit: 'cover', kernel: 'lanczos3' });
    const buf = await (fmt === 'avif'
      ? img.avif({ quality: q, effort: 9, chromaSubsampling: '4:4:4', bitdepth: 8 })
      : img.webp({ quality: q, effort: 6, smartSubsample: true })).toBuffer();
    if (buf.length <= line) return { buf, q };
  }
  throw new Error(`${png} as ${fmt} ${w} x ${h}: nothing from q${START[fmt]} to q${FLOOR[fmt]} fits ${line} B`);
}

/** one job record (the CLI's --json output: a list of one job) */
function job(p) {
  const raw = readFileSync(p, 'utf8'), d = JSON.parse(raw.slice(raw.indexOf('[')));
  const j = Array.isArray(d) ? d[0] : d;
  if (j.status !== 'completed') throw new Error(`${p}: status ${j.status}`);
  return { id: j.id, job_type: j.job_type, credits: CREDITS[j.job_type], at: j.created_at, prompt: j.params.prompt, aspect: j.params.aspect_ratio, size: [j.params.width, j.params.height] };
}

async function main() {
  const RAW = arg('--raw', 'assets-src/room/flux/raw'), SUMS = arg('--sums', 'assets-src/room/flux/SHA256SUMS');
  const OUT = arg('--out', 'src/assets/room/flux'), DATA = arg('--data', 'src/data/room-flux.json'), WORK = arg('--work', 'scripts/room/out/flux');
  const only = arg('--only', null)?.split(',');
  mkdirSync(OUT, { recursive: true }); mkdirSync(WORK, { recursive: true });
  const sums = readSums(SUMS);
  const checked = (name) => {
    const p = join(RAW, name), want = sums.get(`raw/${name}`);
    if (!want) throw new Error(`${SUMS} has no sum for raw/${name}`);
    const got = sha(p);
    if (got !== want) throw new Error(`${p}: sha256 ${got}, ${SUMS} records ${want}`);
    return { path: p, sha256: got, bytes: statSync(p).size };
  };
  const loops = [];
  for (const scene of SCENES) {
    if (only && !only.includes(scene.id)) continue;
    for (const cls of CLASSES) {
      const f = rawFiles(scene.source, cls), [w, h] = SIZE[cls];
      const loop = checked(f.loop), still = checked(f.still), loopJob = job(checked(f.loopJob).path), inpaintJob = job(checked(f.inpaintJob).path);
      const rp = probe(loop.path);
      if (rp.width !== w || rp.height !== h) throw new Error(`${loop.path}: ${rp.width} x ${rp.height}, want ${w} x ${h}`);
      if (rp.frames !== FRAMES + 1 || rp.fps !== `${FPS}/1`) throw new Error(`${loop.path}: ${rp.frames} frames at ${rp.fps}, want ${FRAMES + 1} at ${FPS}/1`);
      // the matrix: the first frame under each, against the still
      const stillRgb = await rgb(still.path, w, h), first = {};
      const diffs = {};
      for (const m of ['bt601', 'bt709']) {
        first[m] = await rgb(decodeFrame(loop.path, 0, m, join(WORK, `${scene.id}-${cls}-f0-${m}.png`)));
        diffs[m] = mad(first[m], stillRgb);
      }
      const matrix = diffs.bt601.mean <= diffs.bt709.mean ? 'bt601' : 'bt709';
      console.log(`${scene.id} ${cls}: first frame against the still, BT.601 ${diffs.bt601.mean} (${diffs.bt601.channel.join(' ')}), BT.709 ${diffs.bt709.mean} (${diffs.bt709.channel.join(' ')}): ${matrix}${rp.matrix !== 'unknown' ? ` (the file is tagged ${rp.matrix})` : ' (the file carries no tag)'}`);
      // the raw file's last frame against its first (why the cut at 120), and frame 1 against frame 0 for the scale: the
      // step between two neighbouring frames, which the wrap from frame 119 back to frame 0 should be close to
      const dup = mad(await rgb(decodeFrame(loop.path, FRAMES, matrix, join(WORK, `${scene.id}-${cls}-f${FRAMES}.png`))), first[matrix]);
      const step = mad(await rgb(decodeFrame(loop.path, 1, matrix, join(WORK, `${scene.id}-${cls}-f1.png`))), first[matrix]);
      // the loop: the lowest CRF from CRF_FROM whose file is inside the cap
      const name = `${scene.id}-${cls}.mp4`, dst = join(OUT, name);
      let crf = CRF_FROM, bytes = encode(loop.path, dst, matrix, crf);
      const tried = [{ crf, bytes }];
      while (bytes > CAP && crf < CRF_TO) { bytes = encode(loop.path, dst, matrix, ++crf); tried.push({ crf, bytes }); }
      if (bytes > CAP) throw new Error(`${dst}: ${bytes} B at CRF ${crf}, over ${CAP}`);
      console.log(`${name}: ${(bytes / KB).toFixed(1)} KB at CRF ${crf} (${tried.map((t) => `${t.crf}: ${t.bytes}`).join(', ')})`);
      // the check: the probe, the box order and the encoded first and last frames against the raw first frame
      const ep = probe(dst);
      const faults = [];
      if (ep.streams !== 1 || ep.codec !== 'h264') faults.push(`${ep.streams} streams, ${ep.codec}`);
      if (ep.frames !== FRAMES || ep.fps !== `${FPS}/1` || ep.duration !== FRAMES / FPS) faults.push(`${ep.frames} frames at ${ep.fps}, ${ep.duration} s`);
      if (ep.width !== w || ep.height !== h) faults.push(`${ep.width} x ${ep.height}`);
      if (ep.matrix !== 'bt709' || ep.primaries !== 'bt709' || ep.transfer !== 'iec61966-2-1' || ep.range !== 'tv') faults.push(`tags ${ep.primaries} ${ep.transfer} ${ep.matrix} ${ep.range}`);
      if (ep.boxes[0] !== 'ftyp' || ep.boxes.indexOf('moov') > ep.boxes.indexOf('mdat')) faults.push(`boxes ${ep.boxes.join(' ')}`);
      if (faults.length) throw new Error(`${dst}: ${faults.join('; ')}`);
      const encFirst = mad(await rgb(decodeFrame(dst, 0, 'bt709', join(WORK, `${scene.id}-${cls}-enc-f0.png`))), first[matrix]);
      const encLast = mad(await rgb(decodeFrame(dst, FRAMES - 1, 'bt709', join(WORK, `${scene.id}-${cls}-enc-f${FRAMES - 1}.png`))), first[matrix]);
      console.log(`${name}: ${ep.boxes.join(' ')}; ${ep.frames} frames, ${ep.duration} s, ${ep.primaries} ${ep.transfer} ${ep.matrix} ${ep.range}; first frame ${encFirst.mean} (${encFirst.channel.join(' ')}) and last ${encLast.mean} (${encLast.channel.join(' ')}) from the raw first frame; the raw frame ${FRAMES} is ${dup.mean} from it, the raw frame 1 ${step.mean}`);
      // the poster stills from the first frame as decoded under the matrix chosen
      const [pw, ph] = POSTER[cls], posters = {};
      for (const fmt of ['avif', 'webp']) {
        const { buf, q } = await poster(join(WORK, `${scene.id}-${cls}-f0-${matrix}.png`), pw, ph, fmt, LINES[cls][fmt]);
        const pn = `${scene.id}-${cls}.${fmt}`;
        writeFileSync(join(OUT, pn), buf);
        const meta = await sharp(buf).metadata();
        if (meta.width !== pw || meta.height !== ph) throw new Error(`${pn}: ${meta.width} x ${meta.height}, want ${pw} x ${ph}`);
        posters[fmt] = { file: pn, bytes: buf.length, line: LINES[cls][fmt], quality: q, floor: FLOOR[fmt], width: pw, height: ph };
        console.log(`${pn}: ${(buf.length / KB).toFixed(1)} KB (line ${LINES[cls][fmt] / KB} KB), q${q}, ${pw} x ${ph}`);
      }
      const inpaint = [inpaintJob, ...(LOST[scene.id]?.[cls] ? [{ id: null, ...LOST[scene.id][cls] }] : [])];
      loops.push({
        id: scene.id, order: scene.order, class: cls, about: scene.about,
        source: { sums: SUMS, sha256: loop.sha256, bytes: loop.bytes, width: rp.width, height: rp.height, frames: rp.frames, tags: rp.tags, frame120_from_frame0: dup, frame1_from_frame0: step, still: { sha256: still.sha256, bytes: still.bytes, width: stillRgb.width, height: stillRgb.height } },
        jobs: { inpaint, loop: loopJob },
        credits: inpaint.reduce((a, j) => a + j.credits, 0) + loopJob.credits,
        prompt: loopJob.prompt,
        encoded: { file: name, crf, bytes, sha256: sha(dst), width: ep.width, height: ep.height, frames: ep.frames, fps: FPS, duration: ep.duration, tried },
        matrix: { chosen: matrix, mad_against_still: diffs },
        check: { boxes: ep.boxes, profile: ep.profile, pix_fmt: ep.pix_fmt, tags: ep.tags, first_frame_from_raw: encFirst, last_frame_from_raw: encLast },
        posters,
        flash: 'pending',
        approval: { ...APPROVAL },
      });
    }
  }
  const data = {
    '//': "Section 4's five scene loops (docs/specs/section-4-flux.md; the evidence and the ledger in docs/specs/evidence/section-4-flux-loops.md). Per loop: the masked inpaint that made its clean still and the kling_o3_flf call that animated it, with job ids, credits and prompts; the raw file by its sum and bytes (assets-src/room/flux/raw, gitignored; the sums committed in SHA256SUMS, where the generator's file names are); the encode scripts/room/encode-flux.mjs wrote, its matrix choice with both differences, the probe's checks and the poster stills. flash stays 'pending' until AC5's check runs on the loops; approval is Sam's for all ten.",
    model: 'kling_o3_flf',
    params: { duration: 5, mode: 'std', sound: 'off', multi_shots: false, frames: 'the clean still as start_image and end_image, so the loop returns to it' },
    stills: { model: 'nano_banana_2_1', params: { is_inpaint: true, resolution: '2k', thinking_level: 'medium', aspect_ratio: { wide: 'auto', portrait: '9:16' } }, about: 'the wide stills: the round-2 masked inpaints that removed every accessory and changed the floors; the portrait stills: masked inpaints that extend each wide still to 9:16' },
    credits: {
      per_call: CREDITS,
      note: "per call as the account's history showed them; the job records carry no price field. The account read 1420 before round 2 and 1346 after its loops, a drop of 74.",
      estimate: { kling_o3_flf: 5, nano_banana_2_1: 2, note: "higgsfield generate cost on 2026-10-22, which creates no job: 5 for a 5 s std frames loop, 2 for a 2k masked inpaint. At those prices the drop of 74 is the ten loops (50) and twelve inpaints (24), one more inpaint than the eleven known; at 6.25 a loop the known calls sum to 84.5, over the drop. Which price was charged is the lead's to settle from the account's history." },
      total: loops.reduce((a, l) => a + l.credits, 0),
      account: { before: 1420, after: 1346 },
    },
    cap: CAP,
    encode: { codec: 'libx264', preset: 'veryslow', profile: 'high', level: '4.0', gop: 24, frames: FRAMES, fps: FPS, duration: FRAMES / FPS, crf_from: CRF_FROM, vui: 'colorprim=bt709:transfer=iec61966-2-1:colormatrix=bt709:range=tv', audio: 'none', faststart: true, metadata: 'none', size: SIZE },
    posters: { size: POSTER, lines: LINES, start: START, floor: FLOOR, avif: '4:4:4, 8-bit, effort 9', webp: 'smart subsampling, effort 6', from: 'the raw first frame decoded under the matrix chosen, resized to cover' },
    loops,
  };
  writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n');
  console.log(`${DATA}: ${loops.length} loops, ${data.credits.total} credits`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
