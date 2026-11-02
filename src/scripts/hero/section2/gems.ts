// Section 2: the ten gems (Gem C, Sam 2026-10-10; prototype v11.4 template.html "Section 2: the ten gems", built from the
// approved gem page prototypes/section-2; docs/specs/section-2.md). Its own scene and camera render into its own targets;
// the hero's composite wipes to it and keeps the logo over it (loop.ts, F14). The blocks leave the logo one at a time:
// block j lifts off at CAS0 + j GAP screens and lands FLY screens later on a long bowed curve with a slow lift and a long
// settle (ease 0.42, 0, 0.12, 1); the logo itself never flies up, it recedes with the hero camera's curve.
// The ten links are the family pages' contract (docs/specs/family-page.md 2.2, src/scripts/family/rock-links.ts): nav#families
// (FamilyLinks.astro, mounted by index.astro) holds one real link per family in catalog order; this island places each
// link's box over its gem (placeLinkBoxes), the canvas click rule opens the page (installRockNav), and a link's focus
// brings section 2 to rest and makes its gem the active one.
import { ACESFilmicToneMapping, Color, Euler, Group, Matrix4, Mesh, MeshStandardMaterial, NoToneMapping, PerspectiveCamera, Quaternion, Raycaster, Scene, Vector2, Vector3 as V3, BufferGeometry, Float32BufferAttribute, LineSegments, ShaderMaterial, BufferAttribute, DynamicDrawUsage, PMREMGenerator, MathUtils, type Texture, type WebGLRenderer } from 'three';
import { S2T } from '../../../config/hero.ts';
import { BLOCK_SHADES } from '../../../config/shades.gen.ts';
import { COPY } from '../../../config/copy.ts';
import keys from '../../../data/family-keys.json' with { type: 'json' };
import { clearLinkBoxes, installRockNav, placeLinkBoxes } from '../../family/rock-links.ts';
import type { Block } from '../logo/geometry.ts';
import type { LogoUniforms } from '../logo/uniforms.ts';
import { LONG, equirect, gemGeometry, rng, studioFn, type GemGeometry } from './gemGeometry.ts';
import { createBackground, createPasses, fsMesh } from './background.ts';
import { hueFrame, writeHues } from './hues.ts';
import { matC, type GemMaterial } from './gemMaterial.ts';
import { createFrost, FSCALE, type FrostSlot } from './frost.ts';
import { createLabels, type Label, type LabelStone } from './labels.ts';
import type { Section2Scene } from './types.ts';

/** the ten families in catalog order: id, name, and the hero block that holds the family's key shade (section-2.md 3) */
export const FAM_ID: readonly string[] = keys.map((k) => k.family);
export const FAM_NAME: readonly string[] = keys.map((k) => k.familyName);

interface Stone extends LabelStone {
  fam: string; shade: string; hex: string; geo: GemGeometry; mats: { B: GemMaterial }; s: number; sig: number; w: number; side: number; tumble: V3; blk: Mesh<BufferGeometry, MeshStandardMaterial>;
}
interface Plexus { st: Stone; pts: { th: number; rad: number; y0: number; w: number; vy: number }[]; links: [number, number][]; obj: LineSegments; on: boolean; t0: number }

export interface GemsOptions {
  renderer: WebGLRenderer; reduced: boolean; touch: boolean; dpr: number;
  logo: Mesh; U: LogoUniforms; blocks: Block[]; camA: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  hooks: boolean;
}

