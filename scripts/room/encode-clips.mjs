// Option C's clips (docs/specs/section-4-world.md 3 "Option C's clips", 6 "Option C: the clips"): each approved
// kling_o3_flf clip encoded for the site. H.264 at 720p (720 x 1280 portrait; the wide's 16:9 cut to 16:10 from its left
// edge, as the lands pipeline cuts the wide picture from its 16:9 canvas, then 1280 x 800), its first 72 frames (3 s at
// 24 fps), no audio track, -movflags +faststart, at most 700 KB each: the lowest CRF that fits, from 20 up. The source's
// matrix is read as BT.601 (its first frame matches the start picture best so) and written as BT.709 with the sRGB
// transfer tagged, so a browser decodes the same display values as the land pictures. The raw clips stay in
// assets-src/room/clips/ (gitignored, as the lands' masters; SHA256SUMS committed); which attempt each clip takes is in
// docs/specs/evidence/section-4-world-clips.md.
//   node scripts/room/encode-clips.mjs <raw dir> [<out dir>]   (out: src/assets/room/clips)
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** the clips, by the lands they join (catalog order), each class's raw file and attempt (the evidence's picks) */
export const CLIPS = Object.freeze([
  { from: 'case', to: 'wallet', portrait: 'case-wallet-portrait-a2-f7430109.mp4', wide: 'case-wallet-wide-a2-71199ea3.mp4' },
  { from: 'wallet', to: 'lenskin', portrait: 'wallet-lenskin-portrait-a2-6ca4f676.mp4', wide: 'wallet-lenskin-wide-a2-3eaacab3.mp4' },
  { from: 'lenskin', to: 'airpods', portrait: 'lenskin-airpods-portrait-a1-e4c52b57.mp4', wide: 'lenskin-airpods-wide-a2-32452206.mp4' },
]);
export const CAP = 700 * 1024;
export const FRAMES = 72;
const SIZE = { portrait: [720, 1280], wide: [1280, 800] };

function encode(src, dst, cls, crf) {
  const [w, h] = SIZE[cls];
  // the wide: 16:9 to 16:10 from the left edge (1152 x 720 of 1280 x 720), then up to 1280 x 800
  const cut = cls === 'wide' ? 'crop=ih*16/10:ih:0:0,' : '';
  // the matrix alone from BT.601 to BT.709 (the colorspace filter: swscale's own yuv to yuv matrices shifted the reds), the
  // primaries and the transfer left as they are
  const vf = `${cut}scale=${w}:${h}:flags=lanczos,colorspace=ispace=bt470bg:space=bt709:iprimaries=bt709:primaries=bt709:itrc=srgb:trc=srgb:irange=tv:range=tv:format=yuv420p`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-an', '-frames:v', String(FRAMES), '-vf', vf,
    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(crf), '-profile:v', 'high', '-level', '4.0', '-g', '24', '-keyint_min', '24',
    // the VUI through x264 itself: ffmpeg's -color_trc and -color_primaries do not always reach it
    '-x264-params', 'colorprim=bt709:transfer=iec61966-2-1:colormatrix=bt709:range=tv',
    '-movflags', '+faststart', '-map_metadata', '-1', dst]);
  return statSync(dst).size;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.argv[2], out = process.argv[3] ?? 'src/assets/room/clips';
  if (!raw) { console.error('usage: node scripts/room/encode-clips.mjs <raw dir> [<out dir>]'); process.exit(2); }
  mkdirSync(out, { recursive: true });
  for (const c of CLIPS) for (const cls of ['portrait', 'wide']) {
    const dst = join(out, `clip-${c.from}-${c.to}-${cls}.mp4`);
    let crf = 20, size = encode(join(raw, c[cls]), dst, cls, crf);
    while (size > CAP && crf < 34) size = encode(join(raw, c[cls]), dst, cls, ++crf);
    if (size > CAP) { console.error(`${dst}: ${size} B at CRF ${crf}, over ${CAP}`); process.exit(1); }
    console.log(`${dst}: ${(size / 1024).toFixed(1)} KB at CRF ${crf}`);
  }
}
