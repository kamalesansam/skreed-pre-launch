// The igloo intro (prototype v10 and v11.4 template.html, "Intro: igloo.inc's opening shot, re-created for the mark";
// spec docs/specs/hero-intro/spec.md): the camera starts high over the mark and cranes down to the hero pose; a Pearl
// Whisper wire cage and a ring of counting numbers open out from the floor point under the logo; the mark's outline
// traces top down, then the mark prints top down through its wire; the snow floor arrives as a growing ring of
// triangles and a disc of snow, the far ridges rise, the fog cards come in, and the flat night turns into the sky.
// 8.2 s. Our code and our geometry, generated here from one seed: no igloo code, model, texture or string ships.
// t = seconds since the loader's lift (igloo hides its loader and plays its intro timeline on the same tick).
import { BufferGeometry, CanvasTexture, Color, CustomBlending, DataTexture, Float32BufferAttribute, LineSegments, LinearMipmapLinearFilter, Matrix4, Mesh, NearestFilter, OneFactor, OrthographicCamera, PlaneGeometry, Points, RedFormat, RepeatWrapping, Scene, ShaderMaterial, Vector3, WebGLRenderTarget, type Material, type Texture } from 'three';
import { INTRO_POSE } from '../../../config/hero.ts';
import { PEARL_WHISPER } from '../../../config/tokens.ts';
import { clamp01, smoothstep } from '../util/math.ts';
import { CAGE_FRAG, CAGE_VERT, COMPOSITE_FRAG_V11, FLOOR_INTRO_COLOR, IGL, LOGO_FRAG_OUT, LOGO_FRAG_PARS, NUMS_FRAG, NUMS_VERT, OUTLINE_FRAG, OUTLINE_VERT, SKY_FRAG_OUT, SKY_FRAG_PARS, TRI_FRAG, TRI_VERT, floorIntroCommon } from '../v11/glsl.ts';
import type { ShaderPatch } from '../world/ground.ts';
import type { HeroContext } from '../types.ts';
import type { IntroDirector, IntroFrame, IntroHooks } from './types.ts';

export const IEND = 8.2;
/** Tune's "Intro lines" (the prototype's P.introLines): 0.45 in v10 r2; locked at 1.50 by Sam from the Tune panel, 2026-10-16 (hero.md section 0) */
export const INTRO_LINES = 1.5;

type Phase = 'armed' | 'run' | 'done';
interface IntroState {
  phase: Phase; t: number; t0: number; paused: boolean; fresh: boolean; go: boolean; ready: boolean; pend: boolean; fin: boolean;
  sync: WebGLSync | null; syncAt: number; rsz: boolean; iv: number[]; last: number; a0: number;
  w: number; touch: number; breath: number; v: Record<string, number>; ev: Record<string, 1>; lines: Line[] | null; lt: number | null;
}
interface Unit { s: HTMLSpanElement; ch: string; el: HTMLElement; i: number; x: number; g?: string; a?: string }
interface Line { els: HTMLElement[]; start: number; count?: 1; units: Unit[] | null; orig?: string[] }

const bez = (x1: number, y1: number, x2: number, y2: number) => (x: number) => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, u = 0.5;
  for (let i = 0; i < 40; i++) { u = (lo + hi) / 2; if (3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u < x) lo = u; else hi = u; }
  return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u; };
const EZ: Record<string, (x: number) => number> = { inOut1: bez(.5, 0, .1, 1), inOut3: bez(.6, 0, 0, 1), inOut4: bez(.4, 0, -.06, 1), printEase: bez(.662, .073, .047, 1), lin: (x) => x,
  sineInOut: (x) => -(Math.cos(Math.PI * x) - 1) / 2, sineOut: (x) => Math.sin(x * Math.PI / 2),
  power2InOut: (x) => x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2,       // GSAP's power2.inOut is cubic
  power3InOut: (x) => x < .5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2 };     // and its power3.inOut quartic
