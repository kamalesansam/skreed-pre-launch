// Section 4 part three's loop elements (docs/specs/section-4-flux.md 5 "Video policy" and "Loading", AC7, E-S4-video),
// salvaged from part two's travel-video.ts and travel.ts: at most five <video> elements, made once and kept across laps,
// muted and inline, unlocked (play then pause) inside the press task and again after a wrap so a browser that wants a
// gesture before a video may play (iOS in Low Power Mode) has had it on these elements. A loop streams from its hashed
// URL into its element (never a blob: the CSP's media-src 'self') and is in once the element has buffered the whole
// file within half a frame (the 1/48 s slack), not in after 20 s or an error; a browser that stops reading ahead
// before the end (iOS) is nudged on once by a play and pause. One VideoTexture per element, display values in and out
// (NoColorSpace, no mipmaps), marked for upload on every new currentTime; play and reset come from the carousel's
// proximity rule (carousel-math.ts loopShouldPlay, loopShouldReset). A rejected play(), or 1.5 s after a play() with
// no new frame, marks the element refused and the carousel keeps the scene's still; the next unlock (a gesture) clears
// the refusals. The loop URLs come from the caller (the wiring's config): this module names no asset of its own, and it
// is the one section 4 module that may spell out the loops' format, .mp4 (tests/unit/room-video.test.ts).
import { NoColorSpace, VideoTexture } from 'three';

/** the policy's numbers (spec 5) */
export const VIDEO = Object.freeze({
  /** s: half a frame of the loops' 24, the slack on "wholly buffered" */
  slack: 1 / 48,
  /** ms: a loop not in by then has failed */
  fetchMs: 20_000,
  /** ms: no new frame this long after play() is a refusal */
  refuseMs: 1500,
  /** at most this many elements, one a scene */
  max: 5,
});

/** whether the ranges an element has buffered cover the whole loop, [0, duration], within the slack */
export function wholeBuffered(r: { readonly length: number; start(i: number): number; end(i: number): number }, duration: number, slack: number = VIDEO.slack): boolean {
  if (!(duration > 0)) return false;
  const spans = Array.from({ length: r.length }, (_, i) => [r.start(i), r.end(i)] as const).sort((a, b) => a[0] - b[0]);
  let reach = 0;
  for (const [a, b] of spans) { if (a > reach + slack) break; reach = Math.max(reach, b); }
  return reach >= duration - slack;
}

export interface VideoEnvironment { saveData?: boolean; effectiveType?: string; deviceMemory?: number; reduced?: boolean }
function environment(): VideoEnvironment {
  if (typeof navigator === 'undefined') return {};
  const n = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  return { saveData: n.connection?.saveData, effectiveType: n.connection?.effectiveType, deviceMemory: n.deviceMemory, reduced: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches };
}
/** where loops may play (E-S4-video): never under reduced motion, Save-Data, on 2g or slow-2g, or at deviceMemory 2 or less; stills then */
export function allowed(e: VideoEnvironment = environment()): boolean {
  return !e.reduced && !e.saveData && !/(^|-)2g$/.test(e.effectiveType ?? '') && !(typeof e.deviceMemory === 'number' && e.deviceMemory <= 2);
}

type FetchState = 'idle' | 'fetching' | 'in' | 'failed';
interface Slot {
  v: HTMLVideoElement;
  state: FetchState;
  url: string;
  job: Promise<boolean> | null;
  stop: (() => void) | null;
  tex: VideoTexture | null;
  refused: boolean;
  /** performance.now() of the play() in flight (-1 none, -2 rejected), the currentTime it started from, whether a frame came since */
  playAt: number; playFrom: number; seen: boolean;
  /** the currentTime last marked for upload */
  shownT: number;
}

export interface VideoPool {
  readonly n: number;
  /** play then pause on every element: inside the press task and after a wrap (the gesture iOS counts); clears the refusals */
  unlock(): void;
  /** stream the loop at url into element i; true once wholly buffered, false when it failed, timed out or was stopped */
  fetch(i: number, url: string, signal?: AbortSignal): Promise<boolean>;
  /** wholly buffered and not refused: the plane may draw it */
  in(i: number): boolean;
  refused(i: number): boolean;
  /** videoWidth over videoHeight, or 0 before the metadata */
  aspect(i: number): number;
  /** the frame's size in pixels, [0, 0] before the metadata (the carousel's memory count) */
  size(i: number): readonly [number, number];
  /** the element's texture, made once; call it once a frame while the plane draws it: a new currentTime is marked for upload and the refusal clock runs */
  texture(i: number): VideoTexture;
  playing(i: number): boolean;
  play(i: number): void;
  /** pause and back to frame 0 */
  reset(i: number): void;
  /** every texture and fetch freed; the elements stay for the next lap, unlocked */
  dispose(): void;
}

