// Section 4's travel between the lands, option C (docs/specs/section-4-world.md 2 "Option C", 3 "Option C's clips", 5
// "Build modes", E-S4-video): the clips. Each forward travel plays a generated 3 s clip from this land's picture to the
// next (src/assets/room/clips/clip-<from>-<to>-<class>.mp4, imported by ?url here and nowhere else: travel-stub.ts's
// second rule) as a VideoTexture, drawn into the world's target as an image layer, cover-fit, in display values; the
// travel lasts the clip.
// - The zoom. A land at rest is its picture pushed into its depth map by 0.15 of its near distance, which magnifies its
//   subject; the clip is drawn at the same magnification, taken at the subject's disparity (SUBJECT_D), so its first
//   frame lines up with the departing land at rest and its last with the arriving one.
// - The hand-over. Over the clip's last 0.2 s its frame cross-fades to the approved next picture at rest (a generated
//   last frame is never exactly the master), timed by the clip's own clock or the travel's, whichever is further on, so
//   the hand-over is always complete when the travel ends.
// - Back is a 0.4 s cross-fade to the previous picture, with no clip.
// - When a land is in. The forward travel from land n waits until clip n is fully fetched (the director's Loading wait,
//   through pending()); clip 0 is fetched on the press (load), and clip n on arrival at land n (end). Clips are streamed
//   from their URL into the video element, never fetched into a blob (the CSP's media-src 'self'), and count as in once
//   the element has buffered the whole clip; a clip not in within 20 s, or whose element reports an error, has failed.
// - The element. One of travel.ts's unlockMedia elements per clip, unlocked in the press's own task: muted, defaultMuted,
//   playsinline, disableRemotePlayback, no audio track in the file. play() is called when the travel starts; no new frame
//   within 1.5 s of it, or a refused play(), is a refusal, and the rest of that travel is the director's 300 ms
//   cross-fade. A refused or failed clip shows CLIP BLOCKED under the land's text on Tune builds (note), never a silent
//   fall-back, so Sam can tell C from the cross-fade; it goes at the next clip that plays.
// - Never on the poster tier (the director makes no option there), under Save-Data, on 2g, at deviceMemory 2 or less, or
//   under reduced motion (E-S4-video): createTravel gives null there, and every travel is the cross-fade.
// - Held frames. The review hook (__s4.travel(i, j, p)) holds p: a p repeated is a held frame, and the clip is paused and
//   sought to p of its length; a p moving on plays it from where it stands.
// - Resident: the element keeps its fetched clip; the GPU holds one video texture at a time, the clip in play, freed when
//   the travel ends.
import { VideoTexture } from 'three';
import { LAND_SIZE, ROOM_COPY, ROOM_LANDS, type LandClass, type RoomParams } from '../../../config/room.ts';
import { clamp01 } from '../util/math.ts';
import { fadeLayers, restLayer, unlockMedia, type Travel, type TravelContext } from './travel.ts';
import type { WorldLayer } from './world.ts';

/** the clips by file name (Vite's glob, each a hashed URL); under Node (the unit tests) there is no glob, and no clip */
let FILES: Record<string, string> = {};
try { FILES = import.meta.glob<string>('../../../assets/room/clips/clip-*.mp4', { eager: true, query: '?url', import: 'default' }); } catch { FILES = {}; }

/** option C's numbers (spec 2 "Option C", 5 "Playback failures" and "No internet") */
export const VIDEO = Object.freeze({
  handOver: 0.2,      // s: the clip's last frame cross-fades to the next picture
  backMs: 400,        // ms: back cross-fades to the previous picture
  refuseMs: 1500,     // ms: no new frame this long after play() is a refusal
  fetchMs: 20_000,    // ms: a clip not in by then has failed (model-fetch.ts's timeout)
  subjectD: 0.85,     // the subjects' disparity in the lands' depth maps (their 90th percentile, 0.80 to 0.87): the zoom is matched there
  slack: 1 / 48,      // s: half a frame of the clips' 24
});