export function createGems(o: GemsOptions): Section2Scene {
  const { renderer, logo, U, blocks, camA } = o, REDUCE = o.reduced, TOUCH = o.touch, DPR = o.dpr;
  const nowMs = () => performance.now();
  const vp = { cssW: 1, cssH: 1, ASP: 1, PHONE: false, LAB_PX: 13, fpx: 1 };
  const W = () => renderer.domElement.width, H = () => renderer.domElement.height;
  const KW = [42.987, 12.423, 2.53];
  const NOISE_W = [0.1234, 0.4221, -0.1375, -0.04566, -0.1450, -0.2123];
  const BY = [1.123, 0.816, 4.134, 0.646, 2.856, 3.490], BP = [3.106, 1.580, 0.048, 6.167, 3.416, 5.394], BR = [2.470, 0.762, 5.662, 3.994, 4.968, 5.251];
  const n6 = (t: number, b: number[]) => { let s = 0; for (let i = 0; i < 6; i++) s += Math.sin(NOISE_W[i] * t + b[i]); return s / 6; };
  const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // ---- scene, camera, layout
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 400);
  const bg = createBackground();
  const bgMesh = fsMesh(bg.material); bgMesh.renderOrder = -100; scene.add(bgMesh);
  const passes = createPasses(renderer);
  const frost = createFrost(renderer, { touch: TOUCH, reduce: REDUCE });
  const labLayer = document.getElementById('s2labels') as HTMLElement | null, leaders = document.getElementById('s2leaders') as SVGSVGElement | null;
  const nav = document.getElementById('families');
  const labels = createLabels({ camera, vp, reduce: REDUCE, touch: TOUCH, layer: labLayer ?? document.createElement('div'), svg: leaders ?? document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
    names: FAM_NAME, cta: [COPY.s2.count, TOUCH ? COPY.s2.tap : COPY.s2.click] });
  function slots() {
    const out: { u: number; v: number; s: number; side: string }[] = [], { cssW, cssH, PHONE } = vp;
    if (!PHONE) {
      const p = Math.min(cssW / 5.6, 0.33 * cssH);
      for (let j = 0; j < 10; j++) { const row = j < 5 ? 0 : 1, k = j % 5;
        const x = cssW / 2 + (k - 2.25 + 0.5 * row) * p, y = cssH / 2 + (row ? 1 : -1) * 0.433 * p;
        let side = row ? 'dr' : 'ur'; if (x + 0.6 * p > cssW - 16) side = row ? 'ul' : 'dl';
        out.push({ u: x / cssW, v: y / cssH, s: 0.65 * p, side }); }
    } else {
      const p = Math.min(0.169 * cssH, (cssW - 32) / 1.446);
      for (let j = 0; j < 10; j++) { const x = cssW / 2 + (j % 2 ? 1 : -1) * 0.433 * p, y = cssH / 2 + (j - 4.5) * p / 2;
        out.push({ u: x / cssW, v: y / cssH, s: 0.58 * p, side: j % 2 ? 'l' : 'r' }); }
    }
    return out;
  }
  const pmrem = new PMREMGenerator(renderer);
  let envTex: Texture | null = null;
  const stones: Stone[] = [];

  // ---- the active stone: igloo shows its date label and the plexus on the stone in the centre band; with ten stones on one
  // screen, the stone under the pointer (or with keyboard focus) is that stone
  let active = -1, activeBy = '';
  function setActive(j: number, by: string) {
    if (j === active) { activeBy = by; return; }
    const now = nowMs();
    if (active >= 0) { const st = stones[active]; labels.setOn(st.labs.cta, false, now); plexusOff(st, now); }
    active = j; activeBy = by;
    if (j >= 0) { const st = stones[j];
      st.labs.cta.side = labels.sideFor(stones, st, st.labs.cta);
      labels.setOn(st.labs.cta, true, now); if (!vp.PHONE && !REDUCE) plexusOn(st, now); }
  }

  // ---- plexus (igloo's: 18 points on a cylinder round the stone, links to up to 3 neighbours, "+" crosses, faint grey lines dashed
  // by noise, depth-tested, growing in over 0.35 s; ours on the active stone)
  const plexMat = new ShaderMaterial({ transparent: true, depthTest: true, depthWrite: false,
    vertexShader: 'attribute float aA; attribute float aD; varying float vA; varying float vD; void main() { vA = aA; vD = aD; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`precision highp float; varying float vA; varying float vD;
    float hh(float x) { return fract(sin(x * 12.9898) * 43758.5453); }
    void main() { float dash = vD < 0.0 ? 1.0 : step(0.28, hh(floor(vD * 16.0))); gl_FragColor = vec4(vec3(0.92, 0.93, 0.96), vA * dash); }` });
  const plexi: Plexus[] = [];
  function plexusOn(st: Stone, now: number) {
    let P = plexi.find((p) => p.st === st); if (!P) {
      const r = rng(900 + st.j * 7), R = st.geo.boundingSphere!.radius, pts: Plexus['pts'] = [];
      for (let i = 0; i < 18; i++) pts.push({ th: r() * 6.283, rad: R * (0.72 + 0.18 * r()), y0: (r() * 2 - 1) * R, w: (r() < 0.5 ? -1 : 1) * 0.25 * (0.6 + 0.4 * r()), vy: (r() - 0.5) * 0.12 });
      const links: [number, number][] = [], deg = new Array(18).fill(0);
      for (let a = 0; a < 18; a++) { const pa = pts[a]; const near: [number, number][] = [];
        for (let b = 0; b < 18; b++) if (b !== a) { const pb = pts[b]; const d = Math.hypot(pa.rad * Math.cos(pa.th) - pb.rad * Math.cos(pb.th), pa.y0 - pb.y0, pa.rad * Math.sin(pa.th) - pb.rad * Math.sin(pb.th)); if (d < 1.6 * R) near.push([d, b]); }
        near.sort((x, y) => x[0] - y[0]);
        for (const [, b] of near) { if (deg[a] >= 3) break; if (deg[b] >= 3 || links.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue; links.push([a, b]); deg[a]++; deg[b]++; } }
      const nSeg = links.length + 36, g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(new Float32Array(nSeg * 6), 3).setUsage(DynamicDrawUsage));
      g.setAttribute('aA', new BufferAttribute(new Float32Array(nSeg * 2), 1).setUsage(DynamicDrawUsage));
      g.setAttribute('aD', new BufferAttribute(new Float32Array(nSeg * 2), 1).setUsage(DynamicDrawUsage));
      const obj = new LineSegments(g, plexMat); obj.frustumCulled = false; obj.renderOrder = 30; scene.add(obj);
      P = { st, pts, links, obj, on: false, t0: 0 }; plexi.push(P);
    }
    P.on = true; P.t0 = now; P.obj.visible = true;
  }
  function plexusOff(st: Stone, now: number) { const P = plexi.find((p) => p.st === st); if (P && P.on) { P.on = false; P.t0 = now; } }
  const camR = new V3(), camU = new V3();
  function updatePlexus(now: number, t: number) {
    camR.setFromMatrixColumn(camera.matrixWorld, 0); camU.setFromMatrixColumn(camera.matrixWorld, 1);
    for (const P of plexi) {
      const e = (now - P.t0) / 1000, g = P.on ? Math.min(1, e / 0.35) : Math.max(0, 1 - e / 0.25);
      if (!P.on && g <= 0) { P.obj.visible = false; continue; }
      const c = P.st.group.position, R = P.st.geo.boundingSphere!.radius, ppu = P.st.slot.s / LONG, cs = 3 / ppu;
      const Wp = P.pts.map((p) => { let y = p.y0 + p.vy * t; y = ((y + R) % (2 * R) + 2 * R) % (2 * R) - R; const th = p.th + p.w * t;
        const edge = 1 - Math.pow(Math.abs(y) / R, 4); return [c.x + p.rad * Math.cos(th), c.y + y, c.z + p.rad * Math.sin(th), edge]; });
      const pos = P.obj.geometry.attributes.position.array as Float32Array, aA = P.obj.geometry.attributes.aA.array as Float32Array, aD = P.obj.geometry.attributes.aD.array as Float32Array; let s = 0;
      const seg = (a: number[], b: number[], al: number, dash: boolean) => { pos.set(a, s * 6); pos.set(b, s * 6 + 3); aA[s * 2] = aA[s * 2 + 1] = al; if (dash) { aD[s * 2] = 0; aD[s * 2 + 1] = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); } else aD[s * 2] = aD[s * 2 + 1] = -1; s++; };
      for (const [a, b] of P.links) { const A = Wp[a], B = Wp[b]; const E = [A[0] + (B[0] - A[0]) * g, A[1] + (B[1] - A[1]) * g, A[2] + (B[2] - A[2]) * g]; seg(A.slice(0, 3), E, 0.22 * g * Math.min(A[3], B[3]), true); }
      for (const p of Wp) { const al = 0.45 * g * p[3];
        seg([p[0] - camR.x * cs, p[1] - camR.y * cs, p[2] - camR.z * cs], [p[0] + camR.x * cs, p[1] + camR.y * cs, p[2] + camR.z * cs], al, false);
        seg([p[0] - camU.x * cs, p[1] - camU.y * cs, p[2] - camU.z * cs], [p[0] + camU.x * cs, p[1] + camU.y * cs, p[2] + camU.z * cs], al, false); }
      P.obj.geometry.setDrawRange(0, s * 2);
      for (const k of ['position', 'aA', 'aD']) P.obj.geometry.attributes[k].needsUpdate = true;
    }
  }
  // the lattice repeat per stone: triangle edge 0.045 of the stone's projected width, at least 6 px
  function latticeScale(st: Stone) {
    const wPx = st.slot.s * (st.viewBB.max.x - st.viewBB.min.x) / LONG, edgePx = Math.max(0.045 * wPx, 6);
    const edgeUV = edgePx / wPx * ((st.viewBB.max.x - st.viewBB.min.x) / FSCALE); return (1 / 12) / edgeUV;
  }

  // ---- pointer: hover, parallax (igloo's camera orbit as a turn in place)
  const ray = new Raycaster(), ndc = new Vector2();
  const par = { x: 0, y: 0, tx: 0, ty: 0, touch: false };
  let hoverSt: Stone | null = null;
  function pick(cx: number, cy: number) {
    ndc.set((cx / vp.cssW) * 2 - 1, -(cy / vp.cssH) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(stones.filter((s) => s.L >= 1 && s.group.visible).map((s) => s.mesh), false); if (!hits.length) return null;
    const st = stones.find((s) => s.mesh === hits[0].object)!; return { st, point: hits[0].point };
  }
  function onMove(e: PointerEvent) {
    if (!ready || !live || w2 > 0.3) { if (hoverSt) { hoverSt = null; if (activeBy === 'pointer') setActive(-1, ''); } return; }
    const now = nowMs(), touch = e.pointerType === 'touch';
    par.touch = touch; if (!touch || e.buttons) { par.tx = Math.max(-1, Math.min(1, (e.clientX / vp.cssW) * 2 - 1)); par.ty = Math.max(-1, Math.min(1, (e.clientY / vp.cssH) * 2 - 1)); }
    if (touch && !e.buttons) return;
    const h = pick(e.clientX, e.clientY);
    if (hoverSt && (!h || h.st !== hoverSt)) { const P = frost.pool.find((p) => p.st === hoverSt); if (P) { P.over = false; P.vel = 0; P.target = 0; P.lastMove = now; } }
    if (h) { const P = frost.slotFor(h.st, now), uv = frost.chartUV(h.st, h.point);
      if (!P.over) { P.over = true; P.vel = 0; P.target = 0; P.prevStep = null; P.hitT = now; }
      P.cur = uv; P.lastMove = now; P.last = now; }
    if ((h ? h.st : null) !== hoverSt) { hoverSt = h ? h.st : null; o.canvas.classList.toggle('over-gem', !!hoverSt);
      if (!touch) { if (hoverSt) setActive(stones.indexOf(hoverSt), 'pointer'); else if (activeBy === 'pointer') setActive(-1, ''); } }
  }
  function onDown(e: PointerEvent) {
    if (!ready || !live) return;
    const now = nowMs();
    if (e.pointerType === 'touch') { const h = pick(e.clientX, e.clientY);
      if (h) { const P: FrostSlot = frost.slotFor(h.st, now); P.cur = frost.chartUV(h.st, h.point); P.prevStep = P.cur.clone(); P.force = now + 350; P.last = now; P.lastMove = now; P.hitT = now; } }
  }
  const lift = (e: PointerEvent) => { if (e.pointerType === 'touch') { par.tx = 0; par.ty = 0; if (hoverSt) { const P = frost.pool.find((p) => p.st === hoverSt); if (P) { P.over = false; P.lastMove = nowMs(); } hoverSt = null; } } };
  const out = (e: PointerEvent) => { if (!e.relatedTarget) { par.tx = 0; par.ty = 0; } };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onDown, { passive: true });
  addEventListener('pointerup', lift, { passive: true }); addEventListener('pointercancel', lift, { passive: true });
  addEventListener('pointerout', out);
  const qPar = new Quaternion(), ePar = new Euler(0, 0, 0, 'YXZ');
  function updateParallax(dt: number) {
    if (REDUCE) { qPar.identity(); return; }
    const k = 1 - Math.pow(1 - 0.035 * (par.touch ? 0.5 : 1), dt * 60);
    par.x += (par.tx - par.x) * k; par.y += (par.ty - par.y) * k;
    ePar.set(par.y * 0.0768, -par.x * 0.1536, 0, 'YXZ'); qPar.setFromEuler(ePar);       // igloo: 4.4 deg pitch, 8.8 deg yaw at full deflection
  }

  // ---- the flights and the hand-over
  const CAS0 = S2T.CAS0, GAP = S2T.GAP, FLY = S2T.FLY;
  const bez = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {          // cubic-bezier easing, solved for t by Newton steps
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x; for (let i = 0; i < 8; i++) { const a = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
      const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t; if (Math.abs(d) < 1e-6) break; t = Math.min(1, Math.max(0, t - a / d)); }
    return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3; };
  const flightEase = bez(0.42, 0, 0.12, 1);
  const Lof = (S: number, j: number) => Math.max(0, Math.min(1, (S - (CAS0 + j * GAP)) / FLY));
  let S = 0;
  // the flying copy of each hero block: the same triangles as the hero's block (taken from the logo geometry), matte black,
  // its family's shade rising in its edges as it nears the change
  function blockGeometryFromLogo(i: number) {
    const g = logo.geometry, P = g.attributes.position.array, ID = g.attributes.aId.array, CEN = g.attributes.aCentroid.array, AH = g.attributes.aH.array;
    const relief = U.uRelief.value, out: number[] = [];
    for (let v = 0; v < ID.length; v++) if (Math.round(ID[v]) === i)
      out.push((P[v * 3] - CEN[v * 3]) * 0.992, (P[v * 3 + 1] - CEN[v * 3 + 1]) * 0.992, (P[v * 3 + 2] + AH[v] * relief - CEN[v * 3 + 2]) * 0.992);
    const bgeo = new BufferGeometry(); bgeo.setAttribute('position', new Float32BufferAttribute(out, 3)); bgeo.computeVertexNormals(); return bgeo;
  }
  const blockOf: number[] = [];          // family j -> hero block index
  const _m = new Matrix4(), _m2 = new Matrix4(), _p = new V3();
  function startPose(j: number, outP: V3, outQ: Quaternion, outS: V3) {
    const b = blocks[blockOf[j]];
    _m.makeTranslation(b.c.x, b.c.y, 0).premultiply(logo.matrixWorld);                    // the block's centre in the logo, at rest
    _m2.multiplyMatrices(camA.matrixWorldInverse, _m).premultiply(camera.matrixWorld);       // same view-space pose under our camera
    _m2.decompose(outP, outQ, outS);
  }
  const cubic = (a: V3, b: V3, c: V3, d: V3, t: number, out: V3) => { const u = 1 - t; return out.set(
    u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    u * u * u * a.z + 3 * u * u * t * b.z + 3 * u * t * t * c.z + t * t * t * d.z); };
  const P0 = new V3(), P1 = new V3(), P2 = new V3(), Q0 = new Quaternion(), S0 = new V3(), tmpE = new Euler(), tmpQ2 = new Quaternion();
  function flyPose(st: Stone, t: number) {
    const L = st.L, e = flightEase(L);
    startPose(st.j, P0, Q0, S0);
    const p1 = st.base, D = P0.distanceTo(p1), side = st.side;
    const dir = _p.subVectors(p1, P0).normalize(), perp = new V3().crossVectors(dir, new V3(0, 0, 1)).normalize();
    P1.copy(P0).addScaledVector(dir, 0.18 * D).addScaledVector(perp, side * 0.38 * D).add(new V3(0, 0.12 * D, 0.30 * D));   // lift, swing out to one side
    P2.copy(p1).add(new V3(0, 0.30 * D, 0.28 * D)).addScaledVector(perp, -side * 0.12 * D);                                  // come in from above and in front
    const pos = cubic(P0, P1, P2, p1, e, new V3());
    // the block: tumbles as it goes, its edges warming to its shade, then folds into a point of light
    const spin = 4 * e * (1 - e);
    tmpE.set(st.tumble.x * spin, st.tumble.y * spin + st.tumble.y * 0.6 * e, st.tumble.z * spin);
    const qb = Q0.clone().multiply(tmpQ2.setFromEuler(tmpE));
    const bs = (1 - sm(0.42, 0.62, L)) * S0.x;
    st.blk.visible = bs > 1e-4 && !REDUCE; st.blk.position.copy(pos); st.blk.quaternion.copy(qb); st.blk.scale.setScalar(Math.max(1e-4, bs));
    st.blk.material.emissiveIntensity = 0.7 * sm(0.18, 0.55, L) * (1 - sm(0.55, 0.62, L));   // a warm-up, never a flat sticker
    // the gem: grows out of that light and turns into its resting pose as it settles
    const gs = sm(0.50, 0.78, L);
    st.group.visible = gs > 1e-4; st.group.scale.setScalar(Math.max(1e-4, gs));
    const a = REDUCE ? 0 : 0.1 * sm(0.85, 1, L);
    const wob = new Euler(a * st.sig * Math.sin(st.w * t + KW[0] * st.s), a * st.sig * Math.sin(st.w * t + KW[1] * st.s), a * st.sig * Math.sin(st.w * t + KW[2] * st.s));
    const qRest = qPar.clone().multiply(new Quaternion().setFromEuler(wob)).multiply(st.rest);
    st.group.quaternion.copy(qb).slerp(qRest, sm(0.45, 1, e));
    st.group.position.copy(pos); st.group.updateMatrixWorld(true);
    st.mats.B.userData.U.uCore.value = 1.5 * sm(0.5, 0.85, L);
  }
  function placeStone(st: Stone, t: number) {
    if (REDUCE) {                                   // reduced motion: no flight; the block goes and the gem is at its slot
      const on = st.L >= 0.5; st.blk.visible = false; st.group.visible = on; st.group.scale.setScalar(1);
      st.group.quaternion.copy(st.rest); st.group.position.copy(st.base); st.group.updateMatrixWorld(true); st.mats.B.userData.U.uCore.value = 1.5; return;
    }
    if (st.L <= 0) { st.blk.visible = false; st.group.visible = false; return; }
    if (st.L < 1) { flyPose(st, t); return; }
    st.blk.visible = false; st.group.visible = true; st.group.scale.setScalar(1); st.mats.B.userData.U.uCore.value = 1.5;
    const a = 0.1;
    const e = new Euler(a * st.sig * Math.sin(st.w * t + KW[0] * st.s), a * st.sig * Math.sin(st.w * t + KW[1] * st.s), a * st.sig * Math.sin(st.w * t + KW[2] * st.s));
    st.group.quaternion.copy(qPar).multiply(new Quaternion().setFromEuler(e)).multiply(st.rest);
    st.group.position.copy(st.base); st.group.updateMatrixWorld(true);
  }
  function poseAll(t: number) {
    const sh = REDUCE ? 0 : 0.0129;
    camera.position.set(0, 0, 0); camera.up.set(0, 1, 0);
    camera.quaternion.setFromEuler(new Euler(sh * n6(t, BP), sh * n6(t, BY), sh * n6(t, BR), 'YXZ')); camera.updateMatrixWorld();
    for (const st of stones) placeStone(st, t);
  }

  // ---- build (after the intro; one stone per frame)
  let ready = false, failed = false, started = false, live = 0, w2 = 0, t2 = 0;
  let offRock: (() => void) | null = null;
  function placeBases() {
    const SL = slots(), th = Math.tan(MathUtils.degToRad(15));
    stones.forEach((st, q) => { const sl = SL[q], d = LONG * vp.fpx / sl.s; st.slot = sl;
      st.base = new V3((2 * sl.u - 1) * d * th * vp.ASP / camera.zoom, (1 - 2 * sl.v) * d * th / camera.zoom, -d); });
  }
  async function build() {
    started = true;
    try {
      envTex = pmrem.fromEquirectangular(equirect(1024, 512, studioFn)).texture;
      FAM_ID.forEach((id, j) => { blockOf[j] = BLOCK_SHADES.findIndex((s) => s.id.startsWith(id + '-')); });
      const frostRefs = { blackTex: frost.blackTex, latTex: frost.latTex, FSCALE };
      for (let j = 0; j < 10; j++) {
        const hex = BLOCK_SHADES[blockOf[j]].hex, shade = BLOCK_SHADES[blockOf[j]].name;
        const geo = gemGeometry(201 + j * 23);
        const group = new Group(); scene.add(group);
        const mesh = new Mesh(geo); group.add(mesh);
        const r = rng(500 + j * 11);
        const rest = new Quaternion().setFromEuler(new Euler((r() - 0.5) * 0.7, r() * Math.PI * 2, (r() - 0.5) * 0.6));
        const s = r(), sig = s >= 0.5 ? 1 : -1, w = 0.3 * (1 + 0.1 * (2 * r() - 1));
        const rr = rng(700 + j * 13); const side = rr() < 0.5 ? -1 : 1;
        const tumble = new V3((rr() < 0.5 ? -1 : 1) * 2.5, (rr() < 0.5 ? -1 : 1) * 3.0, (rr() < 0.5 ? -1 : 1) * 1.2);
        const blk = new Mesh(blockGeometryFromLogo(blockOf[j]), new MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.42, metalness: 0, envMap: envTex, envMapIntensity: 0.55,
          emissive: new Color(hex), emissiveIntensity: 0 }));
        blk.visible = false; scene.add(blk);
        const mats = { B: matC(hex, geo.userData.planes, envTex, frostRefs) }; mesh.material = mats.B;
        const st = { j, fam: FAM_NAME[j], shade, hex, group, mesh, geo, mats, L: 0, rest, s, sig, w, side, tumble, blk } as unknown as Stone;
        group.visible = false; stones.push(st);
        await new Promise((res) => setTimeout(res, 0));
      }
      passes.makeTargets(W(), H()); placeBases(); labels.build(stones); layoutFinal();
      for (const st of stones) { const U2 = st.mats.B.userData.U; U2.uRest.value.setFromMatrix4(new Matrix4().makeRotationFromQuaternion(st.rest)); U2.uLatN.value = latticeScale(st); }
      // the family links (family-page.md 2.2): the canvas click rule and the keyboard's way in
      if (nav) offRock = installRockNav({ canvas: o.canvas, nav, pick: (x, y) => { const h = pick(x, y); return h ? h.st.j : null; }, active: () => ready && live > 0 && w2 < 0.3,
        onFocusGem: (j) => { if (api.snapTo) api.snapTo(S2T.LAND); setActive(j, 'focus'); }, setCursor: (on) => o.canvas.classList.toggle('over-gem', on) });
      // first draw of every program off screen, so the first flight costs no compile
      for (const st of stones) { st.group.visible = true; st.blk.visible = true; }
      const pc = renderer.getClearColor(new Color()), pa = renderer.getClearAlpha();
      await renderer.compileAsync(scene, camera);
      renderS2(); renderer.setClearColor(pc, pa);
      for (const st of stones) { st.group.visible = false; st.blk.visible = false; }
      ready = true;
    } catch (e) { failed = true; console.warn('section 2', e); }
  }
  function resize(w: number, h: number) {
    vp.cssW = w; vp.cssH = h; vp.ASP = w / h; vp.PHONE = vp.ASP < 0.9; vp.LAB_PX = vp.PHONE ? 12 : 13;
    camera.aspect = vp.ASP; camera.zoom = Math.min(1, 1.25 * vp.ASP); camera.updateProjectionMatrix();
    vp.fpx = (vp.cssH / 2) / Math.tan(MathUtils.degToRad(15)) * camera.zoom;
    if (!ready) return;
    passes.makeTargets(W(), H()); placeBases();
    labels.measure(stones);
    for (const st of stones) st.mats.B.userData.U.uLatN.value = latticeScale(st);
    layoutFinal();
  }
  // title sides are chosen once, from every gem at its final resting pose (never re-chosen mid-flight, so nothing jumps)
  function layoutFinal() {
    const saved = stones.map((s) => [s.group.position.clone(), s.group.quaternion.clone(), s.group.scale.clone(), s.group.visible] as const);
    for (const st of stones) { st.group.position.copy(st.base); st.group.quaternion.copy(st.rest); st.group.scale.setScalar(1); st.group.visible = true; st.group.updateMatrixWorld(true); }
    const cq = camera.quaternion.clone(); camera.position.set(0, 0, 0); camera.quaternion.identity(); camera.updateMatrixWorld();
    labels.layoutTitles(stones);
    camera.quaternion.copy(cq); camera.updateMatrixWorld();
    stones.forEach((s, q) => { s.group.position.copy(saved[q][0]); s.group.quaternion.copy(saved[q][1]); s.group.scale.copy(saved[q][2]); s.group.visible = saved[q][3]; s.group.updateMatrixWorld(true); });
  }

  // ---- per frame: called by the hero's loop (tp1: the first wipe, hero to section 2; tp2: the second, section 2 to the Wall)
  function update(Sv: number, tp1: number, tp2: number, t: number, dt: number) {
    S = Sv; t2 = t;
    const now = nowMs();
    live = tp1 > 0 && tp2 < 1 ? 1 : 0; w2 = tp2;
    if (!ready) return;
    for (const st of stones) st.L = Lof(S, st.j);
    updateParallax(dt); poseAll(t);
    const show = tp1 > 0.5 && tp2 < 0.25;
    for (const st of stones) { const landed = st.L >= (REDUCE ? 0.6 : 0.92);
      labels.setOn(st.labs.title, show && landed, now); }
    if (labLayer) labLayer.style.visibility = live ? 'visible' : 'hidden';
    const linksOn = tp1 >= 1 && tp2 < 0.3;
    for (const st of stones) { const on = linksOn && st.L >= 1; if (!on && active === stones.indexOf(st)) setActive(-1, ''); }
    if (!linksOn && active >= 0) setActive(-1, '');
    frost.step(now, dt); labels.update(stones, now, bg.uniforms, DPR);
    if (nav) placeLinkBoxes(nav, stones.map((st) => { if (!(linksOn && st.L >= 1)) return null; const b = labels.gemBox(st); return { x: b[0], y: b[1], w: b[2] - b[0], h: b[3] - b[1] }; }));
    updatePlexus(now, t);
    bg.uniforms.uScroll.value = 2.15 + 0.3 * (S - S2T.W1END);
    writeHues(bg.uniforms, hueFrame(t, REDUCE), 1);   // the fog's shade hues (E-fog-hue), on the clock section 3's ground shares
  }
  let frameNo = 0;
  function renderS2() {
    bg.uniforms.uRes.value.set(W(), H()); bg.uniforms.uTime.value = REDUCE ? 7 : t2; bg.uniforms.uFrame.value = (frameNo++) % 4096; bg.layout(REDUCE ? 7 : t2, W(), H());
    for (const st of stones) { const U2 = st.mats.B.userData.U; U2.uRes.value.set(W(), H()); }
    renderer.setClearColor(0x000000, 0);
    const vis = stones.map((s) => [s.group.visible, s.blk.visible]);
    for (const st of stones) { st.group.visible = false; st.blk.visible = false; } for (const P of plexi) { P.obj.userData.v = P.obj.visible; P.obj.visible = false; }
    renderer.setRenderTarget(passes.rtBG); renderer.render(scene, camera);           // the background the gems refract
    stones.forEach((st, q) => { st.group.visible = vis[q][0]; st.blk.visible = vis[q][1]; st.mats.B.userData.U.tBG.value = passes.rtBG!.texture; });
    for (const P of plexi) P.obj.visible = P.obj.userData.v as boolean;
    renderer.setRenderTarget(passes.rtMain); renderer.render(scene, camera);
    passes.runBloomAndComposite(W(), H());
  }
  function render() {
    if (!ready) return;
    const pc = renderer.getClearColor(new Color()), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
    renderer.toneMapping = NoToneMapping;
    renderS2();
    renderer.toneMapping = tm === NoToneMapping ? ACESFilmicToneMapping : tm; renderer.setClearColor(pc, pa); renderer.setRenderTarget(null);
  }
  const api: Section2Scene = {
    get started() { return started; }, get ready() { return ready; }, get failed() { return failed; },
    get out() { return passes.rtOut ? passes.rtOut.texture : null; },
    get live() { return live; },
    build, resize, update, render,
    // a hero block is hidden once its flying copy has taken over (or, under reduced motion, once its gem is at its slot)
    hidden: (i, Sv) => { if (!ready) return false; const j = blockOf.indexOf(i); if (j < 0) return false; const L = Lof(Sv, j); return REDUCE ? L >= 0.5 : L > 0; },
    logoLeft: () => !ready || stones.some((st) => (REDUCE ? st.L < 0.5 : st.L <= 0)),
    snapTo: null,
    hooks: o.hooks ? () => ({ ready, failed, live, S, L: stones.map((s) => +s.L.toFixed(3)), active, labels: stones.map((s) => (s.labs ? !s.labs.title.hidden : null)) }) : undefined,
    dispose() {
      removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); removeEventListener('pointerup', lift); removeEventListener('pointercancel', lift); removeEventListener('pointerout', out);
      offRock?.(); if (nav) clearLinkBoxes(nav);
      labels.clear(stones); if (labLayer) labLayer.style.removeProperty('visibility');
      o.canvas.classList.remove('over-gem');
      for (const st of stones) { st.geo.dispose(); st.mats.B.dispose(); st.blk.geometry.dispose(); st.blk.material.dispose(); }
      for (const P of plexi) P.obj.geometry.dispose();
      plexMat.dispose(); frost.dispose(); passes.dispose(); bg.dispose(); pmrem.dispose(); envTex?.dispose();
    },
  };
  return api;
}

/** the label strings of section-2.md 3, exported for the tests */
export const S2_LABELS = { names: FAM_NAME.map((n) => n.toUpperCase()), count: COPY.s2.count, click: COPY.s2.click, tap: COPY.s2.tap };
export type { Label, LabelStone };