const pool: HTMLVideoElement[] = [];
/** element k, made once: muted, inline, looping, no remote playback, and read ahead in full */
function element(k: number): HTMLVideoElement {
  while (pool.length <= k) {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.disableRemotePlayback = true; v.loop = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    pool.push(v);
  }
  return pool[k];
}
const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** n elements at most (VIDEO.max), the same ones on every call */
export function create(n: number): VideoPool {
  const count = Math.max(0, Math.min(VIDEO.max, Math.floor(n)));
  const slots: Slot[] = Array.from({ length: count }, (_, k) => ({ v: element(k), state: 'idle', url: '', job: null, stop: null, tex: null, refused: false, playAt: -1, playFrom: 0, seen: false, shownT: -1 }));
  const at = (i: number): Slot | undefined => slots[i];

  function fetchLoop(s: Slot, url: string, signal?: AbortSignal): Promise<boolean> {
    if (s.url === url && s.state !== 'idle' && s.state !== 'failed') return s.job ?? Promise.resolve(s.state === 'in');
    s.stop?.();
    const v = s.v;
    s.url = url; s.state = 'fetching'; s.refused = false;
    s.job = new Promise<boolean>((resolve) => {
      let nudged = false;
      const t = setTimeout(() => finish(false), VIDEO.fetchMs);
      const check = () => { if (s.state === 'fetching' && wholeBuffered(v.buffered, v.duration)) finish(true); };
      // a browser that stops fetching before the whole loop is in is made to read on once
      const onSuspend = () => {
        check();
        if (s.state !== 'fetching' || nudged || v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return;
        nudged = true;
        v.play().then(() => { v.pause(); v.currentTime = 0; }, () => {});
      };
      const onError = () => finish(false);
      const onAbort = () => finish(false, true);
      const events = ['progress', 'canplaythrough', 'loadeddata', 'durationchange'] as const;
      function finish(ok: boolean, stopped = false) {
        clearTimeout(t);
        for (const e of events) v.removeEventListener(e, check);
        v.removeEventListener('suspend', onSuspend); v.removeEventListener('error', onError);
        signal?.removeEventListener('abort', onAbort);
        s.stop = null;
        if (s.state !== 'fetching') { resolve(s.state === 'in'); return; }
        s.state = ok ? 'in' : stopped ? 'idle' : 'failed';
        if (!ok && !stopped) console.warn(`section 4: the loop ${url} did not load; its still stays`);
        resolve(ok);
      }
      s.stop = () => finish(false, true);
      if (signal?.aborted) { finish(false, true); return; }
      signal?.addEventListener('abort', onAbort, { once: true });
      for (const e of events) v.addEventListener(e, check);
      v.addEventListener('suspend', onSuspend); v.addEventListener('error', onError);
      v.src = url; v.load();
    });
    return s.job;
  }

  function refuse(s: Slot) {
    s.refused = true; s.playAt = -1;
    if (!s.v.paused) s.v.pause();
    console.warn('section 4: a loop was refused; its still stays');
  }

  const api: VideoPool = {
    n: count,
    unlock() {
      for (const s of slots) { s.v.play().catch(() => {}); s.v.pause(); s.refused = false; }
    },
    fetch(i, url, signal) { const s = at(i); return s ? fetchLoop(s, url, signal) : Promise.resolve(false); },
    in(i) { const s = at(i); return !!s && s.state === 'in' && !s.refused; },
    refused(i) { return !!at(i)?.refused; },
    aspect(i) { const v = at(i)?.v; return v && v.videoWidth > 0 && v.videoHeight > 0 ? v.videoWidth / v.videoHeight : 0; },
    size(i) { const v = at(i)?.v; return v ? [v.videoWidth, v.videoHeight] : [0, 0]; },
    texture(i) {
      const s = slots[i], v = s.v;
      s.tex ??= new VideoTexture(v);   // LinearFilter both ways, no mipmaps, flipY: the plane's uv as a picture's
      s.tex.colorSpace = NoColorSpace;
      // a refusal: play() rejected, or no new frame within 1.5 s of it
      if (s.playAt === -2 || (s.playAt >= 0 && !s.seen && now() - s.playAt > VIDEO.refuseMs)) refuse(s);
      // a new frame, uploaded with this frame's draw
      if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !v.seeking && v.currentTime !== s.shownT) {
        s.tex.needsUpdate = true; s.shownT = v.currentTime;
        if (s.playAt >= 0 && v.currentTime > s.playFrom) { s.seen = true; s.playAt = -1; }
      }
      return s.tex;
    },
    playing(i) { const s = at(i); return !!s && !s.v.paused && !s.v.ended; },
    play(i) {
      const s = at(i);
      if (!s || s.refused || s.state !== 'in' || !s.v.paused) return;
      s.playAt = now(); s.playFrom = s.v.currentTime; s.seen = false;
      s.v.play().catch(() => { if (s.playAt >= 0) s.playAt = -2; });
    },
    reset(i) {
      const s = at(i);
      if (!s) return;
      s.playAt = -1; s.seen = false;
      if (!s.v.paused) s.v.pause();
      if (s.v.currentTime > 0 && !s.v.seeking) s.v.currentTime = 0;
    },
    dispose() {
      for (const s of slots) {
        s.stop?.(); s.tex?.dispose(); s.tex = null; s.state = 'idle'; s.url = ''; s.job = null; s.playAt = -1; s.shownT = -1;
        s.v.pause(); s.v.removeAttribute('src'); s.v.load();
      }
    },
  };
  return api;
}