/** a clip's file name: the lands it joins by id, and the picture class */
export const clipName = (from: string, to: string, cls: LandClass): string => `clip-${from}-${to}-${cls}.mp4`;

/** the clip's URL among the build's files (by file name), or null */
export function clipUrl(files: Readonly<Record<string, string>>, from: string, to: string, cls: LandClass): string | null {
  const name = clipName(from, to, cls);
  return Object.entries(files).find(([k]) => k === name || k.endsWith(`/${name}`))?.[1] ?? null;
}

/** the magnification of a land at rest at disparity d: the picture pushed `push` along its view, a point of disparity d at 1 / mix(1 / far, 1 / near, d) */
export function restZoom(v: { near: number; far: number }, push: number, d: number = VIDEO.subjectD): number {
  const z = 1 / ((1 - d) / v.far + d / v.near);
  return push > 0 && push < z ? z / (z - push) : 1;
}

/** the next picture's alpha over the clip: over its last handOver seconds by the clip's own time t or the travel's p, whichever is further on */
export function handOverAlpha(t: number, duration: number, p: number, h: number = VIDEO.handOver): number {
  const at = (x: number) => clamp01((x - (duration - h)) / h);
  return Math.max(at(t), at(clamp01(p) * duration));
}

/** whether the ranges an element has buffered cover the whole clip, [0, duration], within the slack */
export function wholeBuffered(r: { readonly length: number; start(i: number): number; end(i: number): number }, duration: number, slack: number = VIDEO.slack): boolean {
  if (!(duration > 0)) return false;
  const spans = Array.from({ length: r.length }, (_, i) => [r.start(i), r.end(i)] as const).sort((a, b) => a[0] - b[0]);
  let reach = 0;
  for (const [a, b] of spans) { if (a > reach + slack) break; reach = Math.max(reach, b); }
  return reach >= duration - slack;
}

/** where clips may play (E-S4-video): never under Save-Data, on 2g, at deviceMemory 2 or less, or under reduced motion */
export function clipsAllowed(e: { saveData?: boolean; effectiveType?: string; deviceMemory?: number; reduced?: boolean }): boolean {
  return !e.reduced && !e.saveData && !/(^|-)2g$/.test(e.effectiveType ?? '') && !(typeof e.deviceMemory === 'number' && e.deviceMemory <= 2);
}