const tw = (t: number, s: number, d: number, e: string, a = 0, b = 1) => a + (b - a) * EZ[e](clamp01((t - s) / d));
const BLOOMF = [1, 0.8, 0.6, 0.4, 0.2], BLOOMT = [1, 0.45, 0.15, 0.04, 0];   // UnrealBloomPass's own mip weights, and a tight set
const SUBS = ['0123456789', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'];
const glyphSub = (ch: string, k: number) => { for (const s of SUBS) { const i = s.indexOf(ch); if (i >= 0) return s[(i + 3 * k + 1) % s.length]; } return ch; };

export interface IglooOptions { reduced: boolean; touch: boolean; dpr: number; mist: number; bloom: number; hooks: boolean }

export function createIglooIntro(o: IglooOptions): IntroDirector {
  const { reduced: reduce, dpr: DPR } = o;
  const HT = document.documentElement, LD = () => window.__skreedLoader, posterNow = () => !!(LD() && LD()!.state().mode === 'poster');
  // the intro is skipped (end state at once) for reduced motion, ?intro=0 and deep links, as igloo skips it for a project link
  const SKIP = reduce || new URLSearchParams(location.search).get('intro') === '0' || !!location.hash;
  const fontsP = Promise.race([document.fonts.load('400 24px "Open Sans"'), new Promise((r) => setTimeout(r, 3000))]).catch(() => 0);   // the number atlas
  const PEARL = new Color(PEARL_WHISPER);
  const FLATC = new Color().setRGB(0.007455, 0.007454, 0.008448);   // linear; ACES + sRGB output it as the loader's night (5,5,6)
  const IO = new Vector3(0, -3.61, 0), IP0 = new Vector3().fromArray(INTRO_POSE.cam as unknown as number[]), IT0 = new Vector3().fromArray(INTRO_POSE.tgt as unknown as number[]);
  const IN: IntroState = { phase: 'armed', t: 0, t0: 0, paused: false, fresh: false, go: false, ready: false, pend: false, fin: false, sync: null, syncAt: 0, rsz: false, iv: [], last: 0, a0: 0,
    w: 0, touch: 0, breath: 0, v: {}, ev: {}, lines: null, lt: null };
  // the floor chunk's uniforms, shared by the ground and the stones; tTri is the logo's (the same object)
  const tTri = { value: null as Texture | null };
  const FLU = { uU: { value: 1 }, uU2: { value: 1 }, uFloorA: { value: 1 }, uFarA: { value: 1 }, uDim: { value: 1 }, uDimN: { value: 1 }, uRing: { value: 0.015 }, uO: { value: new Vector3() },
    uGlowCol: { value: new Color() }, tTri, tMosaic: { value: null as Texture | null } };
  const logoUniforms = { uPrint: { value: 1 }, uPrintCol: { value: new Color() }, tTri, uMask: { value: 0 } };
  const floorIntro = (stones: boolean): ShaderPatch => ({ key: 'floor-intro' + (stones ? '-stones' : ''), apply(sh) {
    Object.assign(sh.uniforms, FLU);
    if (stones) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', floorIntroCommon(stones)).replace('#include <color_fragment>', FLOOR_INTRO_COLOR);
  } });
  FLU.uGlowCol.value.copy(PEARL).multiplyScalar(1.2);   // the snow rim, in Pearl: HDR, so it clears ACES to white and blooms
  logoUniforms.uPrintCol.value.copy(PEARL).multiplyScalar(2);   // the band is HDR (up to 4): ACES maps it to 250 sRGB, and it blooms
  // WebGL2 is up: lock the scroll and hide the corner UI until the intro writes it (never on the poster path)
  const noTouch = (e: TouchEvent) => { if (HT.classList.contains('intro')) e.preventDefault(); };   // the lock follows html.intro, so the loader's poster() releases it too
  if (!SKIP && !posterNow()) { HT.classList.add('intro', 'uh1', 'uh2', 'uh3', 'uh4'); addEventListener('touchmove', noTouch, { passive: false }); }

  let iSeed = 20261009;   // mulberry32: the cage, the numbers and the mosaic are the same on every load
  const irnd = () => { iSeed = (iSeed + 0x6d2b79f5) >>> 0; let q = iSeed; q = Math.imul(q ^ (q >>> 15), q | 1); q ^= q + Math.imul(q ^ (q >>> 7), q | 61); return ((q ^ (q >>> 14)) >>> 0) / 4294967296; };
  const ipick = <T>(a: T[]): T => a[Math.floor(irnd() * a.length)];
  const ipickW = (w: number[]) => { let u = irnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { u -= w[i]; if (u <= 0) return i; } return w.length - 1; };

  // the cage (igloo's "skeleton"): 117 cubes on a 2-unit lattice on the floor, yawed 45 degrees so the camera sits on a lattice
  // diagonal as igloo's does. Each cube is a 3-face shell (top, -z, +x) whose triangle index is drawn as line pairs: 6 edges (2
  // twice), 2 empty pairs and one face diagonal per cube. Clumps grow to igloo's measured layer and band quotas, re-spread for our taller mark.
  function genCage() {
    const RB = 3.433, MAXR = 4.24 * RB, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const Q: Record<string, number[]> = { '-1': [0, 0, 7, 3, 2], 0: [0, 15, 28, 23, 19], 1: [3, 3, 0, 2, 1], 2: [3, 3, 0, 0, 0], 3: [3, 2, 0, 0, 0] };
    const band = (i: number, j: number) => Math.floor(Math.hypot(2 * i, 2 * j) / RB), K = (i: number, j: number, L: number) => i + ',' + j + ',' + L;
    const occ = new Map<string, [number, number, number]>(), owner = new Map<string, number>();
    const free = (i: number, j: number, L: number) => !occ.has(K(i, j, L)) && Math.hypot(2 * i, 2 * j) <= MAXR && Q[L][band(i, j)] > 0;
    const place = (i: number, j: number, L: number) => { occ.set(K(i, j, L), [i, j, L]); Q[L][band(i, j)]--; };
    const cells = (L: number) => { const c: [number, number][] = []; for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) if (free(i, j, L)) c.push([i, j]); return c; };
    const other = (i: number, j: number, id: number) => N4.some(([a, b]) => { const o = owner.get((i + a) + ',' + (j + b)); return o !== undefined && o !== id; });
    let cid = 0;
    const grow = (size: number) => {
      const need = Q[0].map((v) => Math.max(0, v)); if (need.every((v) => !v)) return false;
      const tb = ipickW(need), id = cid++, all = cells(0).filter(([i, j]) => band(i, j) === tb), sd = all.filter(([i, j]) => !other(i, j, id));
      const sp = sd.length ? sd : all; if (!sp.length) { Q[0][tb] = 0; return true; }
      const s0 = ipick(sp), fr = [s0]; place(s0[0], s0[1], 0); owner.set(s0[0] + ',' + s0[1], id);
      for (let n = 1; n < size && fr.length;) {
        const fi = Math.floor(irnd() * fr.length), [ci, cj] = fr[fi];
        const op = N4.map(([a, b]) => [ci + a, cj + b] as [number, number]).filter(([i, j]) => free(i, j, 0) && !other(i, j, id));
        if (!op.length) { fr.splice(fi, 1); continue; }
        const [ni, nj] = ipick(op); place(ni, nj, 0); owner.set(ni + ',' + nj, id); fr.push([ni, nj]); n++;
      }
      return true;
    };
    for (const n of [28, 18, 13, 11, 8, 7, 6, 3, 3, 3, 2, 2, 2]) if (!grow(Math.max(1, Math.round(n * 85 / 117)))) break;
    while (Q[0].some((v) => v > 0)) if (!grow(1)) break;
    const attach = (L: number, under?: number) => { for (let b = 0; b < 5; b++) while (Q[L][b] > 0) {
      const nb: [number, number][] = [];
      for (const [i, j, LL] of occ.values()) { if (under !== undefined && LL !== under) continue;
        for (const [x, y] of under !== undefined ? [[i, j]] : N4.map(([a, c]) => [i + a, j + c])) if (free(x, y, L) && band(x, y) === b) nb.push([x, y]); }
      const pool = nb.length ? nb : cells(L).filter(([i, j]) => band(i, j) === b); if (!pool.length) { Q[L][b] = 0; break; }
      const [x, y] = ipick(pool); place(x, y, L); } };
    attach(-1, 0); attach(1, 0); attach(2, 1); attach(2); attach(3, 2); attach(3);
    const cubes = [...occ.values()], R = new Matrix4().makeRotationY(Math.PI / 4), v3 = new Vector3();
    const W = (x: number, y: number, z: number) => v3.set(x, y, z).applyMatrix4(R).add(IO).toArray();
    const TPL = [[[1, 1, 1], [1, 1, -1], [-1, 1, 1]], [[-1, 1, 1], [1, 1, -1], [-1, 1, -1]], [[-1, 1, -1], [1, 1, -1], [-1, -1, -1]],
      [[-1, -1, -1], [1, 1, -1], [1, -1, -1]], [[1, 1, -1], [1, 1, 1], [1, -1, -1]], [[1, 1, 1], [1, -1, 1], [1, -1, -1]]];
    const rXZ = ([x, y, z]: number[], r: number) => r === 0 ? [x, y, z] : r === 1 ? [-z, y, x] : r === 2 ? [-x, y, -z] : [z, y, -x];
    const pos: number[] = [], cen: number[] = [], ph: number[] = [], idx: number[] = [], phase = new Map<string, number>(), HALF = 0.9985;
    for (const [i, j, L] of cubes) {
      const c = [2 * i, 2 * L, 2 * j], r = ipickW([61, 13, 43, 0]);
      for (let f = 0; f < 3; f++) {
        const loc = new Map<string, number>(), fv: number[][] = [];
        for (const sgn of [...TPL[2 * f], ...TPL[2 * f + 1]]) {
          const key = sgn.join();
          if (!loc.has(key)) {
            loc.set(key, pos.length / 3); const o = rXZ(sgn, r); fv.push(o);
            const p = W(c[0] + o[0] * HALF, c[1] + o[1] * HALF, c[2] + o[2] * HALF); pos.push(...p);
            const pk = p.map((v) => Math.round(v * 1000)).join(); if (!phase.has(pk)) phase.set(pk, irnd()); ph.push(phase.get(pk)!);
          }
          idx.push(loc.get(key)!);
        }
        const fc = [0, 1, 2].map((a) => fv.reduce((s, o) => s + o[a], 0) / 4), cw = W(c[0] + fc[0], c[1] + fc[1], c[2] + fc[2]);
        for (let k = 0; k < 4; k++) cen.push(...cw);
      }
    }
    // number anchors: 58.5% of the lattice corners, each 0.1 right and up of its corner
    const corners = new Map<string, [number[], number[]]>();
    for (const [i, j, L] of cubes) for (let n = 0; n < 8; n++) { const s = [n & 1 ? 1 : -1, n & 2 ? 1 : -1, n & 4 ? 1 : -1], p = [2 * i + s[0], 2 * L + s[1], 2 * j + s[2]]; corners.set(p.join(), [p, s]); }
    const cl = [...corners.values()];
    for (let i = cl.length - 1; i > 0; i--) { const j = Math.floor(irnd() * (i + 1)); [cl[i], cl[j]] = [cl[j], cl[i]]; }
    const pts: number[] = [], dd: number[] = [];
    for (const [p, s] of cl.slice(0, Math.round(cl.length * 252 / 431))) { const w = W(p[0] - s[0] * 0.0015 + 0.1, p[1] - s[1] * 0.0015 + 0.1, p[2] - s[2] * 0.0015); pts.push(...w); dd.push(IO.distanceTo(v3.fromArray(w))); }
    return { pos, cen, ph, idx, pts, dd, n: cubes.length };
  }
  // the outline (igloo's brick-edge wire): one loop per block on its front face and one on its back, inset like the seam, corners rounded
  function genOutline(ctx: HeroContext) {
    const out: number[] = [], rc = 0.0532, S = ctx.frame.S, toLocal = ctx.frame.toLocal;
    type P2 = [number, number];
    const rdp = (pts: P2[], tol: number): P2[] => {
      const seg = (p: P2[]): P2[] => { if (p.length < 3) return p; const a = p[0], b = p[p.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let best = -1, bi = 0;
        for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((p[i][0] - a[0]) * dy - (p[i][1] - a[1]) * dx) / L; if (d > best) { best = d; bi = i; } }
        return best > tol ? seg(p.slice(0, bi + 1)).slice(0, -1).concat(seg(p.slice(bi))) : [a, b]; };
      let far = 0; pts.forEach((q, i) => { if (Math.hypot(q[0] - pts[0][0], q[1] - pts[0][1]) > Math.hypot(pts[far][0] - pts[0][0], pts[far][1] - pts[0][1])) far = i; });
      return seg(pts.slice(0, far + 1)).slice(0, -1).concat(seg(pts.slice(far).concat([pts[0]])).slice(0, -1));
    };
    const inset = (p: P2[], dist: number): P2[] => { let A = 0; const n = p.length; p.forEach((q, i) => { const r = p[(i + 1) % n]; A += q[0] * r[1] - r[0] * q[1]; }); const sgn = A > 0 ? 1 : -1;
      return p.map((b, i) => { const a = p[(i - 1 + n) % n], c = p[(i + 1) % n], n1 = [a[1] - b[1], b[0] - a[0]], n2 = [b[1] - c[1], c[0] - b[0]], l1 = Math.hypot(n1[0], n1[1]) || 1, l2 = Math.hypot(n2[0], n2[1]) || 1;
        const m = [n1[0] / l1 + n2[0] / l2, n1[1] / l1 + n2[1] / l2], ml = Math.hypot(m[0], m[1]) || 1, ch = Math.max(0.35, ml / 2);
        return [b[0] + sgn * m[0] / ml * dist / ch, b[1] + sgn * m[1] / ml * dist / ch]; }); };
    const roundSplit = (p: P2[]): P2[] => { const n = p.length, o: P2[] = [];
      for (let i = 0; i < n; i++) { const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]], lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]);
        if (Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])) > 0.4363 && lu > 2.2 * rc && lv > 2.2 * rc) {
          const p0 = [b[0] - u[0] / lu * rc, b[1] - u[1] / lu * rc], p2 = [b[0] + v[0] / lv * rc, b[1] + v[1] / lv * rc];
          for (let k = 0; k <= 3; k++) { const s = k / 3; o.push([0, 1].map((e) => (1 - s) ** 2 * p0[e] + 2 * (1 - s) * s * b[e] + s * s * p2[e]) as P2); }
        } else o.push(b); }
      const r: P2[] = []; o.forEach((a, i) => { const b = o[(i + 1) % o.length], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.222)); for (let j = 0; j < k; j++) r.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); });
      return r; };
    ctx.pieces.variants['10'].pieces.forEach((pc, id) => {
      const c = ctx.blocks[id].c, loop = roundSplit(inset(rdp(pc.v.slice(0, pc.nb).map(([x, y]) => { const l = toLocal(x, y); return [c.x + (l.x - c.x) * 0.992, c.y + (l.y - c.y) * 0.992] as P2; }), 1.5 * S), 0.05));
      for (const z of [0.477, -0.477]) loop.forEach((a, i) => { const b = loop[(i + 1) % loop.length]; out.push(a[0], a[1], z, b[0], b[1], z); });
    });
    return out;
  }

  // built by install()
  const ILINE = { value: new Color() };
  const CU = { uA: { value: 0 }, uP: { value: 0 }, uO: FLU.uO };
  const OU = { uA: { value: 1 }, uP: { value: 0 }, uK: { value: 2.2 } };   // uK: the wire outline reads above the cage, as igloo's does
  const NU = { uP: { value: 0 }, uSize: { value: 8 }, tNum: { value: null as Texture | null } };
  let cage!: LineSegments, outline!: LineSegments, nums!: Points, numTex!: CanvasTexture, mosaic!: DataTexture, CG!: ReturnType<typeof genCage>;
  let X: HeroContext | null = null;   // the hero context, from install on
  let SKU: Record<string, { value: unknown }> | null = null;
  const UIQ = { eb: null as HTMLElement | null, cnt: null as HTMLElement | null };
  let lastW = 0, lastH = 0;
  const cdIdx = (el: HTMLElement) => ['cd-d', 'cd-h', 'cd-m', 'cd-s'].indexOf(el.id), cdNow = (el: HTMLElement) => { const k = cdIdx(el), v = window.__skreedCountV; return k >= 0 && v ? v[k] : null; };

  function evalTL(t: number) {
    const ctx = X!, v = IN.v, end = IN.phase === 'done', on = !end && !SKIP, A = ctx.composerA, C = ctx.composite.C, FOG = ctx.FOG, P = ctx.params;
    C.uIntro.value = v.uIntro = tw(t, 0, 1, 'inOut3');                                   // flat night to the scene
    OU.uP.value = v.outP = tw(t, 0, 2.5, 'power3InOut'); OU.uA.value = v.outA = tw(t, 2, 3, 'inOut4', 1, 0); outline.visible = !end && t < 5;
    OU.uK.value = v.outK = tw(t, 1.4, 0.6, 'sineInOut', 2.2, 1.5);   // the wire is the brightest thing on screen until the print takes over
    CU.uP.value = v.cageP = tw(t, 0, 4, 'sineInOut'); cage.visible = !end && t < 5.1;
    CU.uA.value = v.cageA = t < 2.1 ? tw(t, 0, .1, 'power2InOut', 0, .4) : tw(t, 2.1, 3, 'power2InOut', .4, 0);
    NU.uP.value = v.numP = tw(t, .5, 4, 'sineOut'); nums.visible = !end && t < 3.75;
    logoUniforms.uPrint.value = v.print = tw(t, 1.1, 2.25, 'printEase');
    IN.breath = v.breath = tw(t, 2, 2, 'lin');
    IN.w = v.w = tw(t, 2, 5.5, 'inOut1'); IN.touch = v.touch = tw(t, 2, 5, 'power2InOut');
    // the far field and the unlit floor wait for the crane: from the high start pose the field stays night around the pool
    const D = smoothstep(0.05, 0.16, IN.w);   // 0 until 2.9 s, 0.84 at 3.25 s, 1 by 3.4 s: the unlit floor fades in fast, so no half-opaque state lingers
    FLU.uFloorA.value = v.floorA = t >= 2.1 ? 1 : 0; FLU.uFarA.value = v.farA = tw(t, .7, 3, 'power2InOut') * D;
    FLU.uDim.value = FLU.uDimN.value = v.dim = D;
    FLU.uU.value = v.u = tw(t, .7, 7.5, 'inOut1'); FLU.uU2.value = v.u2 = tw(t, .7, 7.5, 'inOut3');
    FOG.uOpacity.value = v.fogA = tw(t, 2, 3, 'power2InOut') * smoothstep(0.35, 0.75, tw(t, 2, 5.5, 'inOut1'));   // igloo's smoke, held back until the crane is low: seen from above, our wisp cards read as streaks
    SKU!.uSkyP.value = v.skyP = tw(t, 1.5, 3, 'power2InOut'); SKU!.uSkyB.value = v.u2;
    FOG.uGMAmount.value = v.mist = end ? P.mist : P.mist * smoothstep(0.6, 0.9, IN.w);   // the ground mist's wind taps scroll along z: from the high pose that reads as rain-like streaks, so it waits for the crane
    const BF = (A.b.compositeMaterial.uniforms.bloomFactors as { value: number[] }).value, bk = end ? 0 : tw(t, 1.9, .4, 'sineInOut') * (1 - tw(t, 3.3, 1.2, 'sineInOut'));
    for (let i = 0; i < 5; i++) BF[i] = BLOOMF[i] + (BLOOMT[i] - BLOOMF[i]) * bk;   // tight mips while the snow rim burns (no wide halo on night), the hero's after
    const bg = ctx.sceneA.background as Color;
    if (end) { A.b.strength = P.bloom; A.b.threshold = 0.62; A.b.radius = 0.22; bg.copy(ctx.sceneA.fog!.color); }   // exactly the hero's pass
    // bloom (critique1 C12): the hero's 0.62 threshold throughout, so only the HDR print band and snow rim bloom and the lines stay thin
    // on the night field. Strength and radius start lower than the hero's and ease to it (igloo eases 1.5 to 1 from 2.5 s; on night
    // igloo's ratio blows the band into a blob), so the printed cap reads as a shape with a short glow
    else { A.b.strength = P.bloom * (v.bloomK = tw(t, 2.5, 2, 'sineInOut', 0.7, 1)); A.b.threshold = 0.62; A.b.radius = v.rad = tw(t, 2.1, 1.2, 'sineInOut', 0, .22); bg.copy(FLATC); }
    HT.classList.toggle('intro', on && t < 5);
    uiEval(t, on);
  }
  // the UI (igloo's MSDF text, re-created in the DOM): per line, glyph alpha is a left-to-right wipe with a 10% edge (0.4 s sine.out)
  // and each glyph shows a substitute that steps back 5, 4, 3, 2, 1 to the real one (0.75 s sine.out). Layout never moves: each glyph
  // keeps its measured width. The real text is restored when the line is written.
  function splitLine(ln: Line) {
    if (ln.units) return;
    const units: Unit[] = [], r = document.createRange(); ln.orig = ln.els.map((e) => e.textContent ?? '');
    ln.els.forEach((el, n) => {
      const txt = ln.orig![n], node = el.firstChild, w: number[] = [];
      if (node && node.nodeType === 3) for (let i = 0; i < txt.length; i++) { r.setStart(node, i); r.setEnd(node, i + 1); w.push(r.getBoundingClientRect().width); }
      el.textContent = '';
      [...txt].forEach((ch, i) => { if (ch === ' ') { el.append(' '); return; }
        const s = document.createElement('span'); s.className = 'gl'; s.textContent = ch; if (w[i]) s.style.width = w[i] + 'px'; s.style.opacity = '0'; el.append(s);
        units.push({ s, ch, el, i, x: 0 }); });
    });
    const cx = units.map((u) => { const b = u.s.getBoundingClientRect(); return b.left + b.width / 2; }), lo = Math.min(...cx), hi = Math.max(...cx);
    units.forEach((u, i) => { u.x = hi > lo ? (cx[i] - lo) / (hi - lo) : 0; });
    ln.units = units; if (ln.count && UIQ.cnt) UIQ.cnt.dataset.hold = '1';   // the countdown script leaves the digits to us while they are written
  }
  function unsplitLine(ln: Line) {
    if (!ln.units) return;
    ln.els.forEach((el, n) => { el.textContent = cdNow(el) || ln.orig![n]; });
    ln.units = null; if (ln.count && UIQ.cnt) delete UIQ.cnt.dataset.hold;
  }
  function drawLine(ln: Line, t: number) {
    const p1 = EZ.sineOut(clamp01((t - ln.start) / 0.4)), p2 = EZ.sineOut(clamp01((t - ln.start) / 0.75));
    for (const u of ln.units!) {
      const k = Math.floor((1 - clamp01(2 * p2 - u.x)) * 5.753) % 8, real = (cdNow(u.el) || '')[u.i] || u.ch, g = k ? glyphSub(real, k) : real;
      const a = clamp01((1.1 * p1 - u.x) / 0.1).toFixed(3);
      if (u.g !== g) u.s.textContent = u.g = g;
      if (u.a !== a) u.s.style.opacity = u.a = a;
    }
  }
  function uiEval(t: number, on: boolean) {
    HT.classList.toggle('uh1', on && t < 5.25); HT.classList.toggle('uh2', on && t < 4.5); HT.classList.toggle('uh3', on && t < 4.5); HT.classList.toggle('uh4', on && t < 6.37);
    if (!IN.lines) IN.lines = [{ els: UIQ.eb ? [UIQ.eb] : [], start: 5.5, units: null }, { els: UIQ.cnt ? [...UIQ.cnt.querySelectorAll<HTMLElement>('.n,.l')] : [], start: 5.63, count: 1, units: null }];
    for (const ln of IN.lines) { if (on && t >= 4.5 && t < ln.start + 0.75) { splitLine(ln); drawLine(ln, t); } else unsplitLine(ln); }
  }
  // one-off beats, only while the clock runs (igloo's webgl_show_ui_intro at 4.5, logo at 5.25, scroll at 5.0)
  const logoIntro = (delay: number) => { const w = window; if (w.__skreedLogo) w.__skreedLogo.intro(delay); else (w.__skreedLogoQ ||= []).push(['intro', delay]); };
  function introEvents(t: number) {
    const e = IN.ev;
    if (t >= 5 && !e.s) { e.s = 1; removeEventListener('touchmove', noTouch); }
    if (t >= 5.25 && !e.l) { e.l = 1; logoIntro(0); }
  }
  function introEnd() { IN.phase = 'done'; IN.t = IEND; IN.paused = false; if (X) evalTL(IEND); removeEventListener('touchmove', noTouch); if (IN.go && IN.lt === null) IN.lt = -1e9; if (IN.rsz) { IN.rsz = false; self.onResize?.(); } }
  // GPU fences (critique1 C8): each armed frame under the loader carries one and the next armed frame waits for it, so no backlog of
  // full-size frames builds up behind the loader (SwiftShader and some drivers give no backpressure). A fence that has not signalled
  // after 2 s is dropped, so a slow or odd driver can never hold the lift.
  function fenceDone(now: number) {
    if (!IN.sync) return true;
    const gl = X!.renderer.getContext() as WebGL2RenderingContext, r = gl.clientWaitSync(IN.sync, 0, 0);
    if (r !== gl.ALREADY_SIGNALED && r !== gl.CONDITION_SATISFIED && now - IN.syncAt < 2000) return false;
    gl.deleteSync(IN.sync); IN.sync = null; return true;
  }
  // readiness: after the textures are up, three steady frame intervals (1.5 s cap), then the fence of the next full-size frame:
  // 'frame1' when it is issued, 'frame2' when it has signalled. Then the loader may lift.
  function readiness(now: number, texOk: number) {
    if (IN.ready || texOk < 2) return;
    if (IN.fin) { if (!IN.sync) { IN.ready = true; X!.bridge.report('frame2'); X!.sky.onFrame2(); if (!LD()) window.__introDone?.(); } return; }
    if (!IN.a0) IN.a0 = now; else IN.iv.push(now - IN.last); IN.last = now;
    const iv = IN.iv.slice(-3), med = [...IN.iv].sort((a, b) => a - b)[IN.iv.length >> 1] || 0;
    if ((iv.length === 3 && iv.every((x) => x <= Math.max(1.5 * med, 25))) || now - IN.a0 > 1500) IN.pend = true;
  }

  const imat = (u: Record<string, { value: unknown }>, vs: string, fs: string, uTime: { value: number }) => new ShaderMaterial({ uniforms: { uCol: ILINE, uTime, ...u }, vertexShader: vs, fragmentShader: IGL + fs,
    transparent: true, depthTest: false, depthWrite: false, fog: false,
    blending: CustomBlending, blendSrc: OneFactor, blendDst: OneFactor, blendSrcAlpha: OneFactor, blendDstAlpha: OneFactor });

  const hooks: IntroHooks = {
    state: () => ({ phase: IN.phase, t: +IN.t.toFixed(4), paused: IN.paused, ready: IN.ready, ...Object.fromEntries(Object.entries(IN.v).map(([k, x]) => [k, +x.toFixed(4)])),
      cam: X ? X.camA.position.toArray().map((x) => +x.toFixed(3)) : [], html: HT.className, cubes: CG?.n, segs: CG ? CG.idx.length / 2 : 0, nums: CG?.dd.length, outSegs: outline ? outline.geometry.attributes.position.count / 2 : 0 }),
    seek(x, t0) { if (t0 !== undefined) IN.t0 = t0; IN.paused = true; IN.go = true;
      if (x >= IEND) introEnd(); else { IN.phase = 'run'; IN.t = x; IN.paused = true; evalTL(x); } return IN.t0 + x; },
    play() { IN.paused = false; },
    replay() { if (SKIP) return; scrollTo(0, 0); IN.ev = {}; IN.t = 0; IN.t0 = 0; IN.paused = false; IN.fresh = true; IN.phase = 'run'; IN.go = true; addEventListener('touchmove', noTouch, { passive: false }); },
    skip: () => introEnd(),
  };

  const self: IntroDirector = {
    milestones: ['intro'],
    rendererOptions: { antialias: false, depth: false, stencil: false },   // only the full-screen composite draws to the canvas, so it needs no MSAA, depth or stencil (igloo runs the same way)
    slots: {
      logo: { fragPars: LOGO_FRAG_PARS, fragOut: LOGO_FRAG_OUT },
      sky: { fragPars: SKY_FRAG_PARS, fragOut: SKY_FRAG_OUT },
      composite: { full: COMPOSITE_FRAG_V11 },
      ground: [floorIntro(false)], stones: [floorIntro(true)],
    },
    logoUniforms,
    get done() { return IN.phase === 'done'; },
    get paused() { return IN.paused; },
    onResize: null,
    hooks: o.hooks ? hooks : undefined,
    async install(ctx) {
      X = ctx; const { renderer, U, life } = ctx;
      IO.set(0, ctx.groundAt(0, 0), 0);   // the shockwave origin: the floor under the mark
      FLU.uO.value.copy(IO);
      UIQ.eb = document.querySelector<HTMLElement>('#heroCopy .eyebrow'); UIQ.cnt = document.getElementById('count');
      { // textures: a 32 px mosaic for the stair-stepped disc edge, and a periodic jittered triangle tiling baked on the GPU
        // smooth value noise (two periodic octaves, quantised to 32 cells), so the disc edge is a coherent jagged blob, not scattered squares
        const vn = (n: number) => { const T = Array.from({ length: n * n }, irnd), S = (q: number) => q * q * (3 - 2 * q), g = (a: number, b: number) => T[(b % n) * n + a % n];
          return (x: number, y: number) => { const fx = x * n / 32, fy = y * n / 32, i = fx | 0, j = fy | 0, u = S(fx - i), w = S(fy - j), a = g(i, j) + (g(i + 1, j) - g(i, j)) * u;
            return a + (g(i, j + 1) + (g(i + 1, j + 1) - g(i, j + 1)) * u - a) * w; }; };
        const n1 = vn(4), n2 = vn(8), mv = Array.from({ length: 1024 }, (_, k) => n1(k & 31, k >> 5) + 0.25 * n2(k & 31, k >> 5)), lo = Math.min(...mv), hi = Math.max(...mv);
        mosaic = new DataTexture(Uint8Array.from(mv, (x) => (x - lo) / (hi - lo) * 255), 32, 32, RedFormat);
        mosaic.magFilter = mosaic.minFilter = NearestFilter; mosaic.wrapS = mosaic.wrapT = RepeatWrapping; mosaic.needsUpdate = true; FLU.tMosaic.value = mosaic;
        const rt = new WebGLRenderTarget(512, 512, { format: RedFormat, wrapS: RepeatWrapping, wrapT: RepeatWrapping, generateMipmaps: true, minFilter: LinearMipmapLinearFilter, depthBuffer: false });
        const q = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: TRI_VERT, fragmentShader: TRI_FRAG }));
        const sc = new Scene(); sc.add(q); renderer.setRenderTarget(rt); renderer.render(sc, new OrthographicCamera(-1, 1, 1, -1, 0, 1)); renderer.setRenderTarget(null);
        q.geometry.dispose(); q.material.dispose(); tTri.value = rt.texture;
        life.onKill(() => { rt.dispose(); mosaic.dispose(); });
      }
      CG = genCage();
      const cageGeo = new BufferGeometry();
      cageGeo.setAttribute('position', new Float32BufferAttribute(CG.pos, 3)); cageGeo.setAttribute('aC', new Float32BufferAttribute(CG.cen, 3));
      cageGeo.setAttribute('aPh', new Float32BufferAttribute(CG.ph, 1)); cageGeo.setIndex(CG.idx);
      const outGeo = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(genOutline(ctx), 3));
      // the number atlas: 32 cells of 32 px, blank, +, +, twenty values climbing 00 to 99 (our own seeded steps), +, +, in Open Sans 400
      await fontsP; life.check();
      const numCv = document.createElement('canvas'); numCv.width = 32; numCv.height = 1024;
      {
        const c = numCv.getContext('2d')!, st: number[] = []; let acc = 0;
        for (let i = 0; i < 19; i++) st.push(acc += 3 + Math.floor(irnd() * 6));
        const vals = [0, ...st.map((v) => Math.round(v * 99 / acc))];
        c.fillStyle = '#000'; c.fillRect(0, 0, 32, 1024); c.fillStyle = '#fff'; c.font = '400 24px "Open Sans", Arial, sans-serif';
        for (let k = 8; k < 32; k++) { const plus = k < 10 || k > 29; c.textAlign = plus ? 'center' : 'left'; c.fillText(plus ? '+' : String(vals[k - 10]).padStart(2, '0'), plus ? 16 : 2, 32 * k + 25); }
      }
      numTex = new CanvasTexture(numCv); NU.tNum.value = numTex;
      // one material shape for the three wire layers: additive, no depth, 1-device-pixel GL lines or 8 px sprites. Alpha 1 where lit,
      // so the bloom save/restore pass blooms them over the mark's black faces too (critique0 C9).
      cage = new LineSegments(cageGeo, imat(CU, CAGE_VERT, CAGE_FRAG, U.uTime));
      outline = new LineSegments(outGeo, imat(OU, OUTLINE_VERT, OUTLINE_FRAG, U.uTime));
      const numGeo = new BufferGeometry();
      numGeo.setAttribute('position', new Float32BufferAttribute(CG.pts, 3)); numGeo.setAttribute('aD', new Float32BufferAttribute(CG.dd, 1));
      // counting sprites: one glyph per 1/48 of progress, delayed one cell per unit of distance from the origin, so a counting wave
      // runs about 9 units behind the light front
      nums = new Points(numGeo, imat(NU, NUMS_VERT, NUMS_FRAG, U.uTime));
      cage.renderOrder = outline.renderOrder = 999; nums.renderOrder = 1000;
      for (const m of [cage, outline, nums]) { m.frustumCulled = false; ctx.sceneA.add(m); }
      life.onKill(() => { for (const m of [cage, outline, nums]) { m.geometry.dispose(); (m.material as ShaderMaterial).dispose(); } numTex.dispose(); });
      // the floor fades in: alpha is 1 at rest (critique1 C6); both below the logo, so no program switch at the end
      for (const m of [ctx.groundMesh, ctx.stonesMesh]) { const mat = m.material as Material; mat.transparent = true; mat.forceSinglePass = true; m.renderOrder = -1; }
      // the sky: the flat start field, then the sky (below the horizon with the snow)
      SKU = ctx.sky.dome.material.uniforms as Record<string, { value: unknown }>;
      Object.assign(SKU, { uFlat: { value: FLATC }, uSkyP: { value: 1 }, uSkyB: { value: 1 } });
      life.onKill(() => { removeEventListener('touchmove', noTouch); HT.classList.remove('intro', 'uh1', 'uh2', 'uh3', 'uh4'); });
    },
    warm(ctx) {
      CU.uA.value = 0.4; CU.uP.value = OU.uP.value = NU.uP.value = logoUniforms.uPrint.value = 0.5; OU.uA.value = 1;
      FLU.uU.value = FLU.uU2.value = FLU.uFarA.value = ctx.FOG.uOpacity.value = ctx.composite.C.uIntro.value = 0.5; FLU.uFloorA.value = 1;
      (SKU!.uSkyP as { value: number }).value = (SKU!.uSkyB as { value: number }).value = 0.5;
      for (const x of [mosaic, numTex]) ctx.renderer.initTexture(x);
    },
    arm() { if (SKIP || posterNow()) introEnd(); else evalTL(0); },   // the armed frames: real full-size frames of t = 0 under the loader
    start(t) {
      if (IN.go) return; IN.go = true;
      if (IN.phase !== 'armed' || posterNow()) { if (IN.phase !== 'done') introEnd(); IN.lt = t; logoIntro(0.25); return; }   // skipped: the life eases in from the lift, as v9.9
      IN.phase = 'run'; IN.t = 0; IN.t0 = t; IN.fresh = true; IN.ev = {};
    },
    frame(f, ctx): IntroFrame {
      const { t, dt, raw, frozen, now } = f;
      // the intro clock: a hitch over 0.5 s advances 1/30 s (igloo's GSAP lag smoothing), shorter ones at most 1/12 s, so a stall slows
      // the shot rather than skipping part of it (a deliberate difference from igloo, which advances up to 0.5 s)
      if (IN.phase === 'armed' && posterNow()) introEnd();
      if (IN.phase === 'run') try {
        if (!frozen) { if (IN.fresh) IN.fresh = false; else IN.t += raw > 0.5 ? 1 / 30 : dt; introEvents(IN.t); }
        if (IN.t >= IEND) introEnd(); else evalTL(IN.t);
      } catch (e) { console.warn('intro', e); introEnd(); }   // a failing intro frame ends the shot: never a locked page or hidden UI
      const hold = !fenceDone(now) && IN.phase === 'armed';   // armed: the previous frame's fence is still pending, skip this render
      ILINE.value.copy(PEARL).multiplyScalar(INTRO_LINES * DPR / 1.15);   // 1-device-pixel lines: brighter when they are thinner (critique0 C13)
      readiness(now, f.texOk);
      // igloo's touchAmount during the shot; on a skipped intro (reduced motion, ?intro=0, a deep link, the poster) 0 under the loader,
      // then eased in over 2 s from the lift exactly as v9.9 does, so no push or touch sweep has started before the page is seen
      const live = IN.phase !== 'done' ? IN.touch : IN.lt === null ? 0 : reduce ? 1 : 1 - (1 - clamp01((t - IN.lt) / 2)) ** 3;
      void ctx;
      return { live, breath: IN.phase === 'done' ? 1 : IN.breath, crane: IN.w < 1 ? { w: IN.w, pos: IP0, tgt: IT0 } : null, hold };
    },
    afterRender(now, ctx) {
      if ((IN.phase === 'armed' || IN.pend) && !IN.sync) { const gl = ctx.renderer.getContext() as WebGL2RenderingContext; IN.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); IN.syncAt = now;
        if (IN.pend) { IN.pend = false; IN.fin = true; ctx.bridge.report('frame1'); } }
    },
    resize(w, h, dpr, touch) {
      // during the shot a small width change (a classic scrollbar arriving when the lock lifts at 5 s, up to 24 px) or a phone's URL bar
      // (height only, up to 160 px) moves only the camera; the render targets keep their size until the intro is over (critique1 C13)
      if (IN.phase !== 'done' && IN.ready && lastW && ((Math.abs(w - lastW) <= 24 && h === lastH) || (touch && w === lastW && Math.abs(h - lastH) <= 160))) {
        NU.uSize.value = h * dpr / 100; IN.rsz = true; return true;
      }
      lastW = w; lastH = h; IN.rsz = false; NU.uSize.value = h * dpr / 100; return false;
    },
    skip(reason) { if (reason === 'poster') { introEnd(); HT.classList.remove('intro', 'uh1', 'uh2', 'uh3', 'uh4'); } },
  };
  return self;
}