function environment() {
  const n = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  return { saveData: n.connection?.saveData, effectiveType: n.connection?.effectiveType, deviceMemory: n.deviceMemory, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
}
const tuneBuild = (): boolean => { try { return import.meta.env.PUBLIC_TUNE === '1'; } catch { return false; } };

type ClipState = 'idle' | 'fetching' | 'in' | 'failed';
interface Clip { cls: LandClass; url: string; state: ClipState; job: Promise<void> | null; stop: (() => void) | null }

export function createTravel(ctx: TravelContext): Travel | null {
  if (ctx.reduced || !clipsAllowed(environment())) return null;
  const N = ROOM_LANDS.length;
  if (N < 2) return null;
  const tune = tuneBuild();
  let ready = false, failed = false, note: string | null = null, disposed = false;
  let pool: readonly HTMLVideoElement[] = [];
  const clips = new Map<number, Clip>();          // by the departing land
  const textures = new Map<number, VideoTexture>();
  // the travel in play: its departing land, the last p, how often in a row it came again, play() and the frames since
  let active = -1, lastP = -1, same = 0, playAt = -1, playFrom = 0, seen = false, fresh = false, shownT = -1;
  let lastTo = -1;   // the land the last travel went to, either way: end() fetches its clip

  const url = (from: number, cls: LandClass) => { const a = ROOM_LANDS[from], b = ROOM_LANDS[from + 1]; return a && b ? clipUrl(FILES, a.id, b.id, cls) : null; };
  const blocked = () => { if (tune) note = ROOM_COPY.clipBlocked; };
  const texture = (from: number) => {
    let t = textures.get(from);
    if (!t) { t = new VideoTexture(pool[from]); textures.set(from, t); }   // NoColorSpace, no mipmaps: display values in, display values out
    return t;
  };

  /** clip `from` (land from to from + 1) in the class in use, fetched into its element; settles when in or failed */
  function fetchClip(from: number): Promise<void> {
    const cls = ctx.cls(), c = clips.get(from);
    if (c && c.cls === cls && c.state !== 'idle') return c.job ?? Promise.resolve();
    const v = pool[from], u = url(from, cls);
    if (!v || !u || from === active) {
      if (!u) clips.set(from, { cls, url: '', state: 'failed', job: null, stop: null });
      return Promise.resolve();
    }
    c?.stop?.();
    const clip: Clip = { cls, url: u, state: 'fetching', job: null, stop: null };
    clips.set(from, clip);
    clip.job = new Promise<void>((resolve) => {
      let nudged = false;
      const t = setTimeout(() => finish(false), VIDEO.fetchMs);
      const check = () => { if (clips.get(from) === clip && wholeBuffered(v.buffered, v.duration)) finish(true); };
      // a browser that stops fetching before the whole clip is in (iOS reads ahead only so far) is made to read on once
      const onSuspend = () => {
        check();
        if (clip.state !== 'fetching' || nudged || v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return;
        nudged = true;
        v.play().then(() => { v.pause(); v.currentTime = 0; }, () => {});
      };
      const onError = () => finish(false);
      const events = ['progress', 'canplaythrough', 'loadeddata', 'durationchange'] as const;
      function finish(ok: boolean) {
        clearTimeout(t);
        for (const e of events) v.removeEventListener(e, check);
        v.removeEventListener('suspend', onSuspend); v.removeEventListener('error', onError);
        clip.stop = null;
        if (clips.get(from) !== clip || clip.state !== 'fetching') { resolve(); return; }
        clip.state = ok ? 'in' : 'failed';
        if (ok) warm(from); else { console.warn(`section 4: clip ${clip.url} did not load; that travel is the cross-fade`); blocked(); }
        resolve();
      }
      clip.stop = () => finish(false);
      for (const e of events) v.addEventListener(e, check);
      v.addEventListener('suspend', onSuspend); v.addEventListener('error', onError);
      v.preload = 'auto'; v.src = u; v.load();
    });
    return clip.job;
  }

  /** the clip's first frame uploaded a frame after it is in (one upload a frame, spec 5), so its first travel starts on it */
  function warm(from: number) {
    requestAnimationFrame(() => {
      const v = pool[from];
      if (disposed || clips.get(from)?.state !== 'in' || !v || v.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || from === active) return;
      const t = texture(from); t.needsUpdate = true; ctx.renderer.initTexture(t);
    });
  }

  const isIn = (from: number) => { const c = clips.get(from); return !!c && c.cls === ctx.cls() && c.state === 'in'; };

  /** the travel's end, or its abandonment: the clip paused and back at its start, its texture freed; the next clip fetched */
  function stop() {
    if (active >= 0) {
      const v = pool[active];
      if (v) { v.pause(); if (v.currentTime > 0) v.currentTime = 0; }
      textures.get(active)?.dispose();
    }
    active = -1; lastP = -1; same = 0; playAt = -1; seen = false; fresh = false; shownT = -1;
  }

  const api: Travel = {
    get ready() { return ready; }, get failed() { return failed; }, get note() { return note; },
    async load() {
      try {
        pool = unlockMedia(N - 1);   // the elements the press unlocked (made here, without its gesture, if it did not)
        ready = true;
        void fetchClip(0);           // the first travel's clip, on the press (spec 5, phase 3)
      } catch (e) { failed = true; console.warn("section 4: option C's clips could not be set up; the cross-fade stands in", e); }
    },
    can(from, to) {
      if (!ctx.view(from) || !ctx.view(to)) return false;
      if (to < from) return true;                                 // back: the 0.4 s cross-fade
      if (to !== from + 1 || !clipsAllowed(environment())) return false;
      if (isIn(from)) return true;
      if (clips.get(from)?.state === 'failed' && clips.get(from)?.cls === ctx.cls()) blocked(); else void fetchClip(from);
      return false;
    },
    pending(from, to) {
      if (to !== from + 1 || isIn(from) || !clipsAllowed(environment())) return null;
      const c = clips.get(from);
      if (c && c.cls === ctx.cls() && c.state === 'failed') return null;
      return fetchClip(from);
    },
    ms(from, to, _params: RoomParams) {
      if (to < from) return VIDEO.backMs;
      const d = pool[from]?.duration;
      return (d && Number.isFinite(d) ? d : 3) * 1000;
    },
    frame(from, to, p) {
      lastTo = to;
      if (to < from) return fadeLayers(ctx.world, ctx.view, from, to, p);
      const v = pool[from];
      if (!v || !isIn(from)) return null;
      if (active !== from) { stop(); active = from; fresh = v.currentTime < VIDEO.slack && !v.seeking && textures.has(from); shownT = fresh ? 0 : -1; }
      const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 3, target = Math.min(clamp01(p) * dur, dur - VIDEO.slack);
      same = p === lastP ? same + 1 : 0;
      if (same >= 2 || (lastP >= 0 && Math.abs(p - lastP) > 0.1)) {
        // a held frame (the review hook): paused at p of the clip
        if (!v.paused) v.pause();
        playAt = -1;
        if (!v.seeking && Math.abs(v.currentTime - target) > VIDEO.slack) { v.currentTime = target; fresh = false; }
      } else if (v.paused && !v.ended && playAt < 0) {
        // the travel plays: the clip from where the travel stands
        if (Math.abs(v.currentTime - target) > 0.25) { v.currentTime = target; fresh = false; }
        playAt = performance.now(); playFrom = v.currentTime; seen = false;
        v.play().catch((e: unknown) => { if (active === from && playAt >= 0) { console.warn('section 4: a clip was refused', e); playAt = -2; } });
      }
      lastP = p;
      // a refusal: play() refused, or no new frame within 1.5 s of it; the director's cross-fade takes the rest
      if (playAt === -2 || (playAt >= 0 && !seen && performance.now() - playAt > VIDEO.refuseMs)) { blocked(); stop(); active = -1; return null; }
      // a new frame of the clip, uploaded with this frame's draw
      if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !v.seeking && v.currentTime !== shownT) {
        texture(from).needsUpdate = true; shownT = v.currentTime; fresh = true;
        if (playAt >= 0 && v.currentTime > playFrom) { seen = true; if (note === ROOM_COPY.clipBlocked) note = null; }
      }
      const a = ctx.view(from), b = ctx.view(to);
      if (!fresh) return [restLayer(ctx.world, a, from)];         // until the clip's frame is there: the departing land at rest
      const t = v.currentTime, k0 = a ? restZoom(a, ctx.world.restPush(from)) : 1, k1 = b ? restZoom(b, ctx.world.restPush(to)) : k0;
      const size = LAND_SIZE[ctx.cls()], aspect = v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : size.width / size.height;
      const layers: WorldLayer[] = [{ kind: 'image', texture: texture(from), aspect, zoom: k0 + (k1 - k0) * clamp01(t / dur) }];
      const h = handOverAlpha(t, dur, p);
      if (h > 0) layers.push(restLayer(ctx.world, b, to, h));
      return layers;
    },
    end() {
      stop();
      if (lastTo >= 0 && lastTo < N - 1) void fetchClip(lastTo);  // on arrival at land n, clip n (spec 5, phase 4)
      lastTo = -1;
    },
    dispose() {
      disposed = true; ready = false; stop();
      for (const c of clips.values()) c.stop?.();
      clips.clear();
      for (const t of textures.values()) t.dispose();
      textures.clear();
      for (const v of pool) { v.pause(); v.removeAttribute('src'); v.preload = 'none'; v.load(); }
    },
  };
  return api;
}
